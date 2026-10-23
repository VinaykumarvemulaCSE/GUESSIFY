import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  arrayUnion,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseConfig';
import { MultiplayerRoom, MultiplayerMode, GuessResult } from '../types';
import {
  generateRoomCode,
  ROOM_EXPIRY_MS,
  TURN_TIMEOUT_SECONDS,
  calculateGuessFeedback,
} from '../constants/gameRules';

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Add your credentials to .env and restart the app.');
  }
  return db;
}

export const FirestoreMultiplayer = {
  /**
   * Create a new room in Firestore
   */
  async createRoom(hostUid: string, hostName: string): Promise<MultiplayerRoom> {
    const database = requireDb();
    const code = generateRoomCode();
    const roomId = `room_${code}`;
    const now = Date.now();

    const room: MultiplayerRoom = {
      roomId,
      code,
      hostUid,
      hostName,
      status: 'WAITING',
      selectedMode: 'BOTH_TOGETHER',
      createdAt: now,
      expiresAt: now + ROOM_EXPIRY_MS,
      guesses: [],
      rematchAgreed: [],
    };

    const roomRef = doc(database, 'rooms', roomId);
    await setDoc(roomRef, room);
    return room;
  },

  /**
   * Join an existing room by 6-char alphanumeric code
   */
  async joinRoom(
    code: string,
    guestUid: string,
    guestName: string
  ): Promise<{ success: boolean; room?: MultiplayerRoom; error?: string }> {
    const database = requireDb();
    const cleanCode = code.trim().toUpperCase();
    const roomsRef = collection(database, 'rooms');
    const q = query(roomsRef, where('code', '==', cleanCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: 'Room code not found. Please verify the 6-character code.' };
    }

    const roomDoc = snapshot.docs[0];
    const room = roomDoc.data() as MultiplayerRoom;

    if (Date.now() > room.expiresAt) {
      return { success: false, error: 'This room has expired. Please create a new one.' };
    }

    if (room.guestUid && room.guestUid !== guestUid) {
      return { success: false, error: 'Room is already full (maximum 2 players).' };
    }

    const updatedData: Partial<MultiplayerRoom> = {
      guestUid,
      guestName,
      status: 'MODE_SELECTION',
    };

    await updateDoc(doc(database, 'rooms', room.roomId), updatedData);
    return { success: true, room: { ...room, ...updatedData } };
  },

  /**
   * Subscribe to real-time updates for a room
   */
  subscribeToRoom(roomId: string, onUpdate: (room: MultiplayerRoom) => void): Unsubscribe {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    return onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as MultiplayerRoom);
      }
    });
  },

  /**
   * Host chooses mode
   */
  async setMode(roomId: string, mode: MultiplayerMode): Promise<void> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    await updateDoc(roomRef, {
      selectedMode: mode,
    });
  },

  /**
   * Start round
   */
  async startRound(roomId: string, secret?: number): Promise<void> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const room = snap.data() as MultiplayerRoom;
    const target = secret || Math.floor(Math.random() * 100) + 1;

    let currentTurnUid = room.hostUid;
    let setterUid: string | null = null;

    if (room.selectedMode === 'HOST_GUESSES') {
      currentTurnUid = room.hostUid;
      setterUid = room.guestUid || 'system_setter';
    } else if (room.selectedMode === 'FRIEND_GUESSES') {
      currentTurnUid = room.guestUid || room.hostUid;
      setterUid = room.hostUid;
    }

    await updateDoc(roomRef, {
      targetNumber: target,
      status: 'PLAYING',
      guesses: [],
      winnerUid: null,
      currentTurnUid,
      setterUid,
      turnDeadline: Date.now() + TURN_TIMEOUT_SECONDS * 1000,
      rematchAgreed: [],
    });
  },

  /**
   * Submit guess in real time
   */
  async submitGuess(
    roomId: string,
    uid: string,
    playerName: string,
    num: number
  ): Promise<GuessResult | null> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return null;

    const room = snap.data() as MultiplayerRoom;
    if (room.status !== 'PLAYING') return null;

    const target = room.targetNumber || 50;
    const result = calculateGuessFeedback(num, target, 1, 100);

    const record = {
      uid,
      playerName,
      guessNumber: num,
      result,
      timestamp: Date.now(),
    };

    const newGuesses = [...(room.guesses || []), record];
    const isCorrect = result === 'CORRECT';

    let nextTurn = room.currentTurnUid || room.hostUid;
    if (room.selectedMode === 'BOTH_TOGETHER' && !isCorrect) {
      if (room.guestUid) {
        nextTurn = room.currentTurnUid === room.hostUid ? room.guestUid : room.hostUid;
      } else {
        nextTurn = room.hostUid;
      }
    }

    await updateDoc(roomRef, {
      guesses: newGuesses,
      status: isCorrect ? 'RESULT' : 'PLAYING',
      winnerUid: isCorrect ? uid : null,
      currentTurnUid: nextTurn || room.hostUid,
      turnDeadline: Date.now() + TURN_TIMEOUT_SECONDS * 1000,
    });

    return result;
  },

  /**
   * Request rematch
   */
  async requestRematch(roomId: string, uid: string): Promise<void> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    await updateDoc(roomRef, {
      rematchAgreed: arrayUnion(uid),
    });

    const snap = await getDoc(roomRef);
    if (snap.exists()) {
      const room = snap.data() as MultiplayerRoom;
      if (room.rematchAgreed?.length >= 2) {
        // Both agreed: restart round!
        await FirestoreMultiplayer.startRound(roomId);
      }
    }
  },

  /**
   * Leave or close room
   */
  async leaveRoom(roomId: string): Promise<void> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    await updateDoc(roomRef, {
      status: 'CLOSED',
    });
  },
};

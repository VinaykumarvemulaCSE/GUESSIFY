import {
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { MultiplayerRoom, MultiplayerMode, GuessResult } from '../types';
import {
  calculateGuessFeedback,
  firstGuesserFor,
  generateRoomCode,
  refereeFor,
  ROOM_EXPIRY_MS,
  TURN_TIMEOUT_SECONDS,
} from '../constants/gameRules';
import { newRoundId } from '../lib/ids';

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Add your credentials to .env and restart.');
  }
  return db;
}

const MIN = 1;
const MAX = 100;

function otherPlayer(room: MultiplayerRoom, uid: string): string | undefined {
  if (uid === room.hostUid) return room.guestUid;
  if (uid === room.guestUid) return room.hostUid;
  return undefined;
}

export const FirestoreMultiplayer = {
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

    await setDoc(doc(database, 'rooms', roomId), room);
    return room;
  },

  /**
   * Seat the second player inside a transaction, so two people tapping "Join"
   * on the same code cannot both become the guest (FR-14 / B5).
   */
  async joinRoom(
    code: string,
    guestUid: string,
    guestName: string
  ): Promise<{ success: boolean; room?: MultiplayerRoom; error?: string }> {
    const database = requireDb();
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      return { success: false, error: 'A room code is 6 characters.' };
    }

    const snapshot = await getDocs(
      query(collection(database, 'rooms'), where('code', '==', cleanCode), limit(1))
    );
    if (snapshot.empty) {
      return { success: false, error: 'Room code not found. Check the 6-character code.' };
    }

    const roomRef = snapshot.docs[0].ref;
    try {
      const joined = await runTransaction(database, async (tx) => {
        const snap = await tx.get(roomRef);
        if (!snap.exists()) throw new Error('This room no longer exists.');
        const room = snap.data() as MultiplayerRoom;

        if (Date.now() > room.expiresAt || room.status === 'EXPIRED' || room.status === 'CLOSED') {
          throw new Error('This room has expired. Create a new one.');
        }
        if (room.guestUid === guestUid) return room;
        if (room.guestUid) throw new Error('Room is already full (2 players max).');
        if (room.hostUid === guestUid) throw new Error('You already host this room.');

        const patch = {
          guestUid,
          guestName,
          status: 'MODE_SELECTION' as const,
          expiresAt: Date.now() + ROOM_EXPIRY_MS,
        };
        tx.update(roomRef, patch);
        return { ...room, ...patch };
      });
      return { success: true, room: joined };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  subscribeToRoom(
    roomId: string,
    onUpdate: (room: MultiplayerRoom) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const database = requireDb();
    return onSnapshot(
      doc(database, 'rooms', roomId),
      (snap) => {
        if (snap.exists()) onUpdate(snap.data() as MultiplayerRoom);
      },
      (error) => onError?.(error)
    );
  },

  async setMode(roomId: string, mode: MultiplayerMode, uid: string): Promise<void> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    await runTransaction(database, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) throw new Error('Room not found.');
      const room = snap.data() as MultiplayerRoom;
      if (room.hostUid !== uid) throw new Error('Only the host picks the mode.');
      if (room.status === 'PLAYING') throw new Error('Round already started.');
      tx.update(roomRef, {
        selectedMode: mode,
        status: 'MODE_SELECTION',
        expiresAt: Date.now() + ROOM_EXPIRY_MS,
      });
    });
  },

  /** Host asks the referee to begin. The referee's client starts the round. */
  async requestStart(roomId: string, uid: string): Promise<void> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    await runTransaction(database, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) throw new Error('Room not found.');
      const room = snap.data() as MultiplayerRoom;
      if (room.hostUid !== uid) throw new Error('Only the host can start.');
      if (!room.guestUid) throw new Error('Wait for your opponent to join.');
      if (room.status !== 'MODE_SELECTION') throw new Error('The round is already running.');
      tx.update(roomRef, {
        status: 'CONFIRMING',
        expiresAt: Date.now() + ROOM_EXPIRY_MS,
      });
    });
  },

  /**
   * Called by the referee. `secret` never reaches Firestore: only the derived
   * setter, the turn and the round id are written while PLAYING (FR-16 / B6).
   */
  async startRound(roomId: string, uid: string): Promise<void> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    await runTransaction(database, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) throw new Error('Room not found.');
      const room = snap.data() as MultiplayerRoom;
      if (refereeFor(room.selectedMode, room.hostUid, room.guestUid) !== uid) {
        throw new Error('Only the referee starts the round.');
      }

      tx.update(roomRef, {
        status: 'PLAYING',
        roundId: newRoundId(),
        setterUid: uid,
        targetNumber: deleteField(),
        guesses: [],
        pendingGuess: null,
        winnerUid: deleteField(),
        currentTurnUid: firstGuesserFor(room.selectedMode, room.hostUid, room.guestUid),
        turnDeadline: Date.now() + TURN_TIMEOUT_SECONDS * 1000,
        rematchAgreed: [],
        expiresAt: Date.now() + ROOM_EXPIRY_MS,
      });
    });
  },

  /**
   * The guesser puts a guess in the queue. Only the referee can turn it into a
   * scored record, so the guesser never sees (or writes) the result.
   */
  async submitPendingGuess(
    roomId: string,
    uid: string,
    playerName: string,
    guessNumber: number
  ): Promise<{ queued: boolean; error?: string }> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    try {
      await runTransaction(database, async (tx) => {
        const snap = await tx.get(roomRef);
        if (!snap.exists()) throw new Error('Room not found.');
        const room = snap.data() as MultiplayerRoom;

        if (room.status !== 'PLAYING') throw new Error('The round is not running.');
        if (room.currentTurnUid !== uid) throw new Error('It is not your turn.');
        if (room.pendingGuess) throw new Error('Your previous guess is still being checked.');
        if (guessNumber < MIN || guessNumber > MAX) {
          throw new Error(`Guess a number between ${MIN} and ${MAX}.`);
        }

        tx.update(roomRef, {
          pendingGuess: { uid, playerName, guessNumber, timestamp: Date.now() },
          expiresAt: Date.now() + ROOM_EXPIRY_MS,
        });
      });
      return { queued: true };
    } catch (e) {
      return { queued: false, error: (e as Error).message };
    }
  },

  /**
   * The referee evaluates the queued guess against the secret it holds in
   * memory, appends the scored record and advances the turn.
   */
  async evaluatePendingGuess(roomId: string, uid: string, secret: number): Promise<GuessResult | null> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    let result: GuessResult | null = null;

    await runTransaction(database, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) return;
      const room = snap.data() as MultiplayerRoom;
      const pending = room.pendingGuess;
      if (!pending || room.setterUid !== uid || room.status !== 'PLAYING') return;

      const evaluated = calculateGuessFeedback(pending.guessNumber, secret, MIN, MAX);
      result = evaluated;

      const record = {
        uid: pending.uid,
        playerName: pending.playerName,
        guessNumber: pending.guessNumber,
        result: evaluated,
        timestamp: pending.timestamp,
      };
      const isCorrect = evaluated === 'CORRECT';
      const nextTurn =
        otherPlayer(room, pending.uid) || room.currentTurnUid || room.hostUid;

      tx.update(roomRef, {
        guesses: [...(room.guesses || []), record],
        pendingGuess: null,
        status: isCorrect ? 'RESULT' : 'PLAYING',
        winnerUid: isCorrect ? pending.uid : deleteField(),
        targetNumber: isCorrect ? secret : deleteField(),
        currentTurnUid: isCorrect ? pending.uid : nextTurn,
        turnDeadline: Date.now() + TURN_TIMEOUT_SECONDS * 1000,
        expiresAt: Date.now() + ROOM_EXPIRY_MS,
      });
    });

    return result;
  },

  /** Referee-side guess: evaluate locally and write straight away. */
  async submitRefereeGuess(
    roomId: string,
    uid: string,
    playerName: string,
    guessNumber: number,
    secret: number
  ): Promise<GuessResult | null> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    let result: GuessResult | null = null;

    await runTransaction(database, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) throw new Error('Room not found.');
      const room = snap.data() as MultiplayerRoom;

      if (room.status !== 'PLAYING') throw new Error('The round is not running.');
      if (room.setterUid !== uid) throw new Error('Only the referee scores guesses.');
      if (room.currentTurnUid !== uid) throw new Error('It is not your turn.');
      if (room.pendingGuess) throw new Error('A guess is already being checked.');

      const evaluated = calculateGuessFeedback(guessNumber, secret, MIN, MAX);
      result = evaluated;
      const isCorrect = evaluated === 'CORRECT';
      const record = {
        uid,
        playerName,
        guessNumber,
        result: evaluated,
        timestamp: Date.now(),
      };

      tx.update(roomRef, {
        guesses: [...(room.guesses || []), record],
        pendingGuess: null,
        status: isCorrect ? 'RESULT' : 'PLAYING',
        winnerUid: isCorrect ? uid : deleteField(),
        targetNumber: isCorrect ? secret : deleteField(),
        currentTurnUid: isCorrect
          ? uid
          : otherPlayer(room, uid) || room.currentTurnUid,
        turnDeadline: Date.now() + TURN_TIMEOUT_SECONDS * 1000,
        expiresAt: Date.now() + ROOM_EXPIRY_MS,
      });
    });

    return result;
  },

  /**
   * Turn timer. The referee moves the turn on when the deadline passes; in
   * single-guesser modes it simply extends the deadline (the guesser keeps the
   * floor until they solve it).
   */
  async passExpiredTurn(roomId: string, uid: string): Promise<void> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    await runTransaction(database, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) return;
      const room = snap.data() as MultiplayerRoom;
      if (room.setterUid !== uid || room.status !== 'PLAYING') return;
      if (!room.turnDeadline || Date.now() < room.turnDeadline) return;

      const next =
        room.selectedMode === 'BOTH_TOGETHER'
          ? otherPlayer(room, room.currentTurnUid || '') || room.hostUid
          : room.currentTurnUid;

      tx.update(roomRef, {
        pendingGuess: null,
        currentTurnUid: next,
        turnDeadline: Date.now() + TURN_TIMEOUT_SECONDS * 1000,
        expiresAt: Date.now() + ROOM_EXPIRY_MS,
      });
    });
  },

  async requestRematch(roomId: string, uid: string): Promise<void> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    await updateDoc(roomRef, {
      rematchAgreed: arrayUnion(uid),
      expiresAt: Date.now() + ROOM_EXPIRY_MS,
    });
  },

  /** Close the room for both players (FR-20). */
  async leaveRoom(roomId: string, uid: string): Promise<void> {
    const database = requireDb();
    const roomRef = doc(database, 'rooms', roomId);
    await runTransaction(database, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) return;
      const room = snap.data() as MultiplayerRoom;
      if (room.hostUid !== uid && room.guestUid !== uid) return;
      tx.update(roomRef, {
        status: 'CLOSED',
        closedBy: uid,
        expiresAt: Date.now() + ROOM_EXPIRY_MS,
      });
    });
  },
};

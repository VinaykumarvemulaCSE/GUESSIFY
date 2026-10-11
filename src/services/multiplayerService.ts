import { MultiplayerRoom, MultiplayerMode, GuessResult } from '../types';
import { generateRoomCode, ROOM_EXPIRY_MS, TURN_TIMEOUT_SECONDS, calculateGuessFeedback } from '../constants/gameRules';

// In-memory + event-driven room simulator for multiplayer
type RoomListener = (room: MultiplayerRoom) => void;

class MultiplayerService {
  private rooms: Map<string, MultiplayerRoom> = new Map();
  private listeners: Map<string, Set<RoomListener>> = new Map();

  createRoom(hostUid: string, hostName: string): MultiplayerRoom {
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

    this.rooms.set(code, room);
    return room;
  }

  joinRoom(code: string, guestUid: string, guestName: string): { success: boolean; room?: MultiplayerRoom; error?: string } {
    const upperCode = code.trim().toUpperCase();
    const room = this.rooms.get(upperCode);

    if (!room) {
      return { success: false, error: 'Room code not found. Please verify the 6-character code.' };
    }

    if (Date.now() > room.expiresAt) {
      return { success: false, error: 'This room has expired. Please create a new one.' };
    }

    if (room.guestUid && room.guestUid !== guestUid) {
      return { success: false, error: 'Room is already full (maximum 2 players).' };
    }

    room.guestUid = guestUid;
    room.guestName = guestName;
    room.status = 'MODE_SELECTION';
    this.broadcast(room);

    return { success: true, room };
  }

  getRoom(code: string): MultiplayerRoom | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  setMode(code: string, hostUid: string, mode: MultiplayerMode): boolean {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.hostUid !== hostUid) return false;

    room.selectedMode = mode;
    this.broadcast(room);
    return true;
  }

  startRound(code: string, secret?: number): MultiplayerRoom | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return null;

    // Pick target number if not provided by setter (range 1-100 default)
    const target = secret || Math.floor(Math.random() * 100) + 1;
    room.targetNumber = target;
    room.status = 'PLAYING';
    room.guesses = [];
    room.winnerUid = undefined;
    room.rematchAgreed = [];

    if (room.selectedMode === 'BOTH_TOGETHER') {
      room.currentTurnUid = room.hostUid; // Host starts
    } else if (room.selectedMode === 'HOST_GUESSES') {
      room.currentTurnUid = room.hostUid;
      room.setterUid = room.guestUid;
    } else {
      room.currentTurnUid = room.guestUid;
      room.setterUid = room.hostUid;
    }

    room.turnDeadline = Date.now() + TURN_TIMEOUT_SECONDS * 1000;
    this.broadcast(room);
    return room;
  }

  submitGuess(
    code: string,
    uid: string,
    playerName: string,
    guessValue: number
  ): { result: GuessResult; room: MultiplayerRoom } | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.status !== 'PLAYING' || !room.targetNumber) return null;

    const result = calculateGuessFeedback(guessValue, room.targetNumber, 1, 100);
    if (result === 'CORRECT') {
      room.winnerUid = uid;
      room.status = 'RESULT';
    }

    room.guesses.push({
      uid,
      playerName,
      guessNumber: guessValue,
      result,
      timestamp: Date.now(),
    });

    // In Both Together mode, pass turn to the other player
    if (room.selectedMode === 'BOTH_TOGETHER' && result !== 'CORRECT') {
      room.currentTurnUid = uid === room.hostUid ? room.guestUid : room.hostUid;
      room.turnDeadline = Date.now() + TURN_TIMEOUT_SECONDS * 1000;
    }

    this.broadcast(room);
    return { result, room };
  }

  requestRematch(code: string, uid: string): MultiplayerRoom | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return null;

    if (!room.rematchAgreed.includes(uid)) {
      room.rematchAgreed.push(uid);
    }

    // Both players agreed to rematch!
    if (room.rematchAgreed.length >= 2) {
      room.status = 'MODE_SELECTION';
      room.guesses = [];
      room.winnerUid = undefined;
      room.rematchAgreed = [];
    }

    this.broadcast(room);
    return room;
  }

  subscribe(code: string, listener: RoomListener): () => void {
    const upperCode = code.toUpperCase();
    if (!this.listeners.has(upperCode)) {
      this.listeners.set(upperCode, new Set());
    }
    this.listeners.get(upperCode)!.add(listener);

    const room = this.rooms.get(upperCode);
    if (room) listener(room);

    return () => {
      this.listeners.get(upperCode)?.delete(listener);
    };
  }

  leaveRoom(code: string): void {
    const room = this.rooms.get(code.toUpperCase());
    if (room) {
      room.status = 'EXPIRED';
      this.broadcast(room);
      this.rooms.delete(code.toUpperCase());
    }
  }

  private broadcast(room: MultiplayerRoom) {
    const list = this.listeners.get(room.code.toUpperCase());
    if (list) {
      list.forEach((fn) => fn({ ...room }));
    }
  }
}

export const multiplayerService = new MultiplayerService();

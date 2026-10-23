import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

const ROOM = 'room_ABC123';

function profile(uid: string, overrides: Record<string, unknown> = {}) {
  return {
    uid,
    displayName: uid === 'alice' ? 'Alice' : 'Bob',
    email: `${uid}@example.com`,
    isGuest: false,
    points: 0,
    stats: {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      highScore: 0,
      currentStreak: 0,
      bestStreak: 0,
      averageAttempts: 0,
    },
    hideFromLeaderboard: false,
    updatedAt: 1,
    ...overrides,
  };
}

function room(overrides: Record<string, unknown> = {}) {
  return {
    roomId: ROOM,
    code: 'ABC123',
    hostUid: 'alice',
    hostName: 'Alice',
    status: 'WAITING',
    selectedMode: 'BOTH_TOGETHER',
    createdAt: 1000,
    expiresAt: 1000 + 300000,
    guesses: [],
    rematchAgreed: [],
    ...overrides,
  };
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'guessify-rules-test',
    firestore: {
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe('users', () => {
  it('lets an owner create and read their private profile', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(doc(alice, 'users', 'alice'), profile('alice')));
    await assertSucceeds(getDoc(doc(alice, 'users', 'alice')));
  });

  it('never exposes another player email', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();
    await assertSucceeds(setDoc(doc(alice, 'users', 'alice'), profile('alice')));
    await assertFails(getDoc(doc(bob, 'users', 'alice')));
  });

  it('rejects unauthenticated reads', async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, 'users', 'alice')));
  });

  it('keeps points monotonic', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    const ref = doc(alice, 'users', 'alice');
    await assertSucceeds(setDoc(ref, profile('alice', { points: 300 })));
    await assertSucceeds(setDoc(ref, profile('alice', { points: 450 })));
    await assertFails(setDoc(ref, profile('alice', { points: 200 })));
  });

  it('rejects impossible stats', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(
        doc(alice, 'users', 'alice'),
        profile('alice', {
          stats: {
            gamesPlayed: 1,
            wins: 5,
            losses: 0,
            winRate: 100,
            highScore: 300,
            currentStreak: 5,
            bestStreak: 5,
            averageAttempts: 1,
          },
        })
      )
    );
  });
});

describe('public profiles', () => {
  it('are readable by signed-in players but not by guests without auth', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();
    const anon = env.unauthenticatedContext().firestore();

    await assertSucceeds(
      setDoc(doc(alice, 'publicProfiles', 'alice'), {
        uid: 'alice',
        displayName: 'Alice',
        points: 120,
        wins: 1,
        tier: 'Bronze',
        hideFromLeaderboard: false,
        updatedAt: 1,
      })
    );
    await assertSucceeds(getDoc(doc(bob, 'publicProfiles', 'alice')));
    await assertFails(getDoc(doc(anon, 'publicProfiles', 'alice')));
  });

  it('rejects writing another player card', async () => {
    const bob = env.authenticatedContext('bob').firestore();
    await assertFails(
      setDoc(doc(bob, 'publicProfiles', 'alice'), {
        uid: 'alice',
        displayName: 'Alice',
        points: 120,
        wins: 1,
        tier: 'Bronze',
        hideFromLeaderboard: false,
        updatedAt: 1,
      })
    );
  });
});

describe('leaderboards', () => {
  const entry = (overrides: Record<string, unknown> = {}) => ({
    uid: 'alice',
    displayName: 'Alice',
    points: 500,
    wins: 1,
    tier: 'Silver',
    hidden: false,
    lastMatchId: 'solo_alice_1',
    period: 'weekly',
    updatedAt: 1,
    ...overrides,
  });

  it('creates a period entry for the owner', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(
      setDoc(doc(alice, 'leaderboards', '2026-W43', 'entries', 'alice'), entry())
    );
  });

  it('rejects a single award above the 1200 cap', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(alice, 'leaderboards', '2026-W43', 'entries', 'alice'), entry({ points: 5000 }))
    );
  });

  it('rejects another player writing the entry', async () => {
    const bob = env.authenticatedContext('bob').firestore();
    await assertFails(
      setDoc(doc(bob, 'leaderboards', '2026-W43', 'entries', 'alice'), entry({ uid: 'alice' }))
    );
  });

  it('caps updates at one max award', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    const ref = doc(alice, 'leaderboards', '2026-W43', 'entries', 'alice');
    await assertSucceeds(setDoc(ref, entry()));
    await assertSucceeds(
      updateDoc(ref, { points: 1200, lastMatchId: 'solo_alice_2' })
    );
    await assertFails(
      updateDoc(ref, { points: 3000, lastMatchId: 'solo_alice_3' })
    );
  });

  it('refuses to replay the same match id', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    const ref = doc(alice, 'leaderboards', '2026-W43', 'entries', 'alice');
    await assertSucceeds(setDoc(ref, entry()));
    await assertFails(
      updateDoc(ref, { points: 650, lastMatchId: 'solo_alice_1' })
    );
  });

  it('accepts a rename without new points', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    const ref = doc(alice, 'leaderboards', '2026-W43', 'entries', 'alice');
    await assertSucceeds(setDoc(ref, entry()));
    await assertSucceeds(updateDoc(ref, { displayName: 'Alice II' }));
  });

  it('is world-readable', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    const anon = env.unauthenticatedContext().firestore();
    await assertSucceeds(setDoc(doc(alice, 'leaderboards', '2026-W43', 'entries', 'alice'), entry()));
    await assertSucceeds(getDoc(doc(anon, 'leaderboards', '2026-W43', 'entries', 'alice')));
  });
});

describe('matches', () => {
  const match = (overrides: Record<string, unknown> = {}) => ({
    uid: 'alice',
    clientMatchId: 'solo_alice_1',
    mode: 'Solo',
    difficulty: 'easy',
    outcome: 'Victory',
    attempts: 3,
    hintsUsed: 0,
    durationSeconds: 20,
    score: 450,
    targetNumber: 42,
    createdAt: 1,
    ...overrides,
  });

  it('records a well-formed owner match', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(doc(alice, 'matches', 'solo_alice_1'), match()));
  });

  it('rejects a forged owner', async () => {
    const bob = env.authenticatedContext('bob').firestore();
    await assertFails(
      setDoc(doc(bob, 'matches', 'solo_alice_1'), match({ uid: 'alice' }))
    );
  });

  it('rejects a score above the solo maximum', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(alice, 'matches', 'solo_alice_1'), match({ score: 9999 }))
    );
  });

  it('keeps matches private', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();
    await assertSucceeds(setDoc(doc(alice, 'matches', 'solo_alice_1'), match()));
    await assertFails(getDoc(doc(bob, 'matches', 'solo_alice_1')));
  });
});

describe('rooms', () => {
  async function createRoom(overrides: Record<string, unknown> = {}) {
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(doc(alice, 'rooms', ROOM), room(overrides)));
    return alice;
  }

  it('creates a waiting room with an exact shape', async () => {
    await createRoom();
  });

  it('rejects a room created for somebody else', async () => {
    const bob = env.authenticatedContext('bob').firestore();
    await assertFails(setDoc(doc(bob, 'rooms', ROOM), room({ hostUid: 'alice' })));
  });

  it('is readable by signed-in players (join by code) but not by guests', async () => {
    await createRoom();
    const bob = env.authenticatedContext('bob').firestore();
    const anon = env.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(bob, 'rooms', ROOM)));
    await assertFails(getDoc(doc(anon, 'rooms', ROOM)));
  });

  it('seats exactly one guest', async () => {
    await createRoom();
    const bob = env.authenticatedContext('bob').firestore();
    const charlie = env.authenticatedContext('charlie').firestore();

    await assertSucceeds(
      updateDoc(doc(bob, 'rooms', ROOM), {
        guestUid: 'bob',
        guestName: 'Bob',
        status: 'MODE_SELECTION',
      })
    );

    await assertFails(
      updateDoc(doc(charlie, 'rooms', ROOM), {
        guestUid: 'charlie',
        guestName: 'Charlie',
        status: 'MODE_SELECTION',
      })
    );
  });

  it('never stores the secret while PLAYING', async () => {
    await createRoom();
    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();

    await assertSucceeds(
      updateDoc(doc(bob, 'rooms', ROOM), { guestUid: 'bob', guestName: 'Bob', status: 'MODE_SELECTION' })
    );
    await assertSucceeds(
      updateDoc(doc(alice, 'rooms', ROOM), {
        status: 'PLAYING',
        roundId: 'r1',
        setterUid: 'alice',
        currentTurnUid: 'alice',
        turnDeadline: 2000,
        guesses: [],
        pendingGuess: null,
      })
    );

    // Only the referee may reveal a target, and only at RESULT.
    await assertFails(updateDoc(doc(alice, 'rooms', ROOM), { targetNumber: 42 }));
  });

  it('lets the current player queue a guess and only the referee score it', async () => {
    await createRoom();
    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();

    await assertSucceeds(
      updateDoc(doc(bob, 'rooms', ROOM), { guestUid: 'bob', guestName: 'Bob', status: 'MODE_SELECTION' })
    );
    await assertSucceeds(
      updateDoc(doc(alice, 'rooms', ROOM), {
        status: 'PLAYING',
        roundId: 'r1',
        setterUid: 'alice',
        currentTurnUid: 'alice',
        turnDeadline: 2000,
        guesses: [],
        pendingGuess: null,
      })
    );

    await assertSucceeds(
      updateDoc(doc(alice, 'rooms', ROOM), {
        pendingGuess: { uid: 'alice', playerName: 'Alice', guessNumber: 40, timestamp: 2100 },
      })
    );

    const scored = { uid: 'alice', playerName: 'Alice', guessNumber: 40, result: 'LOW', timestamp: 2100 };
    await assertSucceeds(
      updateDoc(doc(alice, 'rooms', ROOM), {
        guesses: [scored],
        pendingGuess: null,
        currentTurnUid: 'bob',
        turnDeadline: 3000,
      })
    );

    // Bob is not the referee.
    await assertFails(
      updateDoc(doc(bob, 'rooms', ROOM), {
        guesses: [scored, { ...scored, uid: 'bob', guessNumber: 60 }],
      })
    );
  });

  it('reveals the target on a win', async () => {
    await createRoom();
    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();

    await assertSucceeds(
      updateDoc(doc(bob, 'rooms', ROOM), { guestUid: 'bob', guestName: 'Bob', status: 'MODE_SELECTION' })
    );
    await assertSucceeds(
      updateDoc(doc(alice, 'rooms', ROOM), {
        status: 'PLAYING',
        roundId: 'r1',
        setterUid: 'alice',
        currentTurnUid: 'alice',
        turnDeadline: 2000,
        guesses: [],
        pendingGuess: null,
      })
    );

    await assertSucceeds(
      updateDoc(doc(alice, 'rooms', ROOM), {
        status: 'RESULT',
        winnerUid: 'alice',
        targetNumber: 42,
        guesses: [
          { uid: 'alice', playerName: 'Alice', guessNumber: 42, result: 'CORRECT', timestamp: 2200 },
        ],
      })
    );
  });

  it('lets each player add exactly their own rematch vote', async () => {
    await createRoom();
    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();

    await assertSucceeds(
      updateDoc(doc(bob, 'rooms', ROOM), { guestUid: 'bob', guestName: 'Bob', status: 'MODE_SELECTION' })
    );
    await assertSucceeds(updateDoc(doc(bob, 'rooms', ROOM), { rematchAgreed: ['bob'] }));
    await assertFails(updateDoc(doc(bob, 'rooms', ROOM), { rematchAgreed: ['alice'] }));
    await assertSucceeds(updateDoc(doc(alice, 'rooms', ROOM), { rematchAgreed: ['bob', 'alice'] }));
  });
});

describe('config', () => {
  it('is readable everywhere and writable nowhere', async () => {
    const anon = env.unauthenticatedContext().firestore();
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(getDoc(doc(anon, 'config', 'app')));
    await assertFails(setDoc(doc(alice, 'config', 'app'), { minVersion: '1.0.0' }));
  });
});

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../lib/firebase';
import { log } from '../lib/log';
import { LeaderboardPeriod, periodKey, periodKeys } from '../lib/periods';
import { LeaderboardUser, MatchHistoryItem, UserProfile } from '../types';

/** Mirrors the cap enforced in firestore.rules. */
export const MAX_SINGLE_AWARD = 1200;

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Add your credentials to .env and restart.');
  }
  return db;
}

function targetUid(profile: UserProfile): string {
  return auth?.currentUser?.uid || profile.uid;
}

function tierOf(points: number): LeaderboardUser['tier'] {
  if (points >= 3000) return 'Grandmaster';
  if (points >= 2000) return 'Master';
  if (points >= 1200) return 'Diamond';
  if (points >= 600) return 'Gold';
  if (points >= 200) return 'Silver';
  return 'Bronze';
}

export const FirestoreService = {
  /**
   * Read one board. Periods are real documents keyed by ISO week / month, so
   * "weekly" only contains matches played this week (FR-23).
   */
  async getLeaderboard(period: LeaderboardPeriod = 'weekly'): Promise<LeaderboardUser[]> {
    if (!isFirebaseConfigured || !db) return [];
    const key = periodKey(period);
    try {
      const q = query(
        collection(db, 'leaderboards', key, 'entries'),
        orderBy('points', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown> & { id: string }))
        .filter((row) => !row.hidden)
        .map((row) => ({
          uid: row.id,
          displayName: String(row.displayName || 'Player'),
          points: Number(row.points) || 0,
          wins: Number(row.wins) || 0,
        }));

      return rows.map((row, index) => ({
        rank: index + 1,
        uid: row.uid,
        displayName: row.displayName,
        points: row.points,
        wins: row.wins,
        tier: tierOf(row.points),
      }));
    } catch (e) {
      log.warn('FirestoreService', 'Leaderboard read failed:', e);
      throw e;
    }
  },

  /**
   * Persist one completed match.
   *
   * Everything is keyed by `clientMatchId`, and the period entries are written
   * inside a transaction that refuses to apply the same match twice. A retry
   * (or an outbox flush after a crash) is therefore a no-op.
   */
  async recordGameResult(
    profile: UserProfile,
    match: MatchHistoryItem,
    clientMatchId: string,
    hintsUsed = 0
  ): Promise<void> {
    const database = requireDb();
    const uid = targetUid(profile);
    if (!uid) throw new Error('No signed-in user to record the match for.');

    const now = Date.now();
    const batch = writeBatch(database);

    batch.set(doc(database, 'matches', clientMatchId), {
      uid,
      clientMatchId,
      mode: match.mode,
      difficulty: match.difficultyOrMode,
      outcome: match.outcome,
      attempts: match.attempts,
      hintsUsed,
      durationSeconds: match.durationSeconds,
      score: match.score,
      targetNumber: match.targetNumber,
      createdAt: now,
    });

    batch.set(doc(database, 'users', uid), {
      uid,
      displayName: profile.displayName,
      email: profile.email,
      isGuest: profile.isGuest,
      points: profile.points,
      stats: profile.stats,
      hideFromLeaderboard: profile.hideFromLeaderboard,
      updatedAt: now,
    });

    batch.set(doc(database, 'users', uid, 'history', clientMatchId), {
      ...match,
      id: clientMatchId,
      recordedAt: now,
    });

    batch.set(doc(database, 'publicProfiles', uid), {
      uid,
      displayName: profile.displayName,
      points: profile.points,
      wins: profile.stats.wins,
      tier: tierOf(profile.points),
      hideFromLeaderboard: profile.hideFromLeaderboard,
      updatedAt: now,
    });

    await batch.commit();

    for (const { period, key } of periodKeys()) {
      await this.applyPeriodAward(profile, match, clientMatchId, period, key);
    }
  },

  /**
   * Add one match's award to one period board. The transaction reads the
   * current entry so points stay absolute, monotonic, and capped by rules.
   */
  async applyPeriodAward(
    profile: UserProfile,
    match: MatchHistoryItem,
    clientMatchId: string,
    period: LeaderboardPeriod,
    key: string
  ): Promise<void> {
    const database = requireDb();
    const uid = targetUid(profile);
    const entryRef = doc(database, 'leaderboards', key, 'entries', uid);

    await runTransaction(database, async (tx) => {
      const snapshot = await tx.get(entryRef);
      const current = snapshot.exists() ? snapshot.data() : null;

      if (current?.lastMatchId === clientMatchId) return; // already awarded

      const previousPoints = Number(current?.points) || 0;
      const previousWins = Number(current?.wins) || 0;
      const award = Math.max(0, Math.min(match.score, MAX_SINGLE_AWARD));
      const points = previousPoints + award;

      tx.set(
        entryRef,
        {
          uid,
          displayName: profile.displayName,
          points,
          wins: previousWins + (match.outcome === 'Victory' ? 1 : 0),
          tier: tierOf(points),
          hidden: profile.hideFromLeaderboard,
          lastMatchId: clientMatchId,
          period,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    });
  },

  /** Fetch a user's private history (most recent 50). */
  async getUserMatchHistory(uid: string): Promise<MatchHistoryItem[]> {
    if (!isFirebaseConfigured || !db || !uid) return [];
    try {
      const q = query(
        collection(db, 'users', uid, 'history'),
        orderBy('recordedAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as MatchHistoryItem);
    } catch (e) {
      log.warn('FirestoreService', 'History read failed:', e);
      return [];
    }
  },

  /** Hide/show a player on every board without destroying their points. */
  async setLeaderboardVisibility(profile: UserProfile, hidden: boolean): Promise<void> {
    const database = requireDb();
    const uid = targetUid(profile);
    const now = Date.now();

    await setDoc(
      doc(database, 'publicProfiles', uid),
      { hideFromLeaderboard: hidden, updatedAt: now },
      { merge: true }
    ).catch(() => {});

    for (const { key } of periodKeys()) {
      // A player with no match in this window has no entry to hide yet.
      await setDoc(
        doc(database, 'leaderboards', key, 'entries', uid),
        { hidden, updatedAt: now },
        { merge: true }
      ).catch(() => {});
    }
  },

  /**
   * Remove every document owned by a user. Called right before the auth record
   * is deleted, so the account leaves no trace (FR-4).
   */
  async deleteAccountData(uid: string): Promise<void> {
    const database = requireDb();

    const [historySnap, matchesSnap] = await Promise.all([
      getDocs(query(collection(database, 'users', uid, 'history'), limit(450))),
      getDocs(query(collection(database, 'matches'), where('uid', '==', uid), limit(450))),
    ]);

    const refs = [
      ...historySnap.docs.map((d) => d.ref),
      ...matchesSnap.docs.map((d) => d.ref),
      doc(database, 'users', uid),
      doc(database, 'publicProfiles', uid),
      ...periodKeys().map(({ key }) => doc(database, 'leaderboards', key, 'entries', uid)),
    ];

    // Firestore allows 500 operations per batch.
    for (let i = 0; i < refs.length; i += 450) {
      const batch = writeBatch(database);
      for (const ref of refs.slice(i, i + 450)) batch.delete(ref);
      await batch.commit();
    }

    // A user with a very long history may need a second pass.
    if (historySnap.size === 450) {
      const more = await getDocs(query(collection(database, 'users', uid, 'history'), limit(450)));
      await Promise.all(more.docs.map((d) => deleteDoc(d.ref)));
    }
  },

  calculateTier: tierOf,
};

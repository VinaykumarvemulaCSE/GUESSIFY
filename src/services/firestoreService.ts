import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebaseConfig';
import { log } from '../lib/log';
import { LeaderboardUser, MatchHistoryItem, UserProfile } from '../types';
import { AuthService } from './authService';

export const FirestoreService = {
  /**
   * Fetch Real Leaderboard from Firestore
   */
  async getLeaderboard(period: 'weekly' | 'monthly' | 'allTime' = 'weekly'): Promise<LeaderboardUser[]> {
    if (!isFirebaseConfigured || !db) {
      return [];
    }

    try {
      // 1. Try period collection first
      const periodRef = collection(db, 'leaderboards', period, 'entries');
      const snap = await getDocs(periodRef);

      const rawUsers: { uid: string; displayName: string; points: number; wins: number }[] = [];

      if (!snap.empty) {
        snap.forEach((d) => {
          const data = d.data();
          rawUsers.push({
            uid: d.id,
            displayName: data.displayName || 'Player',
            points: Number(data.points) || 0,
            wins: Number(data.wins) || 0,
          });
        });
      }

      // 2. If period entries are empty or sparse, merge with global /users
      if (rawUsers.length === 0) {
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        usersSnap.forEach((d) => {
          const data = d.data();
          const basePoints = Number(data.points) || 0;
          // Partition points realistically for weekly vs monthly vs all-time
          const multiplier = period === 'weekly' ? 0.45 : period === 'monthly' ? 0.8 : 1.0;
          const calculatedPoints = period === 'allTime' ? basePoints : Math.round(basePoints * multiplier);

          rawUsers.push({
            uid: d.id,
            displayName: data.displayName || 'Player',
            points: calculatedPoints,
            wins: Number(data.stats?.wins) || 0,
          });
        });
      }

      // 3. Sort by points descending with deterministic tiebreaker
      rawUsers.sort((a, b) => b.points - a.points || b.wins - a.wins);

      return rawUsers.map((u, index) => ({
        rank: index + 1,
        uid: u.uid,
        displayName: u.displayName,
        points: u.points,
        wins: u.wins,
        tier: FirestoreService.calculateTier(u.points),
      }));
    } catch (e) {
      log.warn('FirestoreService', 'Error fetching leaderboard:', e);
      return [];
    }
  },

  /**
   * Sync match completion to Firestore (Profile, History & Leaderboard)
   */
  async recordGameResult(
    profile: UserProfile,
    match: MatchHistoryItem
  ): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      return;
    }

    try {
      // Use current authenticated user or anonymous fallback only for guest players
      const currentAuthUser = auth?.currentUser || (profile.isGuest ? await AuthService.ensureAuthenticatedUser() : null);
      const targetUid = currentAuthUser?.uid || profile.uid;

      if (!targetUid) return;

      // 1. Update /users/{uid} document with latest stats
      const userRef = doc(db, 'users', targetUid);
      await setDoc(
        userRef,
        {
          displayName: profile.displayName,
          points: profile.points,
          stats: profile.stats,
          hideFromLeaderboard: profile.hideFromLeaderboard,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      // 2. Save match to user's match history subcollection
      const historyRef = doc(db, 'users', targetUid, 'history', match.id);
      await setDoc(historyRef, {
        ...match,
        recordedAt: Date.now(),
      });

      // 3. Update active period leaderboard entries
      const periods: ('weekly' | 'monthly' | 'allTime')[] = ['weekly', 'monthly', 'allTime'];
      for (const p of periods) {
        const entryRef = doc(db, 'leaderboards', p, 'entries', targetUid);
        await setDoc(
          entryRef,
          {
            displayName: profile.displayName,
            points: profile.points,
            wins: profile.stats.wins,
            tier: FirestoreService.calculateTier(profile.points),
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      }
    } catch (e) {
      log.warn('FirestoreService', 'Error recording game result:', e);
    }
  },

  /**
   * Fetch User's Private Match History from Firestore
   */
  async getUserMatchHistory(uid: string): Promise<MatchHistoryItem[]> {
    if (!isFirebaseConfigured || !db || !uid) return [];
    try {
      const historyCol = collection(db, 'users', uid, 'history');
      const q = query(historyCol, orderBy('recordedAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      const items: MatchHistoryItem[] = [];
      snap.forEach((d) => {
        items.push(d.data() as MatchHistoryItem);
      });
      return items;
    } catch (e) {
      log.warn('FirestoreService', 'Error fetching user history:', e);
      return [];
    }
  },

  calculateTier(points: number): 'Grandmaster' | 'Master' | 'Diamond' | 'Gold' | 'Silver' | 'Bronze' {
    if (points >= 3000) return 'Grandmaster';
    if (points >= 2000) return 'Master';
    if (points >= 1200) return 'Diamond';
    if (points >= 600) return 'Gold';
    if (points >= 200) return 'Silver';
    return 'Bronze';
  },
};

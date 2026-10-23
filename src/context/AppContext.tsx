import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  UserProfile,
  AppSettings,
  MatchHistoryItem,
  Difficulty,
  SoloGameSession,
  GuessRecord,
  GuessResult,
  MultiplayerRoom,
  LeaderboardUser,
} from '../types';
import { StorageService } from '../services/storage';
import {
  DIFFICULTY_CONFIGS,
  calculateSoloScore,
  generateHints,
  calculateGuessFeedback,
  MULTIPLAYER_POINTS,
  refereeFor,
} from '../constants/gameRules';
import { AuthService } from '../services/authService';
import { FirestoreMultiplayer } from '../services/firestoreMultiplayer';
import { FirestoreService } from '../services/firestoreService';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { log } from '../lib/log';
import { ROUTES } from '../lib/routes';
import { duelMatchId, soloMatchId } from '../lib/ids';
import { Outbox } from '../lib/outbox';

const EMPTY_PROFILE: UserProfile = {
  uid: '',
  displayName: 'Player',
  email: '',
  isGuest: true,
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
};

interface AppContextType {
  // Profile & Auth
  profile: UserProfile;
  isFirebaseActive: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpUser: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => Promise<void>;
  resetPasswordEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateDisplayName: (name: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<{ success: boolean; error?: string }>;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  setLeaderboardHidden: (hidden: boolean) => Promise<void>;

  // Solo Game
  soloGame: SoloGameSession | null;
  startSoloGame: (diff: Difficulty) => void;
  submitSoloGuess: (guessNum: number) => GuessResult | null;
  unlockHint: (hintId: number) => void;
  surrenderSoloGame: () => void;
  availableHints: any[];

  // Multiplayer Game
  activeRoom: MultiplayerRoom | null;
  createMultiplayerRoom: () => Promise<MultiplayerRoom>;
  joinMultiplayerRoom: (code: string) => Promise<{ success: boolean; error?: string }>;
  setRoomMode: (mode: any) => Promise<void>;
  startMultiplayerGame: (secret?: number) => Promise<void>;
  submitMultiplayerGuess: (
    guessNum: number
  ) => Promise<{ ok: boolean; result?: GuessResult; error?: string }>;
  requestRematch: () => Promise<void>;
  leaveRoom: () => Promise<void>;

  // History & Leaderboard
  matchHistory: MatchHistoryItem[];
  clearMatchHistory: () => Promise<void>;
  leaderboardUsers: LeaderboardUser[];
  refreshLeaderboard: (period?: 'weekly' | 'monthly' | 'allTime') => Promise<void>;

  /** Awards waiting for the network. */
  pendingSync: number;
}

const AppContext = createContext<AppContextType | null>(null);

function prependHistory(
  historyRef: React.MutableRefObject<MatchHistoryItem[]>,
  setHistory: (items: MatchHistoryItem[]) => void,
  item: MatchHistoryItem,
  uid: string
) {
  const next = [item, ...historyRef.current];
  historyRef.current = next;
  setHistory(next);
  StorageService.saveMatchHistory(next, uid).catch(() => {});
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const profileRef = useRef<UserProfile>(EMPTY_PROFILE);

  const [settings, setSettings] = useState<AppSettings>({
    soundEnabled: true,
    hapticsEnabled: true,
    keypadVibration: true,
  });

  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);
  const matchHistoryRef = useRef<MatchHistoryItem[]>([]);

  const [soloGame, setSoloGame] = useState<SoloGameSession | null>(null);
  const [availableHints, setAvailableHints] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [pendingSync, setPendingSync] = useState(0);

  const roomUnsubscribeRef = useRef<(() => void) | null>(null);
  const lastProcessedRoomResultRef = useRef<string | null>(null);
  const lastStartedRoundRef = useRef<string | null>(null);
  const refereeSecretRef = useRef<{ roomId: string; secret: number } | null>(null);

  const applyProfile = useCallback((updated: UserProfile) => {
    profileRef.current = updated;
    setProfile(updated);
    StorageService.saveProfile(updated).catch(() => {});
  }, []);

  const setHistory = useCallback((items: MatchHistoryItem[]) => {
    matchHistoryRef.current = items;
    setMatchHistory(items);
  }, []);

  /**
   * One award path: try the network, otherwise durably queue it. Firestore IDs
   * make the queued retry a no-op if it already landed.
   */
  const awardMatch = useCallback(
    async (
      updatedProfile: UserProfile,
      match: MatchHistoryItem,
      clientMatchId: string,
      hintsUsed = 0
    ) => {
      if (!isFirebaseConfigured) return;
      try {
        await FirestoreService.recordGameResult(updatedProfile, match, clientMatchId, hintsUsed);
        await Outbox.remove(clientMatchId);
      } catch (e) {
        log.warn('App', 'Award queued for retry:', e);
        await Outbox.add({ clientMatchId, profile: updatedProfile, match, hintsUsed });
        const queued = await Outbox.list();
        setPendingSync(queued.length);
      }
    },
    []
  );

  const loadUserHistory = useCallback(async (uid: string) => {
    const local = await StorageService.getMatchHistory(uid);
    setHistory(local);

    if (uid && !uid.startsWith('guest_') && !uid.startsWith('local_')) {
      FirestoreService.getUserMatchHistory(uid).then((cloud) => {
        if (cloud && cloud.length > 0) {
          setHistory(cloud);
          StorageService.saveMatchHistory(cloud, uid).catch(() => {});
        }
      });
    }
  }, [setHistory]);

  const refreshLeaderboard = useCallback(
    async (period: 'weekly' | 'monthly' | 'allTime' = 'weekly') => {
      if (!isFirebaseConfigured) {
        setLeaderboardUsers([]);
        return;
      }
      try {
        const rows = await FirestoreService.getLeaderboard(period);
        setLeaderboardUsers(rows.map((u) => ({ ...u, isCurrentUser: u.uid === profileRef.current.uid })));
      } catch (e) {
        log.warn('App', 'Leaderboard refresh failed:', e);
      }
    },
    []
  );

  // Restore profile + settings, then follow Firebase auth.
  useEffect(() => {
    StorageService.getSavedProfile().then((cached) => {
      if (cached) {
        applyProfile(cached);
        loadUserHistory(cached.uid);
      }
    });
    StorageService.getSettings().then(setSettings);

    const unsubAuth = AuthService.subscribeToAuthState((firebaseProfile) => {
      if (firebaseProfile) {
        applyProfile(firebaseProfile);
        loadUserHistory(firebaseProfile.uid);
      }
    });

    return () => {
      unsubAuth();
      roomUnsubscribeRef.current?.();
    };
  }, [applyProfile, loadUserHistory]);

  // Flush awards that were finished offline.
  useEffect(() => {
    if (!isFirebaseConfigured || !auth?.currentUser) return;
    Outbox.flush((award) =>
      FirestoreService.recordGameResult(
        award.profile,
        award.match,
        award.clientMatchId,
        award.hintsUsed
      )
    )
      .then(async (sent) => {
        const queued = await Outbox.list();
        setPendingSync(queued.length);
        if (sent > 0) refreshLeaderboard('weekly');
      })
      .catch(() => {});
  }, [profile.uid, refreshLeaderboard]);

  // Auth operations
  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const loggedProfile = await AuthService.login(email, pass);
      applyProfile(loggedProfile);
      await loadUserHistory(loggedProfile.uid);
      router.replace(ROUTES.dashboard);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Login failed' };
    }
  };

  const signUpUser = async (name: string, email: string, pass: string) => {
    try {
      const newProfile = await AuthService.signUp(name, email, pass);
      applyProfile(newProfile);
      await loadUserHistory(newProfile.uid);
      router.replace(ROUTES.dashboard);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Signup failed' };
    }
  };

  const loginAsGuest = async () => {
    try {
      const guestProfile = await AuthService.loginAsGuest();
      applyProfile(guestProfile);
      await loadUserHistory(guestProfile.uid);
    } catch {
      const updated: UserProfile = {
        ...profileRef.current,
        uid: `guest_${Date.now()}`,
        displayName: 'Guest Player',
        isGuest: true,
      };
      applyProfile(updated);
    }
    router.replace(ROUTES.dashboard);
  };

  const resetPasswordEmail = async (email: string) => {
    try {
      await AuthService.resetPassword(email);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Password reset failed' };
    }
  };

  const updateDisplayName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = { ...profileRef.current, displayName: trimmed };
    applyProfile(updated);
    await AuthService.updateDisplayName(updated.uid, trimmed);
    refreshLeaderboard('weekly');
  };

  const logout = async () => {
    roomUnsubscribeRef.current?.();
    roomUnsubscribeRef.current = null;
    setActiveRoom(null);
    await AuthService.signOut();
    await StorageService.clearProfile();
    applyProfile(EMPTY_PROFILE);
    setHistory([]);
    router.replace(ROUTES.login);
  };

  const deleteAccount = async (password?: string) => {
    try {
      await AuthService.deleteAccount(profileRef.current, password);
      roomUnsubscribeRef.current?.();
      roomUnsubscribeRef.current = null;
      setActiveRoom(null);
      applyProfile(EMPTY_PROFILE);
      setHistory([]);
      setLeaderboardUsers([]);
      router.replace(ROUTES.login);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Account deletion failed' };
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await StorageService.saveSettings(updated);
  };

  const setLeaderboardHidden = async (hidden: boolean) => {
    const updated = { ...profileRef.current, hideFromLeaderboard: hidden };
    applyProfile(updated);
    if (isFirebaseConfigured) {
      try {
        await FirestoreService.setLeaderboardVisibility(updated, hidden);
      } catch (e) {
        log.warn('App', 'Could not update leaderboard visibility:', e);
      }
    }
    refreshLeaderboard('weekly');
  };

  // Solo engine
  const startSoloGame = (diff: Difficulty) => {
    const config = DIFFICULTY_CONFIGS[diff];
    const target = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
    const hints = generateHints(target, config.min, config.max);

    const session: SoloGameSession = {
      difficulty: diff,
      targetNumber: target,
      rangeMin: config.min,
      rangeMax: config.max,
      attempts: [],
      maxAttempts: config.shields,
      hintsUsed: 0,
      startTime: Date.now(),
      isWon: false,
      isGameOver: false,
      score: 0,
    };

    setSoloGame(session);
    setAvailableHints(hints);
    router.push(ROUTES.solo);
  };

  const submitSoloGuess = (guessNum: number): GuessResult | null => {
    if (!soloGame || soloGame.isGameOver || soloGame.isWon) return null;

    const result = calculateGuessFeedback(
      guessNum,
      soloGame.targetNumber,
      soloGame.rangeMin,
      soloGame.rangeMax
    );

    const record: GuessRecord = {
      id: `g_${Date.now()}`,
      guessNumber: guessNum,
      result,
      timestamp: Date.now(),
    };

    const newAttempts = [record, ...soloGame.attempts];
    const attemptCount = newAttempts.length;
    const isWon = result === 'CORRECT';
    const isGameOver = !isWon && attemptCount >= soloGame.maxAttempts;
    const finalScore = isWon
      ? calculateSoloScore(soloGame.difficulty, attemptCount, soloGame.hintsUsed)
      : 0;

    const updatedSession: SoloGameSession = {
      ...soloGame,
      attempts: newAttempts,
      isWon,
      isGameOver,
      score: finalScore,
      endTime: isWon || isGameOver ? Date.now() : undefined,
    };
    setSoloGame(updatedSession);

    if (isWon || isGameOver) {
      const current = profileRef.current;
      const clientMatchId = soloMatchId(current.uid, soloGame.startTime);
      const matchItem: MatchHistoryItem = {
        id: clientMatchId,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        mode: 'Solo',
        difficultyOrMode: soloGame.difficulty,
        outcome: isWon ? 'Victory' : 'Defeat',
        targetNumber: soloGame.targetNumber,
        attempts: attemptCount,
        score: finalScore,
        durationSeconds: Math.round((Date.now() - soloGame.startTime) / 1000),
      };

      prependHistory(matchHistoryRef, setHistory, matchItem, current.uid);

      const newTotal = current.stats.gamesPlayed + 1;
      const newWins = isWon ? current.stats.wins + 1 : current.stats.wins;
      const newCurrentStreak = isWon ? current.stats.currentStreak + 1 : 0;
      const prevAttemptsTotal = (current.stats.averageAttempts || 0) * current.stats.gamesPlayed;
      const updatedProfile: UserProfile = {
        ...current,
        points: current.points + finalScore,
        stats: {
          ...current.stats,
          gamesPlayed: newTotal,
          wins: newWins,
          losses: isWon ? current.stats.losses : current.stats.losses + 1,
          winRate: Math.round((newWins / newTotal) * 100),
          highScore: Math.max(current.stats.highScore, finalScore),
          currentStreak: newCurrentStreak,
          bestStreak: Math.max(current.stats.bestStreak || 0, newCurrentStreak),
          averageAttempts: Number(((prevAttemptsTotal + attemptCount) / newTotal).toFixed(1)),
        },
      };
      applyProfile(updatedProfile);
      awardMatch(updatedProfile, matchItem, clientMatchId, soloGame.hintsUsed).then(() =>
        refreshLeaderboard('weekly')
      );

      setTimeout(() => {
        router.replace(isWon ? ROUTES.soloResult : ROUTES.gameOver);
      }, 700);
    }

    return result;
  };

  const unlockHint = (hintId: number) => {
    if (!soloGame) return;
    setAvailableHints((prev) =>
      prev.map((h) => (h.id === hintId ? { ...h, unlocked: true } : h))
    );
    setSoloGame({ ...soloGame, hintsUsed: soloGame.hintsUsed + 1 });
  };

  const surrenderSoloGame = () => {
    if (!soloGame) return;
    const current = profileRef.current;
    const clientMatchId = soloMatchId(current.uid, soloGame.startTime);
    const matchItem: MatchHistoryItem = {
      id: clientMatchId,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      mode: 'Solo',
      difficultyOrMode: soloGame.difficulty,
      outcome: 'Defeat',
      targetNumber: soloGame.targetNumber,
      attempts: soloGame.attempts.length,
      score: 0,
      durationSeconds: Math.round((Date.now() - soloGame.startTime) / 1000),
    };

    prependHistory(matchHistoryRef, setHistory, matchItem, current.uid);

    const newTotal = current.stats.gamesPlayed + 1;
    const updatedProfile: UserProfile = {
      ...current,
      stats: {
        ...current.stats,
        gamesPlayed: newTotal,
        losses: current.stats.losses + 1,
        winRate: Math.round((current.stats.wins / newTotal) * 100),
        currentStreak: 0,
      },
    };
    applyProfile(updatedProfile);
    awardMatch(updatedProfile, matchItem, clientMatchId, soloGame.hintsUsed).then(() =>
      refreshLeaderboard('weekly')
    );

    setSoloGame({
      ...soloGame,
      isGameOver: true,
      isWon: false,
      score: 0,
      endTime: Date.now(),
    });
    router.replace(ROUTES.gameOver);
  };

  // Room subscription + referee duties
  const subscribeAndHandleRoom = useCallback(
    (roomId: string) => {
      roomUnsubscribeRef.current?.();

      roomUnsubscribeRef.current = FirestoreMultiplayer.subscribeToRoom(
        roomId,
        (updated) => {
          setActiveRoom(updated);

          if (updated.status === 'RESULT' && updated.winnerUid && updated.roundId) {
            const resultKey = `${updated.roomId}:${updated.roundId}`;
            if (lastProcessedRoomResultRef.current === resultKey) return;
            lastProcessedRoomResultRef.current = resultKey;

            const me = profileRef.current;
            const isParticipant = updated.hostUid === me.uid || updated.guestUid === me.uid;
            if (!isParticipant) return;

            const isWinner = updated.winnerUid === me.uid;
            const points = isWinner ? MULTIPLAYER_POINTS.WIN : MULTIPLAYER_POINTS.LOSS;
            const myAttempts = updated.guesses.filter((g) => g.uid === me.uid).length;
            const clientMatchId = duelMatchId(updated.roomId, updated.roundId, me.uid);

            const matchItem: MatchHistoryItem = {
              id: clientMatchId,
              date: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              mode: 'Multiplayer',
              difficultyOrMode: updated.selectedMode,
              outcome: isWinner ? 'Victory' : 'Defeat',
              targetNumber: updated.targetNumber || 0,
              attempts: myAttempts,
              score: points,
              durationSeconds: Math.round((Date.now() - updated.createdAt) / 1000),
            };

            prependHistory(matchHistoryRef, setHistory, matchItem, me.uid);

            const newTotal = me.stats.gamesPlayed + 1;
            const newWins = isWinner ? me.stats.wins + 1 : me.stats.wins;
            const newStreak = isWinner ? me.stats.currentStreak + 1 : 0;
            const updatedProfile: UserProfile = {
              ...me,
              points: me.points + points,
              stats: {
                ...me.stats,
                gamesPlayed: newTotal,
                wins: newWins,
                losses: isWinner ? me.stats.losses : me.stats.losses + 1,
                winRate: Math.round((newWins / newTotal) * 100),
                currentStreak: newStreak,
                bestStreak: Math.max(me.stats.bestStreak || 0, newStreak),
              },
            };
            applyProfile(updatedProfile);
            awardMatch(updatedProfile, matchItem, clientMatchId, 0).then(() =>
              refreshLeaderboard('weekly')
            );
          }
        },
        (error) => log.warn('App', 'Room listener failed:', error)
      );
    },
    [applyProfile, awardMatch, refreshLeaderboard, setHistory]
  );

  // Host presses Start → the referee's client begins the round.
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'CONFIRMING') return;
    const referee = refereeFor(activeRoom.selectedMode, activeRoom.hostUid, activeRoom.guestUid);
    if (referee !== profileRef.current.uid) return;
    const guard = `${activeRoom.roomId}:start`;
    if (lastStartedRoundRef.current === guard) return;

    lastStartedRoundRef.current = guard;
    const secret = Math.floor(Math.random() * 100) + 1;
    refereeSecretRef.current = { roomId: activeRoom.roomId, secret };

    FirestoreMultiplayer.startRound(activeRoom.roomId, profileRef.current.uid).catch((e) => {
      lastStartedRoundRef.current = null;
      log.warn('App', 'Could not start round:', e);
    });
  }, [activeRoom]);

  // Referee evaluates guesses queued by the guesser.
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'PLAYING') return;
    const pending = activeRoom.pendingGuess;
    const secret = refereeSecretRef.current;
    if (!pending || !secret || secret.roomId !== activeRoom.roomId) return;
    if (activeRoom.setterUid !== profileRef.current.uid) return;

    FirestoreMultiplayer.evaluatePendingGuess(
      activeRoom.roomId,
      profileRef.current.uid,
      secret.secret
    ).catch((e) => log.warn('App', 'Could not evaluate guess:', e));
  }, [activeRoom]);

  // Both players ready → the referee deals a fresh round.
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'RESULT') return;
    if (activeRoom.rematchAgreed.length < 2) return;
    const referee = refereeFor(activeRoom.selectedMode, activeRoom.hostUid, activeRoom.guestUid);
    if (referee !== profileRef.current.uid) return;
    const guard = `${activeRoom.roomId}:${activeRoom.roundId}:rematch`;
    if (lastStartedRoundRef.current === guard) return;

    lastStartedRoundRef.current = guard;
    const secret = Math.floor(Math.random() * 100) + 1;
    refereeSecretRef.current = { roomId: activeRoom.roomId, secret };
    FirestoreMultiplayer.startRound(activeRoom.roomId, profileRef.current.uid).catch((e) => {
      lastStartedRoundRef.current = null;
      log.warn('App', 'Could not start rematch:', e);
    });
  }, [activeRoom]);

  // Turn timer: only the referee writes.
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'PLAYING') return;
    if (activeRoom.setterUid !== profileRef.current.uid) return;
    const deadline = activeRoom.turnDeadline;
    if (!deadline) return;

    const delay = Math.max(0, deadline - Date.now()) + 300;
    const timer = setTimeout(() => {
      FirestoreMultiplayer.passExpiredTurn(activeRoom.roomId, profileRef.current.uid).catch(() => {});
    }, delay);
    return () => clearTimeout(timer);
  }, [activeRoom]);

  const createMultiplayerRoom = async (): Promise<MultiplayerRoom> => {
    const me = profileRef.current;
    const room = await FirestoreMultiplayer.createRoom(me.uid, me.displayName);
    setActiveRoom(room);
    subscribeAndHandleRoom(room.roomId);
    router.push(ROUTES.duelRoom);
    return room;
  };

  const joinMultiplayerRoom = async (code: string) => {
    const me = profileRef.current;
    const res = await FirestoreMultiplayer.joinRoom(code, me.uid, me.displayName);
    if (res.success && res.room) {
      setActiveRoom(res.room);
      subscribeAndHandleRoom(res.room.roomId);
      router.push(ROUTES.duelRoom);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const setRoomMode = async (mode: any) => {
    if (!activeRoom) return;
    await FirestoreMultiplayer.setMode(activeRoom.roomId, mode, profileRef.current.uid);
  };

  const startMultiplayerGame = async (_secret?: number) => {
    if (!activeRoom) return;
    await FirestoreMultiplayer.requestStart(activeRoom.roomId, profileRef.current.uid);
  };

  const submitMultiplayerGuess = async (guessNumber: number) => {
    if (!activeRoom) return { ok: false, error: 'No active room.' };
    const me = profileRef.current;
    const secret = refereeSecretRef.current;

    try {
      if (activeRoom.setterUid === me.uid && secret?.roomId === activeRoom.roomId) {
        const result = await FirestoreMultiplayer.submitRefereeGuess(
          activeRoom.roomId,
          me.uid,
          me.displayName,
          guessNumber,
          secret.secret
        );
        return { ok: true, result: result || undefined };
      }

      const queued = await FirestoreMultiplayer.submitPendingGuess(
        activeRoom.roomId,
        me.uid,
        me.displayName,
        guessNumber
      );
      return queued.queued ? { ok: true } : { ok: false, error: queued.error };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  };

  const requestRematch = async () => {
    if (!activeRoom) return;
    await FirestoreMultiplayer.requestRematch(activeRoom.roomId, profileRef.current.uid);
  };

  const leaveRoom = async () => {
    if (activeRoom) {
      await FirestoreMultiplayer.leaveRoom(activeRoom.roomId, profileRef.current.uid).catch(() => {});
    }
    roomUnsubscribeRef.current?.();
    roomUnsubscribeRef.current = null;
    refereeSecretRef.current = null;
    lastStartedRoundRef.current = null;
    setActiveRoom(null);
    router.replace(ROUTES.dashboard);
  };

  const clearMatchHistory = async () => {
    await StorageService.clearHistory(profileRef.current.uid);
    setHistory([]);
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        isFirebaseActive: isFirebaseConfigured,
        loginWithEmail,
        signUpUser,
        loginAsGuest,
        resetPasswordEmail,
        updateDisplayName,
        logout,
        deleteAccount,
        settings,
        updateSettings,
        setLeaderboardHidden,
        soloGame,
        startSoloGame,
        submitSoloGuess,
        unlockHint,
        surrenderSoloGame,
        availableHints,
        activeRoom,
        createMultiplayerRoom,
        joinMultiplayerRoom,
        setRoomMode,
        startMultiplayerGame,
        submitMultiplayerGuess,
        requestRematch,
        leaveRoom,
        matchHistory,
        clearMatchHistory,
        leaderboardUsers,
        refreshLeaderboard,
        pendingSync,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

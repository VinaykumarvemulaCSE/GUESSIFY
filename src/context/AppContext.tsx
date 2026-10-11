import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  MAX_ATTEMPTS,
  calculateSoloScore,
  generateHints,
  calculateGuessFeedback,
} from '../constants/gameRules';
import { AuthService } from '../services/authService';
import { FirestoreMultiplayer } from '../services/firestoreMultiplayer';
import { FirestoreService } from '../services/firestoreService';
import { isFirebaseConfigured } from '../services/firebaseConfig';

export type ScreenName =
  | 'SPLASH'
  | 'ONBOARDING'
  | 'LOGIN'
  | 'SIGNUP'
  | 'FORGOT_PASSWORD'
  | 'DASHBOARD'
  | 'DIFFICULTY_SELECT'
  | 'SOLO_GAME'
  | 'SOLO_RESULT'
  | 'GAME_OVER'
  | 'MULTIPLAYER_MENU'
  | 'WAITING_ROOM'
  | 'MODE_SELECTION'
  | 'LIVE_MULTIPLAYER'
  | 'MULTIPLAYER_RESULT'
  | 'LEADERBOARD'
  | 'HISTORY'
  | 'SETTINGS'
  | 'PROFILE'
  | 'RULES'
  | 'ABOUT';

interface AppContextType {
  // Navigation
  currentScreen: ScreenName;
  screenParams: any;
  navigateTo: (screen: ScreenName, params?: any) => void;
  goBack: () => void;

  // Profile & Auth
  profile: UserProfile;
  isFirebaseActive: boolean;
  loginAsUser: (name: string, email: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpUser: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => Promise<void>;
  resetPasswordEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateDisplayName: (name: string) => Promise<void>;
  logout: () => Promise<void>;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;

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
  submitMultiplayerGuess: (guessNum: number) => Promise<GuessResult | null>;
  requestRematch: () => Promise<void>;
  leaveRoom: () => Promise<void>;

  // History & Leaderboard
  matchHistory: MatchHistoryItem[];
  clearMatchHistory: () => Promise<void>;
  leaderboardUsers: LeaderboardUser[];
  refreshLeaderboard: (period?: 'weekly' | 'monthly' | 'allTime') => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('SPLASH');
  const [screenParams, setScreenParams] = useState<any>({});
  const [screenStack, setScreenStack] = useState<ScreenName[]>(['SPLASH']);

  const [profile, setProfile] = useState<UserProfile>({
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
  });

  const [settings, setSettings] = useState<AppSettings>({
    soundEnabled: true,
    hapticsEnabled: true,
    keypadVibration: true,
    notifications: true,
  });

  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);
  const [soloGame, setSoloGame] = useState<SoloGameSession | null>(null);
  const [availableHints, setAvailableHints] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);

  const roomUnsubscribeRef = useRef<(() => void) | null>(null);

  // Dynamic Leaderboard Dataset loaded from Firestore
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([
    { rank: 1, uid: 'guest_user_1', displayName: 'CyberGuesser', points: 450, wins: 4, tier: 'Silver', isCurrentUser: true },
  ]);

  const refreshLeaderboard = async (period: 'weekly' | 'monthly' | 'allTime' = 'weekly') => {
    try {
      const realUsers = await FirestoreService.getLeaderboard(period);
      if (realUsers && realUsers.length > 0) {
        // Tag current user in the leaderboard
        const tagged = realUsers.map((u) => ({
          ...u,
          isCurrentUser: u.uid === profile.uid,
        }));
        setLeaderboardUsers(tagged);
      } else {
        // At minimum show the active logged-in player
        setLeaderboardUsers([
          {
            rank: 1,
            uid: profile.uid,
            displayName: profile.displayName,
            points: profile.points,
            wins: profile.stats.wins,
            tier: FirestoreService.calculateTier(profile.points),
            isCurrentUser: true,
          },
        ]);
      }
    } catch (e) {
      console.warn('[AppContext] Failed to refresh leaderboard:', e);
    }
  };

  const loadUserHistory = async (uid: string) => {
    const local = await StorageService.getMatchHistory(uid);
    setMatchHistory(local);

    if (uid && !uid.startsWith('guest_') && !uid.startsWith('local_')) {
      FirestoreService.getUserMatchHistory(uid).then((cloud) => {
        if (cloud && cloud.length > 0) {
          setMatchHistory(cloud);
          StorageService.saveMatchHistory(cloud, uid);
        }
      });
    }
  };

  useEffect(() => {
    // 1. Load cached profile only if an authenticated user session was saved
    StorageService.getSavedProfile().then((cachedProfile) => {
      if (cachedProfile && !cachedProfile.isGuest) {
        setProfile(cachedProfile);
        loadUserHistory(cachedProfile.uid);
      }
    });
    StorageService.getSettings().then(setSettings);

    // 2. Subscribe to Firebase Auth state for real session persistence across app restarts
    const unsubAuth = AuthService.subscribeToAuthState((firebaseProfile) => {
      if (firebaseProfile && !firebaseProfile.isGuest) {
        setProfile(firebaseProfile);
        StorageService.saveProfile(firebaseProfile);
        loadUserHistory(firebaseProfile.uid);
      }
    });

    return () => {
      unsubAuth();
      if (roomUnsubscribeRef.current) {
        roomUnsubscribeRef.current();
      }
    };
  }, []);

  const navigateTo = (screen: ScreenName, params?: any) => {
    setScreenStack((prev) => [...prev, screen]);
    setScreenParams(params || {});
    setCurrentScreen(screen);
  };

  const goBack = () => {
    if (screenStack.length > 1) {
      const nextStack = [...screenStack];
      nextStack.pop();
      const prevScreen = nextStack[nextStack.length - 1];
      setScreenStack(nextStack);
      setCurrentScreen(prevScreen);
    } else {
      setCurrentScreen('DASHBOARD');
    }
  };

  // Auth Operations
  const loginWithGoogle = async () => {
    try {
      const loggedProfile = await AuthService.loginWithGoogle();
      setProfile(loggedProfile);
      navigateTo('DASHBOARD');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Google sign in failed' };
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const loggedProfile = await AuthService.login(email, pass);
      setProfile(loggedProfile);
      navigateTo('DASHBOARD');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Login failed' };
    }
  };

  const signUpUser = async (name: string, email: string, pass: string) => {
    try {
      const newProfile = await AuthService.signUp(name, email, pass);
      setProfile(newProfile);
      navigateTo('DASHBOARD');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Signup failed' };
    }
  };

  const loginAsUser = async (name: string, email: string) => {
    const updated: UserProfile = {
      ...profile,
      uid: `user_${Date.now()}`,
      displayName: name,
      email,
      isGuest: false,
    };
    setProfile(updated);
    await StorageService.saveProfile(updated);
    navigateTo('DASHBOARD');
  };

  const loginAsGuest = async () => {
    try {
      const guestProfile = await AuthService.loginAsGuest();
      setProfile(guestProfile);
      navigateTo('DASHBOARD');
    } catch (e) {
      const updated: UserProfile = {
        ...profile,
        uid: `guest_${Date.now()}`,
        displayName: 'Guest Player',
        isGuest: true,
      };
      setProfile(updated);
      await StorageService.saveProfile(updated);
      navigateTo('DASHBOARD');
    }
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
    const updated = { ...profile, displayName: trimmed };
    setProfile(updated);
    await StorageService.saveProfile(updated);
    await AuthService.updateDisplayName(profile.uid, trimmed);
    refreshLeaderboard('weekly');
  };

  const logout = async () => {
    await AuthService.signOut();
    await StorageService.clearProfile();
    setProfile({
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
    });
    setMatchHistory([]);
    navigateTo('LOGIN');
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await StorageService.saveSettings(updated);
  };

  // Single Player Engine
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
    navigateTo('SOLO_GAME');
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
      const matchItem: MatchHistoryItem = {
        id: `m_${Date.now()}`,
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

      const newHistory = [matchItem, ...matchHistory];
      setMatchHistory(newHistory);
      StorageService.saveMatchHistory(newHistory, profile.uid);

      const newTotal = profile.stats.gamesPlayed + 1;
      const newWins = isWon ? profile.stats.wins + 1 : profile.stats.wins;
      const newCurrentStreak = isWon ? profile.stats.currentStreak + 1 : 0;
      const newBestStreak = Math.max(profile.stats.bestStreak || 0, newCurrentStreak);
      const prevAttemptsTotal = (profile.stats.averageAttempts || 0) * profile.stats.gamesPlayed;
      const newAverageAttempts = Number(((prevAttemptsTotal + attemptCount) / newTotal).toFixed(1));

      const updatedProfile: UserProfile = {
        ...profile,
        points: profile.points + finalScore,
        stats: {
          ...profile.stats,
          gamesPlayed: newTotal,
          wins: newWins,
          losses: isWon ? profile.stats.losses : profile.stats.losses + 1,
          winRate: Math.round((newWins / newTotal) * 100),
          highScore: Math.max(profile.stats.highScore, finalScore),
          currentStreak: newCurrentStreak,
          bestStreak: newBestStreak,
          averageAttempts: newAverageAttempts,
        },
      };
      setProfile(updatedProfile);
      StorageService.saveProfile(updatedProfile);

      // Sync real match and points to Firestore
      FirestoreService.recordGameResult(updatedProfile, matchItem).then(() => {
        refreshLeaderboard('weekly');
      });

      setTimeout(() => {
        if (isWon) {
          navigateTo('SOLO_RESULT');
        } else {
          navigateTo('GAME_OVER');
        }
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
    const attemptCount = soloGame.attempts.length;
    const matchItem: MatchHistoryItem = {
      id: `m_${Date.now()}`,
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
      attempts: attemptCount,
      score: 0,
      durationSeconds: Math.round((Date.now() - soloGame.startTime) / 1000),
    };

    const newHistory = [matchItem, ...matchHistory];
    setMatchHistory(newHistory);
    StorageService.saveMatchHistory(newHistory, profile.uid);

    const newTotal = profile.stats.gamesPlayed + 1;
    const updatedProfile: UserProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        gamesPlayed: newTotal,
        losses: profile.stats.losses + 1,
        winRate: Math.round((profile.stats.wins / newTotal) * 100),
        currentStreak: 0,
      },
    };
    setProfile(updatedProfile);
    StorageService.saveProfile(updatedProfile);

    FirestoreService.recordGameResult(updatedProfile, matchItem).then(() => {
      refreshLeaderboard('weekly');
    });

    setSoloGame({
      ...soloGame,
      isGameOver: true,
      isWon: false,
      score: 0,
      endTime: Date.now(),
    });
    navigateTo('GAME_OVER');
  };

  // Real-Time Multiplayer Room Handlers
  const lastProcessedRoomResultRef = useRef<string | null>(null);

  const subscribeAndHandleRoom = (roomId: string) => {
    if (roomUnsubscribeRef.current) {
      roomUnsubscribeRef.current();
    }

    roomUnsubscribeRef.current = FirestoreMultiplayer.subscribeToRoom(roomId, (updated) => {
      setActiveRoom(updated);

      if (updated.status === 'PLAYING') {
        setCurrentScreen((prev) => (prev !== 'LIVE_MULTIPLAYER' ? 'LIVE_MULTIPLAYER' : prev));
      } else if (updated.status === 'MODE_SELECTION' || updated.status === 'CONFIRMING') {
        setCurrentScreen((prev) => (prev === 'WAITING_ROOM' ? 'MODE_SELECTION' : prev));
      } else if (updated.status === 'RESULT') {
        setCurrentScreen((prev) => (prev !== 'MULTIPLAYER_RESULT' ? 'MULTIPLAYER_RESULT' : prev));

        const resultKey = `${updated.roomId}_${updated.guesses.length}_${updated.winnerUid}`;
        if (lastProcessedRoomResultRef.current !== resultKey && updated.winnerUid) {
          lastProcessedRoomResultRef.current = resultKey;
          const isMeWinner = updated.winnerUid === profile.uid;
          const pointsEarned = isMeWinner ? 150 : 45;
          const myAttempts = updated.guesses.filter((g) => g.uid === profile.uid).length;

          const matchItem: MatchHistoryItem = {
            id: `mp_${Date.now()}`,
            date: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            mode: 'Multiplayer',
            difficultyOrMode: updated.selectedMode,
            outcome: isMeWinner ? 'Victory' : 'Defeat',
            targetNumber: updated.targetNumber || 0,
            attempts: myAttempts,
            score: pointsEarned,
            durationSeconds: Math.round((Date.now() - updated.createdAt) / 1000),
          };

          const newHistory = [matchItem, ...matchHistory];
          setMatchHistory(newHistory);
          StorageService.saveMatchHistory(newHistory, profile.uid);

          const newTotal = profile.stats.gamesPlayed + 1;
          const newWins = isMeWinner ? profile.stats.wins + 1 : profile.stats.wins;
          const newStreak = isMeWinner ? profile.stats.currentStreak + 1 : 0;
          const updatedProfile: UserProfile = {
            ...profile,
            points: profile.points + pointsEarned,
            stats: {
              ...profile.stats,
              gamesPlayed: newTotal,
              wins: newWins,
              losses: isMeWinner ? profile.stats.losses : profile.stats.losses + 1,
              winRate: Math.round((newWins / newTotal) * 100),
              currentStreak: newStreak,
              bestStreak: Math.max(profile.stats.bestStreak || 0, newStreak),
            },
          };
          setProfile(updatedProfile);
          StorageService.saveProfile(updatedProfile);

          FirestoreService.recordGameResult(updatedProfile, matchItem).then(() => {
            refreshLeaderboard('weekly');
          });
        }
      }
    });
  };

  const createMultiplayerRoom = async (): Promise<MultiplayerRoom> => {
    const room = await FirestoreMultiplayer.createRoom(profile.uid, profile.displayName);
    setActiveRoom(room);
    subscribeAndHandleRoom(room.roomId);
    navigateTo('WAITING_ROOM');
    return room;
  };

  const joinMultiplayerRoom = async (code: string) => {
    const res = await FirestoreMultiplayer.joinRoom(code, profile.uid, profile.displayName);
    if (res.success && res.room) {
      setActiveRoom(res.room);
      subscribeAndHandleRoom(res.room.roomId);
      navigateTo('WAITING_ROOM');
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const setRoomMode = async (mode: any) => {
    if (!activeRoom) return;
    await FirestoreMultiplayer.setMode(activeRoom.roomId, mode);
  };

  const startMultiplayerGame = async (secret?: number) => {
    if (!activeRoom) return;
    await FirestoreMultiplayer.startRound(activeRoom.roomId, secret);
    navigateTo('LIVE_MULTIPLAYER');
  };

  const submitMultiplayerGuess = async (guessNum: number) => {
    if (!activeRoom) return null;
    const res = await FirestoreMultiplayer.submitGuess(
      activeRoom.roomId,
      profile.uid,
      profile.displayName,
      guessNum
    );
    return res;
  };

  const requestRematch = async () => {
    if (!activeRoom) return;
    await FirestoreMultiplayer.requestRematch(activeRoom.roomId, profile.uid);
  };

  const leaveRoom = async () => {
    if (activeRoom) {
      await FirestoreMultiplayer.leaveRoom(activeRoom.roomId);
    }
    if (roomUnsubscribeRef.current) {
      roomUnsubscribeRef.current();
      roomUnsubscribeRef.current = null;
    }
    setActiveRoom(null);
    navigateTo('DASHBOARD');
  };

  const clearMatchHistory = async () => {
    await StorageService.clearHistory(profile.uid);
    setMatchHistory([]);
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        screenParams,
        navigateTo,
        goBack,
        profile,
        isFirebaseActive: isFirebaseConfigured,
        loginAsUser,
        loginWithEmail,
        signUpUser,
        loginWithGoogle,
        loginAsGuest,
        resetPasswordEmail,
        updateDisplayName,
        logout,
        settings,
        updateSettings,
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

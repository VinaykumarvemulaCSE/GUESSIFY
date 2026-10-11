import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, MatchHistoryItem, AppSettings } from '../types';

const STORAGE_KEYS = {
  USER_PROFILE: '@guessify_user_profile',
  MATCH_HISTORY: '@guessify_match_history',
  APP_SETTINGS: '@guessify_app_settings',
  ONBOARDING_SEEN: '@guessify_onboarding_seen',
};

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  keypadVibration: true,
  notifications: true,
};

const DEFAULT_PROFILE: UserProfile = {
  uid: 'guest_user_1',
  displayName: 'Cipher Cadet',
  email: 'cadet@guessify.app',
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

export const StorageService = {
  async getProfile(): Promise<UserProfile> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  async getSavedProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async clearProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    } catch {}
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch {}
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
    } catch {}
  },

  getHistoryKey(uid?: string): string {
    return uid ? `${STORAGE_KEYS.MATCH_HISTORY}_${uid}` : STORAGE_KEYS.MATCH_HISTORY;
  },

  async getMatchHistory(uid?: string): Promise<MatchHistoryItem[]> {
    try {
      const key = this.getHistoryKey(uid);
      const data = await AsyncStorage.getItem(key);
      if (data) return JSON.parse(data);
      // Fallback for previous single-user cache
      if (!uid) {
        const legacy = await AsyncStorage.getItem(STORAGE_KEYS.MATCH_HISTORY);
        if (legacy) return JSON.parse(legacy);
      }
      return [];
    } catch {
      return [];
    }
  },

  async addMatch(match: MatchHistoryItem, uid?: string): Promise<void> {
    try {
      const history = await this.getMatchHistory(uid);
      const updated = [match, ...history];
      await AsyncStorage.setItem(this.getHistoryKey(uid), JSON.stringify(updated));
    } catch {}
  },

  async saveMatchHistory(history: MatchHistoryItem[], uid?: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.getHistoryKey(uid), JSON.stringify(history));
    } catch {}
  },

  async clearHistory(uid?: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getHistoryKey(uid));
    } catch {}
  },

  async hasSeenOnboarding(): Promise<boolean> {
    try {
      const seen = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN);
      return seen === 'true';
    } catch {
      return false;
    }
  },

  async setSeenOnboarding(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
    } catch {}
  },
};

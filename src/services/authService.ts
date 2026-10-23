import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebaseConfig';
import { log } from '../lib/log';
import { UserProfile } from '../types';
import { StorageService } from './storage';

export const AuthService = {
  /**
   * Ensure user is authenticated in Firebase (fallback to anonymous so Firestore rules pass)
   */
  async ensureAuthenticatedUser(): Promise<User | null> {
    if (!isFirebaseConfigured || !auth) return null;
    if (auth.currentUser) return auth.currentUser;
    try {
      const cred = await signInAnonymously(auth);
      return cred.user;
    } catch (e) {
      log.warn('AuthService', 'Anonymous sign-in fallback failed:', e);
      return null;
    }
  },

  /**
   * Listen to real-time auth changes (session persistence across app restarts)
   */
  subscribeToAuthState(onUserChanged: (profile: UserProfile | null) => void): () => void {
    if (!isFirebaseConfigured || !auth) {
      return () => {};
    }

    return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const profile = await AuthService.fetchOrInitUserProfile(firebaseUser);
          onUserChanged(profile);
        } catch (error) {
          log.warn('AuthService', 'Error fetching profile:', error);
        }
      } else {
        onUserChanged(null);
      }
    });
  },

  /**
   * Fetch or initialize UserProfile document in Firestore
   */
  async fetchOrInitUserProfile(firebaseUser: User): Promise<UserProfile> {
    const isGuest = firebaseUser.isAnonymous;
    const defaultDisplayName = isGuest
      ? `Guest_${firebaseUser.uid.slice(0, 5)}`
      : firebaseUser.displayName || 'Player';

    if (db) {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          uid: firebaseUser.uid,
          displayName: data.displayName || defaultDisplayName,
          email: firebaseUser.email || (isGuest ? 'guest@guessify.app' : ''),
          isGuest,
          points: data.points ?? 0,
          stats: data.stats || {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            highScore: 0,
            currentStreak: 0,
            bestStreak: 0,
            averageAttempts: 0,
          },
          hideFromLeaderboard: Boolean(data.hideFromLeaderboard),
        };
      } else {
        // Create initial document
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: defaultDisplayName,
          email: firebaseUser.email || (isGuest ? 'guest@guessify.app' : ''),
          isGuest,
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
        await setDoc(userDocRef, {
          ...newProfile,
          createdAt: Date.now(),
        });
        return newProfile;
      }
    }

    return {
      uid: firebaseUser.uid,
      displayName: defaultDisplayName,
      email: firebaseUser.email || 'guest@guessify.app',
      isGuest,
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
  },

  /**
   * Register with Email & Password
   */
  async signUp(displayName: string, email: string, pass: string): Promise<UserProfile> {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Auth is not initialized. Please verify network connection.');
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (displayName) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      const profile = await AuthService.fetchOrInitUserProfile(cred.user);
      await StorageService.saveProfile(profile);
      return profile;
    } catch (error: any) {
      throw new Error(formatAuthError(error));
    }
  },

  /**
   * Log in with Email & Password
   */
  async login(email: string, pass: string): Promise<UserProfile> {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Auth is not initialized. Please verify network connection.');
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const profile = await AuthService.fetchOrInitUserProfile(cred.user);
      await StorageService.saveProfile(profile);
      return profile;
    } catch (error: any) {
      throw new Error(formatAuthError(error));
    }
  },

  /**
   * Anonymous Guest Login
   */
  async loginAsGuest(): Promise<UserProfile> {
    if (!isFirebaseConfigured || !auth) {
      const localGuest: UserProfile = {
        uid: `guest_${Date.now()}`,
        displayName: `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
        email: 'guest@guessify.app',
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
      await StorageService.saveProfile(localGuest);
      return localGuest;
    }

    const cred = await signInAnonymously(auth);
    const profile = await AuthService.fetchOrInitUserProfile(cred.user);
    await StorageService.saveProfile(profile);
    return profile;
  },

  /**
   * Password Reset
   */
  async resetPassword(email: string): Promise<void> {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Auth is not initialized. Please verify network connection.');
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error: any) {
      throw new Error(formatAuthError(error));
    }
  },

  /**
   * Update Display Name
   */
  async updateDisplayName(uid: string, newName: string): Promise<void> {
    if (auth?.currentUser) {
      await updateProfile(auth.currentUser, { displayName: newName.trim() });
    }
    if (db && uid) {
      try {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, { displayName: newName.trim() });
      } catch (e) {
        log.warn('AuthService', 'Update display name in firestore error:', e);
      }
    }
  },

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    if (auth && isFirebaseConfigured) {
      await signOut(auth);
    }
  },
};

export function formatAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'The email address format is invalid.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No account exists with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to many failed attempts. Try again later.';
    default:
      return error?.message || 'Authentication failed. Please verify your credentials.';
  }
}


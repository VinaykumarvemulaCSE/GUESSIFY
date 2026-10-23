import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence is exported by the React Native entry of firebase/auth
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from './log';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5 && firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    const isFirstInit = getApps().length === 0;
    app = isFirstInit ? initializeApp(firebaseConfig) : getApp();
    if (isFirstInit) {
      try {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch {
        auth = getAuth(app);
      }
    } else {
      auth = getAuth(app);
    }
    // Long polling keeps realtime listeners alive on mobile networks where
    // the default WebChannel transport stalls (same fix as BloodLine).
    db = initializeFirestore(app, { experimentalForceLongPolling: true });
    log.info('Firebase', 'Initialized with projectId:', firebaseConfig.projectId);
  } catch (error) {
    log.warn('Firebase', 'Initialization error:', error);
  }
} else {
  log.info('Firebase', 'Not configured - add EXPO_PUBLIC_FIREBASE_* keys to .env');
}

export { app, auth, db };

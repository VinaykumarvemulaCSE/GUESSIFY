import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence is exported by React Native entry of firebase/auth
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '../lib/log';

// Read Expo Public Environment Variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 5 &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      try {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch {
        auth = getAuth(app);
      }
      db = getFirestore(app);
      log.info('Firebase', 'Initialized successfully with projectId:', firebaseConfig.projectId);
    } else {
      app = getApp();
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } catch (error) {
    log.warn('Firebase', 'Initialization error:', error);
  }
} else {
  log.info('Firebase', 'Running in offline / simulation mode. (Fill keys in .env to connect to live Firebase)');
}

export { app, auth, db };

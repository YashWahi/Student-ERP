// src/config/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env) ? process.env : {};

export const getFirebaseConfig = (envState = env) => {
  const emulatorEnabled = envState.VITE_USE_FIREBASE_EMULATORS === 'true';

  if (emulatorEnabled) {
    return {
      apiKey: envState.VITE_FIREBASE_API_KEY || 'fake-api-key',
      authDomain: envState.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
      databaseURL: envState.VITE_FIREBASE_DATABASE_URL || 'http://127.0.0.1:8080?ns=demo-test',
      projectId: envState.VITE_FIREBASE_PROJECT_ID || 'demo-test',
      storageBucket: envState.VITE_FIREBASE_STORAGE_BUCKET || 'demo-test.appspot.com',
      messagingSenderId: envState.VITE_FIREBASE_MESSAGING_SENDER_ID || 'demo-messaging-sender',
      appId: envState.VITE_FIREBASE_APP_ID || '1:demo-test:web:demo',
      measurementId: envState.VITE_FIREBASE_MEASUREMENT_ID,
    };
  }

  return {
    apiKey: envState.VITE_FIREBASE_API_KEY || 'AIzaSyAinTROq8ttJWVhQdxR6pf_cSik13dXuMs',
    authDomain: envState.VITE_FIREBASE_AUTH_DOMAIN || 'cafe-265bd.firebaseapp.com',
    databaseURL: envState.VITE_FIREBASE_DATABASE_URL || 'https://cafe-265bd-default-rtdb.firebaseio.com',
    projectId: envState.VITE_FIREBASE_PROJECT_ID || 'cafe-265bd',
    storageBucket: envState.VITE_FIREBASE_STORAGE_BUCKET || 'cafe-265bd.firebasestorage.app',
    messagingSenderId: envState.VITE_FIREBASE_MESSAGING_SENDER_ID || '396904698649',
    appId: envState.VITE_FIREBASE_APP_ID || '1:396904698649:web:dacc483343354438e5ab88',
    measurementId: envState.VITE_FIREBASE_MEASUREMENT_ID,
  };
};

const firebaseConfig = getFirebaseConfig();

export const shouldUseFirebaseEmulators = (envState = env, runtimeWindow = typeof window !== 'undefined' ? window : undefined) => {
  if (envState.VITE_USE_FIREBASE_EMULATORS !== 'true') {
    return false;
  }

  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV !== true) {
    return false;
  }

  if (!runtimeWindow || !runtimeWindow.location) {
    return false;
  }

  const hostname = runtimeWindow.location.hostname;
  return ['localhost', '127.0.0.1', '::1'].includes(hostname);
};

// Singleton guard — prevents "duplicate-app" error during HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Callable Cloud Functions region must match FUNCTIONS_REGION in functions/index.js.
export const functions = getFunctions(app, 'asia-south1');

if (shouldUseFirebaseEmulators()) {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  } catch (error) {
    console.warn('Unable to connect Firebase Auth emulator:', error);
  }

  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  } catch (error) {
    console.warn('Unable to connect Firestore emulator:', error);
  }

  try {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  } catch (error) {
    console.warn('Unable to connect Functions emulator:', error);
  }
}

export default app;

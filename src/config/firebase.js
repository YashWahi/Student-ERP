// src/config/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env) ? process.env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoDummyKeyForTestEnv9901',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-school-erp.firebaseapp.com',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || 'https://demo-school-erp.firebaseio.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'demo-school-erp',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-school-erp.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-DEMO12345',
};

// Singleton guard — prevents "duplicate-app" error during HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

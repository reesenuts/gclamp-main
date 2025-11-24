/**
 * Firebase Service
 * Initializes Firebase and provides Firestore instance
 */

import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../config/firebase';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

/**
 * Initialize Firebase (only once)
 */
export const initializeFirebase = (): FirebaseApp => {
  if (app) {
    return app;
  }

  // Check if Firebase is already initialized
  const apps = getApps();
  if (apps.length > 0) {
    app = apps[0];
  } else {
    // Validate config
    if (!FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
      throw new Error(
        'Firebase configuration is missing. Please update app/config/firebase.ts with your Firebase project credentials.'
      );
    }

    app = initializeApp(FIREBASE_CONFIG);
  }

  return app;
};

/**
 * Get Firestore instance
 */
export const getFirestoreInstance = (): Firestore => {
  if (db) {
    return db;
  }

  // Initialize Firebase if not already done
  if (!app) {
    initializeFirebase();
  }

  db = getFirestore(app!);
  return db;
};

/**
 * Check if Firebase is configured
 */
export const isFirebaseConfigured = (): boolean => {
  return FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY' && 
         FIREBASE_CONFIG.projectId !== 'YOUR_PROJECT_ID';
};


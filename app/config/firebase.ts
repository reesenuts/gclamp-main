/**
 * Firebase Configuration
 * 
 * IMPORTANT: Replace these values with your Firebase project configuration
 * 
 * To get your Firebase config:
 * 1. Go to Firebase Console (https://console.firebase.google.com/)
 * 2. Select your project
 * 3. Go to Project Settings (gear icon)
 * 4. Scroll to "Your apps" section
 * 5. Click Web icon (</>) to add web app
 * 6. Copy the config object values below
 */

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAlYVI5wzMrYXHBotsU7euk2pfsOsFxc4s",
  authDomain: "gclamp-mobile.firebaseapp.com",
  projectId: "gclamp-mobile",
  storageBucket: "gclamp-mobile.firebasestorage.app",
  messagingSenderId: "642494817360",
  appId: "1:642494817360:web:202ac02ebebee0630f9d55",
  // Optional: measurementId for Analytics (not used in React Native)
  // measurementId: "G-PG9H3T6N30"
};

// Firestore Collections
export const FIRESTORE_COLLECTIONS = {
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  USERS: 'users',
} as const;


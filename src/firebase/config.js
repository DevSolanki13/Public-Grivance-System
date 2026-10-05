import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Values come from your .env file (see .env.example).
// Vite only exposes variables that start with VITE_
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app); // login system
export const db = getFirestore(app); // database
export const storage = getStorage(app); // file uploads

export default app;

// Turns Firebase's technical error codes into messages a citizen can understand.
const messages = {
  'auth/email-already-in-use': 'This email is already registered. Try logging in.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a bit and try again.',
  'auth/network-request-failed': 'Network problem. Check your internet connection.',
  'permission-denied': 'Firestore blocked this request. Check that your database exists and its rules allow it.',
};

export function friendlyError(err) {
  if (messages[err.code]) return messages[err.code];
  if (err.code) return `Something went wrong (${err.code}).`;
  return err.message || 'Something went wrong. Please try again.';
}

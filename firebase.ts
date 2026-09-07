import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// All values come from Vite env vars (must be prefixed VITE_ to be exposed
// to the browser bundle — see .env.example). Firebase web API keys are not
// secret by design (they identify the project, not authorize access — real
// access control lives in firestore.rules), so it's normal for these to be
// visible in the client bundle. Do NOT put GEMINI_API_KEY here; that one
// stays server-side only (see api/_lib/gemini.ts).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // eslint-disable-next-line no-console
  console.error(
    'Firebase config is missing. Set VITE_FIREBASE_* variables in your .env file (see .env.example).'
  );
}

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// This project uses a NAMED Firestore database (not the default one) —
// see VITE_FIREBASE_DATABASE_ID in .env.example. Falls back to the
// default database if not set.
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)';
export const db = getFirestore(firebaseApp, databaseId);

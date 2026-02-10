import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

/**
 * Get or initialize Firebase client app
 */
function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (firebaseApp) {
    return firebaseApp;
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Only initialize if all required config is present
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.projectId ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.appId
  ) {
    return null;
  }

  // Check if Firebase is already initialized
  const apps = getApps();
  if (apps.length > 0) {
    firebaseApp = apps[0];
  } else {
    firebaseApp = initializeApp(firebaseConfig);
  }

  return firebaseApp;
}

/**
 * Get Firestore database instance
 * Uses lazy initialization for better testability
 */
function getDb(): Firestore | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (firestoreDb) {
    return firestoreDb;
  }

  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  firestoreDb = getFirestore(app);
  return firestoreDb;
}

// Export the db getter
export const db = getDb();

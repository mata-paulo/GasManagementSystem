import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  connectAuthEmulator,
} from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

function envValue(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = import.meta.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function requiredEnv(...keys: string[]): string {
  const value = envValue(...keys);
  if (!value) {
    throw new Error(`Missing Firebase environment variable. Expected one of: ${keys.join(", ")}`);
  }
  return value;
}

const firebaseConfig = {
  apiKey: requiredEnv("VITE_FIREBASE_API_KEY", "VITE_PUBLIC_FIREBASE_API_KEY"),
  authDomain: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN", "VITE_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: requiredEnv("VITE_FIREBASE_PROJECT_ID", "VITE_PUBLIC_FIREBASE_PROJECT_ID"),
  appId: requiredEnv("VITE_FIREBASE_APP_ID", "VITE_PUBLIC_FIREBASE_APP_ID"),
  messagingSenderId: envValue("VITE_FIREBASE_MESSAGING_SENDER_ID", "VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  storageBucket: envValue("VITE_FIREBASE_STORAGE_BUCKET", "VITE_PUBLIC_FIREBASE_STORAGE_BUCKET"),
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/** Matches `registerResident` region in `functions/src/auth/registerResident.ts`. */
export const functions = getFunctions(
  app,
  envValue("VITE_FIREBASE_FUNCTIONS_REGION", "VITE_PUBLIC_FIREBASE_FUNCTIONS_REGION") ?? "asia-southeast1",
);
export const db = getFirestore(app);

const useEmulator =
  envValue("VITE_USE_FIREBASE_EMULATORS", "VITE_PUBLIC_USE_EMULATOR") === "true";

if (import.meta.env.DEV && useEmulator) {
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  // Your Functions/Firestore emulators usually run Auth on 9099.
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

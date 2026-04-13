import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  connectAuthEmulator,
} from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_PUBLIC_FIREBASE_PROJECT_ID as string,
  appId: import.meta.env.VITE_PUBLIC_FIREBASE_APP_ID as string,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/** Matches `registerResident` region in `functions/src/auth/registerResident.ts`. */
export const functions = getFunctions(app, "asia-southeast1");

const firebaseEmuHost =
  (import.meta.env.VITE_PUBLIC_FIREBASE_EMULATOR_HOST as string | undefined)?.trim() ||
  (import.meta.env.VITE_FIREBASE_EMULATOR_HOST as string | undefined)?.trim() ||
  "127.0.0.1";

if (import.meta.env.DEV && import.meta.env.VITE_PUBLIC_USE_EMULATOR === "true") {
  connectFunctionsEmulator(functions, firebaseEmuHost, 5001);
  connectAuthEmulator(auth, `http://${firebaseEmuHost}:9099`);
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

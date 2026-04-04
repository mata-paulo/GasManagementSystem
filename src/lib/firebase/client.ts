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

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId?: string;
  storageBucket?: string;
};

/**
 * In development, missing env vars no longer crash the app: we initialize with placeholders so UI
 * loads; login/Firestore still fail until `.env` is filled. Production builds require real config.
 */
function resolveFirebaseConfig(): { config: FirebaseWebConfig; isConfigured: boolean } {
  const apiKey = envValue("VITE_FIREBASE_API_KEY", "VITE_PUBLIC_FIREBASE_API_KEY");
  const authDomain = envValue("VITE_FIREBASE_AUTH_DOMAIN", "VITE_PUBLIC_FIREBASE_AUTH_DOMAIN");
  const projectId = envValue("VITE_FIREBASE_PROJECT_ID", "VITE_PUBLIC_FIREBASE_PROJECT_ID");
  const appId = envValue("VITE_FIREBASE_APP_ID", "VITE_PUBLIC_FIREBASE_APP_ID");

  if (apiKey && authDomain && projectId && appId) {
    return {
      isConfigured: true,
      config: {
        apiKey,
        authDomain,
        projectId,
        appId,
        messagingSenderId: envValue(
          "VITE_FIREBASE_MESSAGING_SENDER_ID",
          "VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
        ),
        storageBucket: envValue("VITE_FIREBASE_STORAGE_BUCKET", "VITE_PUBLIC_FIREBASE_STORAGE_BUCKET"),
      },
    };
  }

  if (import.meta.env.DEV) {
    console.warn(
      "[AGAS] Firebase env vars are missing. Add a `.env` file with VITE_FIREBASE_* — " +
        "the shell will load, but sign-in and Firestore will not work until then.",
    );
    return {
      isConfigured: false,
      config: {
        apiKey: "dev-placeholder-api-key",
        authDomain: "dev-placeholder.firebaseapp.com",
        projectId: "dev-placeholder",
        appId: "1:000000000000:web:0000000000000000000000",
      },
    };
  }

  throw new Error(
    "Missing Firebase environment variables. Required: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, " +
      "VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID (or the VITE_PUBLIC_* equivalents).",
  );
}

const { config: firebaseConfig, isConfigured: isFirebaseConfigured } = resolveFirebaseConfig();

/** True when real VITE_FIREBASE_* (or VITE_PUBLIC_*) values are present. */
export { isFirebaseConfigured };
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

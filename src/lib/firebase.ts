import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

  if (missing.length > 0 && typeof window === "undefined") {
  console.warn(
    `Firebase env vars missing: ${missing.join(", ")}. Firebase disabled during build.`
  );
}

// Allow static build to proceed without env vars — Firebase only runs on client
if (missing.length > 0 && typeof window === "undefined") {
  console.warn(`Firebase env vars missing: ${missing.join(", ")}. Firebase disabled during build.`);
}

// Cast as non-null — always initialized on client where actually used
let _app: ReturnType<typeof initializeApp> | null = null;
let _auth: ReturnType<typeof getAuth> | null = null;
let _db: ReturnType<typeof getFirestore> | null = null;
let _storage: ReturnType<typeof getStorage> | null = null;

if (typeof window !== "undefined" && missing.length === 0) {
  _app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  _auth = getAuth(_app);
  _db = getFirestore(_app);
  _storage = getStorage(_app);
}

export const auth = _auth!;
export const db = _db!;
export const storage = _storage!;

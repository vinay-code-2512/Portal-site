import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserProfile {
  displayName: string;
  photoURL: string;
  email: string;
  bio: string;
  phone: string;
  createdAt?: string;
  updatedAt?: string;
  shiftDurationHours?: number;
}

const COLLECTION = "users";

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTION, uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch {
    return null;
  }
}

export async function createUserProfile(uid: string, data: UserProfile): Promise<void> {
  await setDoc(doc(db, COLLECTION, uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

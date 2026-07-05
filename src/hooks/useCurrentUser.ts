"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export interface UserProfile {
  uid: string;
  fullName?: string;
  displayName?: string;
  photoURL?: string;
  email?: string;
  phone?: string;
  role?: string;
  bio?: string;
  googleSheetId?: string;
  shiftDurationHours?: number;
  shiftStartTime?: string;
  shiftEndTime?: string;
  createdAt?: any;
  updatedAt?: any;
}

export function useCurrentUser() {
  const { currentUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setLoading(false);
      setProfile(null);
      return;
    }

    let cancelled = false;
    const uid = currentUser.uid;
    const userDisplayName = currentUser.displayName || undefined;
    const userEmail = currentUser.email || undefined;
    const userPhotoURL = currentUser.photoURL || undefined;

    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);
        const snap = await getDoc(doc(db, "users", uid));
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            uid,
            ...data,
            photoURL: data.photoURL || userPhotoURL,
          } as UserProfile);
        } else {
          setProfile({
            uid,
            displayName: userDisplayName,
            email: userEmail,
            photoURL: userPhotoURL,
          });
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();
    return () => { cancelled = true; };
  }, [currentUser, authLoading]);

  return { user: currentUser, profile, loading, error };
}

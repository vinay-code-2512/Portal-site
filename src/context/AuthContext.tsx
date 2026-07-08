"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { auth, db } from "@/lib/firebase";
import type { EmployeeData } from "@/lib/employees";

interface AuthContextValue {
  currentUser: User | null;
  userData: EmployeeData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await user.reload();
        setCurrentUser(auth.currentUser);
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setUserData({ uid: snap.id, ...snap.data() } as EmployeeData);
        }
      } catch (e) {
        console.error("Failed to refresh user data:", e);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;
      setCurrentUser(user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            setUserData({ uid: snap.id, ...snap.data() } as EmployeeData);
          } else {
            setUserData(null);
          }
        } catch {
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return { currentUser: null, userData: null, loading: true, refreshUserData: async () => {} };
  }
  return ctx;
}

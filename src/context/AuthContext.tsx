"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
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
    const [{ auth, db }, { doc, getDoc }] = await Promise.all([
      import("@/lib/firebase"),
      import("firebase/firestore"),
    ]);
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
    let cleanup: (() => void) | null = null;

    const timer = setTimeout(async () => {
      const [{ onAuthStateChanged }, { doc, getDoc }, { auth, db }] =
        await Promise.all([
          import("firebase/auth"),
          import("firebase/firestore"),
          import("@/lib/firebase"),
        ]);
      if (cancelled) return;

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
      cleanup = () => unsubscribe();
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cleanup?.();
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

"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export interface Department {
  id: string;
  name: string;
}

export function useDepartments() {
  const { currentUser, loading: authLoading } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetch() {
    if (!currentUser) { setLoading(false); return; }
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "departments"));
      const items: Department[] = [];
      snap.forEach((d) => items.push({ id: d.id, name: d.data().name }));
      items.sort((a, b) => a.name.localeCompare(b.name));
      setDepartments(items);
    } catch (err: any) {
      setError(err?.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    fetch();
  }, [currentUser, authLoading]);

  return { departments, loading, error, refresh: fetch };
}

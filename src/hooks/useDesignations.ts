"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export interface Designation {
  id: string;
  name: string;
}

export function useDesignations() {
  const { currentUser, loading: authLoading } = useAuth();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetch() {
    if (!currentUser) { setLoading(false); return; }
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "designations"));
      const items: Designation[] = [];
      snap.forEach((d) => items.push({ id: d.id, name: d.data().name }));
      items.sort((a, b) => a.name.localeCompare(b.name));
      setDesignations(items);
    } catch (err: any) {
      setError(err?.message || "Failed to load designations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    fetch();
  }, [currentUser, authLoading]);

  return { designations, loading, error, refresh: fetch };
}

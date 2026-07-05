"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Holiday {
  id?: string;
  date: string;
  name: string;
  type?: string;
}

export function useHolidays(maxItems = 3) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHolidays() {
      try {
        setLoading(true);
        setError(null);
        const snap = await getDocs(
          query(
            collection(db, "holidays"),
            orderBy("date", "asc"),
            limit(maxItems)
          )
        );
        if (cancelled) return;
        const items: Holiday[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Holiday));
        setHolidays(items);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load holidays");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHolidays();
    return () => { cancelled = true; };
  }, [maxItems]);

  return { holidays, loading, error };
}

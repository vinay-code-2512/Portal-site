"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getLocalDateString } from "@/lib/format";
import { getTodayRecord, createAttendanceRecord } from "@/lib/attendance";

export function useCheckIn() {
  const { currentUser, loading: authLoading } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const uid = currentUser.uid;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const record = await getTodayRecord(uid);
        if (!cancelled) {
          setCheckedIn(!!record);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to check status");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [currentUser, authLoading]);

  const checkIn = useCallback(async () => {
    if (!currentUser) return;
    const date = getLocalDateString(new Date());
    try {
      setError(null);
      setLoading(true);
      await createAttendanceRecord(currentUser.uid, date, new Date());
      setCheckedIn(true);
    } catch (err: any) {
      setError(err?.message || "Failed to check in");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return { checkedIn, checkIn, loading, error };
}

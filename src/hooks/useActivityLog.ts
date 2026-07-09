"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getLocalDateString, isSunday } from "@/lib/format";

export interface ActivityAttachment {
  name: string;
  url: string;
  type: "image" | "pdf";
}

export interface ActivityEvent {
  id: string;
  uid: string;
  type: "attendance" | "leave" | "task" | "activity_confirmation" | "other";
  description: string;
  note?: string;
  attachments?: ActivityAttachment[];
  timestamp: any;
}

export function useActivityLog(maxItems = 5) {
  const { currentUser, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const uid = currentUser.uid;

    async function fetchActivities() {
      try {
        setLoading(true);
        setError(null);
        const snap = await getDocs(
          query(
            collection(db, "activity_log"),
            where("uid", "==", uid),
            orderBy("timestamp", "desc"),
            limit(maxItems)
          )
        );
        if (cancelled) return;
        const items: ActivityEvent[] = [];
        snap.forEach((d) => {
          const entry = { id: d.id, ...d.data() } as ActivityEvent;
          const ts = entry.timestamp?.toDate ? entry.timestamp.toDate() : entry.timestamp ? new Date(entry.timestamp) : null;
          if (ts && isSunday(getLocalDateString(ts))) return;
          items.push(entry);
        });
        setActivities(items);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchActivities();
    return () => { cancelled = true; };
  }, [currentUser, authLoading, maxItems]);

  return { activities, loading, error };
}

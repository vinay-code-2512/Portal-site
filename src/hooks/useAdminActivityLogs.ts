"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export interface AdminActivityEvent {
  id: string;
  uid: string;
  type: string;
  description: string;
  timestamp: any;
}

export function useAdminActivityLogs(maxItems = 20) {
  const { currentUser, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<AdminActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchActivities() {
      try {
        setLoading(true);
        setError(null);
        const snap = await getDocs(
          query(
            collection(db, "activity_log"),
            orderBy("timestamp", "desc"),
            limit(maxItems)
          )
        );
        if (cancelled) return;
        const items: AdminActivityEvent[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as AdminActivityEvent));
        setActivities(items);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load activities");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchActivities();
    return () => { cancelled = true; };
  }, [currentUser, authLoading, maxItems]);

  const enrichedActivities = activities.map((a) => ({
    ...a,
    timeAgo: a.timestamp?.toDate
      ? getTimeAgo(a.timestamp.toDate())
      : "Unknown",
  }));

  return { activities: enrichedActivities, loading, error };
}

function getTimeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

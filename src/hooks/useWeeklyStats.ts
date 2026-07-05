"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getWeeklyRecords } from "@/lib/attendance";
import { getLocalDateString } from "@/lib/format";

export interface DailyHour {
  day: string;
  date: string;
  hours: number;
  isToday: boolean;
}

export function useWeeklyStats() {
  const { currentUser, loading: authLoading } = useAuth();
  const [dailyHours, setDailyHours] = useState<DailyHour[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [weekAvg, setWeekAvg] = useState(0);
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

    async function fetchWeek() {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const today = getLocalDateString(now);
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const mondayStr = getLocalDateString(monday);
        const sundayStr = getLocalDateString(sunday);

        const records = await getWeeklyRecords(uid, mondayStr, sundayStr);
        if (cancelled) return;

        const days: DailyHour[] = [];
        let total = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dateStr = getLocalDateString(d);
          const record = records.find((r: any) => r.date === dateStr);

          let hours = 0;
          if (record?.checkIn && record?.checkOut) {
            const checkIn = record.checkIn.toDate();
            const checkOut = record.checkOut.toDate();
            const breaksMs = record.breaks?.reduce((sum: number, b: any) => {
              if (b.end) return sum + (b.end.toDate() - b.start.toDate());
              return sum;
            }, 0) || 0;
            hours = Math.max(0, (checkOut.getTime() - checkIn.getTime() - breaksMs) / (1000 * 60 * 60));
          } else if (record?.checkIn && !record?.checkOut) {
            const checkIn = record.checkIn.toDate();
            const nowMs = Date.now();
            const breaksMs = record.breaks?.reduce((sum: number, b: any) => {
              if (b.end) return sum + (b.end.toDate() - b.start.toDate());
              return sum;
            }, 0) || 0;
            hours = Math.max(0, (nowMs - checkIn.getTime() - breaksMs) / (1000 * 60 * 60));
          }

          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          days.push({
            day: dayNames[d.getDay()],
            date: dateStr,
            hours: Math.round(hours * 100) / 100,
            isToday: dateStr === today,
          });
          total += hours;
        }

        setDailyHours(days);
        setWeekTotal(Math.round(total * 100) / 100);
        const daysWithHours = days.filter((d) => d.hours > 0).length;
        setWeekAvg(daysWithHours > 0 ? Math.round((total / daysWithHours) * 100) / 100 : 0);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load weekly stats");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWeek();
    return () => { cancelled = true; };
  }, [currentUser, authLoading]);

  return { dailyHours, weekTotal, weekAvg, loading, error };
}

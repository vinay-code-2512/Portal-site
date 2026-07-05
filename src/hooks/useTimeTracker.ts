"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getLocalDateString } from "@/lib/format";
import {
  createAttendanceRecord,
  checkoutAttendance,
  startBreak as startBreakService,
  endBreak as endBreakService,
  getTodayRecord,
  logActivity,
} from "@/lib/attendance";
import type { AttendanceRecord } from "./useAttendance";

export type SessionStatus = "idle" | "working" | "on-break" | "checked-out";

export function useTimeTracker() {
  const { currentUser, loading: authLoading } = useAuth();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [currentWorkMs, setCurrentWorkMs] = useState(0);
  const [currentBreakMs, setCurrentBreakMs] = useState(0);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionStatusRef = useRef(sessionStatus);
  sessionStatusRef.current = sessionStatus;
  const todayRef = useRef(todayRecord);
  todayRef.current = todayRecord;

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const uid = currentUser.uid;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const record = await getTodayRecord(uid);
        if (cancelled) return;

        if (record) {
          setTodayRecord(record);
          if (record.checkOut) {
            setSessionStatus("checked-out");
          } else if (record.breaks?.length > 0) {
            const lastBreak = record.breaks[record.breaks.length - 1];
            if (lastBreak && !lastBreak.end) {
              setSessionStatus("on-break");
              const breakStart = lastBreak.start.toDate();
              setCurrentBreakMs(Date.now() - breakStart.getTime());
            } else {
              setSessionStatus("working");
            }
          } else {
            setSessionStatus("working");
          }
        } else {
          setSessionStatus("idle");
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load attendance");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [currentUser, authLoading]);

  useEffect(() => {
    if (authLoading || !currentUser) return;
    if (sessionStatus === "idle" || sessionStatus === "checked-out") return;

    const id = setInterval(() => {
      const record = todayRef.current;
      if (!record?.checkIn) return;

      const checkInTime = record.checkIn.toDate();
      const now = Date.now();

      if (sessionStatusRef.current === "working") {
        const breaks = record.breaks || [];
        let breakTotalMs = 0;
        for (const b of breaks) {
          if (b.end) {
            breakTotalMs += b.end.toDate().getTime() - b.start.toDate().getTime();
          }
        }
        setCurrentWorkMs(now - checkInTime.getTime() - breakTotalMs);
      } else if (sessionStatusRef.current === "on-break") {
        const breaks = record.breaks || [];
        const lastBreak = breaks[breaks.length - 1];
        if (lastBreak && !lastBreak.end) {
          setCurrentBreakMs(now - lastBreak.start.toDate().getTime());
        }
        let breakTotalMs = 0;
        for (const b of breaks) {
          if (b.end) {
            breakTotalMs += b.end.toDate().getTime() - b.start.toDate().getTime();
          }
        }
        setCurrentWorkMs(now - checkInTime.getTime() - breakTotalMs);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [currentUser, authLoading, sessionStatus]);

  const checkIn = useCallback(async () => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const date = getLocalDateString(new Date());
    const now = new Date();
    try {
      setError(null);
      setLoading(true);
      await createAttendanceRecord(uid, date, now);
      await logActivity(uid, "attendance", "Checked in for the day");
      const record = await getTodayRecord(uid);
      setTodayRecord(record);
      setSessionStatus("working");
      setCurrentWorkMs(0);
      setCurrentBreakMs(0);
    } catch (err: any) {
      setError(err?.message || "Failed to check in");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const checkOut = useCallback(async () => {
    if (!currentUser || !todayRecord) return;
    const uid = currentUser.uid;
    const date = getLocalDateString(new Date());
    const now = new Date();
    try {
      setError(null);
      setLoading(true);
      await checkoutAttendance(uid, date, now);
      await logActivity(uid, "attendance", "Checked out for the day");
      const record = await getTodayRecord(uid);
      setTodayRecord(record);
      setSessionStatus("checked-out");
    } catch (err: any) {
      setError(err?.message || "Failed to check out");
    } finally {
      setLoading(false);
    }
  }, [currentUser, todayRecord]);

  const startBreak = useCallback(async () => {
    if (!currentUser || !todayRecord) return;
    const uid = currentUser.uid;
    const date = getLocalDateString(new Date());
    try {
      setError(null);
      setLoading(true);
      await startBreakService(uid, date);
      await logActivity(uid, "attendance", "Started break");
      const record = await getTodayRecord(uid);
      setTodayRecord(record);
      setSessionStatus("on-break");
      setCurrentBreakMs(0);
    } catch (err: any) {
      setError(err?.message || "Failed to start break");
    } finally {
      setLoading(false);
    }
  }, [currentUser, todayRecord]);

  const endBreak = useCallback(async () => {
    if (!currentUser || !todayRecord) return;
    const uid = currentUser.uid;
    const date = getLocalDateString(new Date());
    try {
      setError(null);
      setLoading(true);
      await endBreakService(uid, date);
      await logActivity(uid, "attendance", "Ended break");
      const record = await getTodayRecord(uid);
      setTodayRecord(record);
      setSessionStatus("working");
      const checkInTime = record?.checkIn?.toDate();
      if (checkInTime) {
        const breaks = record.breaks || [];
        let breakTotalMs = 0;
        for (const b of breaks) {
          if (b.end) {
            breakTotalMs += b.end.toDate().getTime() - b.start.toDate().getTime();
          }
        }
        setCurrentWorkMs(Date.now() - checkInTime.getTime() - breakTotalMs);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to end break");
    } finally {
      setLoading(false);
    }
  }, [currentUser, todayRecord]);

  return {
    sessionStatus,
    currentWorkMs,
    currentBreakMs,
    todayRecord,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    loading,
    error,
  };
}

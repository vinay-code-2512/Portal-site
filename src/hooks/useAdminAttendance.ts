"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getAdminAttendanceByDate,
  markAttendance,
  updateAttendanceStatus,
  type EnrichedAttendance,
  type AttendanceDateStats,
} from "@/lib/adminAttendance";
import { getLocalDateString, isSunday } from "@/lib/format";

export function useAdminAttendance() {
  const { currentUser, loading: authLoading } = useAuth();
  const [records, setRecords] = useState<EnrichedAttendance[]>([]);
  const [stats, setStats] = useState<AttendanceDateStats | null>(null);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (date: string) => {
    if (authLoading || !currentUser) return;
    try {
      setLoading(true);
      setError(null);
      if (isSunday(date)) {
        setRecords([]);
        setStats({ total: 0, present: 0, late: 0, absent: 0, halfDay: 0, onLeave: 0, checkedOut: 0, onBreak: 0, attendancePercent: 0 });
        return;
      }
      const result = await getAdminAttendanceByDate(date);
      setRecords(result.records);
      setStats(result.stats);
    } catch (err: any) {
      setError(err?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [currentUser, authLoading]);

  useEffect(() => {
    fetchData(selectedDate);
  }, [fetchData, selectedDate]);

  const goToPrevDay = useCallback(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(getLocalDateString(d));
  }, [selectedDate]);

  const goToNextDay = useCallback(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(getLocalDateString(d));
  }, [selectedDate]);

  const goToToday = useCallback(() => {
    setSelectedDate(getLocalDateString(new Date()));
  }, []);

  const handleMarkAttendance = useCallback(async (
    uid: string,
    status: "present" | "late" | "half-day",
    hour: number,
    minute: number,
    note: string | null
  ) => {
    if (!currentUser) return;
    await markAttendance(uid, selectedDate, status, hour, minute, note, currentUser.uid);
    await fetchData(selectedDate);
  }, [selectedDate, currentUser, fetchData]);

  const handleUpdateStatus = useCallback(async (
    uid: string,
    status: "present" | "late" | "absent" | "half-day"
  ) => {
    if (!currentUser) return;
    await updateAttendanceStatus(uid, selectedDate, status, currentUser.uid);
    await fetchData(selectedDate);
  }, [selectedDate, currentUser, fetchData]);

  return {
    records,
    stats,
    selectedDate,
    loading,
    error,
    goToPrevDay,
    goToNextDay,
    goToToday,
    setSelectedDate,
    markAttendance: handleMarkAttendance,
    updateStatus: handleUpdateStatus,
    refresh: () => fetchData(selectedDate),
  };
}

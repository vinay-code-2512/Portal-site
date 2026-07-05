"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  approveLeaveRequest,
  rejectLeaveRequest,
  getPendingLeaveRequests,
  getLeaveOverview,
  getLeaveAnalytics,
  getApprovedLeavesForDateRange,
  type LeaveRequest,
} from "@/lib/leaves";

export function useAdminLeaves() {
  const { currentUser, loading: authLoading } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [overview, setOverview] = useState<{ pendingCount: number; approvedToday: number; rejectedToday: number } | null>(null);
  const [analytics, setAnalytics] = useState<{ byType: Record<string, number>; byMonth: Record<string, number>; byDepartment: Record<string, number> } | null>(null);
  const [teamLeaves, setTeamLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    if (authLoading || !currentUser) return;
    try {
      setLoading(true);
      setError(null);

      const [pendingResult, ov] = await Promise.all([
        getPendingLeaveRequests(),
        getLeaveOverview(),
      ]);

      setPendingRequests(pendingResult.items);
      setLastDoc(pendingResult.lastDoc);
      setHasMore(pendingResult.hasMore);
      setOverview(ov);
    } catch (err: any) {
      setError(err?.message || "Failed to load leave data");
    } finally {
      setLoading(false);
    }
  }, [currentUser, authLoading]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    try {
      setLoadingMore(true);
      const result = await getPendingLeaveRequests(lastDoc);
      setPendingRequests((prev) => [...prev, ...result.items]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(err?.message || "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastDoc]);

  const approve = useCallback(
    async (id: string, note?: string) => {
      if (!currentUser) return;
      try {
        setActionLoading(id);
        await approveLeaveRequest(id, currentUser.uid, note);
        setPendingRequests((prev) => prev.filter((r) => r.id !== id));
      } finally {
        setActionLoading(null);
      }
    },
    [currentUser]
  );

  const reject = useCallback(
    async (id: string, note: string) => {
      if (!currentUser) return;
      try {
        setActionLoading(id);
        await rejectLeaveRequest(id, currentUser.uid, note);
        setPendingRequests((prev) => prev.filter((r) => r.id !== id));
      } finally {
        setActionLoading(null);
      }
    },
    [currentUser]
  );

  const loadAnalytics = useCallback(async () => {
    if (!currentUser) return;
    try {
      const a = await getLeaveAnalytics();
      setAnalytics(a);
    } catch {
      // silently fail for analytics
    }
  }, [currentUser]);

  const loadTeamLeaves = useCallback(async (startDate: string, endDate: string) => {
    if (!currentUser) return;
    try {
      const leaves = await getApprovedLeavesForDateRange(startDate, endDate);
      setTeamLeaves(leaves);
    } catch {
      // silently fail
    }
  }, [currentUser]);

  return {
    pendingRequests,
    overview,
    analytics,
    teamLeaves,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    approve,
    reject,
    actionLoading,
    loadAnalytics,
    loadTeamLeaves,
    refresh: loadInitial,
  };
}

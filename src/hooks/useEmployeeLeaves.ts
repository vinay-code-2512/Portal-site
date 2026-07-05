"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  submitLeaveRequest,
  getEmployeeLeaveRequests,
  getLeaveBalances,
  type LeaveRequest,
  type LeaveBalanceMap,
  type LeaveType,
} from "@/lib/leaves";

export function useEmployeeLeaves() {
  const { currentUser, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadInitial = useCallback(async () => {
    if (authLoading || !currentUser) return;
    try {
      setLoading(true);
      setError(null);
      const [result, bal] = await Promise.all([
        getEmployeeLeaveRequests(currentUser.uid),
        getLeaveBalances(currentUser.uid),
      ]);
      setRequests(result.items);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      setBalances(bal);
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
    if (!hasMore || loadingMore || !lastDoc || !currentUser) return;
    try {
      setLoadingMore(true);
      const result = await getEmployeeLeaveRequests(currentUser.uid, lastDoc);
      setRequests((prev) => [...prev, ...result.items]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(err?.message || "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastDoc, currentUser]);

  const submitLeave = useCallback(
    async (
      leaveType: LeaveType,
      startDate: string,
      endDate: string,
      reason: string,
      attachment?: File | null
    ) => {
      if (!currentUser) throw new Error("Not authenticated");
      const name = (currentUser as any).fullName || currentUser.email || "";
      const eid = (currentUser as any).employeeId || "";
      await submitLeaveRequest(
        currentUser.uid,
        name,
        eid,
        leaveType,
        startDate,
        endDate,
        reason,
        attachment
      );
      await loadInitial();
    },
    [currentUser, loadInitial]
  );

  return {
    requests,
    balances,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    submitLeave,
    refresh: loadInitial,
  };
}

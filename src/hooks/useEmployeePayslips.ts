"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getEmployeePayrollRecords,
  getEmployeePayrollOverview,
  savePayslipPdf,
  getPayslipPdf,
  type PayrollRecord,
  type EmployeePayrollOverview,
} from "@/lib/payroll";
import { generatePayslipPdf } from "@/utils/generatePayslipPdf";

export function useEmployeePayslips() {
  const { currentUser, loading: authLoading } = useAuth();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [overview, setOverview] = useState<EmployeePayrollOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    if (authLoading || !currentUser) return;
    try {
      setLoading(true);
      setError(null);
      const [result, ov] = await Promise.all([
        getEmployeePayrollRecords(currentUser.uid),
        getEmployeePayrollOverview(currentUser.uid),
      ]);
      setRecords(result.items);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      setOverview(ov);
    } catch (err: any) {
      setError(err?.message || "Failed to load payroll data");
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
      const result = await getEmployeePayrollRecords(currentUser.uid, lastDoc);
      setRecords((prev) => [...prev, ...result.items]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(err?.message || "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastDoc, currentUser]);

  const downloadPdf = useCallback(async (record: PayrollRecord) => {
    if (!currentUser) return;
    const id = record.id!;
    setDownloadingId(id);

    try {
      let pdfData = await getPayslipPdf(id);

      if (!pdfData) {
        const blob = generatePayslipPdf(
          record,
          record.employeeName,
          record.employeeId,
          record.department
        );
        const reader = new FileReader();
        pdfData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        await savePayslipPdf(id, currentUser.uid, record.month, record.year, pdfData);
      }

      const link = document.createElement("a");
      link.href = pdfData;
      link.download = `Payslip_${record.employeeId}_${record.month}_${record.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadingId(null);
    }
  }, [currentUser]);

  return {
    records,
    overview,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    downloadPdf,
    downloadingId,
    refresh: loadInitial,
  };
}

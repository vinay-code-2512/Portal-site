"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import {
  createPayrollRecord,
  updatePayrollStatus,
  getPayrollOverview,
  getAllPayrollForMonth,
  type PayrollRecord,
  type PayrollOverview,
  type PayrollStatus,
} from "@/lib/payroll";

export function useAdminPayroll() {
  const { currentUser, loading: authLoading } = useAuth();
  const { employees, loading: employeesLoading } = useEmployees();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [overview, setOverview] = useState<PayrollOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    if (authLoading || !currentUser) return;
    try {
      setLoading(true);
      setError(null);
      const [recs, ov] = await Promise.all([
        getAllPayrollForMonth(year, month),
        getPayrollOverview(year, month),
      ]);
      setRecords(recs);
      setOverview(ov);
    } catch (err: any) {
      setError(err?.message || "Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  }, [currentUser, authLoading, year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generatePayroll = useCallback(
    async (selectedUids: string[]) => {
      if (!currentUser || selectedUids.length === 0) return;
      try {
        setGenerating(true);
        const emps = employees.filter((e) => selectedUids.includes(e.uid));

        for (const emp of emps) {
          const basic = emp.basicSalary || 0;
          const allowances = emp.allowances || 0;
          const bonuses = emp.bonuses || 0;
          const deductions = emp.deductions || 0;

          await createPayrollRecord(
            emp.uid,
            emp.fullName,
            emp.employeeId,
            emp.department,
            month,
            year,
            basic,
            allowances,
            bonuses,
            deductions
          );
        }

        await loadData();
      } finally {
        setGenerating(false);
      }
    },
    [currentUser, employees, month, year, loadData]
  );

  const updateStatus = useCallback(
    async (id: string, status: PayrollStatus) => {
      try {
        await updatePayrollStatus(id, status);
        setRecords((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
        if (overview) {
          const updated = await getPayrollOverview(year, month);
          setOverview(updated);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to update status");
      }
    },
    [year, month, overview]
  );

  const isLoading = authLoading || employeesLoading;

  return {
    employees,
    records,
    overview,
    month,
    setMonth,
    year,
    setYear,
    loading: loading || isLoading,
    error,
    generatePayroll,
    generating,
    updateStatus,
    refresh: loadData,
  };
}

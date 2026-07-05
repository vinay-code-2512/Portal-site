"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getEmployeesPaginated, getEmployee, type EmployeeData } from "@/lib/employees";

export function useEmployees() {
  const { currentUser, loading: authLoading } = useAuth();
  const [allEmployees, setAllEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadEmployees = useCallback(async () => {
    if (authLoading || !currentUser) return;
    try {
      setLoading(true);
      setError(null);
      const result = await getEmployeesPaginated(10);
      setAllEmployees(result.employees);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(err?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [currentUser, authLoading]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    try {
      setLoadingMore(true);
      const result = await getEmployeesPaginated(10, lastDoc);
      setAllEmployees((prev) => [...prev, ...result.employees]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(err?.message || "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastDoc]);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allEmployees.filter((emp) => {
      if (q && !emp.fullName?.toLowerCase().includes(q) &&
          !emp.employeeId?.toLowerCase().includes(q) &&
          !emp.email?.toLowerCase().includes(q)) {
        return false;
      }
      if (departmentFilter && emp.department !== departmentFilter) return false;
      if (designationFilter && emp.designation !== designationFilter) return false;
      if (statusFilter && emp.status !== statusFilter) return false;
      return true;
    });
  }, [allEmployees, searchQuery, departmentFilter, designationFilter, statusFilter]);

  const uniqueDepartments = useMemo(
    () => [...new Set(allEmployees.map((e) => e.department).filter(Boolean))],
    [allEmployees]
  );
  const uniqueDesignations = useMemo(
    () => [...new Set(allEmployees.map((e) => e.designation).filter(Boolean))],
    [allEmployees]
  );

  return {
    employees: filteredEmployees,
    allCount: allEmployees.length,
    loading,
    loadingMore,
    error,
    searchQuery,
    setSearchQuery,
    departmentFilter,
    setDepartmentFilter,
    designationFilter,
    setDesignationFilter,
    statusFilter,
    setStatusFilter,
    uniqueDepartments,
    uniqueDesignations,
    hasMore,
    loadMore,
  };
}

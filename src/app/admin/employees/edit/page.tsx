"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getEmployee, type EmployeeData } from "@/lib/employees";
import EmployeeForm from "@/components/admin/employees/EmployeeForm";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";

function EditContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("id");

  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const uidStr: string = uid;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const emp = await getEmployee(uidStr);
        if (cancelled) return;
        setEmployee(emp);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load employee");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [uid]);

  if (!uid) return <ErrorState message="No employee ID provided" />;
  if (loading) return <LoadingState variant="page" />;
  if (error) return <ErrorState message={error} />;
  if (!employee) return <ErrorState message="Employee not found" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="hrms-breadcrumb">Admin / Employees / Edit</p>
        <h1 className="hrms-page-title">Edit Employee</h1>
        <p className="hrms-page-subtitle">Update employee information</p>
      </div>
      <EmployeeForm mode="edit" initialData={employee} />
    </div>
  );
}

export default function EditEmployeePage() {
  return (
    <Suspense fallback={<LoadingState variant="page" />}>
      <EditContent />
    </Suspense>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { deleteDoc, doc, setDoc, collection, Timestamp, writeBatch, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useEmployees } from "@/hooks/useEmployees";
import EmployeeTable from "@/components/admin/employees/EmployeeTable";
import EmployeeCard from "@/components/admin/employees/EmployeeCard";
import EmployeeFilters from "@/components/admin/employees/EmployeeFilters";

import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/shared/EmptyState";

export default function AdminEmployees() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { canManageEmployees, loading: permLoading } = usePermissions();
  
  const {
    employees,
    allCount,
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
  } = useEmployees();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const deleteAllEmployeeData = async (uid: string) => {
    const collections = [
      { ref: collection(db, "attendance"), field: "uid" },
      { ref: collection(db, "leaves"), field: "uid" },
      { ref: collection(db, "tasks"), field: "employeeId" },
      { ref: collection(db, "activity_log"), field: "uid" },
      { ref: collection(db, "payroll"), field: "uid" },
      { ref: collection(db, "payslips"), field: "uid" },
    ];

    const batch = writeBatch(db);
    let ops = 0;

    for (const { ref, field } of collections) {
      const snap = await getDocs(query(ref, where(field, "==", uid)));
      for (const d of snap.docs) {
        batch.delete(d.ref);
        ops++;
        if (ops >= 490) {
          await batch.commit();
          ops = 0;
        }
      }
    }

    if (ops > 0) await batch.commit();
  };

  const handleDeleteEmployee = async (uid: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this employee record and ALL associated data (attendance, leaves, tasks, payroll, activity logs)? This action cannot be undone."
    );
    if (!confirmDelete) return;

    // Step 1: Delete Firebase Auth account first
    if (currentUser) {
      try {
        const idToken = await currentUser.getIdToken();
        const { deleteUser } = await import("@/lib/adminFunctions");
        await deleteUser(uid, idToken);
      } catch (err: any) {
        alert(`Failed to delete auth account: ${err.message}`);
        return;
      }
    }

    // Step 2: Delete all related Firestore data
    try {
      await deleteAllEmployeeData(uid);
    } catch (err: any) {
      alert(`Error deleting employee data: ${err.message}`);
      return;
    }

    // Step 3: Delete employee profile
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (err: any) {
      alert(`Error deleting employee profile: ${err.message}`);
      return;
    }

    // Step 4: Log activity
    if (currentUser) {
      try {
        const logRef = doc(collection(db, "activity_log"));
        await setDoc(logRef, {
          uid: currentUser.uid,
          type: "employee",
          description: `Deleted employee ${uid} and all associated data`,
          timestamp: Timestamp.now(),
        });
      } catch {}
    }

    alert("Employee and all associated data deleted successfully.");
    window.location.reload();
  };

  if (permLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;
  }

  if (!canManageEmployees) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center py-12">
        <p className="text-xs font-bold text-zinc-400">You don&apos;t have access to employee management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 sm:pb-6 pt-6 sm:pt-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Employees</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage workforce, departments and employee records.
          </p>
        </div>
        <div>
          <button
            onClick={() => router.push("/admin/employees/add")}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#5B4CFF] to-[#7A6EFF] text-white text-xs font-bold hover:brightness-110 shadow-md hover:shadow-lg transition-all cursor-pointer min-h-[44px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <EmployeeFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        departmentFilter={departmentFilter}
        onDepartmentChange={setDepartmentFilter}
        designationFilter={designationFilter}
        onDesignationChange={setDesignationFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        uniqueDepartments={uniqueDepartments}
        uniqueDesignations={uniqueDesignations}
      />

      {/* Employees Table / Cards */}
      <div className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        {loading ? (
          <LoadingState variant="list" count={5} />
        ) : error ? (
          <ErrorState message={error} />
        ) : employees.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={allCount === 0 ? "No employees yet" : "No employees match your filters"}
            action={
              allCount === 0 ? (
                <button
                  onClick={() => router.push("/admin/employees/add")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/10 text-purple-300 text-xs font-semibold border border-purple-500/20 hover:bg-purple-500/20 transition-all cursor-pointer min-h-[40px]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Your First Employee
                </button>
              ) : undefined
            }
          />
        ) : isMobile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {employees.map((emp) => (
              <EmployeeCard
                key={emp.uid}
                employee={emp}
                onDelete={handleDeleteEmployee}
              />
            ))}
          </div>
        ) : (
          <EmployeeTable
            employees={employees}
            onDelete={handleDeleteEmployee}
          />
        )}

        {hasMore && !loading && (
          <div className="flex justify-center mt-6 pt-4 border-t border-[var(--border-light)]/50">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[var(--border-light)] text-xs text-zinc-500 font-bold hover:bg-zinc-50 hover:text-zinc-800 transition-all cursor-pointer disabled:opacity-50 min-h-[40px]"
            >
              {loadingMore ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              Load More
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

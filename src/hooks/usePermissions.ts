"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type UserRole = "admin" | "manager" | "employee" | "paid-user";

interface MatrixEntry {
  key: string;
  label: string;
  admin: boolean;
  manager: boolean;
  employee: boolean;
}

interface MatrixRow {
  category: string;
  permissions: MatrixEntry[];
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    "employees", "attendance", "leaves", "payroll", "reports",
    "team_attendance", "team_leave_approvals", "team_reports",
    "personal_dashboard", "profile_self",
  ],
  manager: [
    "team_attendance", "team_leave_approvals", "team_reports",
    "personal_dashboard", "profile_self",
  ],
  employee: [
    "personal_dashboard", "profile_self",
  ],
  "paid-user": [
    "personal_dashboard", "profile_self",
  ],
};

const MATRIX_KEY_TO_PERMISSION: Record<string, string[]> = {
  view_dashboard: ["personal_dashboard"],
  export_dashboard: ["personal_dashboard"],
  view_all_employees: ["employees"],
  add_edit_employees: ["employees"],
  delete_employees: ["employees"],
  view_own_attendance: ["attendance"],
  view_team_attendance: ["team_attendance"],
  mark_attendance: ["attendance"],
  apply_leave: ["leaves"],
  approve_reject_leaves: ["team_leave_approvals"],
  view_all_leaves: ["leaves"],
  view_payroll: ["payroll"],
  generate_payroll: ["payroll"],
  view_own_payslips: ["payroll"],
  view_all_reports: ["reports"],
  view_team_reports: ["team_reports"],
  export_reports: ["reports"],
  company_settings: ["company_settings"],
  manage_roles: ["manage_roles"],
  manage_departments: ["company_settings"],
  notification_settings: ["company_settings"],
};

export function usePermissions() {
  const { userData, loading: authLoading } = useAuth();
  const [matrix, setMatrix] = useState<MatrixRow[] | null>(null);
  const [matrixLoading, setMatrixLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadMatrix() {
      setMatrixLoading(true);
      try {
        const snap = await getDoc(doc(db, "settings", "permissions"));
        if (!cancelled) {
          if (snap.exists()) {
            const data = snap.data().matrix as MatrixRow[];
            if (Array.isArray(data) && data.length > 0) {
              setMatrix(data);
            } else {
              setMatrix(null);
            }
          } else {
            setMatrix(null);
          }
        }
      } catch {
        if (!cancelled) setMatrix(null);
      } finally {
        if (!cancelled) setMatrixLoading(false);
      }
    }
    if (userData) {
      loadMatrix();
    } else {
      setMatrixLoading(false);
      setMatrix(null);
    }
    return () => { cancelled = true; };
  }, [userData]);

  const role = useMemo<(UserRole | null)>(() => {
    if (!userData) return null;
    const r = userData.role;
    if (r === "admin" || r === "manager" || r === "employee" || r === "paid-user") return r;
    return null;
  }, [userData]);

  const permissions = useMemo<string[]>(() => {
    if (!role) return [];
    if (matrix && matrix.length > 0 && role !== "paid-user") {
      const granted = new Set<string>();
      for (const group of matrix) {
        for (const entry of group.permissions) {
          if (entry[role as "admin" | "manager" | "employee"]) {
            const mapped = MATRIX_KEY_TO_PERMISSION[entry.key];
            if (mapped) {
              mapped.forEach((p) => granted.add(p));
            }
          }
        }
      }
      return Array.from(granted);
    }
    return ROLE_PERMISSIONS[role] || [];
  }, [role, matrix]);

  const loading = authLoading || matrixLoading;

  const hasPermission = (perm: string) => permissions.includes(perm);

  return {
    role,
    permissions,
    loading,
    hasPermission,
    canManageEmployees: hasPermission("employees"),
    canApproveLeaves: hasPermission("leaves") || hasPermission("team_leave_approvals"),
    canViewPayroll: hasPermission("payroll"),
    canViewReports: hasPermission("reports") || hasPermission("all_reports") || hasPermission("team_reports"),
    canManageAdmins: hasPermission("manage_admins"),
    canCompanySettings: hasPermission("company_settings"),
    canManageRoles: hasPermission("manage_roles"),
    isAdmin: role === "admin",
    isManager: role === "manager",
    isEmployee: role === "employee",
  };
}

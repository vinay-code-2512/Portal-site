"use client";
import { useState, useEffect } from "react";
import { ShieldCheck, Check, X, Loader2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PermissionEntry {
  key: string;
  label: string;
  admin: boolean;
  manager: boolean;
  employee: boolean;
}

interface PermissionRow {
  category: string;
  permissions: PermissionEntry[];
}

const PERMISSION_DATA: PermissionRow[] = [
  {
    category: "Dashboard",
    permissions: [
      { key: "view_dashboard", label: "View Dashboard", admin: true, manager: true, employee: true },
      { key: "export_dashboard", label: "Export Dashboard", admin: true, manager: false, employee: false },
    ],
  },
  {
    category: "Employees",
    permissions: [
      { key: "view_all_employees", label: "View All Employees", admin: true, manager: false, employee: false },
      { key: "add_edit_employees", label: "Add / Edit Employees", admin: true, manager: false, employee: false },
      { key: "delete_employees", label: "Delete Employees", admin: true, manager: false, employee: false },
    ],
  },
  {
    category: "Attendance",
    permissions: [
      { key: "view_own_attendance", label: "View Own Attendance", admin: true, manager: true, employee: true },
      { key: "view_team_attendance", label: "View Team Attendance", admin: true, manager: true, employee: false },
      { key: "mark_attendance", label: "Mark Attendance", admin: true, manager: false, employee: false },
    ],
  },
  {
    category: "Leaves",
    permissions: [
      { key: "apply_leave", label: "Apply for Leave", admin: true, manager: true, employee: true },
      { key: "approve_reject_leaves", label: "Approve / Reject", admin: true, manager: true, employee: false },
      { key: "view_all_leaves", label: "View All Leaves", admin: true, manager: false, employee: false },
    ],
  },
  {
    category: "Payroll",
    permissions: [
      { key: "view_payroll", label: "View Payroll", admin: true, manager: false, employee: false },
      { key: "generate_payroll", label: "Generate Payroll", admin: true, manager: false, employee: false },
      { key: "view_own_payslips", label: "View Own Payslips", admin: true, manager: true, employee: true },
    ],
  },
  {
    category: "Reports",
    permissions: [
      { key: "view_all_reports", label: "View All Reports", admin: true, manager: false, employee: false },
      { key: "view_team_reports", label: "View Team Reports", admin: true, manager: true, employee: false },
      { key: "export_reports", label: "Export Reports", admin: true, manager: true, employee: false },
    ],
  },
  {
    category: "Settings",
    permissions: [
      { key: "company_settings", label: "Company Settings", admin: true, manager: false, employee: false },
      { key: "manage_roles", label: "Manage Roles", admin: true, manager: false, employee: false },
      { key: "manage_departments", label: "Manage Departments", admin: true, manager: false, employee: false },
      { key: "notification_settings", label: "Notification Settings", admin: true, manager: false, employee: false },
    ],
  },
];

const ROLES = [
  { key: "admin" as const, label: "Admin", color: "text-[var(--color-primary)]" },
  { key: "manager" as const, label: "Manager", color: "text-amber-600" },
  { key: "employee" as const, label: "Employee", color: "text-emerald-600" },
];

export default function PermissionMatrix() {
  const [viewMode, setViewMode] = useState<"view" | "create" | "edit" | "delete" | "export">("view");
  const [data, setData] = useState<PermissionRow[]>(PERMISSION_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const snap = await getDoc(doc(db, "settings", "permissions"));
        if (snap.exists()) {
          const matrix = snap.data().matrix as PermissionRow[];
          if (Array.isArray(matrix)) {
            setData(matrix);
          }
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load permissions");
      } finally {
        setLoading(false);
      }
    }
    loadPermissions();
  }, []);

  const handleToggle = (groupIndex: number, permIndex: number, role: "admin" | "manager" | "employee") => {
    setData(prev => {
      const copy = [...prev];
      const category = { ...copy[groupIndex] };
      const permissions = [...category.permissions];
      const permission = { ...permissions[permIndex] };
      permission[role] = !permission[role];
      permissions[permIndex] = permission;
      category.permissions = permissions;
      copy[groupIndex] = category;
      return copy;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await setDoc(doc(db, "settings", "permissions"), { matrix: data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const actionCols = [
    { key: "view", label: "View" },
    { key: "create", label: "Create" },
    { key: "edit", label: "Edit" },
    { key: "delete", label: "Delete" },
    { key: "export", label: "Export" },
  ] as const;

  if (loading) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
          <p className="text-xs font-semibold">Loading permissions matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Permission Matrix</h3>
            <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Role-based module access with CRUD controls</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {error && <span className="text-[10px] text-red-500 font-bold">{error}</span>}
          {saved && <span className="text-[10px] text-emerald-600 font-bold">Saved!</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-md shrink-0"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Role Toggle */}
      <div className="flex items-center gap-1.5 mb-4 bg-white/35 p-1 rounded-xl border border-[var(--border-light)]/50 w-fit">
        {actionCols.map((col) => (
          <button
            key={col.key}
            onClick={() => setViewMode(col.key)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              viewMode === col.key
                ? "bg-[var(--color-primary)] text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-800 hover:bg-white/40"
            }`}
          >
            {col.label}
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold border-b border-[var(--border-light)]/40 text-left">
              <th className="pb-3 pr-4 font-extrabold">Module</th>
              <th className="pb-3 pr-4 font-extrabold">Permission</th>
              {ROLES.map((r) => (
                <th key={r.key} className={`text-center pb-3 px-2 font-extrabold ${r.color}`}>{r.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]/20">
            {data.map((group, groupIndex) => (
              <div key={group.category} className="contents">
                <tr key={`${group.category}-header`}>
                  <td colSpan={ROLES.length + 2} className="py-2.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                    {group.category}
                  </td>
                </tr>
                {group.permissions.map((perm, permIndex) => (
                  <tr key={perm.label} className="text-xs text-zinc-700 hover:bg-white/20 transition-all duration-200">
                    <td className="py-2.5 pr-4 text-zinc-500 font-semibold text-[10px] uppercase tracking-wider">
                      {group.category}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-zinc-700">{perm.label}</td>
                    {ROLES.map((r) => (
                      <td
                        key={r.key}
                        onClick={() => handleToggle(groupIndex, permIndex, r.key)}
                        className="text-center py-2.5 px-2 cursor-pointer hover:bg-white/50 transition-colors rounded-lg"
                        title={`Click to toggle ${perm.label} for ${r.label}`}
                      >
                        {perm[r.key] ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-600">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-zinc-500/10 text-zinc-400">
                            <X className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </div>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {data.map((group, groupIndex) => (
          <div key={group.category} className="p-4 rounded-xl bg-white/20 border border-[var(--border-light)]/40">
            <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-2">{group.category}</p>
            <div className="space-y-2">
              {group.permissions.map((perm, permIndex) => (
                <div key={perm.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-700 font-semibold">{perm.label}</span>
                  <div className="flex items-center gap-1.5">
                    {ROLES.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => handleToggle(groupIndex, permIndex, r.key)}
                        className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all cursor-pointer ${
                          perm[r.key]
                            ? `${r.color} bg-white/60 shadow-sm ring-1 ring-[var(--border-light)]/40`
                            : "text-zinc-400 bg-white/10 hover:bg-white/20"
                        }`}
                        title={`Click to toggle ${perm.label} for ${r.label}`}
                      >
                        {r.label === "Admin" ? "A" : r.label === "Manager" ? "M" : "E"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

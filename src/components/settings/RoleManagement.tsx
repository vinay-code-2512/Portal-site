"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { grantAdminSheetAccess } from "@/lib/googleSheets";
import { fetchAllEmployeeSheetIds, fetchAdminEmails } from "@/lib/adminHelpers";
import { Shield, Search, Users, Eye, Pencil, Trash2, RefreshCw } from "lucide-react";
import type { EmployeeData } from "@/lib/employees";

const ROLES = [
  { value: "admin", label: "Admin", color: "text-[var(--color-primary)] bg-[var(--color-primary-dim)]" },
  { value: "manager", label: "Manager", color: "text-amber-600 bg-amber-500/10" },
  { value: "employee", label: "Employee", color: "text-emerald-600 bg-emerald-500/10" },
] as const;

function getRoleMeta(role: string) {
  return ROLES.find((r) => r.value === role) || ROLES[2];
}

const PERMISSION_COUNTS: Record<string, number> = {
  admin: 12,
  manager: 7,
  employee: 4,
};

export default function RoleManagement() {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "users"), where("role", "in", ["admin", "manager", "employee"]));
      const snap = await getDocs(q);
      const list: EmployeeData[] = [];
      snap.forEach((d) => list.push({ uid: d.id, ...d.data() } as EmployeeData));
      list.sort((a, b) => {
        const order: Record<string, number> = { admin: 0, manager: 1, employee: 2 };
        return (order[a.role] ?? 99) - (order[b.role] ?? 99);
      });
      setEmployees(list);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const syncAllAdmins = useCallback(async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const [adminEmails, sheetIds] = await Promise.all([
        fetchAdminEmails(),
        fetchAllEmployeeSheetIds(),
      ]);
      if (adminEmails.length === 0) {
        setSyncMsg("No admins found");
        return;
      }
      if (sheetIds.length === 0) {
        setSyncMsg("No employee sheets found");
        return;
      }
      let totalGranted = 0;
      let totalFailed = 0;
      for (const email of adminEmails) {
        const result = await grantAdminSheetAccess(email, sheetIds);
        if (result) {
          totalGranted += result.granted;
          totalFailed += result.failed;
        }
      }
      setSyncMsg(`Done: ${totalGranted} granted, ${totalFailed} failed across ${adminEmails.length} admin(s)`);
    } catch (err: any) {
      setSyncMsg("Error: " + (err?.message || "Unknown error"));
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleRoleChange = async (uid: string, newRole: string) => {
    if (!currentUser || updating) return;
    const prev = employees.find((e) => e.uid === uid);
    try {
      setUpdating(uid);
      await updateDoc(doc(db, "users", uid), { role: newRole, updatedAt: serverTimestamp() });
      setEmployees((prev) => prev.map((e) => (e.uid === uid ? { ...e, role: newRole as any } : e)));

      if (newRole === "admin" && prev && prev.role !== "admin" && prev.email) {
        const sheetIds = await fetchAllEmployeeSheetIds();
        if (sheetIds.length > 0) {
          await grantAdminSheetAccess(prev.email, sheetIds);
        }
      }
    } finally { setUpdating(null); }
  };

  const filtered = employees.filter(
    (e) =>
      e.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  // Count users per role
  const roleCounts: Record<string, number> = {};
  employees.forEach((e) => { roleCounts[e.role] = (roleCounts[e.role] || 0) + 1; });

  if (loading) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white/30 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
          <Shield className="w-4.5 h-4.5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Role Management</h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-0.5">{employees.length} users assigned</p>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {ROLES.map((role) => (
          <div key={role.value} className="p-3.5 rounded-xl bg-white/30 border border-[var(--border-light)]/30">
            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold ${role.color} mb-1.5`}>
              {role.label}
            </span>
            <p className="text-lg font-extrabold text-[#111827] tabular-nums">{roleCounts[role.value] || 0}</p>
            <p className="text-[9px] text-zinc-400 font-semibold">users · {PERMISSION_COUNTS[role.value]} permissions</p>
          </div>
        ))}
      </div>

      {/* Sync Admin Sheet Permissions */}
      {syncMsg && (
        <p className="text-[10px] text-zinc-500 font-semibold mb-2">{syncMsg}</p>
      )}
      <button
        onClick={syncAllAdmins}
        disabled={syncing}
        className="w-full flex items-center justify-center gap-1.5 mb-4 px-3 py-2 rounded-xl bg-white/40 border border-[var(--border-light)]/40 text-[10px] font-bold text-zinc-600 hover:bg-white/60 transition-all cursor-pointer disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing..." : "Grant all admins access to all sheets"}
      </button>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
        <input
          type="text" placeholder="Search by name, email or ID..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--color-primary-light)]"
        />
      </div>

      {/* User list */}
      {filtered.length === 0 ? (
        <p className="text-xs text-zinc-400 text-center py-8 font-bold">No employees found</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((emp) => {
            const meta = getRoleMeta(emp.role);
            return (
              <div
                key={emp.uid}
                className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-white/20 border border-[var(--border-light)]/20 hover:bg-white/35 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-[10px] text-white font-extrabold shrink-0 overflow-hidden shadow-sm">
                    {emp.fullName?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-800 truncate">{emp.fullName}</p>
                    <p className="text-[10px] text-zinc-400 font-semibold truncate">{emp.email} · {emp.employeeId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold ${meta.color}`}>
                    {meta.label}
                  </span>
                  <select
                    value={emp.role}
                    onChange={(e) => handleRoleChange(emp.uid, e.target.value)}
                    disabled={updating === emp.uid}
                    className="px-2 py-1.5 rounded-lg bg-white/40 border border-[var(--border-light)]/50 text-[10px] font-semibold text-zinc-600 focus:outline-none focus:border-[var(--color-primary)]/40 cursor-pointer appearance-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

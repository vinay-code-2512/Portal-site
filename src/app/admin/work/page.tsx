"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Users, Search, ChevronRight } from "lucide-react";
import LoadingState from "@/components/common/LoadingState";

interface Employee {
  uid: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  photoURL?: string;
  employeeId: string;
}

export default function AdminWorkPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "users"),
          where("role", "==", "employee")
        );
        const snap = await getDocs(q);
        const list: Employee[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            uid: d.id,
            fullName: data.fullName || data.displayName || "",
            email: data.email || "",
            department: data.department || "",
            designation: data.designation || "",
            photoURL: data.photoURL || "",
            employeeId: data.employeeId || "",
          });
        });
        list.sort((a, b) => a.fullName.localeCompare(b.fullName));
        setEmployees(list);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filtered = search.trim()
    ? employees.filter(
        (e) =>
          e.fullName.toLowerCase().includes(search.toLowerCase()) ||
          e.department.toLowerCase().includes(search.toLowerCase()) ||
          e.employeeId.toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  return (
    <div className="space-y-6 pb-24 sm:pb-6 pt-6 sm:pt-8">
      <div>
        <p className="hrms-breadcrumb">Admin / Work</p>
        <h1 className="hrms-page-title">Assign Work</h1>
        <p className="hrms-page-subtitle">Select an employee to assign tasks or notes</p>
      </div>

      {loading ? (
        <LoadingState variant="list" count={5} />
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, department or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white/50 backdrop-blur-sm border border-white/40 text-zinc-700 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((emp, i) => (
              <motion.div
                key={emp.uid}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                onClick={() => router.push(`/admin/work/assign?id=${emp.uid}`)}
                className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm text-white font-extrabold shrink-0 overflow-hidden ring-2 ring-white/50">
                    {emp.photoURL ? (
                      <img src={emp.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      emp.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#111827] truncate group-hover:text-indigo-600 transition-colors">
                      {emp.fullName}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-semibold truncate mt-0.5">
                      {emp.department || "—"} {emp.designation ? `/ ${emp.designation}` : ""}
                    </p>
                    <p className="text-[9px] text-zinc-400 font-bold tabular-nums mt-0.5">
                      {emp.employeeId || emp.uid.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="hrms-glass rounded-[20px] p-8 sm:p-10 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex flex-col items-center justify-center text-center min-h-[200px]">
              <Users className="w-8 h-8 text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500 font-semibold">No employees match your search</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

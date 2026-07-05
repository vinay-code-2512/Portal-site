"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { History, User, LogIn, FileEdit, Shield, Settings2, Calendar, Clock, Loader2 } from "lucide-react";

interface AuditEntry {
  id: string;
  uid: string;
  type: string;
  description: string;
  timestamp: { seconds: number; nanoseconds: number };
  actorName?: string;
  actorEmail?: string;
}

function getActionIcon(type: string) {
  switch (type) {
    case "auth": return LogIn;
    case "role": return Shield;
    case "settings": return Settings2;
    case "edit": return FileEdit;
    default: return User;
  }
}

function getActionColor(type: string) {
  switch (type) {
    case "auth": return "text-emerald-600 bg-emerald-500/10";
    case "role": return "text-[var(--color-primary)] bg-[var(--color-primary-dim)]";
    case "settings": return "text-amber-600 bg-amber-500/10";
    case "edit": return "text-blue-600 bg-blue-500/10";
    default: return "text-zinc-600 bg-zinc-500/10";
  }
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "activity_log"), orderBy("timestamp", "desc"), limit(20));
        const snap = await getDocs(q);
        const items: AuditEntry[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as AuditEntry));

        // Fetch user profiles for all unique UIDs in parallel
        const uids = Array.from(new Set(items.map(item => item.uid).filter(Boolean)));
        const userMap: Record<string, { fullName: string; email: string }> = {};
        
        await Promise.all(
          uids.map(async (uid) => {
            try {
              const userSnap = await getDoc(doc(db, "users", uid));
              if (userSnap.exists()) {
                const uData = userSnap.data();
                userMap[uid] = {
                  fullName: uData.fullName || uData.displayName || "Unknown User",
                  email: uData.email || "",
                };
              }
            } catch {
              // ignore fetch errors
            }
          })
        );

        // Attach user info to each log entry
        const enriched = items.map((item) => ({
          ...item,
          actorName: userMap[item.uid]?.fullName || "System/Unknown",
          actorEmail: userMap[item.uid]?.email || "",
        }));

        setLogs(enriched);
      } catch {
        // activity_log may not exist
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
          <p className="text-xs font-semibold">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
          <History className="w-4.5 h-4.5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Audit Logs</h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Recent activity across the system</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-zinc-400">
          <History className="w-6 h-6 mb-2" />
          <p className="text-xs font-bold">No audit logs available</p>
        </div>
      ) : (
        <div className="space-y-0">
          {logs.map((entry, i) => {
            const Icon = getActionIcon(entry.type);
            const colorClass = getActionColor(entry.type);
            const date = entry.timestamp
              ? new Date(entry.timestamp.seconds * 1000)
              : null;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 py-3 border-b border-[var(--border-light)]/20 last:border-0"
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-xl ${colorClass} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {i < logs.length - 1 && (
                    <div className="w-px h-full min-h-[20px] bg-[var(--border-light)]/30 mt-1" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs font-bold text-zinc-800">{entry.description}</p>
                  {entry.actorName && (
                    <p className="text-[9.5px] text-zinc-500 font-semibold mt-0.5 flex flex-wrap items-center gap-1 select-none">
                      by <span className="text-[var(--color-primary)] font-bold">{entry.actorName}</span>
                      {entry.actorEmail && <span className="text-zinc-400">({entry.actorEmail})</span>}
                    </p>
                  )}
                </div>

                {date && (
                  <div className="flex flex-col items-end shrink-0 pt-0.5 pl-2 select-none">
                    <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                      <Calendar className="w-2.5 h-2.5" />
                      {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-bold mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-zinc-400" />
                      {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

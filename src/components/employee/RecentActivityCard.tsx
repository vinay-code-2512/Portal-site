"use client";

import { motion } from "framer-motion";
import { Clock, CalendarOff, CheckSquare, LogIn, FileText, Image, AlertCircle } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import type { ActivityEvent } from "@/hooks/useActivityLog";
import { formatFirebaseDate } from "@/lib/format";

interface RecentActivityCardProps {
  activities: ActivityEvent[];
  loading?: boolean;
}

const iconMap: Record<string, typeof Clock> = {
  attendance: LogIn,
  leave: CalendarOff,
  task: CheckSquare,
  other: FileText,
};

const colorMap: Record<string, string> = {
  attendance: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  leave: "bg-[var(--color-primary-dim)] text-[var(--color-primary-light)] border-[var(--color-primary)]/20",
  task: "bg-[var(--color-primary-dim)] text-[var(--color-primary-light)] border-[var(--color-primary)]/20",
  other: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function RecentActivityCard({ activities, loading }: RecentActivityCardProps) {
  if (!loading && activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="hrms-glass rounded-[20px] p-5"
      >
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-4">
          Recent Activities
        </p>
        <EmptyState
          icon={<AlertCircle className="w-6 h-6" />}
          title="No recent activity"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="hrms-glass rounded-[20px] p-5"
    >
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-4">
        Recent Activities
      </p>

      <div className="space-y-0">
        {activities.map((item, i) => {
          const Icon = iconMap[item.type] || FileText;
          const isLast = i === activities.length - 1;
          const colorClass = colorMap[item.type] || colorMap.other;
          const timeStr = item.timestamp ? formatFirebaseDate(item.timestamp) : "";
          return (
            <motion.div
              key={item.id || i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: 0.3 + i * 0.06 }}
              className="relative flex gap-3 pb-3"
            >
              {!isLast && (
                <div className="absolute left-[15px] top-8 bottom-0 w-px bg-white/5" />
              )}
              <div className={`flex items-center justify-center w-8 h-8 rounded-xl border shrink-0 ${colorClass}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-sm text-zinc-300 truncate">{item.description || item.note || ""}</p>
                {item.attachments && item.attachments.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {item.attachments.map((att, i) => (
                      <span key={i} className="text-[9px] text-zinc-500 flex items-center gap-0.5">
                        {att.type === "image" ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        {att.name.length > 12 ? att.name.slice(0, 12) + "..." : att.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-zinc-600 font-medium shrink-0 pt-1.5">{timeStr}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { LogIn, LogOut, Calendar, IndianRupee, UserPlus, Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  uid: string;
  type: string;
  description: string;
  timeAgo: string;
}

interface RecentActivitiesProps {
  activities: ActivityItem[];
}

function getActivityIcon(type: string, description: string) {
  const descLower = description.toLowerCase();
  const typeLower = type.toLowerCase();
  
  if (descLower.includes("check in") || descLower.includes("checked in") || typeLower.includes("checkin")) {
    return <LogIn className="w-3.5 h-3.5 text-emerald-500" />;
  }
  if (descLower.includes("check out") || descLower.includes("checked out") || typeLower.includes("checkout")) {
    return <LogOut className="w-3.5 h-3.5 text-rose-500" />;
  }
  if (descLower.includes("leave") || typeLower.includes("leave")) {
    return <Calendar className="w-3.5 h-3.5 text-amber-500" />;
  }
  if (descLower.includes("payroll") || typeLower.includes("payroll")) {
    return <IndianRupee className="w-3.5 h-3.5 text-[var(--color-primary-light)]" />;
  }
  if (descLower.includes("added") || descLower.includes("new employee") || typeLower.includes("employee")) {
    return <UserPlus className="w-3.5 h-3.5 text-indigo-500" />;
  }
  return <Activity className="w-3.5 h-3.5 text-zinc-400" />;
}

export default function RecentActivities({ activities }: RecentActivitiesProps) {
  if (!activities.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col h-full"
      >
        <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4">
          Recent Activity
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
          <Activity className="w-8 h-8 opacity-40 mb-2" />
          <p className="text-xs">No recent activity logs available</p>
        </div>
      </motion.div>
    );
  }

  // Display top 6 activities to fit well inside Row 3 layout
  const displayedActivities = activities.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col h-full"
    >
      <div>
        <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
          Recent Activities
        </h3>
        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 mb-6">
          Real-time activity logs from across the portal
        </p>
      </div>

      {/* Timeline Layout */}
      <div className="relative pl-1 flex-1">
        {/* Purple vertical timeline line */}
        <div className="absolute left-[15px] top-2 bottom-6 w-[2px] bg-[var(--color-primary)]/20" />

        <div className="space-y-4">
          {displayedActivities.map((a) => (
            <div key={a.id} className="relative pl-9 group">
              {/* Circular icon markers with hover scaling */}
              <div className="absolute left-0 top-[1.5px] w-8 h-8 rounded-full bg-white border border-[var(--border-light)] shadow-[0_2px_8px_rgba(91,76,255,0.06)] flex items-center justify-center z-10 transition-transform duration-200 group-hover:scale-110 group-hover:border-[var(--color-primary-light)]">
                {getActivityIcon(a.type, a.description)}
              </div>

              {/* Activity Details */}
              <div className="flex flex-col transition-all duration-200 group-hover:translate-x-0.5">
                <span className="text-[11px] text-[#111827] font-semibold leading-snug">
                  {a.description}
                </span>
                <span className="text-[9.5px] text-zinc-400 mt-0.5 font-medium tabular-nums">
                  {a.timeAgo}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

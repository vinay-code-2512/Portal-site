"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Users,
  UserCheck,
  Clock,
  Plus,
  Image as ImageIcon,
  Calendar,
  ClipboardList,
  CreditCard,
  Gift,
  GraduationCap,
  Video,
} from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

interface SettingsDashboardProps {
  departmentCount: number;
  designationCount: number;
  onTabChange?: (tab: any) => void;
}

export default function SettingsDashboard({ departmentCount, designationCount, onTabChange }: SettingsDashboardProps) {
  const router = useRouter();
  const { data, loading } = useAdminDashboard();
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTimeString(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const topCards = [
    {
      label: "Total Employees",
      value: loading ? "..." : data.totalEmployees.toString(),
      icon: Users,
      desc: "Registered staff in organization",
      iconColor: "text-blue-500",
      bgColor: "bg-white",
      action: () => router.push("/admin/employees"),
    },
    {
      label: "Today's Attendance",
      value: loading ? "..." : `${data.presentToday} / ${data.totalEmployees}`,
      icon: UserCheck,
      desc: "Employees present today",
      iconColor: "text-emerald-500",
      bgColor: "bg-white",
      action: () => router.push("/admin/attendance"),
    },
    {
      label: "Time Card",
      value: timeString || "--:--:--",
      icon: Clock,
      desc: "Local Standard Time",
      iconColor: "text-purple-500",
      bgColor: "bg-white",
      isLive: true,
    },
  ];

  const collectionCards = [
    {
      label: "User",
      desc: "Manage and add system users",
      icon: Users,
      action: () => router.push("/admin/employees/add"),
      iconColor: "text-blue-500",
      bgColor: "bg-white",
    },
    {
      label: "Media",
      desc: "Manage files & uploaded assets",
      icon: ImageIcon,
      action: () => alert("Media folder opened (integrated with cloud storage)."),
      iconColor: "text-amber-500",
      bgColor: "bg-white",
    },
    {
      label: "Attendances",
      desc: "Track employee presence logs",
      icon: Calendar,
      action: () => router.push("/admin/attendance"),
      iconColor: "text-emerald-500",
      bgColor: "bg-white",
    },
    {
      label: "Leaves",
      desc: "Approve and review leave requests",
      icon: ClipboardList,
      action: () => router.push("/admin/leaves"),
      iconColor: "text-rose-500",
      bgColor: "bg-white",
    },
    {
      label: "Payrolls",
      desc: "Process salaries and payroll statements",
      icon: CreditCard,
      action: () => router.push("/admin/payroll"),
      iconColor: "text-indigo-500",
      bgColor: "bg-white",
    },
    {
      label: "Holidays",
      desc: "Configure holiday lists & calendar",
      icon: Gift,
      action: () => router.push("/admin/holidays"),
      iconColor: "text-orange-500",
      bgColor: "bg-white",
    },
    {
      label: "Student",
      desc: "Manage student records & enrollments",
      icon: GraduationCap,
      action: () => router.push("/admin/students"),
      iconColor: "text-teal-500",
      bgColor: "bg-white",
    },
  ];

  const adminCards = [
    {
      label: "Meetings",
      desc: "Schedule and manage team meetings",
      icon: Video,
      action: () => router.push("/admin/meetings"),
      iconColor: "text-emerald-500",
      bgColor: "bg-white",
    },
    {
      label: "Notifications",
      desc: "Manage alerts & notification rules",
      icon: Bell,
      action: () => {
        if (onTabChange) {
          onTabChange("notifications");
        } else {
          router.push("/admin/settings");
        }
      },
      iconColor: "text-indigo-500",
      bgColor: "bg-white",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Operational Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={card.action}
              className={`hrms-glass rounded-[24px] p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex items-center justify-between min-h-[100px] relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 ${
                card.action ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <div className="flex items-center gap-4">
<div className={`w-12 h-12 rounded-2xl border border-gray-200/60 ${card.bgColor} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
  <Icon className={`w-6 h-6 ${card.iconColor}`} />
</div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                    {card.label}
                  </span>
                  <h4 className="text-2xl font-black text-[#111827] tracking-tight mt-1">
                    {card.value}
                  </h4>
                  <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">
                    {card.desc}
                  </p>
                </div>
              </div>
              {card.isLive && (
                <span className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold bg-white text-emerald-600 uppercase tracking-wider animate-pulse">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  Live
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pt-2 select-none">
        Collections
      </h3>

      {/* Collection Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {collectionCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col justify-between min-h-[130px] relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 cursor-pointer"
              onClick={card.action}
            >
              <div className="flex items-start justify-between">
<div className={`w-10 h-10 rounded-xl border border-gray-200/60 ${card.bgColor} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
  <Icon className={`w-5 h-5 ${card.iconColor}`} />
</div>
                <button
                  className="w-8 h-8 rounded-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary-dim)] transition-all duration-200 shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    card.action();
                  }}
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-black text-[#111827] tracking-tight">{card.label}</h4>
                <p className="text-[9.5px] text-zinc-400 font-semibold mt-1 leading-normal">{card.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pt-4 select-none">
        Admin
      </h3>

      {/* Admin Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col justify-between min-h-[130px] relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 cursor-pointer"
              onClick={card.action}
            >
              <div className="flex items-start justify-between">
<div className={`w-10 h-10 rounded-xl border border-gray-200/60 ${card.bgColor} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
  <Icon className={`w-5 h-5 ${card.iconColor}`} />
</div>
                <button
                  className="w-8 h-8 rounded-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary-dim)] transition-all duration-200 shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    card.action();
                  }}
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-black text-[#111827] tracking-tight">{card.label}</h4>
                <p className="text-[9.5px] text-zinc-400 font-semibold mt-1 leading-normal">{card.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

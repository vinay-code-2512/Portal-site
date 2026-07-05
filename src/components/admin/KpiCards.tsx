"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, UserCheck, UserX, Clock, Percent,
} from "lucide-react";
import type { AdminDashboardData } from "@/hooks/useAdminDashboard";

interface KpiCardsProps {
  data: AdminDashboardData;
}

export default function KpiCards({ data }: KpiCardsProps) {
  const router = useRouter();
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTimeString(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      icon: <Users className="w-5 h-5 text-[var(--color-primary-light)]" />,
      label: "Total Employees",
      value: data.totalEmployees,
      route: "/admin/employees",
    },
    {
      icon: <UserCheck className="w-5 h-5 text-emerald-500" />,
      label: "Present Today",
      value: data.presentToday,
      route: "/admin/attendance?status=present",
    },
    {
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      label: "Late Today",
      value: data.lateArrivals,
      route: "/admin/attendance?status=late",
    },
    {
      icon: <UserX className="w-5 h-5 text-red-500" />,
      label: "Absent Today",
      value: data.absentToday,
      route: "/admin/attendance?status=absent",
    },
    {
      icon: <Percent className="w-5 h-5 text-[var(--color-primary)]" />,
      label: "Attendance %",
      value: `${data.attendancePercent}%`,
    },
    {
      icon: <Clock className="w-5 h-5 text-indigo-500 animate-pulse" />,
      label: "INDIA (IST)",
      value: timeString || "--:--",
      isLive: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
    >
      {cards.map((card) => (
        <motion.div
          key={card.label}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          onClick={() => card.route && router.push(card.route)}
          className="hrms-glass rounded-[20px] p-5 flex flex-col justify-between cursor-pointer border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
              {card.icon}
            </div>
            {card.isLive && (
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-[#111827] tabular-nums leading-none">
              {card.value}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold mt-2.5">
              {card.label}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

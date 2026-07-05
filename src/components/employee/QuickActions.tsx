"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, CalendarOff, CheckSquare, Wallet } from "lucide-react";

interface Action {
  icon: typeof Clock;
  label: string;
  href: string;
  gradient: string;
}

const actions: Action[] = [
  { icon: Clock, label: "Mark Attendance", href: "/employee", gradient: "from-[var(--color-primary)] to-[var(--color-primary-light)]" },
  { icon: CalendarOff, label: "Apply Leave", href: "/employee/leaves?tab=apply", gradient: "from-[var(--color-primary)] to-[var(--color-primary-light)]" },
  { icon: CheckSquare, label: "History", href: "/employee/attendance", gradient: "from-[var(--color-primary)] to-[var(--color-primary-light)]" },
  { icon: Wallet, label: "Holidays", href: "/employee/holidays", gradient: "from-[var(--color-primary)] to-[var(--color-primary-light)]" },
];

export default function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.35 }}
      className="hrms-glass rounded-[20px] p-5"
    >
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-3">
        Quick Actions
      </p>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-[0_4px_16px_var(--color-primary-glow)] hover:shadow-[0_6px_24px_var(--color-primary-glow)] transition-shadow duration-200 cursor-pointer min-h-[80px] border border-white/10`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-semibold text-center leading-tight">{item.label}</span>
              </motion.button>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}


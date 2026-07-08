"use client";

import { motion } from "framer-motion";
import { Users, IndianRupee, Settings } from "lucide-react";
import Link from "next/link";

const actions = [
  {
    icon: <IndianRupee className="w-4 h-4" />,
    label: "Open Payroll Admin",
    href: "/admin/payroll",
  },
  {
    icon: <Users className="w-4 h-4" />,
    label: "Manage Employees",
    href: "/admin/employees",
  },
  {
    icon: <Settings className="w-4 h-4" />,
    label: "Work Settings",
    href: "/admin/settings",
  },
];

export default function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col justify-between"
    >
      <div>
        <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
          Quick Actions
        </h3>
        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 mb-4">
          Common tasks and operations
        </p>
      </div>

      <div className="flex flex-col gap-2.5 flex-1 justify-center">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-xs font-semibold shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200 cursor-pointer min-h-[44px]"
          >
            <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              {a.icon}
            </span>
            <span>{a.label}</span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

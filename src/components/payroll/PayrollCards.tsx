"use client";

import { motion } from "framer-motion";
import { IndianRupee, Users, Clock, TrendingDown, Gift, Calendar } from "lucide-react";
import { getMonthName, type PayrollRecord } from "@/lib/payroll";

interface StatCard {
  label: string;
  value: string;
  icon: typeof IndianRupee;
}

interface PayrollCardsProps {
  items: StatCard[];
  loading?: boolean;
  records?: PayrollRecord[];
  month?: number;
  columns?: number;
}

export default function PayrollCards({ items, loading, records, month, columns }: PayrollCardsProps) {
  // Compute additional KPIs from records
  const totalDeductions = records?.reduce((sum, r) => sum + (r.deductions || 0), 0) || 0;
  const totalBonuses = records?.reduce((sum, r) => sum + (r.bonuses || 0), 0) || 0;
  const currentMonth = month || new Date().getMonth() + 1;

  const extendedItems = [
    ...items,
    {
      label: "Deductions",
      value: `₹${totalDeductions.toLocaleString("en-IN")}`,
      icon: TrendingDown,
    },
    {
      label: "Bonuses",
      value: `₹${totalBonuses.toLocaleString("en-IN")}`,
      icon: Gift,
    },
    {
      label: "Current Month",
      value: getMonthName(currentMonth),
      icon: Calendar,
    },
  ];

  const isCustomCols = columns != null;

  if (loading) {
    return (
      <div
        className={isCustomCols ? "grid gap-4" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"}
        style={isCustomCols ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : {}}
      >
        {[1, 2, 3, 4, 5, 6].slice(0, isCustomCols ? columns : 6).map((i) => (
          <div key={i} className="h-[120px] bg-white/30 rounded-[20px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={isCustomCols ? "grid gap-4" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"}
      style={isCustomCols ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : {}}
    >
      {extendedItems.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] shadow-sm bg-white/55 backdrop-blur-md flex flex-col justify-between min-h-[120px] relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 cursor-default"
          >
            {/* Background Glow */}
            <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all duration-300" />

            <div className="flex items-start justify-between">
              <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                {card.label}
              </span>
              <div className="w-9 h-9 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center text-[var(--color-primary)] shadow-sm group-hover:bg-[var(--color-primary)]/20 transition-all duration-300">
                <Icon className="w-4.5 h-4.5" />
              </div>
            </div>

            <div className="mt-3">
              <h4 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                {card.value}
              </h4>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export const EMPLOYEE_PAYROLL_CARDS = (
  overview: { currentSalary: number; lastPaid: number; pendingPayment: number; ytdEarnings: number } | null
): StatCard[] => [
  {
    label: "Current Salary",
    value: `₹${(overview?.currentSalary ?? 0).toLocaleString("en-IN")}`,
    icon: IndianRupee,
  },
  {
    label: "Last Salary Paid",
    value: `₹${(overview?.lastPaid ?? 0).toLocaleString("en-IN")}`,
    icon: IndianRupee,
  },
  {
    label: "Pending Payment",
    value: `₹${(overview?.pendingPayment ?? 0).toLocaleString("en-IN")}`,
    icon: Clock,
  },
  {
    label: "YTD Earnings",
    value: `₹${(overview?.ytdEarnings ?? 0).toLocaleString("en-IN")}`,
    icon: IndianRupee,
  },
];

export const ADMIN_PAYROLL_CARDS = (
  overview: { totalPayroll: number; employeesPaid: number; pendingCount: number; monthlyCost: number } | null
): StatCard[] => [
  {
    label: "Total Payroll",
    value: `₹${(overview?.totalPayroll ?? 0).toLocaleString("en-IN")}`,
    icon: IndianRupee,
  },
  {
    label: "Employees Paid",
    value: `${overview?.employeesPaid ?? 0}`,
    icon: Users,
  },
  {
    label: "Pending Payroll",
    value: `${overview?.pendingCount ?? 0}`,
    icon: Clock,
  },
];

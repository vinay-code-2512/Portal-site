"use client";

import { TrendingUp } from "lucide-react";

export default function AdminProductivity() {
  return (
    <div className="space-y-6">
      <div>
        <p className="hrms-breadcrumb">Admin / Productivity</p>
        <h1 className="hrms-page-title">Productivity Overview</h1>
        <p className="hrms-page-subtitle">Track employee productivity metrics</p>
      </div>

      <div className="hrms-glass rounded-[20px] p-8 sm:p-10 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-dim)] flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-[var(--color-primary)]" />
        </div>
        <h3 className="text-base font-extrabold text-[#111827] mb-1">Productivity Analytics</h3>
        <p className="text-sm text-zinc-500 max-w-sm">Productivity analytics will appear here once employee data is available.</p>
      </div>
    </div>
  );
}

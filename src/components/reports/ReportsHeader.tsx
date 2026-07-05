"use client";

import { FileText, FileSpreadsheet, Download } from "lucide-react";
import type { ReportTab } from "@/hooks/useReports";

const TABS: { key: ReportTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "attendance", label: "Attendance" },
  { key: "leave", label: "Leave" },
  { key: "payroll", label: "Payroll" },
  { key: "employees", label: "Employees" },
  { key: "departments", label: "Departments" },
];

interface ReportsHeaderProps {
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onGenerateReport?: () => void;
  canExport?: boolean;
}

export default function ReportsHeader({
  activeTab, onTabChange, onExportPdf, onExportExcel, onGenerateReport, canExport,
}: ReportsHeaderProps) {
  return (
    <div className="space-y-5">
      {/* Top header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] text-[var(--color-primary)] uppercase tracking-wider font-extrabold">
            Analytics / Reports
          </p>
          <h1 className="text-2xl font-extrabold text-[#111827] mt-0.5 tracking-tight">
            Reports &amp; Analytics
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Workforce insights, attendance trends and payroll intelligence.
          </p>
        </div>

        {/* Premium Purple Gradient Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onExportPdf}
            disabled={!canExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-white/40 hover:bg-[var(--color-primary-dim)] transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Export PDF
          </button>
          <button
            onClick={onExportExcel}
            disabled={!canExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-white/40 hover:bg-[var(--color-primary-dim)] transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            onClick={onGenerateReport}
            disabled={!canExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-white/35 p-1 rounded-xl border border-[var(--border-light)]/50 w-fit">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-800 hover:bg-white/40"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

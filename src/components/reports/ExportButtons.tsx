"use client";

import { FileDown, FileText, FileSpreadsheet } from "lucide-react";
import {
  exportToCsv,
  exportToExcel,
  exportReportToPdf,
} from "@/utils/exportReports";

interface ExportData {
  attendanceSummary: Record<string, string | number>[];
  leaveSummary: Record<string, string | number>[];
  payrollSummary: Record<string, string | number>[];
  departmentSummary: Record<string, string | number>[];
  employeeAnalytics: Record<string, string | number>[];
}

interface Props {
  data: ExportData | null;
  disabled?: boolean;
}

export default function ExportButtons({ data, disabled }: Props) {
  if (!data || disabled) return null;

  const handlePdf = () => {
    const sections: { heading: string; rows: [string, string][] }[] = [
      {
        heading: "Attendance Summary",
        rows: data.attendanceSummary
          .slice(0, 15)
          .map((r): [string, string] => [String(r.date || r.week || ""), String(r.present || "")]),
      },
      {
        heading: "Leave Summary",
        rows: data.leaveSummary.map((r): [string, string] => [
          String(r.status || ""),
          String(r.count || ""),
        ]),
      },
      {
        heading: "Payroll Summary",
        rows: data.payrollSummary.map((r): [string, string] => [
          String(r.department || ""),
          `\u20B9 ${Number(r.total).toLocaleString("en-IN")}`,
        ]),
      },
    ];
    exportReportToPdf("Reports_Analytics", sections);
  };

  const handleCsv = (type: keyof ExportData) => {
    if (!data[type] || data[type].length === 0) return;
    exportToCsv(data[type], `report_${type}`);
  };

  const handleExcel = (type: keyof ExportData) => {
    if (!data[type] || data[type].length === 0) return;
    exportToExcel(data[type], `report_${type}`, `${type.replace(/_/g, " ")} Report`);
  };

  const btnClass =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handlePdf}
        className={`${btnClass} bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20`}
      >
        <FileText className="w-3 h-3" />
        Export PDF
      </button>

      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => handleCsv("attendanceSummary")}
          className={`${btnClass} bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20`}
        >
          <FileDown className="w-3 h-3" />
          Attendance CSV
        </button>
        <button
          onClick={() => handleCsv("leaveSummary")}
          className={`${btnClass} bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20`}
        >
          <FileDown className="w-3 h-3" />
          Leave CSV
        </button>
        <button
          onClick={() => handleCsv("payrollSummary")}
          className={`${btnClass} bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20`}
        >
          <FileDown className="w-3 h-3" />
          Payroll CSV
        </button>
      </div>

      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => handleExcel("attendanceSummary")}
          className={`${btnClass} bg-[var(--color-primary-dim)] border border-[var(--color-primary)]/20 text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/20`}
        >
          <FileSpreadsheet className="w-3 h-3" />
          Attendance Excel
        </button>
        <button
          onClick={() => handleExcel("leaveSummary")}
          className={`${btnClass} bg-[var(--color-primary-dim)] border border-[var(--color-primary)]/20 text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/20`}
        >
          <FileSpreadsheet className="w-3 h-3" />
          Leave Excel
        </button>
        <button
          onClick={() => handleExcel("payrollSummary")}
          className={`${btnClass} bg-[var(--color-primary-dim)] border border-[var(--color-primary)]/20 text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/20`}
        >
          <FileSpreadsheet className="w-3 h-3" />
          Payroll Excel
        </button>
      </div>
    </div>
  );
}

"use client";

import { Download, Users, Calendar, IndianRupee, CalendarClock, FileBarChart } from "lucide-react";

interface ExportData {
  attendanceSummary: Record<string, string | number>[];
  leaveSummary: Record<string, string | number>[];
  payrollSummary: Record<string, string | number>[];
  departmentSummary: Record<string, string | number>[];
  employeeAnalytics: Record<string, string | number>[];
}

interface ExportCenterProps {
  data: ExportData | null;
  disabled?: boolean;
}

export default function ExportCenter({ data, disabled }: ExportCenterProps) {
  if (!data || disabled) return null;

  const btnClass = "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer w-full sm:w-auto justify-center";

  const sections: { label: string; icon: typeof Download; desc: string; onClick: () => void; color: string }[] = [
    {
      label: "Export Attendance",
      icon: Calendar,
      desc: "Attendance records as CSV",
      onClick: () => exportCsv(data.attendanceSummary, "attendance"),
      color: "from-[var(--color-primary)] to-[var(--color-primary-light)] text-white shadow-sm hover:opacity-90",
    },
    {
      label: "Export Payroll",
      icon: IndianRupee,
      desc: "Payroll summary as CSV",
      onClick: () => exportCsv(data.payrollSummary, "payroll"),
      color: "from-[var(--color-primary)] to-[var(--color-primary-light)] text-white shadow-sm hover:opacity-90",
    },
    {
      label: "Export Employees",
      icon: Users,
      desc: "Employee analytics as CSV",
      onClick: () => exportCsv(data.employeeAnalytics, "employees"),
      color: "border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-white/40 hover:bg-[var(--color-primary-dim)]",
    },
    {
      label: "Export Leaves",
      icon: CalendarClock,
      desc: "Leave data as CSV",
      onClick: () => exportCsv(data.leaveSummary, "leaves"),
      color: "border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-white/40 hover:bg-[var(--color-primary-dim)]",
    },
    {
      label: "Export Full Report",
      icon: FileBarChart,
      desc: "Complete analytics PDF report",
      onClick: () => {},
      color: "bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-sm hover:opacity-90",
    },
  ];

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
          <Download className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">Export Center</h3>
          <p className="text-[9px] text-zinc-400 font-bold mt-0.5">Download reports in CSV format</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.label}
              onClick={section.onClick}
              className={`${btnClass} ${section.color} flex-col items-center gap-1.5 p-4`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-bold text-xs">{section.label}</span>
              <span className="text-[9px] opacity-70 font-semibold">{section.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function downloadCsv(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const str = String(row[h] ?? "");
          return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report_${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCsv(rows: Record<string, string | number>[], type: string) {
  downloadCsv(rows, type);
}

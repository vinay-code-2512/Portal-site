"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAdminPayroll } from "@/hooks/useAdminPayroll";
import PayrollCards, { ADMIN_PAYROLL_CARDS } from "@/components/payroll/PayrollCards";
import PayrollTable from "@/components/payroll/PayrollTable";
import PayrollDetails from "@/components/payroll/PayrollDetails";
import PayslipViewer from "@/components/payroll/PayslipViewer";
import GeneratePayrollModal from "@/components/payroll/GeneratePayrollModal";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { Download, IndianRupee, History, BarChart3 } from "lucide-react";
import type { PayrollRecord } from "@/lib/payroll";

const PayrollAnalytics = dynamic(() => import("@/components/payroll/PayrollAnalytics"), {
  loading: () => <div className="h-80 rounded-xl bg-gray-100 animate-pulse" />,
});

type Tab = "manage" | "history";

const TABS: { key: Tab; label: string; icon: typeof IndianRupee }[] = [
  { key: "manage", label: "Manage", icon: IndianRupee },
  { key: "history", label: "History", icon: History },
];

export default function AdminPayroll() {
  const { canViewPayroll, loading: permLoading } = usePermissions();
  const {
    employees, records, overview, month, setMonth, year, setYear,
    loading, error, generatePayroll, generating, updateStatus, refresh,
  } = useAdminPayroll();

  const [activeTab, setActiveTab] = useState<Tab>("manage");
  const [showGenerate, setShowGenerate] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<PayrollRecord | null>(null);
  const [viewingPayslip, setViewingPayslip] = useState<PayrollRecord | null>(null);
  const [downloadingPayslip, setDownloadingPayslip] = useState(false);

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ["Employee Name", "Employee ID", "Department", "Basic Salary", "Allowances", "Bonuses", "Deductions", "Net Salary", "Status"];
    const rows = records.map((r) => [
      r.employeeName, r.employeeId, r.department,
      r.basicSalary.toString(), r.allowances.toString(), r.bonuses.toString(), r.deductions.toString(),
      r.netSalary.toString(), r.status,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (permLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;
  }

  if (!canViewPayroll) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center py-12">
        <p className="text-xs font-bold text-zinc-400">You don&apos;t have access to payroll.</p>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] text-[var(--color-primary)] uppercase tracking-wider font-extrabold">
            Finance / Payroll
          </p>
          <h1 className="text-2xl font-extrabold text-[#111827] mt-0.5 tracking-tight">
            Payroll Management
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage salaries, payslips, deductions and payroll processing.
          </p>
        </div>

        {/* Premium Purple Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-white/40 hover:bg-[var(--color-primary-dim)] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Payroll
          </button>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all cursor-pointer shadow-md"
          >
            <IndianRupee className="w-4 h-4" />
            Generate Payroll
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {overview ? (
        <PayrollCards
          items={ADMIN_PAYROLL_CARDS(overview)}
          loading={loading}
          records={records}
          month={month}
        />
      ) : loading ? (
        <PayrollCards items={[]} loading />
      ) : null}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 bg-white/35 p-1 rounded-xl border border-[var(--border-light)]/50 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-800 hover:bg-white/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Month/Year Controls + Content */}
      {viewingRecord ? (
        <PayrollDetails record={viewingRecord} onBack={() => setViewingRecord(null)} />
      ) : (
        <>
          {/* Glass toolbar for month/year filters */}
          <div className="hrms-glass rounded-[20px] p-4 sm:p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center text-[var(--color-primary)]">
                <IndianRupee className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Payroll Period</span>
                <div className="flex items-center gap-2">
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="px-2 py-0.5 text-xs font-bold bg-transparent text-[#111827] focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1).toLocaleString("en-US", { month: "long" })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="px-2 py-0.5 text-xs font-bold bg-transparent text-[#111827] focus:outline-none cursor-pointer"
                  >
                    {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <span className="text-[10px] text-zinc-400 font-semibold">
              {records.length} record{records.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Main content area */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-7 space-y-6">
              {activeTab === "manage" && (
                <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Payroll Records</h3>
                      <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
                        {records.length} record{records.length !== 1 ? "s" : ""} found
                      </p>
                    </div>
                  </div>
                  <PayrollTable
                    records={records}
                    loading={loading}
                    onView={setViewingRecord}
                    onEditStatus={updateStatus}
                  />
                </div>
              )}

              {activeTab === "history" && (
                <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Monthly History</h3>
                      <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
                        Historical payroll records
                      </p>
                    </div>
                  </div>
                  <PayrollTable
                    records={records}
                    loading={loading}
                    onView={setViewingRecord}
                    onEditStatus={updateStatus}
                  />
                </div>
              )}
            </div>

            {/* Right sidebar - Payroll Overview Summary */}
            <div className="lg:col-span-3 h-full">
              <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex flex-col h-full space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border-light)] pb-3">
                  <IndianRupee className="w-4 h-4 text-[var(--color-primary)]" />
                  <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">
                    Payroll Overview
                  </h3>
                </div>
                {overview ? (
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-light)]/30">
                      <span className="text-xs text-zinc-500 font-semibold">Total Payroll</span>
                      <span className="text-sm font-extrabold text-[#111827] tabular-nums">
                        ₹{overview.totalPayroll.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-light)]/30">
                      <span className="text-xs text-zinc-500 font-semibold">Employees Paid</span>
                      <span className="text-sm font-extrabold text-emerald-600 tabular-nums">
                        {overview.employeesPaid}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-light)]/30">
                      <span className="text-xs text-zinc-500 font-semibold">Pending Payroll</span>
                      <span className={`text-sm font-extrabold tabular-nums ${overview.pendingCount > 0 ? "text-amber-600" : "text-zinc-400"}`}>
                        {overview.pendingCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-zinc-500 font-semibold">Monthly Cost</span>
                      <span className="text-sm font-extrabold text-[#111827] tabular-nums">
                        ₹{overview.monthlyCost.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ) : loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Payroll Analytics */}
          <PayrollAnalytics records={records} />
        </>
      )}

      {/* Generate Payroll Modal */}
      <GeneratePayrollModal
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        employees={employees}
        onGenerate={generatePayroll}
        generating={generating}
        month={month}
        year={year}
        onMonthChange={setMonth}
        onYearChange={setYear}
      />

      {/* Payslip Viewer */}
      <PayslipViewer
        record={viewingPayslip}
        onClose={() => setViewingPayslip(null)}
        onDownload={(rec) => {
          setDownloadingPayslip(true);
          setTimeout(() => setDownloadingPayslip(false), 2000);
        }}
        downloading={downloadingPayslip}
      />
    </div>
  );
}

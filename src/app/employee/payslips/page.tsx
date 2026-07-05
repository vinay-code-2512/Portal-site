"use client";

import { useState, useEffect } from "react";
import { useEmployeePayslips } from "@/hooks/useEmployeePayslips";
import PayrollCards, { EMPLOYEE_PAYROLL_CARDS } from "@/components/payroll/PayrollCards";
import SalaryBreakdown from "@/components/payroll/SalaryBreakdown";
import PayslipCard from "@/components/payroll/PayslipCard";
import PayslipViewer from "@/components/payroll/PayslipViewer";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { Wallet, Clock, IndianRupee, ChevronDown } from "lucide-react";
import type { PayrollRecord } from "@/lib/payroll";

type Tab = "dashboard" | "payslips";

const TABS: { key: Tab; label: string; icon: typeof Wallet }[] = [
  { key: "dashboard", label: "Dashboard", icon: Wallet },
  { key: "payslips", label: "Payslips", icon: IndianRupee },
];

export default function EmployeePayslips() {
  const {
    records, overview, loading, loadingMore, error, hasMore, loadMore,
    downloadPdf, downloadingId, refresh,
  } = useEmployeePayslips();

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [viewingRecord, setViewingRecord] = useState<PayrollRecord | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const latestRecord = records[0];

  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="space-y-6">
      <div>
        <p className="hrms-breadcrumb">Employee / Payslips</p>
        <h1 className="hrms-page-title">Payslips &amp; Salary</h1>
        <p className="hrms-page-subtitle">View your salary breakdown and payslip history</p>
      </div>

      {/* Floating segmented tabs */}
      <div className="flex justify-center">
        <div className="hrms-tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`hrms-tab flex items-center gap-1.5 ${
                  isActive ? "hrms-tab--active" : "hrms-tab--inactive"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-5">
          <PayrollCards
            items={EMPLOYEE_PAYROLL_CARDS(overview)}
            loading={loading}
            columns={2}
          />

          {latestRecord && (
            <SalaryBreakdown
              basicSalary={latestRecord.basicSalary}
              allowances={latestRecord.allowances}
              bonuses={latestRecord.bonuses}
              deductions={latestRecord.deductions}
              netSalary={latestRecord.netSalary}
            />
          )}

          {!latestRecord && !loading && (
            <div className="hrms-glass rounded-[20px] p-8 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex flex-col items-center justify-center text-center min-h-[200px]">
              <Clock className="w-8 h-8 text-zinc-300 mb-2" />
              <p className="text-xs text-zinc-400 font-semibold">No payroll data available yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "payslips" && (
        <div className="space-y-3">
          {loading ? (
            <LoadingState variant="card" count={4} />
          ) : records.length === 0 ? (
            <div className="hrms-glass rounded-[20px] p-8 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex flex-col items-center justify-center text-center min-h-[200px]">
              <IndianRupee className="w-8 h-8 text-zinc-300 mb-2" />
              <p className="text-xs text-zinc-400 font-semibold">No payslips generated yet</p>
            </div>
          ) : (
            <>
              <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"} gap-3`}>
                {records.map((r) => (
                  <div key={r.id} onClick={() => setViewingRecord(r)} className="cursor-pointer">
                    <PayslipCard
                      record={r}
                      onDownload={downloadPdf}
                      downloading={downloadingId === r.id}
                    />
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/70 border border-[var(--color-primary)]/20 text-xs text-[var(--color-primary)] font-bold hover:bg-[var(--color-primary-dim)] transition-all cursor-pointer disabled:opacity-50 min-h-[40px]"
                  >
                    {loadingMore ? (
                      <span className="w-3.5 h-3.5 animate-spin border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <PayslipViewer
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
        onDownload={downloadPdf}
        downloading={downloadingId === viewingRecord?.id}
      />
    </div>
  );
}

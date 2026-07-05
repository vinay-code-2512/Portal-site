"use client";

import { useState, useEffect } from "react";
import { useEmployeeLeaves } from "@/hooks/useEmployeeLeaves";
import LeaveBalanceCards from "@/components/leaves/LeaveBalanceCards";
import ApplyLeaveForm from "@/components/leaves/ApplyLeaveForm";
import LeaveHistory from "@/components/leaves/LeaveHistory";
import LeaveCalendar from "@/components/leaves/LeaveCalendar";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { Wallet, Send, ClipboardList, CalendarDays, CalendarOff } from "lucide-react";

type Tab = "balance" | "apply" | "history";

const TABS: { key: Tab; label: string; icon: typeof Wallet }[] = [
  { key: "balance", label: "Balance", icon: Wallet },
  { key: "apply", label: "Apply", icon: Send },
  { key: "history", label: "History", icon: ClipboardList },
];

export default function EmployeeLeaves() {
  const {
    requests, balances, loading, loadingMore, error, hasMore, loadMore, submitLeave, refresh,
  } = useEmployeeLeaves();

  const [activeTab, setActiveTab] = useState<Tab>("balance");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && (tab === "balance" || tab === "apply" || tab === "history")) {
        setActiveTab(tab as Tab);
      }
    }
  }, []);

  const approvedLeaves = requests.filter((r) => r.status === "approved");

  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="space-y-5 sm:space-y-6 pt-4 sm:pt-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white shadow-[0_0_16px_var(--color-primary-glow)] shrink-0">
          <CalendarOff className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] text-[var(--color-primary)] uppercase tracking-wider font-semibold">Employee / Leaves</p>
          <h1 className="text-xl font-bold mt-0.5">
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] bg-clip-text text-transparent">
              Leave Requests
            </span>
          </h1>
        </div>
      </div>

      <div className="sticky top-0 z-20 -mx-5 sm:-mx-7 px-5 sm:px-7 pb-3 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 bg-[var(--color-primary-dim)] rounded-xl p-1 border border-[var(--color-primary)]/20">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[40px] ${
                  isActive
                    ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white shadow-sm"
                    : "text-zinc-500 hover:text-[var(--color-primary)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "balance" && (
        <div className="space-y-5">
          {loading ? (
            <LoadingState variant="card" count={4} />
          ) : balances ? (
            <LeaveBalanceCards balances={balances} />
          ) : null}

          <LeaveCalendar requests={approvedLeaves} />
        </div>
      )}

      {activeTab === "apply" && (
        <ApplyLeaveForm balances={balances} onSubmit={submitLeave} />
      )}

      {activeTab === "history" && (
        <div className="hrms-glass rounded-[20px] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Leave History</h3>
          <LeaveHistory
            requests={requests}
            loading={loading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        </div>
      )}
    </div>
  );
}

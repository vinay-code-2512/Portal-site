"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminLeaves } from "@/hooks/useAdminLeaves";
import { useEmployeeLeaves } from "@/hooks/useEmployeeLeaves";
import AdminLeaveOverview from "@/components/leaves/AdminLeaveOverview";
import LeaveApprovalQueue from "@/components/leaves/LeaveApprovalQueue";
import LeaveDetailsDrawer from "@/components/leaves/LeaveDetailsDrawer";
import TeamLeaveCalendar from "@/components/leaves/TeamLeaveCalendar";
import LeaveAnalytics from "@/components/leaves/LeaveAnalytics";
import ApplyLeaveForm from "@/components/leaves/ApplyLeaveForm";
import LeaveHistory from "@/components/leaves/LeaveHistory";
import LeaveBalanceCards from "@/components/leaves/LeaveBalanceCards";
import ErrorState from "@/components/common/ErrorState";
import { usePermissions } from "@/hooks/usePermissions";
import { Plus, Download, ClipboardList, BarChart3 } from "lucide-react";
import type { LeaveRequest } from "@/lib/leaves";

type Tab = "balance" | "apply" | "history" | "calendar";

const TABS: { key: Tab; label: string }[] = [
  { key: "balance", label: "Balance" },
  { key: "apply", label: "Apply" },
  { key: "history", label: "History" },
  { key: "calendar", label: "Team Calendar" },
];

export default function AdminLeaves() {
  const adminLeaves = useAdminLeaves();
  const empLeaves = useEmployeeLeaves();
  const { canApproveLeaves, loading: permLoading } = usePermissions();

  const [activeTab, setActiveTab] = useState<Tab>("balance");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    adminLeaves.loadAnalytics();
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const end = `${y}-${String(m).padStart(2, "0")}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
    adminLeaves.loadTeamLeaves(start, end);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTeamLeaves = useCallback(async (start: string, end: string) => {
    await adminLeaves.loadTeamLeaves(start, end);
  }, [adminLeaves.loadTeamLeaves]);

  const employeesOnLeave = adminLeaves.teamLeaves
    ? new Set(adminLeaves.teamLeaves.map((l: LeaveRequest) => l.uid)).size
    : 0;

  const totalBalance = empLeaves.balances
    ? Object.values(empLeaves.balances).reduce((sum: number, b) => sum + b.remaining, 0)
    : 0;

  if (adminLeaves.error) return <ErrorState message={adminLeaves.error} onRetry={adminLeaves.refresh} />;

  if (permLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;
  }

  if (!canApproveLeaves) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center py-12">
        <p className="text-xs font-bold text-zinc-400">You don&apos;t have access to leave management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] text-[var(--color-primary)] uppercase tracking-wider font-extrabold">
            Admin / Leaves
          </p>
          <h1 className="text-2xl font-extrabold text-[#111827] mt-0.5 tracking-tight">
            Leave Management
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage employee leave requests, approvals and leave balances.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab("apply")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            Apply Leave
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-white/40 hover:bg-[var(--color-primary-dim)] transition-all cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            Export Leaves
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <AdminLeaveOverview
        pendingCount={adminLeaves.overview?.pendingCount ?? 0}
        approvedToday={adminLeaves.overview?.approvedToday ?? 0}
        rejectedToday={adminLeaves.overview?.rejectedToday ?? 0}
        employeesOnLeave={employeesOnLeave}
        leaveBalance={totalBalance}
        loading={adminLeaves.loading}
      />

      {/* Floating Segmented Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 bg-white/30 backdrop-blur-md rounded-xl p-1 border border-[var(--color-primary)]/15 shadow-sm">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-white/80 backdrop-blur-md text-[var(--color-primary)] border border-[var(--color-primary)]/25 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 hover:bg-white/30 border border-transparent"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "balance" && (
        <LeaveBalanceCards
          balances={empLeaves.balances ?? {
            casual: { available: 0, used: 0, remaining: 0 },
            sick: { available: 0, used: 0, remaining: 0 },
            paid: { available: 0, used: 0, remaining: 0 },
            emergency: { available: 0, used: 0, remaining: 0 },
          }}
        />
      )}

      {activeTab === "apply" && (
        <ApplyLeaveForm
          balances={empLeaves.balances}
          onSubmit={empLeaves.submitLeave}
        />
      )}

      {activeTab === "history" && (
        <LeaveHistory
          requests={empLeaves.requests}
          loading={empLeaves.loading}
          hasMore={empLeaves.hasMore}
          loadingMore={empLeaves.loadingMore}
          onLoadMore={empLeaves.loadMore}
        />
      )}

      {activeTab === "calendar" && (
        <TeamLeaveCalendar
          onLoad={handleTeamLeaves}
          teamLeaves={adminLeaves.teamLeaves}
        />
      )}

      {/* Approval Queue */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
            <ClipboardList className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-sm font-extrabold text-[#111827]">Approval Queue</h2>
          {!adminLeaves.loading && adminLeaves.pendingRequests.length > 0 && (
            <span className="text-[10px] bg-[var(--color-primary-dim)] text-[var(--color-primary)] px-2 py-0.5 rounded-full font-bold">
              {adminLeaves.pendingRequests.length}
            </span>
          )}
        </div>
        <LeaveApprovalQueue
          requests={adminLeaves.pendingRequests}
          loading={adminLeaves.loading}
          hasMore={adminLeaves.hasMore}
          loadingMore={adminLeaves.loadingMore}
          onLoadMore={adminLeaves.loadMore}
          onApprove={adminLeaves.approve}
          onReject={adminLeaves.reject}
          actionLoading={adminLeaves.actionLoading}
          onSelectRequest={setSelectedRequest}
        />
      </div>

      {/* Leave Analytics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-sm font-extrabold text-[#111827]">Leave Analytics</h2>
        </div>
        <LeaveAnalytics
          data={adminLeaves.analytics}
          loading={adminLeaves.loading}
        />
      </div>

      {/* Details Drawer */}
      <LeaveDetailsDrawer
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}

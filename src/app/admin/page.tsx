"use client";

import dynamic from "next/dynamic";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { useHolidays } from "@/hooks/useHolidays";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAdminLeaves } from "@/hooks/useAdminLeaves";
import KpiCards from "@/components/admin/KpiCards";
import UpcomingHolidays from "@/components/admin/UpcomingHolidays";
import QuickActions from "@/components/admin/QuickActions";
import PendingLeaves from "@/components/admin/PendingLeaves";
import TodaysAttendance from "@/components/admin/TodaysAttendance";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";

const AttendanceOverview = dynamic(() => import("@/components/admin/AttendanceOverview"), {
  loading: () => <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />,
});
const DepartmentSummary = dynamic(() => import("@/components/admin/DepartmentSummary"), {
  loading: () => <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />,
});

export default function AdminDashboard() {
  const { loading: userLoading } = useCurrentUser();
  const { data, loading: dashLoading, error: dashError } = useAdminDashboard();
  const { holidays, loading: holidaysLoading } = useHolidays(6);
  
  const {
    pendingRequests,
    approve: approveLeave,
    reject: rejectLeave,
    actionLoading: leaveActionLoading,
    loading: leavesLoading,
  } = useAdminLeaves();

  const loading = userLoading || dashLoading;

  if (dashError) {
    return (
      <ErrorState
        message={dashError || "Something went wrong"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loading) {
    return <LoadingState variant="page" />;
  }

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 pb-24 sm:pb-6 pt-6 sm:pt-8">
      {/* Header Area */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white italic">
          Hello, <span className="bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary-glow)] bg-clip-text text-transparent">Admin</span>
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Command Center — {dayName}, {dateStr}
        </p>
      </div>

      {/* KPI Cards (6 columns) */}
      <KpiCards data={data} />

      {/* Analytics Row: Attendance (50%), Department Summary (25%), Quick Actions (25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6">
        <div className="lg:col-span-2 flex flex-col">
          <AttendanceOverview data={data} />
        </div>
        <div className="lg:col-span-1 flex flex-col">
          <DepartmentSummary departments={data.departments} />
        </div>
        <div className="lg:col-span-1 flex flex-col">
          <QuickActions />
        </div>
      </div>

      {/* Content Row 3: 2-column layout (Pending Leaves 50%, Upcoming Holidays 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingLeaves
          requests={pendingRequests}
          onApprove={approveLeave}
          onReject={rejectLeave}
          actionLoading={leaveActionLoading}
          loading={leavesLoading}
        />
        <UpcomingHolidays holidays={holidays} loading={holidaysLoading} />
      </div>

      {/* Row 5: Today's Employee Attendance */}
      <TodaysAttendance data={data} />

    </div>
  );
}

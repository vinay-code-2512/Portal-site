"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAttendance } from "@/hooks/useAttendance";
import { useTimeTracker } from "@/hooks/useTimeTracker";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";
import LiveClockCard from "@/components/employee/attendance/LiveClockCard";
import SessionControls from "@/components/employee/attendance/SessionControls";
import TodayBreakdown from "@/components/employee/attendance/TodayBreakdown";
import WeeklyOverview from "@/components/employee/attendance/WeeklyOverview";
import AttendanceHistory from "@/components/employee/attendance/AttendanceHistory";
import MonthlyStatsBar from "@/components/employee/attendance/MonthlyStatsBar";
import AttendanceSelfie from "@/components/employee/AttendanceSelfie";
import { History } from "lucide-react";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";

export default function EmployeeAttendance() {
  const { loading: userLoading } = useCurrentUser();
  const { monthlyRecords, monthlyStats, loading: attLoading, error: attError } = useAttendance();
  const {
    sessionStatus, currentWorkMs, currentBreakMs, todayRecord,
    checkIn, checkOut, startBreak, endBreak,
    loading: trackerLoading, error: trackerError,
  } = useTimeTracker();
  const { dailyHours, weekTotal, loading: weekLoading } = useWeeklyStats();

  const loading = userLoading || attLoading || trackerLoading || weekLoading;

  if (attError || trackerError) {
    return (
      <ErrorState
        message={attError || trackerError || "Something went wrong"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loading) {
    return <LoadingState variant="page" />;
  }

  return (
    <div className="space-y-5 sm:space-y-6 pt-4 sm:pt-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white shadow-[0_0_16px_var(--color-primary-glow)] shrink-0">
          <History className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] text-[var(--color-primary)] uppercase tracking-wider font-semibold">Employee / Attendance</p>
          <h1 className="text-xl font-bold mt-0.5">
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] bg-clip-text text-transparent">
              Attendance &amp; Time Tracking
            </span>
          </h1>
        </div>
      </div>

      <LiveClockCard sessionStatus={sessionStatus} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SessionControls
          sessionStatus={sessionStatus}
          onCheckIn={checkIn}
          onCheckOut={checkOut}
          onStartBreak={startBreak}
          onEndBreak={endBreak}
          currentBreakMs={currentBreakMs}
          loading={trackerLoading}
        />
        <AttendanceSelfie sessionStatus={sessionStatus} />
      </div>

      <MonthlyStatsBar stats={monthlyStats} />

      <TodayBreakdown
        todayRecord={todayRecord}
        currentWorkMs={currentWorkMs}
        currentBreakMs={currentBreakMs}
      />

      <WeeklyOverview dailyHours={dailyHours} weekTotal={weekTotal} />

      <AttendanceHistory records={monthlyRecords} />
    </div>
  );
}

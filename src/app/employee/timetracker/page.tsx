"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTimeTracker } from "@/hooks/useTimeTracker";
import { useWeeklyStats } from "@/hooks/useWeeklyStats";
import LiveClockCard from "@/components/employee/attendance/LiveClockCard";
import SessionControls from "@/components/employee/attendance/SessionControls";
import TodayBreakdown from "@/components/employee/attendance/TodayBreakdown";
import WeeklyOverview from "@/components/employee/attendance/WeeklyOverview";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";

export default function TimeTracker() {
  const { loading: userLoading } = useCurrentUser();
  const {
    sessionStatus, currentWorkMs, currentBreakMs, todayRecord,
    checkIn, checkOut, startBreak, endBreak,
    loading: trackerLoading, error: trackerError,
  } = useTimeTracker();
  const { dailyHours, weekTotal, loading: weekLoading } = useWeeklyStats();

  const loading = userLoading || trackerLoading || weekLoading;

  if (trackerError) {
    return (
      <ErrorState
        message={trackerError || "Failed to load time tracker"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loading) {
    return <LoadingState variant="page" />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white">Time Tracker</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LiveClockCard sessionStatus={sessionStatus} />
          <SessionControls
            sessionStatus={sessionStatus}
            onCheckIn={checkIn}
            onCheckOut={checkOut}
            onStartBreak={startBreak}
            onEndBreak={endBreak}
            currentBreakMs={currentBreakMs}
            loading={trackerLoading}
          />
          <TodayBreakdown todayRecord={todayRecord} currentWorkMs={currentWorkMs} currentBreakMs={currentBreakMs} />
        </div>
        <div className="space-y-6">
          <WeeklyOverview dailyHours={dailyHours} weekTotal={weekTotal} />
        </div>
      </div>
    </div>
  );
}

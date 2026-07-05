"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAttendance } from "@/hooks/useAttendance";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useHolidays } from "@/hooks/useHolidays";
import Link from "next/link";
import { Calendar, CalendarPlus } from "lucide-react";
import { useTimeTracker } from "@/hooks/useTimeTracker";
import WelcomeHeader from "@/components/employee/WelcomeHeader";
import SessionConsole from "@/components/employee/SessionConsole";
import ShiftProgressCard from "@/components/employee/ShiftProgressCard";
import AttendanceStatusCard from "@/components/employee/AttendanceStatusCard";
import ProductivityCards from "@/components/employee/ProductivityCards";
import RecentActivityCard from "@/components/employee/RecentActivityCard";
import HolidayCard from "@/components/employee/HolidayCard";
import QuickActions from "@/components/employee/QuickActions";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";

function formatShiftTime(time24: string | undefined): string {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function EmployeeDashboard() {
  const { profile, loading: userLoading, error: userError } = useCurrentUser();
  const { monthlyStats, loading: attendanceLoading, error: attendanceError } = useAttendance();
  const { activities, loading: activityLoading, error: activityError } = useActivityLog();
  const { holidays, loading: holidaysLoading, error: holidaysError } = useHolidays();
  
  const {
    sessionStatus,
    todayRecord,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    loading: trackerLoading,
  } = useTimeTracker();

  const loading = userLoading || attendanceLoading || activityLoading || holidaysLoading || trackerLoading;

  if (userError || attendanceError || activityError || holidaysError) {
    return (
      <ErrorState
        message={userError || attendanceError || activityError || holidaysError || "Something went wrong"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loading) {
    return <LoadingState variant="page" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 pt-6 sm:pt-8">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-5 sm:space-y-6">
        <WelcomeHeader profile={profile} />
        <SessionConsole
          todayRecord={todayRecord}
          sessionStatus={sessionStatus}
          onCheckIn={checkIn}
          onCheckOut={checkOut}
          onStartBreak={startBreak}
          onEndBreak={endBreak}
          loading={trackerLoading}
        />
        <RecentActivityCard activities={activities} />
        <QuickActions />
      </div>

      {/* Right Column */}
      <div className="space-y-5 sm:space-y-6">
        <div className="flex gap-2.5">
          <Link href="/employee/leaves" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[var(--color-primary-light)] text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[44px] hrms-glass">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>My Calendar</span>
            </button>
          </Link>
          <Link href="/employee/leaves?tab=apply" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-xs font-semibold shadow-[0_4px_20px_var(--color-primary-glow)] hover:shadow-[0_4px_28px_var(--color-primary-glow)] transition-all duration-200 cursor-pointer min-h-[44px]">
              <CalendarPlus className="w-4 h-4 shrink-0" />
              <span>Apply Leave</span>
            </button>
          </Link>
        </div>
        <div className="lg:mt-9">
          <ShiftProgressCard
            shiftDurationHours={profile?.shiftDurationHours || 8}
            startTime={formatShiftTime(profile?.shiftStartTime)}
            endTime={formatShiftTime(profile?.shiftEndTime)}
            checkIn={todayRecord?.checkIn}
            checkOut={todayRecord?.checkOut}
          />
        </div>
        <AttendanceStatusCard stats={monthlyStats} />
        <ProductivityCards />
        <HolidayCard holidays={holidays} />
      </div>
    </div>
  );
}

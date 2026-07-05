"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTimeTracker } from "@/hooks/useTimeTracker";
import { getEnrollmentsByUserId, type Enrollment } from "@/lib/enrollments";
import { getClassesByUserId, isStorageUrl, type ClassEntry } from "@/lib/classes";
import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, IndianRupee, Tag, Monitor, ArrowRight, User, Phone, Shield } from "lucide-react";
import WelcomeHeader from "@/components/employee/WelcomeHeader";
import SessionConsole from "@/components/employee/SessionConsole";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="hrms-glass rounded-[20px] p-4 sm:p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{label}</p>
          <p className="text-lg font-black text-zinc-800 mt-0.5 truncate">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function PaidUserDashboard() {
  const { currentUser, userData } = useAuth();
  const { profile, loading: userLoading, error: userError } = useCurrentUser();
  const {
    sessionStatus,
    todayRecord,
    checkIn,
    checkOut,
    startBreak,
    endBreak,
    loading: trackerLoading,
  } = useTimeTracker();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);

  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  const lastPlayedVideo = (() => {
    if (!currentUser || classes.length === 0) return null;
    for (const c of classes) {
      if (!c.completed) {
        const key = `video-progress:${currentUser.uid}:${c.id}`;
        const val = localStorage.getItem(key);
        if (val && parseFloat(val) > 0 && isStorageUrl(c.link)) return { title: c.title, url: c.link };
      }
    }
    const completed = [...classes].filter((c) => c.completed && isStorageUrl(c.link));
    if (completed.length > 0) {
      const last = completed.reduce((a, b) => {
        const at = a.completedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
        const bt = b.completedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
        return at > bt ? a : b;
      });
      return { title: last.title, url: last.link };
    }
    const next = classes.find((c) => !c.completed && isStorageUrl(c.link));
    if (next) return { title: next.title, url: next.link };
    return null;
  })();

  const fullName = userData?.fullName || currentUser?.displayName || "Learner";
  const email = currentUser?.email || "";
  const phone = userData?.phone || "";
  const role = userData?.role || "";
  const classType = (userData as any)?.classType || "";
  const batchName = (userData as any)?.batchName || "";
  const userCourseName = (userData as any)?.courseName || "";
  const initial = fullName.charAt(0).toUpperCase();
  const totalPaid = enrollments.reduce((sum, e) => sum + e.amount, 0);

  const allCourseNames = [
    ...new Set([
      ...(userCourseName ? [userCourseName] : []),
      ...enrollments.map((e) => e.courseName),
    ]),
  ];

  useEffect(() => {
    if (!currentUser) return;
    getEnrollmentsByUserId(currentUser.uid)
      .then(setEnrollments)
      .catch(() => {})
      .finally(() => setEnrollmentsLoading(false));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    getClassesByUserId(currentUser.uid)
      .then(setClasses)
      .catch(() => {})
      .finally(() => setClassesLoading(false));
  }, [currentUser]);

  const loading = userLoading || enrollmentsLoading || classesLoading || trackerLoading;

  if (userError) {
    return (
      <ErrorState
        message={userError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loading) {
    return <LoadingState variant="page" />;
  }

  return (
    <div className="space-y-5 sm:space-y-6 pt-6 sm:pt-8">
      <WelcomeHeader profile={profile} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          <SessionConsole
            todayRecord={todayRecord}
            sessionStatus={sessionStatus}
            onCheckIn={checkIn}
            onCheckOut={checkOut}
            onStartBreak={startBreak}
            onEndBreak={endBreak}
            loading={trackerLoading}
            hideSelfie
            slidePaddingTop="pt-8"
            lastPlayedVideo={lastPlayedVideo}
          />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={BookOpen} label="Courses Enrolled" value={allCourseNames.length} />
          <StatCard icon={IndianRupee} label="Total Paid" value={`₹${totalPaid.toLocaleString("en-IN")}`} />
          <StatCard icon={Tag} label="Class Type" value={classType ? classType.charAt(0).toUpperCase() + classType.slice(1) : "—"} />
          <StatCard icon={Monitor} label="Classes" value={classes.length} />
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm"
        >
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-3">
            Quick Links
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/paid-user/class">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-between gap-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_4px_16px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.4)] transition-shadow duration-200 cursor-pointer min-h-[56px] border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-[13px] font-bold">View Classes</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link href="/paid-user/profile">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-between gap-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_4px_16px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.4)] transition-shadow duration-200 cursor-pointer min-h-[56px] border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span className="text-[13px] font-bold">View Profile</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Column */}
      <div className="space-y-5 sm:space-y-6">
        {/* Profile Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-md">
              {initial}
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-800">{fullName}</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">{email}</p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--border-light)] space-y-3">
            <div className="flex items-center gap-2.5 text-xs">
              <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium text-zinc-700">{phone || "—"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <Shield className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium text-zinc-700 capitalize">{role || "—"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <Tag className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium text-zinc-700">{classType ? classType.charAt(0).toUpperCase() + classType.slice(1) : "—"}</span>
            </div>
            {batchName && (
              <div className="flex items-center gap-2.5 text-xs">
                <Monitor className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="font-medium text-zinc-700">{batchName}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Enrolled Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black text-zinc-700 uppercase tracking-wider">Enrolled Courses</h3>
            </div>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black">{allCourseNames.length}</span>
          </div>

          {allCourseNames.length === 0 ? (
            <div className="text-center py-6">
              <BookOpen className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-400">No courses enrolled yet</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allCourseNames.map((name, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {name}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      </div>
    </div>
  );
}

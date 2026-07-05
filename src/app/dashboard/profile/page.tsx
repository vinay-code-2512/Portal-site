"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getEnrollmentsByUserId, type Enrollment } from "@/lib/enrollments";
import { Mail, Phone, Calendar, BookOpen, IndianRupee, CreditCard, CheckCircle, User } from "lucide-react";

export default function ProfilePage() {
  const { currentUser, userData } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    getEnrollmentsByUserId(currentUser.uid)
      .then((data) => setEnrollments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const fullName = userData?.fullName || currentUser?.displayName || "Learner";
  const email = currentUser?.email || "";
  const phone = userData?.phone || "";
  const initial = fullName.charAt(0).toUpperCase();
  const totalPaid = enrollments.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 pb-12 pt-4 sm:pt-6">
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[var(--border-light)]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
            {initial}
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-800">{fullName}</h2>
            <p className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
              <Mail className="w-3.5 h-3.5" />
              {email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3 h-3" /> Phone
            </p>
            <p className="text-sm font-bold text-zinc-800 mt-1">{phone || "—"}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Courses Enrolled
            </p>
            <p className="text-lg font-black text-zinc-800 mt-1">{enrollments.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <IndianRupee className="w-3 h-3" /> Total Paid
            </p>
            <p className="text-lg font-black text-emerald-600 mt-1">
              ₹{totalPaid.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <Calendar className="w-3 h-3" />
            Member since{" "}
            {currentUser?.metadata?.creationTime
              ? new Date(currentUser.metadata.creationTime).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
              : "now"}
          </p>
        </div>
      </div>

      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <h3 className="text-sm font-black text-zinc-700 mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Payment History
        </h3>

        {loading ? (
          <p className="text-xs text-zinc-400">Loading...</p>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-8">
            <IndianRupee className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-400">No payments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="p-4 rounded-xl bg-white/40 border border-[var(--border-light)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold text-zinc-700">{enrollment.courseName}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold">
                    <CheckCircle className="w-3 h-3" />
                    Paid
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    {enrollment.createdAt?.toDate
                      ? enrollment.createdAt.toDate().toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                  <span className="font-bold text-zinc-800">
                    ₹{enrollment.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 border border-indigo-200">
              <span className="text-sm font-bold text-indigo-700">Total Amount Paid</span>
              <span className="text-lg font-black text-indigo-700">
                ₹{totalPaid.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

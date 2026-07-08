"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getEnrollmentsByUserId, type Enrollment } from "@/lib/enrollments";
import { updateProfile, updatePassword } from "firebase/auth";
import { auth, storage } from "@/lib/firebase";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import {
  Mail, Phone, Calendar, BookOpen, IndianRupee, CreditCard, CheckCircle, Shield, Tag, Camera, Loader2, Lock, Eye, EyeOff
} from "lucide-react";

export default function PaidUserProfilePage() {
  const { currentUser, userData } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollError, setEnrollError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const uploadMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showPwNew, setShowPwNew] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  function fetchEnrollments() {
    if (!currentUser) return;
    setEnrollError("");
    getEnrollmentsByUserId(currentUser.uid)
      .then((data) => setEnrollments(data))
      .catch((err) => {
        const msg = err?.message || "Failed to load payment info";
        console.error("Enrollment fetch error:", msg);
        setEnrollError(msg);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchEnrollments();
    window.addEventListener("focus", fetchEnrollments);
    return () => window.removeEventListener("focus", fetchEnrollments);
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (uploadMsgTimer.current) clearTimeout(uploadMsgTimer.current);
    };
  }, []);

  async function handlePhotoUpload(file: File) {
    if (!currentUser) return;
    if (!file.type.startsWith("image/")) {
      setUploadMsg({ type: "error", text: "Please select an image file" });
      if (uploadMsgTimer.current) clearTimeout(uploadMsgTimer.current);
      uploadMsgTimer.current = setTimeout(() => setUploadMsg(null), 3000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadMsg({ type: "error", text: "File too large (max 5MB)" });
      if (uploadMsgTimer.current) clearTimeout(uploadMsgTimer.current);
      uploadMsgTimer.current = setTimeout(() => setUploadMsg(null), 3000);
      return;
    }
    setUploading(true);
    setUploadMsg(null);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 15000)
    );

    try {
      const ref = storageRef(storage, `profile-images/${currentUser.uid}`);
      await Promise.race([uploadBytes(ref, file), timeout]);
      const url = await Promise.race([getDownloadURL(ref), timeout]);
      await Promise.race([updateProfile(currentUser, { photoURL: url }), timeout]);
      setUploadMsg({ type: "success", text: "Photo updated!" });
      if (uploadMsgTimer.current) clearTimeout(uploadMsgTimer.current);
      uploadMsgTimer.current = setTimeout(() => setUploadMsg(null), 3000);
    } catch (e: any) {
      console.error("Upload failed:", e);
      if (e?.message === "timeout") {
        setUploadMsg({
          type: "error",
          text: "Upload timed out. Firebase Storage may not be enabled.",
        });
      } else {
        const msg =
          e?.code === "storage/unauthorized"
            ? "Upload denied — Storage rules may need updating."
            : "Upload failed. Check console for details.";
        setUploadMsg({ type: "error", text: msg });
      }
      if (uploadMsgTimer.current) clearTimeout(uploadMsgTimer.current);
      uploadMsgTimer.current = setTimeout(() => setUploadMsg(null), 6000);
    } finally {
      setUploading(false);
    }
  }

  async function handleChangePassword() {
    if (!currentUser) return;
    setPwError("");
    setPwSuccess("");

    if (!pwNew) { setPwError("Enter a new password"); return; }
    if (pwNew.length < 6) { setPwError("New password must be at least 6 characters"); return; }
    if (pwNew !== pwConfirm) { setPwError("Passwords do not match"); return; }

    setPwSaving(true);
    try {
      await updatePassword(currentUser, pwNew);
      setPwSuccess("Password changed successfully!");
      setPwNew("");
      setPwConfirm("");
    } catch (e: any) {
      const code = e?.code || "";
      if (code === "auth/weak-password") {
        setPwError("Password should be at least 6 characters");
      } else if (code === "auth/requires-recent-login") {
        setPwError("Please log out and log back in before changing your password.");
      } else if (code === "auth/too-many-requests") {
        setPwError("Too many attempts. Please try again later.");
      } else {
        setPwError(e?.message || "Failed to change password");
      }
    } finally {
      setPwSaving(false);
    }
  }

  const fullName = userData?.fullName || currentUser?.displayName || "Learner";
  const email = currentUser?.email || "";
  const phone = userData?.phone || "";
  const role = userData?.role || "";
  const classType = (userData as any)?.classType || "";
  const photoURL = userData?.photoURL || currentUser?.photoURL || "";
  const initial = fullName.charAt(0).toUpperCase();
  const totalPaid = enrollments.reduce((sum, e) => sum + e.amount, 0);
  const courseFee = enrollments.reduce((max, e) => e.totalFee ? Math.max(max, e.totalFee) : max, 0);

  const groupedEnrollments = useMemo(() => {
    const map = new Map<string, { courseName: string; enrollments: Enrollment[] }>();
    for (const e of enrollments) {
      const key = e.courseName;
      if (!map.has(key)) map.set(key, { courseName: key, enrollments: [] });
      map.get(key)!.enrollments.push(e);
    }
    return Array.from(map.values());
  }, [enrollments]);

  const initials = fullName
    ? fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : currentUser?.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="space-y-6 pb-12 pt-4 sm:pt-6">
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[var(--border-light)]">
          <div className="relative shrink-0">
            {photoURL ? (
              <img
                src={photoURL}
                alt=""
                className="w-14 h-14 rounded-full object-cover border-2 border-zinc-200"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white border border-zinc-300 flex items-center justify-center hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Camera className="w-3 h-3 text-zinc-600" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
                e.target.value = "";
              }}
            />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-800">{fullName}</h2>
            <p className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
              <Mail className="w-3.5 h-3.5" />
              {email}
            </p>
          </div>
        </div>
        {uploadMsg && (
          <p className={`mb-4 text-xs text-center ${uploadMsg.type === "success" ? "text-green-600" : "text-red-500"}`}>
            {uploadMsg.text}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3 h-3" /> Phone
            </p>
            <p className="text-sm font-bold text-zinc-800 mt-1">{phone || "—"}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3" /> Role
            </p>
            <p className="text-sm font-bold text-zinc-800 mt-1 capitalize">{role || "—"}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3 h-3" /> Class Type
            </p>
            <p className="text-sm font-bold text-zinc-800 mt-1 capitalize">{classType || "—"}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Courses Enrolled
            </p>
            <p className="text-lg font-black text-zinc-800 mt-1">{groupedEnrollments.length}</p>
          </div>
        </div>

        {groupedEnrollments.length > 0 && (
          <div className="mt-4">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Enrolled Courses</h3>
            <div className="flex flex-wrap gap-2">
              {groupedEnrollments.map((g) => (
                <span
                  key={g.courseName}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold"
                >
                  <BookOpen className="w-3 h-3" />
                  {g.courseName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <h3 className="text-sm font-black text-zinc-700 mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Payment History
        </h3>

        {enrollError && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-500 text-xs">{enrollError}</div>
        )}

        {loading ? (
          <p className="text-xs text-zinc-400">Loading...</p>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-8">
            <IndianRupee className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-400">No payments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedEnrollments.map((group) => {
              const first = group.enrollments[0];
              const isEmi = first.paymentType === "emi";
              const groupTotalFee = first.totalFee || 0;
              const groupTotalPaid = group.enrollments.reduce((s, e) => s + e.amount, 0);
              const balance = groupTotalFee - groupTotalPaid;

              return (
                <div key={group.courseName} className="p-4 rounded-xl bg-white/40 border border-[var(--border-light)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-bold text-zinc-700">{group.courseName}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isEmi
                        ? "bg-amber-50 border border-amber-200 text-amber-600"
                        : "bg-emerald-50 border border-emerald-200 text-emerald-600"
                    }`}>
                      {isEmi ? <IndianRupee className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {isEmi ? "EMI" : "FULL PAID"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-white/60 border border-[var(--border-light)]">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Cost</p>
                      <p className="text-sm font-black text-zinc-800 mt-0.5">₹{groupTotalFee.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/60 border border-[var(--border-light)]">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Paid</p>
                      <p className="text-sm font-black text-emerald-600 mt-0.5">₹{groupTotalPaid.toLocaleString("en-IN")}</p>
                    </div>
                    {isEmi && (
                      <div className="p-2.5 rounded-lg bg-white/60 border border-[var(--border-light)]">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Balance</p>
                        <p className="text-sm font-black text-amber-600 mt-0.5">₹{Math.max(0, balance).toLocaleString("en-IN")}</p>
                      </div>
                    )}
                  </div>

                  {isEmi && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        Installments ({group.enrollments.length})
                      </p>
                      {group.enrollments.map((enrollment, i) => (
                        <div key={enrollment.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/40 border border-[var(--border-light)]">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-zinc-400 w-12">{i + 1}{i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"} EMI</span>
                            <span className="text-xs font-bold text-zinc-700">₹{enrollment.amount.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-400">
                              {enrollment.createdAt?.toDate
                                ? enrollment.createdAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                : "—"}
                            </span>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isEmi && (
                    <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/40 border border-[var(--border-light)]">
                      <span className="text-xs font-bold text-zinc-700">Paid on</span>
                      <span className="text-xs text-zinc-400">
                        {first.createdAt?.toDate
                          ? first.createdAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 border border-indigo-200">
              <span className="text-sm font-bold text-indigo-700">Total Amount Paid</span>
              <span className="text-lg font-black text-indigo-700">
                ₹{totalPaid.toLocaleString("en-IN")}
              </span>
            </div>
            {courseFee > 0 && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-sm font-bold text-amber-700">Course Fee</span>
                <span className="text-lg font-black text-amber-700">
                  ₹{courseFee.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-center">
        <span className="text-[10px] text-zinc-400">
          <Calendar className="w-3 h-3 inline mr-1" />
          Member since{" "}
          {currentUser?.metadata?.creationTime
            ? new Date(currentUser.metadata.creationTime).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })
            : "now"}
        </span>
      </div>

      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <h3 className="text-sm font-black text-zinc-700 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Change Password
        </h3>

        {pwSuccess && (
          <p className="mb-4 text-xs text-green-600 text-center">{pwSuccess}</p>
        )}
        {pwError && (
          <p className="mb-4 text-xs text-red-500 text-center">{pwError}</p>
        )}

        <div className="space-y-3">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type={showPwNew ? "text" : "password"}
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              placeholder="New password (min. 6 characters)"
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-white/40 border border-[var(--border-light)] text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-300 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPwNew((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              tabIndex={-1}
            >
              {showPwNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type={showPwConfirm ? "text" : "password"}
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-white/40 border border-[var(--border-light)] text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-300 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPwConfirm((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              tabIndex={-1}
            >
              {showPwConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={pwSaving}
            className="w-full min-h-[40px] px-4 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {pwSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Lock className="w-4 h-4" /> Change Password</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

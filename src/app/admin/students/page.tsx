"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, deleteDoc, doc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GraduationCap, Mail, IndianRupee, Search, Plus, X, Phone, CheckCircle, Loader2, User as UserIcon, Lock, Trash2, BookOpen, Video, Monitor, Upload, Image, Save } from "lucide-react";
import { sendOtp, verifyOtp } from "@/lib/otpService";
import { createPaidUser, checkEmailExists } from "@/lib/admin/paidUserService";
import { createEnrollment } from "@/lib/enrollments";
import { createBulkClasses, uploadClassVideo, generateVideoThumbnail, uploadClassThumbnail, uploadClassFile, isStorageUrl } from "@/lib/classes";
import { useAuth } from "@/context/AuthContext";
import { COURSES, BATCHES } from "@/lib/courses";

interface StudentCard {
  userId: string;
  userName: string;
  userEmail: string;
  courses: string[];
  totalPaid: number;
  paymentType?: string;
  classType?: string;
  batchName?: string;
}

export default function AdminStudents() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [classType, setClassType] = useState<"live" | "recorded">("live");
  const [paymentType, setPaymentType] = useState<"full" | "emi">("full");
  const [courseName, setCourseName] = useState("");
  const [batchName, setBatchName] = useState("");
  const [amount, setAmount] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState<{ email: string; password: string } | null>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedClassType, setSelectedClassType] = useState<"all" | "live" | "recorded">("all");
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [bulkShowForm, setBulkShowForm] = useState(false);
  const [bulkType, setBulkType] = useState<"live" | "recorded">("recorded");
  const [bulkTitle, setBulkTitle] = useState("");
  const [bulkBatchName, setBulkBatchName] = useState("");
  const [bulkLink, setBulkLink] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkIsLiveNow, setBulkIsLiveNow] = useState(false);
  const [bulkVideoFileName, setBulkVideoFileName] = useState("");
  const [bulkVideoName, setBulkVideoName] = useState("");
  const [bulkThumbnailUrl, setBulkThumbnailUrl] = useState("");
  const [bulkThumbnailUploading, setBulkThumbnailUploading] = useState(false);
  const [bulkQuestions, setBulkQuestions] = useState<string[]>([]);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const bulkVideoInputRef = useRef<HTMLInputElement>(null);

  const [bulkLiveVideoUrl, setBulkLiveVideoUrl] = useState("");
  const [bulkLiveVideoName, setBulkLiveVideoName] = useState("");
  const [bulkLiveThumbnailUrl, setBulkLiveThumbnailUrl] = useState("");
  const [bulkLiveThumbnailUploading, setBulkLiveThumbnailUploading] = useState(false);
  const bulkLiveVideoInputRef = useRef<HTMLInputElement>(null);

  const [bulkFileUrl, setBulkFileUrl] = useState("");
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkFileUploading, setBulkFileUploading] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      setError("");
      try {
        const userSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "paid-user"))
        );

        const userIds: string[] = [];
        const userMap = new Map<string, { fullName: string; email: string; courseName?: string; paymentType?: string; classType?: string; batchName?: string }>();
        userSnap.forEach((d) => {
          const data = d.data();
          userIds.push(d.id);
          userMap.set(d.id, {
            fullName: data.fullName || data.name || "",
            email: data.email || "",
            courseName: data.courseName || undefined,
            paymentType: data.paymentType || undefined,
            classType: data.classType || data.class_type || undefined,
            batchName: data.batchName || undefined,
          });
        });

        let enrollmentSnap: any = null;
        const enrollmentMap = new Map<string, { courses: string[]; totalPaid: number; paymentType?: string }>();
        try {
          enrollmentSnap = await getDocs(collection(db, "enrollments"));
          enrollmentSnap.forEach((d: any) => {
            const data = d.data();
            const uid = data.userId;
            if (!enrollmentMap.has(uid)) {
              enrollmentMap.set(uid, { courses: [], totalPaid: 0, paymentType: data.paymentType });
            }
            const entry = enrollmentMap.get(uid)!;
            if (data.courseName) entry.courses.push(data.courseName);
            if (data.amount) entry.totalPaid += data.amount;
            if (data.paymentType) entry.paymentType = data.paymentType;
          });
        } catch {
          // Enrollments query may fail due to security rules; show users without enrollment data
        }

        const allIds = new Set([...userIds, ...enrollmentMap.keys()]);
        const cards: StudentCard[] = [];
        for (const uid of allIds) {
          const userInfo = userMap.get(uid);
          const enrollInfo = enrollmentMap.get(uid);
          if (!userInfo && !enrollInfo) continue;
          const enrollDoc = enrollmentSnap?.docs?.find((d: any) => d.data().userId === uid);
          const userCourseName = userInfo?.courseName;
          const userPaymentType = userInfo?.paymentType;
          cards.push({
            userId: uid,
            userName: userInfo?.fullName || enrollDoc?.data()?.userName || "Unknown",
            userEmail: userInfo?.email || enrollDoc?.data()?.userEmail || "",
            courses: userCourseName ? [userCourseName] : (enrollInfo?.courses || []),
            totalPaid: enrollInfo?.totalPaid || 0,
            paymentType: userPaymentType || enrollInfo?.paymentType || enrollDoc?.data()?.paymentType || undefined,
            classType: userInfo?.classType || enrollDoc?.data()?.classType || undefined,
            batchName: userInfo?.batchName || enrollDoc?.data()?.batchName || undefined,
          });
        }

        cards.sort((a, b) => a.userName.localeCompare(b.userName));
        setStudents(cards);
      } catch (err: any) {
        setError(err?.message || "Failed to load students");
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const handleDelete = async (e: React.MouseEvent, uid: string) => {
    e.stopPropagation();
    const confirm = window.confirm("Delete this paid user? This cannot be undone.");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "users", uid));

      if (currentUser) {
        const logRef = doc(collection(db, "activity_log"));
        await setDoc(logRef, {
          uid: currentUser.uid,
          type: "paid-user",
          description: `Deleted paid user: ${uid}`,
          timestamp: Timestamp.now(),
        }).catch(() => {});

        try {
          const idToken = await currentUser.getIdToken();
          const { deleteUser } = await import("@/lib/adminFunctions");
          await deleteUser(uid, idToken);
        } catch {}
      }

      setStudents((prev) => prev.filter((s) => s.userId !== uid));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const courseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      s.courses.forEach((c) => {
        const key = c.toLowerCase().trim();
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return counts;
  }, [students]);

  const displayedStudents = students
    .filter((s) => !selectedCourse || s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()))
    .filter((s) => selectedClassType === "all" || s.classType === selectedClassType)
    .filter((s) => !selectedBatch || s.batchName === selectedBatch)
    .filter(
      (s) =>
        s.userName.toLowerCase().includes(search.toLowerCase()) ||
        s.userEmail.toLowerCase().includes(search.toLowerCase())
    );

  // ... form handlers (same as before)
  async function handleSendOtp() {
    if (!email.trim()) { setFormError("Email is required to send OTP"); return; }
    setFormError("");
    setOtpError("");
    setOtpVerified(false);
    setOtp("");
    setOtpLoading(true);
    try {
      const exists = await checkEmailExists(email.trim());
      if (exists) {
        setFormError("This email is already registered. Please use a different email.");
        setOtpLoading(false);
        return;
      }
      await sendOtp(email.trim());
      setOtpSent(true);
    } catch (err: any) {
      setOtpError(err?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) { setOtpError("Enter the OTP code"); return; }
    setOtpError("");
    setOtpLoading(true);
    try {
      const valid = await verifyOtp(email.trim(), otp.trim());
      if (valid) {
        setOtpVerified(true);
      } else {
        setOtpError("Invalid or expired OTP");
      }
    } catch (err: any) {
      setOtpError(err?.message || "Verification failed");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess(null);

    if (!fullName.trim()) { setFormError("Full name is required"); return; }
    if (!email.trim()) { setFormError("Email is required"); return; }
    if (!phone.trim()) { setFormError("Phone number is required"); return; }
    if (!password) { setFormError("Password is required"); return; }
    if (password.length < 6) { setFormError("Password must be at least 6 characters"); return; }
    if (!courseName.trim()) { setFormError("Course name is required"); return; }
    if (!otpVerified) { setFormError("Please verify the email with OTP first"); return; }

    const selectedCourse = COURSES.find((c) => c.name === courseName.trim());
    setCreating(true);
    try {
      const result = await createPaidUser(fullName.trim(), email.trim(), phone.trim(), password, classType, batchName.trim() || undefined);
      if (result.success) {
        // Create enrollment document
        try {
          await createEnrollment({
            userId: result.uid,
            userName: fullName.trim(),
            userEmail: result.email,
            courseId: selectedCourse?.id || courseName.trim().toLowerCase().replace(/\s+/g, "-"),
            courseName: courseName.trim(),
            amount: amount ? Number(amount) : 0,
            paymentType,
          } as any);
        } catch (e: any) {
          console.warn("Enrollment creation failed (account created):", e?.message);
        }

        try {
          await updateDoc(doc(db, "users", result.uid), {
            courseName: courseName.trim(),
            paymentType,
            batchName: batchName.trim() || "",
            updatedAt: Timestamp.now(),
          });
        } catch {
          // non-critical, user doc fields are best-effort
        }

        setFormSuccess({ email: result.email, password: result.password });
        setFullName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setCourseName("");
        setBatchName("");
        setAmount("");
        setClassType("live");
        setPaymentType("full");
        setOtpSent(false);
        setOtpVerified(false);
        setOtp("");
        // Reload students list
        const userSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "paid-user"))
        );
        const newUser = userSnap.docs.find((d) => d.id === result.uid);
        if (newUser) {
          const data = newUser.data();
          setStudents((prev) => [
            ...prev,
            {
              userId: result.uid,
              userName: data.fullName || data.name || "",
              userEmail: data.email || "",
              courses: [courseName.trim()],
              totalPaid: Number(amount),
              paymentType,
              batchName: batchName.trim() || undefined,
            },
          ].sort((a, b) => a.userName.localeCompare(b.userName)));
        }
      } else {
        setFormError(result.error);
      }
    } catch (err: any) {
      setFormError(err?.message || "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setShowForm(false);
    setFullName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setCourseName("");
    setAmount("");
    setClassType("live");
    setPaymentType("full");
    setFormError("");
    setFormSuccess(null);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    setOtpError("");
  }

  const inputClass = "w-full min-h-[44px] px-4 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-indigo-500/40 transition-colors";

  return (
    <div className="space-y-6 pb-12 pt-6 sm:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Paid Users
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Users who have paid for courses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="min-h-[44px] px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.45)] transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Close" : "Create New Account"}
          </button>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border-light)] bg-white/55 text-sm font-medium text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--color-primary)]/30"
            />
          </div>
        </div>
      </div>

      {showForm && (
        <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-zinc-700 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Create New Account
            </h3>
          </div>

          {formSuccess ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white border border-emerald-200 text-emerald-700 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold text-emerald-600">Account created successfully!</span>
                </div>
                <div className="bg-white rounded-lg p-3 space-y-1 text-xs font-mono border border-emerald-100">
                  <p><span className="text-zinc-500">Email:</span> <span className="font-bold text-emerald-700">{formSuccess.email}</span></p>
                  <p><span className="text-zinc-500">Password:</span> <span className="font-bold">{formSuccess.password}</span></p>
                </div>
                <p className="text-xs text-emerald-600">Share these credentials with the student to log in using the &quot;paid-user&quot; option.</p>
              </div>
              <button
                onClick={resetForm}
                className="min-h-[44px] px-5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-sm font-semibold hover:bg-zinc-200 transition-all cursor-pointer"
              >
                Create Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-500 text-xs">{formError}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Class Type</label>
                  <div className="flex gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="classType"
                        value="live"
                        checked={classType === "live"}
                        onChange={() => setClassType("live")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-sm text-zinc-700 font-medium">Live</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="classType"
                        value="recorded"
                        checked={classType === "recorded"}
                        onChange={() => setClassType("recorded")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-sm text-zinc-700 font-medium">Recorded</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Course Name</label>
                  <select
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    <option value="">Select a course</option>
                    {COURSES.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Batch</label>
                  <select
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    <option value="">Select a batch</option>
                    {BATCHES.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Payment Type</label>
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentType"
                      value="full"
                      checked={paymentType === "full"}
                      onChange={() => setPaymentType("full")}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm text-zinc-700 font-medium">FULL PAID</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentType"
                      value="emi"
                      checked={paymentType === "emi"}
                      onChange={() => setPaymentType("emi")}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm text-zinc-700 font-medium">EMI</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Email (Gmail ID)</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setOtpSent(false);
                      setOtpVerified(false);
                      setOtp("");
                    }}
                    className={inputClass + " flex-1"}
                    placeholder="student@gmail.com"
                  />
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading || !email.trim() || otpSent}
                      className="min-h-[44px] px-4 rounded-xl bg-white border border-red-300 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-2"
                    >
                      {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {otpLoading ? "Sending..." : otpSent ? "OTP Sent" : "Send OTP"}
                    </button>
                  )}
                  {otpVerified && (
                    <div className="flex items-center gap-1.5 shrink-0 min-h-[44px] px-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-semibold">Verified</span>
                    </div>
                  )}
                </div>
                {otpSent && !otpVerified && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className={inputClass + " w-[160px] text-center tracking-[8px] font-mono text-lg"}
                      placeholder="000000"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || otp.length !== 6}
                      className="min-h-[44px] px-5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 text-sm font-semibold hover:bg-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-2"
                    >
                      {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {otpLoading ? "Verifying..." : "Verify"}
                    </button>
                    {otpError && <p className="text-xs text-red-500 self-center">{otpError}</p>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className={inputClass + " pl-10"}
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass + " pl-10"}
                      placeholder="Min. 6 characters"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="min-h-[48px] px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.45)] disabled:opacity-50 transition-all duration-200 cursor-pointer flex items-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {creating ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/35 border border-[var(--border-light)]/50 text-zinc-700"
      >
        <GraduationCap className="w-3.5 h-3.5" />
        {sidebarOpen ? "Hide Courses" : "Show Courses"}
      </button>

      {/* Sidebar + Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "block" : "hidden"} lg:block w-full lg:w-60 shrink-0`}>
          <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm sticky top-6">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[var(--border-light)]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-black text-zinc-700 tracking-tight">
                  Courses
                </h3>
                <p className="text-[9px] text-zinc-400 font-semibold">
                  {selectedCourse ? `Filtering: ${selectedCourse}` : "All students"}
                </p>
              </div>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => { setSelectedCourse(null); setSelectedClassType("all"); setSelectedBatch(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all duration-200 group ${
                  !selectedCourse
                    ? "bg-gradient-to-r from-indigo-50 to-purple-50/50 border border-indigo-200 text-indigo-700 shadow-sm"
                    : "bg-white/70 border border-transparent text-zinc-500 hover:bg-zinc-50 hover:border-zinc-200 hover:text-zinc-700"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${!selectedCourse ? "bg-indigo-500" : "bg-zinc-300 group-hover:bg-zinc-400"}`} />
                  <span className="text-[11px] font-bold">All Courses</span>
                </div>
                <span className={`shrink-0 ml-2 min-w-[22px] text-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  !selectedCourse
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-zinc-100 text-zinc-500"
                }`}>
                  {students.length}
                </span>
              </button>
              <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent mx-2 my-1.5" />
              {COURSES.map((course) => {
                const count = courseCounts[course.name.toLowerCase().trim()] || 0;
                const isActive = selectedCourse === course.name;
                return (
                  <button
                    key={course.id}
                    onClick={() => { setSelectedCourse(course.name); setSelectedClassType("all"); setSelectedBatch(null); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50/50 border border-indigo-200 text-indigo-700 shadow-sm"
                        : "bg-white/70 border border-transparent text-zinc-500 hover:bg-zinc-50 hover:border-zinc-200 hover:text-zinc-700"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        isActive ? "bg-indigo-500" : "bg-zinc-300 group-hover:bg-zinc-400"
                      }`} />
                      <span className="text-[11px] font-bold leading-snug whitespace-normal break-words">{course.name}</span>
                    </div>
                    <span className={`shrink-0 ml-2 min-w-[22px] text-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                      isActive
                        ? "bg-indigo-100 text-indigo-600"
                        : count > 0
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-zinc-100 text-zinc-400"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {selectedCourse && !loading && !error && (
            <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <Monitor className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-700">Upload Class to All Students</h3>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                      {students.filter((s) => s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()) && (!bulkBatchName || s.batchName === bulkBatchName)).length} student{students.filter((s) => s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()) && (!bulkBatchName || s.batchName === bulkBatchName)).length !== 1 ? "s" : ""} enrolled in <span className="text-indigo-600">{selectedCourse}</span>
                      {bulkBatchName && <span className="text-cyan-600"> ({bulkBatchName})</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setBulkShowForm(!bulkShowForm);
                    if (bulkShowForm) {
                      setBulkTitle("");
                      setBulkBatchName("");
                      setBulkLink("");
                      setBulkQuestions([]);
                      setBulkThumbnailUrl("");
                      setBulkVideoFileName("");
                      setBulkError("");
                      setBulkSuccess("");
                    }
                  }}
                  className="min-h-[36px] px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {bulkShowForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {bulkShowForm ? "Close" : "Upload Class"}
                </button>
              </div>

              {bulkSuccess && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {bulkSuccess}
                </div>
              )}

              {bulkShowForm && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBulkError("");
                    setBulkSuccess("");

                    if (!bulkTitle.trim()) { setBulkError("Title is required"); return; }
                    if (!bulkLink.trim() && !bulkVideoFileName) { setBulkError("Link or video is required"); return; }

                    const enrolledStudents = students.filter((s) =>
                      s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()) &&
                      (!bulkBatchName || s.batchName === bulkBatchName)
                    );
                    if (enrolledStudents.length === 0) { setBulkError("No enrolled students found"); return; }

                    setBulkUploading(true);

                    try {
                      const result = await createBulkClasses(
                        enrolledStudents.map((s) => s.userId),
                        {
                          type: bulkType,
                          title: bulkTitle.trim(),
                          link: bulkLink.trim(),
                          videoName: bulkVideoName || undefined,
                          questions: bulkQuestions.filter((q) => q.trim()).length > 0 ? bulkQuestions.filter((q) => q.trim()) : undefined,
                          thumbnailUrl: bulkThumbnailUrl || undefined,
                          isLiveNow: bulkIsLiveNow || undefined,
                          liveVideoUrl: bulkLiveVideoUrl || undefined,
                          liveVideoName: bulkLiveVideoName || undefined,
                          liveThumbnailUrl: bulkLiveThumbnailUrl || undefined,
                          fileUrl: bulkFileUrl || undefined,
                          fileName: bulkFileName || undefined,
                        }
                      );

                      setBulkSuccess(`Class created for ${result.success} student${result.success !== 1 ? "s" : ""}`);
                      if (result.failed.length > 0) {
                        setBulkError(`${result.failed.length} failed: ${result.failed.map((f) => f.error).join("; ")}`);
                      }

                      setBulkShowForm(false);
                      setBulkIsLiveNow(false);
                      setBulkTitle("");
                      setBulkBatchName("");
                      setBulkLink("");
                      setBulkQuestions([]);
                      setBulkThumbnailUrl("");
                      setBulkVideoFileName("");
                      setBulkLiveVideoUrl("");
                      setBulkLiveVideoName("");
                      setBulkLiveThumbnailUrl("");
                      setBulkLiveThumbnailUploading(false);
                      setBulkFileUrl("");
                      setBulkFileName("");
                      setBulkFileUploading(false);
                    } catch (err: any) {
                      setBulkError(err?.message || "Something went wrong");
                    } finally {
                      setBulkUploading(false);
                    }
                  }}
                  className="mt-4 space-y-3 p-4 rounded-xl bg-white/40 border border-[var(--border-light)]"
                >
                  {bulkError && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-500 text-xs">{bulkError}</div>
                  )}

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bulkType"
                        value="recorded"
                        checked={bulkType === "recorded"}
                        onChange={() => setBulkType("recorded")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <Video className="w-4 h-4 text-violet-500" />
                      <span className="text-sm text-zinc-700 font-medium">Recorded</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bulkType"
                        value="live"
                        checked={bulkType === "live"}
                        onChange={() => setBulkType("live")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <Monitor className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-zinc-700 font-medium">Live</span>
                    </label>
                  </div>

                  {bulkType === "live" && (
                    <label className="flex items-center gap-2 cursor-pointer select-none py-1.5 px-3 rounded-xl bg-red-50/50 border border-red-100">
                      <input
                        type="checkbox"
                        checked={bulkIsLiveNow}
                        onChange={(e) => setBulkIsLiveNow(e.target.checked)}
                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                      />
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-[11px] font-bold shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-[blink_1.5s_ease-in-out_infinite]" />
                        Live Now
                      </span>
                    </label>
                  )}

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">Batch (optional)</label>
                      <select
                        value={bulkBatchName}
                        onChange={(e) => setBulkBatchName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-light)] text-sm font-medium focus:outline-none focus:border-indigo-300 appearance-none cursor-pointer bg-white"
                      >
                        <option value="">All Batches</option>
                        {BATCHES.map((b) => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">Class Title</label>
                      <input
                        type="text"
                        value={bulkTitle}
                        onChange={(e) => setBulkTitle(e.target.value)}
                        placeholder="Class title"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-light)] text-sm font-medium focus:outline-none focus:border-indigo-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="url"
                      value={bulkLink}
                      onChange={(e) => setBulkLink(e.target.value)}
                      placeholder={bulkType === "live" ? "Live meeting link (e.g. Zoom/Google Meet URL)" : "Recording link (e.g. YouTube/Drive URL)"}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-light)] text-sm font-medium focus:outline-none focus:border-indigo-300"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={bulkVideoInputRef}
                        accept="video/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (bulkType === "live") {
                            setBulkVideoFileName(file.name);
                            setBulkError("");
                            try {
                              const { url, name } = await uploadClassVideo("_bulk", file);
                              setBulkLiveVideoUrl(url);
                              setBulkLiveVideoName(name);
                              setBulkLiveThumbnailUploading(true);
                              try {
                                const thumbBlob = await generateVideoThumbnail(url);
                                const thumbUrl = await uploadClassThumbnail("_bulk", thumbBlob);
                                setBulkLiveThumbnailUrl(thumbUrl);
                              } catch { }
                              setBulkLiveThumbnailUploading(false);
                            } catch (err: any) {
                              setBulkError(err?.message || "Failed to upload video");
                            } finally {
                              setBulkVideoFileName("");
                              e.target.value = "";
                            }
                          } else {
                            setBulkVideoFileName(file.name);
                            setBulkError("");
                            try {
                              const { url, name } = await uploadClassVideo("_bulk", file);
                              setBulkLink(url);
                              setBulkVideoName(name);
                              setBulkThumbnailUploading(true);
                              try {
                                const thumbBlob = await generateVideoThumbnail(url);
                                const thumbUrl = await uploadClassThumbnail("_bulk", thumbBlob);
                                setBulkThumbnailUrl(thumbUrl);
                              } catch { }
                              setBulkThumbnailUploading(false);
                            } catch (err: any) {
                              setBulkError(err?.message || "Failed to upload video");
                            } finally {
                              setBulkVideoFileName("");
                              e.target.value = "";
                            }
                          }
                        }}
                        className="hidden"
                      />
                      {bulkType === "live" ? (
                        <>
                          {bulkLiveVideoUrl && isStorageUrl(bulkLiveVideoUrl) ? (
                            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                              <Video className="w-3.5 h-3.5" />
                              Video uploaded
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => bulkVideoInputRef.current?.click()}
                              className="min-h-[26px] px-2.5 rounded-lg border border-dashed border-[var(--border-light)] text-[11px] text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              Upload Video
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {bulkUploading && bulkVideoFileName ? (
                            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Uploading {bulkVideoFileName}...
                            </span>
                          ) : bulkLink && isStorageUrl(bulkLink) ? (
                            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                              <Video className="w-3.5 h-3.5" />
                              Video uploaded
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => bulkVideoInputRef.current?.click()}
                              className="min-h-[26px] px-2.5 rounded-lg border border-dashed border-[var(--border-light)] text-[11px] text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              Upload from PC
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {bulkType === "live" && (
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={bulkFileInputRef}
                          accept=".pdf,application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setBulkFileUploading(true);
                            setBulkFileName(file.name);
                            setBulkError("");
                            try {
                              const { url, name } = await uploadClassFile("_bulk", file);
                              setBulkFileUrl(url);
                              setBulkFileName(name);
                            } catch (err: any) {
                              setBulkError(err?.message || "Failed to upload file");
                            } finally {
                              setBulkFileUploading(false);
                              e.target.value = "";
                            }
                          }}
                          className="hidden"
                        />
                        {bulkFileUploading ? (
                          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Uploading {bulkFileName}...
                          </span>
                        ) : bulkFileUrl ? (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                            <Image className="w-3.5 h-3.5" />
                            PDF uploaded
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => bulkFileInputRef.current?.click()}
                            className="min-h-[26px] px-2.5 rounded-lg border border-dashed border-[var(--border-light)] text-[11px] text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            Upload PDF
                          </button>
                        )}
                      </div>
                    )}
                    {bulkLiveThumbnailUploading && (
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating video thumbnail...
                      </span>
                    )}
                    {bulkLiveThumbnailUrl && !bulkLiveThumbnailUploading && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                        <Image className="w-3.5 h-3.5" />
                        Video thumbnail ready
                      </div>
                    )}
                    {bulkThumbnailUploading && (
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating thumbnail...
                      </span>
                    )}
                  </div>

                  <div className="border-t border-[var(--border-light)] pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-zinc-600">Questions ({bulkQuestions.length})</h5>
                      <button
                        type="button"
                        onClick={() => setBulkQuestions((prev) => [...prev, ""])}
                        className="min-h-[26px] px-2.5 rounded-lg bg-violet-600 text-white text-[10px] font-bold hover:bg-violet-700 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    {bulkQuestions.length === 0 && (
                      <p className="text-xs text-zinc-400 text-center py-2">No questions yet. Click "Add" to create one.</p>
                    )}
                    {bulkQuestions.map((q, qi) => (
                      <div key={qi} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 shrink-0">#{qi + 1}</span>
                        <input
                          type="text"
                          value={q}
                          onChange={(e) => setBulkQuestions((prev) => prev.map((v, i) => (i === qi ? e.target.value : v)))}
                          placeholder="Enter question"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-light)] text-xs font-medium focus:outline-none focus:border-violet-300"
                        />
                        <button
                          type="button"
                          onClick={() => setBulkQuestions((prev) => prev.filter((_, i) => i !== qi))}
                          className="p-1 rounded bg-white border border-red-200 text-red-500 hover:bg-rose-50 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={bulkUploading}
                    className="min-h-[44px] px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.45)] disabled:opacity-50 transition-all duration-200 cursor-pointer flex items-center gap-2"
                  >
                    {bulkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {bulkUploading
                      ? "Creating classes..."
                      : `Upload to All ${students.filter((s) => s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()) && (!bulkBatchName || s.batchName === bulkBatchName)).length} Student${students.filter((s) => s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()) && (!bulkBatchName || s.batchName === bulkBatchName)).length !== 1 ? "s" : ""}`}
                  </button>
                </form>
              )}
            </div>
          )}

          {selectedCourse && !loading && !error && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Class Type:</span>
                {(["all", "live", "recorded"] as const).map((type) => {
                  const courseFiltered = students.filter((s) => !selectedCourse || s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()));
                  const count = type === "all"
                    ? courseFiltered.length
                    : courseFiltered.filter((s) => s.classType === type).length;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedClassType(type)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                        selectedClassType === type
                          ? type === "live"
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm"
                            : type === "recorded"
                            ? "bg-violet-50 border border-violet-200 text-violet-700 shadow-sm"
                            : "bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm"
                          : "bg-white/70 border border-transparent text-zinc-500 hover:bg-zinc-50 hover:border-zinc-200"
                      }`}
                    >
                      {type === "all" ? null : type === "live" ? (
                        <Monitor className="w-3.5 h-3.5" />
                      ) : (
                        <Video className="w-3.5 h-3.5" />
                      )}
                      <span className="capitalize">{type === "all" ? "All" : type}</span>
                      <span className={`text-[10px] font-extrabold ml-0.5 ${
                        selectedClassType === type
                          ? type === "live" ? "text-emerald-500" : type === "recorded" ? "text-violet-500" : "text-indigo-500"
                          : "text-zinc-400"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-5 bg-zinc-200 hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Batch:</span>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    !selectedBatch
                      ? "bg-cyan-50 border border-cyan-200 text-cyan-700 shadow-sm"
                      : "bg-white/70 border border-transparent text-zinc-500 hover:bg-zinc-50 hover:border-zinc-200"
                  }`}
                >
                  All
                  <span className={`text-[10px] font-extrabold ${!selectedBatch ? "text-cyan-500" : "text-zinc-400"}`}>
                    {students.filter((s) => !selectedCourse || s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim())).length}
                  </span>
                </button>
                {BATCHES.map((batch) => {
                  const count = students.filter((s) => {
                    const courseMatch = !selectedCourse || s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim());
                    return courseMatch && s.batchName === batch.name;
                  }).length;
                  return (
                    <button
                      key={batch.id}
                      onClick={() => setSelectedBatch(batch.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                        selectedBatch === batch.name
                          ? "bg-cyan-50 border border-cyan-200 text-cyan-700 shadow-sm"
                          : "bg-white/70 border border-transparent text-zinc-500 hover:bg-zinc-50 hover:border-zinc-200"
                      }`}
                    >
                      {batch.name}
                      <span className={`text-[10px] font-extrabold ${selectedBatch === batch.name ? "text-cyan-500" : "text-zinc-400"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div className="hrms-glass rounded-[20px] p-12 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center">
              <Loader2 className="w-8 h-8 text-zinc-300 mx-auto mb-3 animate-spin" />
              <p className="text-sm font-semibold text-zinc-400">Loading students...</p>
            </div>
          ) : error ? (
            <div className="hrms-glass rounded-[20px] p-12 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center">
              <p className="text-sm font-semibold text-red-400">{error}</p>
            </div>
          ) : displayedStudents.length === 0 ? (
            <div className="hrms-glass rounded-[20px] p-12 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center">
              <GraduationCap className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-400">{search ? "No students match your search" : "No paid users yet. Create your first account!"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedStudents.map((student) => {
                const initial = student.userName.charAt(0).toUpperCase();
                return (
                  <div
                    key={student.userId}
                    onClick={() => router.push(`/admin/students/details?id=${student.userId}`)}
                    className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-zinc-800 truncate">
                          {student.userName}
                        </h3>
                        <p className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{student.userEmail}</span>
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, student.userId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white border border-red-200 text-red-500 hover:bg-rose-50 hover:text-red-700 shadow-sm"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="pt-3 border-t border-[var(--border-light)] space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {student.courses.length === 0 ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-200 text-zinc-400 text-[9px] font-bold">
                            No courses
                          </span>
                        ) : (
                          student.courses.map((course) => (
                            <span
                              key={course}
                              className="inline-flex px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600 text-[9px] font-bold"
                            >
                              {course}
                            </span>
                          ))
                        )}
                        {student.paymentType && (
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold ${
                            student.paymentType === "full"
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-600"
                              : "bg-amber-50 border border-amber-200 text-amber-600"
                          }`}>
                            {student.paymentType === "full" ? "FULL PAID" : "EMI"}
                          </span>
                        )}
                        {student.batchName && (
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-600 text-[9px] font-bold">
                            {student.batchName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {student.courses.length} course{student.courses.length !== 1 ? "s" : ""}
                        </span>
                        {student.totalPaid > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold">
                            <IndianRupee className="w-3 h-3" />
                            {student.totalPaid.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

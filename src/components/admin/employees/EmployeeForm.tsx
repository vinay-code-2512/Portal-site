"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createEmployee, updateEmployee, type EmployeeData } from "@/lib/employees";
import { useAuth } from "@/context/AuthContext";
import DepartmentSelector from "./DepartmentSelector";
import DesignationSelector from "./DesignationSelector";
import { sendOtp, verifyOtp } from "@/lib/otpService";
import { CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";

interface EmployeeFormProps {
  mode: "add" | "edit";
  initialData?: EmployeeData;
}

export default function EmployeeForm({ mode, initialData }: EmployeeFormProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState(initialData?.fullName || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [department, setDepartment] = useState(initialData?.department || "");
  const [designation, setDesignation] = useState(initialData?.designation || "");
  const [role, setRole] = useState(initialData?.role || "employee");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(initialData?.status || "active");
  const [shiftDurationHours, setShiftDurationHours] = useState(initialData?.shiftDurationHours?.toString() || "8");
  const [showPassword, setShowPassword] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const inputClass = "w-full min-h-[44px] px-4 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 transition-colors";

  async function handleSendOtp() {
    if (!email.trim()) { setError("Email is required to send OTP"); return; }
    setError("");
    setOtpError("");
    setOtpVerified(false);
    setOtp("");
    setOtpLoading(true);
    try {
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

  async function handleResetPassword() {
    if (!initialData || newPassword.length < 6) return;
    setPasswordMessage("");
    setIsResettingPassword(true);
    try {
      if (!currentUser) throw new Error("Not authenticated");
      const idToken = await currentUser.getIdToken();
      const { updatePassword } = await import("@/lib/adminFunctions");
      await updatePassword(initialData.uid, newPassword, idToken);
      setPasswordMessage("Password updated successfully");
      setNewPassword("");
    } catch (err: any) {
      setPasswordMessage(err.message || "An error occurred");
    } finally {
      setIsResettingPassword(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim()) { setError("Full name is required"); return; }
    if (!email.trim()) { setError("Email is required"); return; }
    if (!phone.trim()) { setError("Phone is required"); return; }
    if (!department) { setError("Department is required"); return; }
    if (!designation) { setError("Designation is required"); return; }
    if (mode === "add" && !password) { setError("Password is required"); return; }
    if (mode === "add" && password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (mode === "add" && !otpVerified) { setError("Please verify the email with OTP first"); return; }

    if (!currentUser) { setError("You must be logged in"); return; }

    try {
      setLoading(true);

      if (mode === "add") {
        const idToken = await currentUser.getIdToken();
        const emp = await createEmployee(fullName.trim(), email.trim(), phone.trim(), department, designation, role as any, password, currentUser.uid, idToken);
        if (shiftDurationHours !== "8") {
          await updateEmployee(emp.uid, { shiftDurationHours: parseInt(shiftDurationHours, 10) || 8 }, currentUser.uid);
        }
        setSuccess(`Employee "${fullName}" created successfully!`);
        setTimeout(() => router.push("/admin/employees"), 1500);
      } else if (initialData) {
        await updateEmployee(initialData.uid, { fullName: fullName.trim(), phone: phone.trim(), department, designation, status: status as any, shiftDurationHours: parseInt(shiftDurationHours, 10) || 8 }, currentUser.uid);
        setSuccess("Employee updated successfully!");
        setTimeout(() => router.push(`/admin/employees/view?id=${initialData.uid}`), 1500);
      }
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else {
        setError(err?.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="hrms-glass rounded-[20px] p-5 sm:p-7 space-y-5 max-w-2xl">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">{error}</div>
      )}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs">{success}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Full Name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="John Doe" />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Email</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (mode === "add") { setOtpSent(false); setOtpVerified(false); setOtp(""); }
              }}
              className={inputClass + " flex-1"}
              placeholder="john@company.com"
              disabled={mode === "edit"}
            />
            {mode === "add" && !otpVerified && (
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
            {mode === "add" && otpVerified && (
              <div className="flex items-center gap-1.5 shrink-0 min-h-[44px] px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-semibold">Verified</span>
              </div>
            )}
          </div>
          {mode === "add" && otpSent && !otpVerified && (
            <div className="flex gap-2 pt-2">
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
                className="min-h-[44px] px-5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-2"
              >
                {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {otpLoading ? "Verifying..." : "Verify"}
              </button>
              {otpError && <p className="text-xs text-red-400 self-center">{otpError}</p>}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Phone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="9876543210" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as "employee" | "admin" | "manager")} className={inputClass + " appearance-none cursor-pointer"}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Department</label>
          <DepartmentSelector value={department} onChange={setDepartment} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Designation</label>
          <DesignationSelector value={designation} onChange={setDesignation} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Shift Duration (Hours)</label>
          <input type="number" min="1" max="24" value={shiftDurationHours} onChange={(e) => setShiftDurationHours(e.target.value)} className={inputClass} placeholder="8" />
        </div>
        {mode === "add" && (
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass + " pr-10"} placeholder="Min 6 characters" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
        {mode === "edit" && (
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive" | "suspended" | "on-leave")} className={inputClass + " appearance-none cursor-pointer"}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>
        )}
        {mode === "edit" && (
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Reset Password (Optional)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordMessage(""); }} className={inputClass + " pr-10"} placeholder="Enter new password to reset" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResettingPassword || newPassword.length < 6}
                className="min-h-[44px] px-5 rounded-xl bg-orange-500 text-white text-sm font-bold shadow-[0_4px_16px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_24px_rgba(249,115,22,0.45)] hover:bg-orange-600 transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-2"
              >
                {isResettingPassword ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
                {isResettingPassword ? "Resetting..." : "Reset Password"}
              </button>
            </div>
            {passwordMessage && <p className={`text-xs ${passwordMessage.includes("success") ? "text-emerald-400" : "text-red-400"}`}>{passwordMessage}</p>}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="min-h-[48px] px-6 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-sm font-bold shadow-[0_4px_16px_rgba(80,57,240,0.35)] hover:shadow-[0_6px_24px_rgba(80,57,240,0.45)] disabled:opacity-50 transition-all duration-200 cursor-pointer"
        >
          {loading ? "Saving..." : mode === "add" ? "Create Employee" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="min-h-[48px] px-6 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-400 text-sm font-semibold hover:text-white transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

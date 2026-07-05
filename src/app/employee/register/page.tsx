"use client";

import { Suspense, useReducer, type FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getInvite, validateInvite, claimInvite } from "@/lib/invites";
import { User, Phone, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle, AlertCircle, Key } from "lucide-react";

type State = {
  inviteCode: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
  success: boolean;
  fieldErrors: Record<string, string | null>;
  inviteValidated: boolean;
  inviteError: string;
};

type Action =
  | { type: "SET_FIELD"; field: "inviteCode" | "fullName" | "email" | "phone" | "password" | "confirmPassword"; value: string }
  | { type: "SET_ERRORS"; errors: Record<string, string | null> }
  | { type: "SET_ERROR"; error: string }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_SUCCESS"; success: boolean }
  | { type: "TOGGLE_PASSWORD" }
  | { type: "SET_INVITE_VALIDATED"; validated: boolean }
  | { type: "SET_INVITE_ERROR"; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
        fieldErrors: { ...state.fieldErrors, [action.field]: null },
      };
    case "SET_ERRORS":
      return { ...state, fieldErrors: action.errors };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_SUCCESS":
      return { ...state, success: action.success };
    case "TOGGLE_PASSWORD":
      return { ...state, showPassword: !state.showPassword };
    case "SET_INVITE_VALIDATED":
      return { ...state, inviteValidated: action.validated };
    case "SET_INVITE_ERROR":
      return { ...state, inviteError: action.error };
    default:
      return state;
  }
}

const initialState: State = {
  inviteCode: "",
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  showPassword: false,
  loading: false,
  error: "",
  success: false,
  fieldErrors: {},
  inviteValidated: false,
  inviteError: "",
};

function EmployeeRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);

  const { inviteCode, fullName, email, phone, password, confirmPassword, showPassword, loading, error, success, fieldErrors, inviteValidated, inviteError } = state;

  // Check if invite code is in URL
  useEffect(() => {
    const code = searchParams.get("invite");
    if (code) {
      dispatch({ type: "SET_FIELD", field: "inviteCode", value: code });
    }
  }, [searchParams]);

  async function validateInviteCode() {
    if (!inviteCode.trim()) {
      dispatch({ type: "SET_INVITE_ERROR", error: "Please enter an invite code" });
      return;
    }

    setValidatingInvite(true);
    dispatch({ type: "SET_INVITE_ERROR", error: "" });

    try {
      const invite = await getInvite(inviteCode);
      if (!invite) {
        dispatch({ type: "SET_INVITE_ERROR", error: "Invalid invite code" });
        setValidatingInvite(false);
        return;
      }

      if (invite.role !== "employee") {
        dispatch({ type: "SET_INVITE_ERROR", error: "This invite is not for employee registration" });
        setValidatingInvite(false);
        return;
      }

      // Pre-fill email if invite is email-specific
      if (invite.email) {
        dispatch({ type: "SET_FIELD", field: "email", value: invite.email });
      }

      setInviteData(invite);
      dispatch({ type: "SET_INVITE_VALIDATED", validated: true });
    } catch (err) {
      dispatch({ type: "SET_INVITE_ERROR", error: "Failed to validate invite code" });
    } finally {
      setValidatingInvite(false);
    }
  }

  function validate(): boolean {
    const errs: Record<string, string | null> = {};
    if (!fullName.trim()) {
      errs.fullName = "Full name is required";
    }
    if (!email) {
      errs.email = "Corporate email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address";
    }
    if (!phone.trim()) {
      errs.phone = "Contact number is required";
    } else if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, ""))) {
      errs.phone = "Enter a valid 10-digit phone number";
    }
    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    dispatch({ type: "SET_ERRORS", errors: errs });
    return !Object.values(errs).some(Boolean);
  }
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "SET_ERROR", error: "" });
    dispatch({ type: "SET_SUCCESS", success: false });

    if (!inviteValidated) {
      dispatch({ type: "SET_ERROR", error: "Please validate your invite code first" });
      return;
    }

    if (!validate()) return;

    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.replace(/\D/g, ""),
        role: "employee",
        createdAt: serverTimestamp(),
      });

      // Mark invite as claimed
      if (inviteData) {
        await claimInvite(inviteData.id, cred.user.uid);
      }

      dispatch({ type: "SET_SUCCESS", success: true });
      setTimeout(() => {
        router.push("/employee/login");
      }, 1500);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      let msg = "Failed to create account. Please try again.";
      if (code === "auth/email-already-in-use") {
        msg = "An account with this email already exists.";
      } else if (code === "auth/invalid-email") {
        msg = "Invalid email address formatting.";
      }
      dispatch({ type: "SET_ERROR", error: msg });
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }

  const setField = (field: "inviteCode" | "fullName" | "email" | "phone" | "password" | "confirmPassword") => (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_FIELD", field, value: e.target.value });
  };

  const inputClass = (field: string) =>
    `w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm rounded-lg bg-zinc-900 border text-slate-100 placeholder:text-zinc-500 focus:outline-none transition-colors duration-150 ${
      fieldErrors[field]
        ? "border-red-500/50 focus:border-red-500"
        : "border-zinc-800 focus:border-zinc-500"
    }`;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[var(--background)]">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-4">
            Robot Genie Corp
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Register Test Employee</h1>
          <p className="text-zinc-500 text-sm mt-2">Create employee credentials to test attendance tracking</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 sm:p-8 shadow-xl">
          {success && (
            <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Employee profile created! Check your email to verify before signing in.</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Invite Code Validation - Show only if not validated */}
          {!inviteValidated && (
            <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/25">
              <div className="flex items-start gap-2 mb-3">
                <Key className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-amber-400 text-xs font-semibold uppercase">Invite Code Required</p>
                  <p className="text-zinc-400 text-xs mt-1">You need a valid invite code to register as an employee</p>
                </div>
              </div>

              {inviteError && (
                <div className="flex items-start gap-2 p-3 mb-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{inviteError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label htmlFor="inviteCode" className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Invite Code
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <input
                      id="inviteCode"
                      type="text"
                      value={inviteCode}
                      onChange={setField("inviteCode")}
                      className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-slate-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors duration-150 uppercase"
                      placeholder="Enter your invite code"
                      disabled={validatingInvite}
                      maxLength={8}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={validateInviteCode}
                  disabled={validatingInvite || !inviteCode.trim()}
                  className="w-full min-h-[44px] bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 text-sm"
                >
                  {validatingInvite ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    "Validate Invite Code"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success message showing invite was validated */}
          {inviteValidated && (
            <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Invite code validated! Now complete your registration below.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className={`space-y-4 ${!inviteValidated ? 'pointer-events-none opacity-50' : ''}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={setField("fullName")}
                    className={inputClass("fullName")}
                    placeholder="John Doe"
                    disabled={loading || success}
                  />
                </div>
                {fieldErrors.fullName && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.fullName}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Contact Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={setField("phone")}
                    className={inputClass("phone")}
                    placeholder="9876543210"
                    maxLength={10}
                    disabled={loading || success}
                  />
                </div>
                {fieldErrors.phone && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.phone}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={setField("email")}
                  className={inputClass("email")}
                  placeholder="name@company.com"
                  disabled={loading || success}
                />
              </div>
              {fieldErrors.email && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={setField("password")}
                    className={`${inputClass("password")} pr-10`}
                    placeholder="Min. 6 chars"
                    disabled={loading || success}
                  />
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "TOGGLE_PASSWORD" })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={setField("confirmPassword")}
                    className={inputClass("confirmPassword")}
                    placeholder="Re-type password"
                    disabled={loading || success}
                  />
                </div>
                {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{fieldErrors.confirmPassword}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success || !inviteValidated}
              className="w-full h-11 mt-4 rounded-lg bg-white hover:bg-slate-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  Creating Profile...
                </>
              ) : !inviteValidated ? (
                <>
                  <span>Validate Invite First</span>
                  <Key className="w-4 h-4 text-zinc-600" />
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.06] flex justify-between items-center text-xs">
            <span className="text-zinc-500">Already registered?</span>
            <Link
              href="/employee/login"
              className="text-zinc-300 hover:text-white font-medium underline underline-offset-4"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070b]" />}>
      <EmployeeRegisterForm />
    </Suspense>
  );
}

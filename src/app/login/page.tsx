"use client";

import { Suspense, useEffect, useReducer, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  AlertCircle,
  CheckCircle,
  Star,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";

function validateEmail(v: string): string | null {
  if (!v) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address";
  return null;
}

function validatePassword(v: string): string | null {
  if (!v) return "Password is required";
  return null;
}

function getFirebaseErrorMessage(code: string): string {
  const map: Record<string, string> = {
    "auth/invalid-credential": "Invalid email or password",
    "auth/user-not-found": "No account found with this email",
    "auth/wrong-password": "Incorrect password",
    "auth/invalid-email": "Invalid email address",
    "auth/too-many-requests": "Too many attempts. Please try again later",
    "auth/user-disabled": "This account has been disabled",
    "auth/operation-not-allowed":
      "Email/Password sign-in is not enabled. Please enable it in Firebase Console > Authentication > Sign-in method.",
    "auth/network-request-failed": "Network error. Please check your internet connection.",
    "auth/internal-error": "An internal error occurred. Please try again.",
    "auth/email-already-in-use": "An account with this email already exists",
    "auth/weak-password": "Password should be at least 6 characters",
    "permission-denied":
      "Firestore access denied. Deploy the security rules from firestore/firestore.rules to Firebase Console.",
  };
  return map[code] || `Something went wrong (${code}). Please try again`;
}

type Role = "user" | "paid-user" | "employee" | "admin";

type State = {
  role: Role;
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
  successMessage: string;
  fieldErrors: Record<string, string | null>;
  isForgotPassword: boolean;
  isResetMode: boolean;
  resetCode: string | null;
  verifyingCode: boolean;
  verifiedEmail: string;
  newPassword: string;
  confirmNewPassword: string;
  showConfirmPassword: boolean;
};

type Action =
  | { type: "SET_ROLE"; role: Role }
  | { type: "SET_FIELD"; field: "email" | "password"; value: string }
  | { type: "SET_ERRORS"; errors: Record<string, string | null> }
  | { type: "SET_SUBMIT_ERROR"; error: string }
  | { type: "SET_SUCCESS_MESSAGE"; message: string }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "TOGGLE_PASSWORD" }
  | { type: "TOGGLE_FORGOT_PASSWORD"; val: boolean }
  | { type: "SET_RESET_MODE"; val: boolean }
  | { type: "SET_RESET_FIELD"; field: "newPassword" | "confirmNewPassword"; value: string }
  | { type: "TOGGLE_CONFIRM_PASSWORD" }
  | { type: "SET_VERIFIED"; resetCode: string; email: string }
  | { type: "SET_VERIFYING"; val: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ROLE":
      return { ...state, role: action.role, error: "", successMessage: "", fieldErrors: {} };
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
        fieldErrors: { ...state.fieldErrors, [action.field]: null },
      };
    case "SET_ERRORS":
      return { ...state, fieldErrors: action.errors };
    case "SET_SUBMIT_ERROR":
      return { ...state, error: action.error, successMessage: "" };
    case "SET_SUCCESS_MESSAGE":
      return { ...state, successMessage: action.message, error: "" };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "TOGGLE_PASSWORD":
      return { ...state, showPassword: !state.showPassword };
    case "TOGGLE_FORGOT_PASSWORD":
      return { ...state, isForgotPassword: action.val, isResetMode: false, error: "", successMessage: "", fieldErrors: {} };
    case "SET_RESET_MODE":
      return { ...state, isResetMode: action.val, error: "", successMessage: "", fieldErrors: {} };
    case "SET_RESET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
        fieldErrors: { ...state.fieldErrors, [action.field]: null },
      };
    case "TOGGLE_CONFIRM_PASSWORD":
      return { ...state, showConfirmPassword: !state.showConfirmPassword };
    case "SET_VERIFIED":
      return { ...state, resetCode: action.resetCode, verifiedEmail: action.email, verifyingCode: false };
    case "SET_VERIFYING":
      return { ...state, verifyingCode: action.val };
    default:
      return state;
  }
}

const initialState: State = {
  role: "user",
  email: "",
  password: "",
  showPassword: false,
  loading: false,
  error: "",
  successMessage: "",
  fieldErrors: {},
  isForgotPassword: false,
  isResetMode: false,
  resetCode: null,
  verifyingCode: false,
  verifiedEmail: "",
  newPassword: "",
  confirmNewPassword: "",
  showConfirmPassword: false,
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawRole = searchParams.get("role") as Role;
  const initialRole = ["user", "paid-user", "employee", "admin"].includes(rawRole) ? rawRole : "user";

  const [state, dispatch] = useReducer(reducer, { ...initialState, role: initialRole });
  const {
    role,
    email,
    password,
    showPassword,
    loading,
    error,
    successMessage,
    fieldErrors,
    isForgotPassword,
    isResetMode,
    resetCode,
    verifyingCode,
    verifiedEmail,
    newPassword,
    confirmNewPassword,
    showConfirmPassword,
  } = state;

  useEffect(() => {
    let oobCode = searchParams.get("oobCode");

    if (!oobCode && window.location.hash) {
      const hash = window.location.hash.replace(/^#/, "");
      const hashParams = new URLSearchParams(hash);
      oobCode = hashParams.get("oobCode");
    }

    if (!oobCode) return;

    dispatch({ type: "TOGGLE_FORGOT_PASSWORD", val: true });
    dispatch({ type: "SET_RESET_MODE", val: true });
    dispatch({ type: "SET_VERIFYING", val: true });

    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        dispatch({ type: "SET_VERIFIED", resetCode: oobCode, email: userEmail });
      })
      .catch(() => {
        dispatch({ type: "SET_VERIFYING", val: false });
        dispatch({
          type: "SET_SUBMIT_ERROR",
          error: "This reset link is invalid or has expired. Please request a new one.",
        });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function validate(): boolean {
    const errs: Record<string, string | null> = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    dispatch({ type: "SET_ERRORS", errors: errs });
    return !Object.values(errs).some(Boolean);
  }

  function validateNewPassword(): boolean {
    const errs: Record<string, string | null> = {};
    if (!newPassword) {
      errs.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      errs.newPassword = "Password should be at least 6 characters";
    }
    if (!confirmNewPassword) {
      errs.confirmNewPassword = "Confirm your new password";
    } else if (newPassword !== confirmNewPassword) {
      errs.confirmNewPassword = "Passwords do not match";
    }
    dispatch({ type: "SET_ERRORS", errors: errs });
    return !Object.values(errs).some(Boolean);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "SET_SUBMIT_ERROR", error: "" });

    if (!validate()) return;

    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const userRef = doc(db, "users", cred.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        dispatch({ type: "SET_SUBMIT_ERROR", error: "User profile not found. Please contact support." });
        return;
      }

      const userData = userSnap.data();
      const userRole = userData?.role || "user";

      if (role !== "user" && role !== "paid-user" && userRole !== role) {
        await signOut(auth);
        dispatch({
          type: "SET_SUBMIT_ERROR",
          error: `Access denied. Your account role is '${userRole}', not '${role}'.`,
        });
        return;
      }

      if (role === "paid-user" && userRole !== "paid-user") {
        await signOut(auth);
        dispatch({
          type: "SET_SUBMIT_ERROR",
          error: `Access denied. Your account role is '${userRole}', not '${role}'.`,
        });
        return;
      }

      let finalRedirect: string;
      if (userRole === "admin") finalRedirect = "/admin";
      else if (userRole === "employee") finalRedirect = "/employee";
      else if (role === "paid-user") finalRedirect = "/paid-user";
      else finalRedirect = searchParams.get("redirect") || "/";

      router.push(finalRedirect);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      dispatch({ type: "SET_SUBMIT_ERROR", error: getFirebaseErrorMessage(code) });
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "SET_SUBMIT_ERROR", error: "" });
    dispatch({ type: "SET_SUCCESS_MESSAGE", message: "" });

    const emailError = validateEmail(email);
    if (emailError) {
      dispatch({ type: "SET_ERRORS", errors: { email: emailError } });
      return;
    }

    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const snap = await getDocs(q);
      if (!snap.empty && snap.docs[0].data().role === "paid-user") {
        dispatch({ type: "SET_LOADING", loading: false });
        dispatch({
          type: "SET_SUBMIT_ERROR",
          error: "Password reset is not available for paid user accounts. Please contact support.",
        });
        return;
      }

      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      dispatch({
        type: "SET_SUCCESS_MESSAGE",
        message: "Password reset email sent! Check your inbox.",
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      dispatch({ type: "SET_SUBMIT_ERROR", error: getFirebaseErrorMessage(code) });
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }

  async function handleConfirmReset(e: FormEvent) {
    e.preventDefault();
    dispatch({ type: "SET_SUBMIT_ERROR", error: "" });
    dispatch({ type: "SET_SUCCESS_MESSAGE", message: "" });

    if (!validateNewPassword()) return;
    if (!resetCode) return;

    dispatch({ type: "SET_LOADING", loading: true });
    try {
      if (verifiedEmail) {
        const q = query(collection(db, "users"), where("email", "==", verifiedEmail));
        const snap = await getDocs(q);
        if (!snap.empty && snap.docs[0].data().role === "paid-user") {
          dispatch({ type: "SET_LOADING", loading: false });
          dispatch({
            type: "SET_SUBMIT_ERROR",
            error: "Password reset is not available for paid user accounts. Please contact support.",
          });
          return;
        }
      }
      await confirmPasswordReset(auth, resetCode, newPassword);
      dispatch({
        type: "SET_SUCCESS_MESSAGE",
        message: "Your password has been successfully reset! Sign in with your new password.",
      });
      dispatch({ type: "SET_RESET_FIELD", field: "newPassword", value: "" });
      dispatch({ type: "SET_RESET_FIELD", field: "confirmNewPassword", value: "" });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (code === "auth/expired-action-code") {
        dispatch({ type: "SET_SUBMIT_ERROR", error: "This reset link has expired. Please request a new one." });
      } else if (code === "auth/invalid-action-code") {
        dispatch({ type: "SET_SUBMIT_ERROR", error: "This reset link is invalid or has already been used." });
      } else if (code === "auth/weak-password") {
        dispatch({ type: "SET_SUBMIT_ERROR", error: "Password should be at least 6 characters." });
      } else {
        dispatch({ type: "SET_SUBMIT_ERROR", error: "Something went wrong. Please try again." });
      }
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }

  function handleResetSuccessSignIn() {
    dispatch({ type: "SET_FIELD", field: "email", value: verifiedEmail });
    dispatch({ type: "SET_RESET_MODE", val: false });
    dispatch({ type: "TOGGLE_FORGOT_PASSWORD", val: false });
    dispatch({ type: "SET_SUCCESS_MESSAGE", message: "" });
    dispatch({ type: "SET_SUBMIT_ERROR", error: "" });
  }

  const setField = (field: "email" | "password") => (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_FIELD", field, value: e.target.value });
  };

  const inputClass = (field: string, base = "") =>
    `w-full min-h-[48px] pl-10 pr-4 py-3 text-sm rounded-xl bg-white/[0.03] border text-white caret-white placeholder:text-zinc-600 focus:outline-none transition-colors duration-200 ${
      fieldErrors[field]
        ? "border-red-500/50 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20"
        : "border-white/[0.08] focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 focus:shadow-[0_0_16px_rgba(244,63,94,0.08)]"
    } ${base}`;

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-[#07070a]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(251,191,36,0.15),transparent_55%),radial-gradient(ellipse_90%_70%_at_80%_100%,rgba(244,63,94,0.12),transparent_50%),radial-gradient(ellipse_80%_60%_at_10%_90%,rgba(251,191,36,0.08),transparent_45%),linear-gradient(180deg,#07070a_0%,#0c0c18_45%,#07070a_100%)]" />
        <div className="pointer-events-none absolute -left-[20%] top-1/2 h-[min(90vw,520px)] w-[min(90vw,520px)] -translate-y-1/2 rounded-full bg-amber-500/20 blur-[100px] md:blur-[140px]" />
        <div className="pointer-events-none absolute -right-[15%] top-1/3 h-[min(70vw,440px)] w-[min(70vw,440px)] rounded-full bg-rose-500/15 blur-[90px] md:blur-[120px]" />
      </div>

      <div className="hidden lg:flex lg:w-[42%] relative items-center justify-center py-24 px-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/15 via-amber-800/10 to-transparent" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-amber-500/15 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 -right-10 w-56 h-56 bg-rose-500/10 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='25' cy='25' r='1' fill='%23ffffff'/%3E%3C/svg%3E")`,
            backgroundSize: "50px 50px",
          }}
        />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-900 flex items-center justify-center shadow-xl shadow-rose-400/20 mb-10 ring-1 ring-white/[0.06] relative">
              <Image
src="/RGLogo.png"
                        alt="Robot Genie"
                        fill
                        className="object-cover"
                        priority
                sizes="56px"
              />
            </div>

            <h2 className="text-4xl md:text-[2.8rem] font-black text-white leading-[1.1] mb-5 tracking-tight">
              Welcome
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-yellow-200 bg-clip-text text-transparent">
                Back
              </span>
            </h2>

            <p className="text-zinc-500 text-base leading-relaxed max-w-sm mb-10">
              Sign in to continue your learning journey with 5000+ learners mastering industry-relevant skills.
            </p>

            <div className="space-y-5">
              {[
                { label: "Expert Mentorship", sub: "Learn from industry professionals" },
                { label: "Live Projects", sub: "Build real-world portfolio" },
                { label: "Placement Guarantee", sub: "5000+ successful placements" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-amber-500/20">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{item.label}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-white/[0.06] flex items-center gap-5">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 border-2 border-[#07070b] flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-600 text-xs mt-0.5">Rated 4.9 by our students</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16 lg:py-0 lg:min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative w-full max-w-xl"
        >
          <div className="relative rounded-3xl bg-gradient-to-r from-amber-500 to-yellow-400 p-[1px] shadow-[0_0_40px_rgba(245,158,11,0.15)]">
            <div className="relative rounded-3xl bg-gradient-to-b from-[#0c0c18]/95 to-[#090912]/95 backdrop-blur-2xl p-8 sm:p-10 md:p-12 shadow-[0_0_80px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-rose-400/30 to-transparent" />
              <div className="absolute -top-[1px] left-1/3 right-1/3 h-[2px] bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full blur-[1px]" />

              <div className="text-center mb-8">
                <div className="lg:hidden flex items-center justify-center gap-2.5 mb-6">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center shadow-lg shadow-rose-400/20 ring-1 ring-white/[0.06] relative">
                    <Image
                      src="/RGLogo.webp"
                      alt="Robot Genie"
                      fill
                      className="object-cover"
                      sizes="36px"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-white font-semibold text-base">Robot Genie</span>
                </div>
                <motion.h1
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="text-3xl sm:text-4xl font-black text-white tracking-tight"
                >
                  {isForgotPassword ? (
                    <>Reset{" "}
                      <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-yellow-200 bg-clip-text text-transparent">
                        Password
                      </span>
                    </>
                  ) : (
                    <>Welcome{" "}
                      <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-yellow-200 bg-clip-text text-transparent">
                        Back
                      </span>
                    </>
                  )}
                </motion.h1>
                <p className="text-zinc-500 text-sm mt-2">
                  {isForgotPassword
                    ? isResetMode
                      ? "Choose a new password for your account"
                      : "Enter your email to receive a password reset link"
                    : "Sign in to continue your learning journey"}
                </p>
              </div>

              {!isForgotPassword && (
                <div className="flex p-1 mb-8 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  {(["user", "paid-user", "employee", "admin"] as const).map((r) => {
                    const label = r === "paid-user" ? "Students" : r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => dispatch({ type: "SET_ROLE", role: r })}
                        className={`flex-1 py-2.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200 ${
                          role === r
                            ? "bg-gradient-to-r from-amber-500/20 to-yellow-400/20 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.15)] border border-amber-400/30"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-2.5 p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                  {isResetMode && (
                    <button
                      type="button"
                      onClick={handleResetSuccessSignIn}
                      className="mt-2 w-full max-w-[200px] min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-bold text-sm shadow-[0_4px_24px_rgba(245,158,11,0.3)] hover:shadow-[0_8px_40px_rgba(245,158,11,0.45)] transition-all duration-200"
                    >
                      <LogIn className="w-4 h-4" /> Sign In
                    </button>
                  )}
                </motion.div>
              )}

              <form
                onSubmit={
                  isForgotPassword
                    ? isResetMode
                      ? handleConfirmReset
                      : handleResetPassword
                    : handleSubmit
                }
                noValidate
                className="space-y-5"
              >
                {isForgotPassword && isResetMode ? (
                  <>
                    {verifyingCode && (
                      <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-400">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                        <p className="text-sm">Verifying reset link...</p>
                      </div>
                    )}

                    {!verifyingCode && error && !resetCode && (
                      <div className="flex flex-col items-center text-center py-6 gap-3">
                        <ShieldAlert className="w-10 h-10 shrink-0 text-red-400" />
                        <button
                          type="button"
                          onClick={() => {
                            dispatch({ type: "SET_RESET_MODE", val: false });
                            dispatch({ type: "SET_SUBMIT_ERROR", error: "" });
                          }}
                          className="text-sm text-rose-400 hover:text-rose-300 transition-colors font-semibold flex items-center justify-center gap-1.5"
                        >
                          <ArrowLeft className="w-4 h-4" /> Request New Reset Link
                        </button>
                      </div>
                    )}

                    {!verifyingCode && resetCode && !successMessage && (
                      <>
                        {verifiedEmail && (
                          <p className="text-zinc-500 text-sm text-center">
                            Reset password for{" "}
                            <span className="text-amber-400 font-semibold">{verifiedEmail}</span>
                          </p>
                        )}

                        <div>
                          <label
                            htmlFor="newPassword"
                            className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest"
                          >
                            New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input
                              id="newPassword"
                              type={showPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) =>
                                dispatch({ type: "SET_RESET_FIELD", field: "newPassword", value: e.target.value })
                              }
                              className={inputClass("newPassword", "pr-10")}
                              placeholder="Enter new password (min. 6 characters)"
                            />
                            <button
                              type="button"
                              onClick={() => dispatch({ type: "TOGGLE_PASSWORD" })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                              tabIndex={-1}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {fieldErrors.newPassword && (
                            <p className="text-red-400 text-xs mt-1">{fieldErrors.newPassword}</p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="confirmNewPassword"
                            className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest"
                          >
                            Confirm Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input
                              id="confirmNewPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmNewPassword}
                              onChange={(e) =>
                                dispatch({
                                  type: "SET_RESET_FIELD",
                                  field: "confirmNewPassword",
                                  value: e.target.value,
                                })
                              }
                              className={inputClass("confirmNewPassword", "pr-10")}
                              placeholder="Re-enter your password"
                            />
                            <button
                              type="button"
                              onClick={() => dispatch({ type: "TOGGLE_CONFIRM_PASSWORD" })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                              tabIndex={-1}
                              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {fieldErrors.confirmNewPassword && (
                            <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmNewPassword}</p>
                          )}
                        </div>

                        <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={!loading ? { y: -2, scale: 1.01 } : {}}
                          whileTap={!loading ? { scale: 0.98 } : {}}
                          className="relative w-full min-h-[50px] mt-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-bold text-sm shadow-[0_4px_24px_rgba(244,63,94,0.3)] hover:shadow-[0_8px_40px_rgba(244,63,94,0.45)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-300" />
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Saving Password...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" /> <span>Reset Password</span>
                            </>
                          )}
                        </motion.button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {!isForgotPassword && (
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest"
                        >
                          Email Address
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
                            placeholder="you@example.com"
                          />
                        </div>
                        {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
                      </div>
                    )}

                    {!isForgotPassword ? (
                      <>
                        <div>
                          <label
                            htmlFor="password"
                            className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest"
                          >
                            Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              value={password}
                              onChange={setField("password")}
                              className={inputClass("password", "pr-10")}
                              placeholder="Enter your password"
                            />
                            <button
                              type="button"
                              onClick={() => dispatch({ type: "TOGGLE_PASSWORD" })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                              tabIndex={-1}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
                          {role !== "paid-user" && (
                            <div className="mt-2 text-right">
                              <button
                                type="button"
                                onClick={() => dispatch({ type: "TOGGLE_FORGOT_PASSWORD", val: true })}
                                className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium"
                              >
                                Forgot Password?
                              </button>
                            </div>
                          )}
                        </div>

                        <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={!loading ? { y: -2, scale: 1.01 } : {}}
                          whileTap={!loading ? { scale: 0.98 } : {}}
                          className="relative w-full min-h-[50px] mt-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-bold text-sm shadow-[0_4px_24px_rgba(244,63,94,0.3)] hover:shadow-[0_8px_40px_rgba(244,63,94,0.45)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-300" />
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                            </>
                          ) : (
                            <>
                              <LogIn className="w-4 h-4" /> <span>Sign In</span>
                            </>
                          )}
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <div>
                          <label
                            htmlFor="forgotEmail"
                            className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest"
                          >
                            Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input
                              id="forgotEmail"
                              type="email"
                              autoComplete="email"
                              value={email}
                              onChange={setField("email")}
                              className={inputClass("email")}
                              placeholder="you@example.com"
                            />
                          </div>
                          {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
                        </div>

                        <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={!loading ? { y: -2, scale: 1.01 } : {}}
                          whileTap={!loading ? { scale: 0.98 } : {}}
                          className="relative w-full min-h-[50px] mt-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-bold text-sm shadow-[0_4px_24px_rgba(244,63,94,0.3)] hover:shadow-[0_8px_40px_rgba(244,63,94,0.45)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-300" />
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4" /> <span>Send Reset Link</span>
                            </>
                          )}
                        </motion.button>

                        <p className="text-center text-zinc-500 text-sm mt-5">
                          <button
                            type="button"
                            onClick={() => dispatch({ type: "TOGGLE_FORGOT_PASSWORD", val: false })}
                            className="text-rose-400 hover:text-rose-300 transition-colors font-semibold flex items-center justify-center gap-1.5 mx-auto"
                          >
                            <ArrowLeft className="w-4 h-4" /> Back to Sign In
                          </button>
                        </p>
                      </>
                    )}
                  </>
                )}
              </form>

              {!isForgotPassword && (
                <>
                  <div className="flex items-center gap-3 mt-6">
                    <span className="h-px flex-1 bg-white/[0.06]" />
                    <span className="text-zinc-600 text-xs font-medium">or</span>
                    <span className="h-px flex-1 bg-white/[0.06]" />
                  </div>

                  <p className="text-center text-zinc-500 text-sm mt-5">
                    Don&apos;t have an account?{" "}
                    <Link
                      href={
                        searchParams.get("redirect")
                          ? `/signup?redirect=${encodeURIComponent(searchParams.get("redirect") as string)}`
                          : "/signup"
                      }
                      className="text-rose-400 hover:text-rose-300 transition-colors font-semibold"
                    >
                      Create one
                    </Link>
                  </p>
                </>
              )}

              {isForgotPassword && isResetMode && !successMessage && !verifyingCode && !error && resetCode && (
                <p className="text-center text-zinc-500 text-sm mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: "SET_RESET_MODE", val: false });
                      dispatch({ type: "SET_SUBMIT_ERROR", error: "" });
                    }}
                    className="text-rose-400 hover:text-rose-300 transition-colors font-semibold flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" /> Request New Reset Link
                  </button>
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-zinc-600 text-xs mt-5">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070b]" />}>
      <LoginForm />
    </Suspense>
  );
}

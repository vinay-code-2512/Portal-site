"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useScrollLock } from "@/lib/useScrollLock";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Mail, Lock, Eye, EyeOff, Loader2, LogIn, AlertCircle, CheckCircle, Star, User, Phone, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const DISMISS_COUNT_KEY = "auth-modal-dismiss-count";
const MODAL_PAUSED = true; // Set to false to enable modal

function getDismissCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(DISMISS_COUNT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function incrementDismissCount() {
  try {
    localStorage.setItem(DISMISS_COUNT_KEY, String(getDismissCount() + 1));
  } catch {}
}

function validateEmail(v: string): string | null {
  if (!v) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address";
  return null;
}

function validatePassword(v: string): string | null {
  if (!v) return "Password is required";
  return null;
}

function getSignupErrorMessage(code: string): string {
  const map: Record<string, string> = {
    "auth/email-already-in-use": "An account with this email already exists",
    "auth/weak-password": "Password is too weak. Use at least 6 characters",
    "auth/invalid-email": "Invalid email address",
    "auth/operation-not-allowed": "Email/password signup is not enabled",
    "auth/too-many-requests": "Too many attempts. Please try again later",
  };
  return map[code] || "Something went wrong. Please try again";
}

function getLoginErrorMessage(code: string): string {
  const map: Record<string, string> = {
    "auth/invalid-credential": "Invalid email or password",
    "auth/user-not-found": "No account found with this email",
    "auth/wrong-password": "Incorrect password",
    "auth/invalid-email": "Invalid email address",
    "auth/too-many-requests": "Too many attempts. Please try again later",
    "auth/user-disabled": "This account has been disabled",
  };
  return map[code] || "Something went wrong. Please try again";
}

type AuthMode = "signin" | "signup" | "forgot";

export default function AuthModal() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [dismissCount, setDismissCount] = useState(getDismissCount);

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Signup-only fields
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  useScrollLock(visible);

  // Reset dismiss on each page load so user always gets 2 dismissals per session
  useEffect(() => {
    localStorage.removeItem(DISMISS_COUNT_KEY);
    setDismissCount(0);
  }, []);

  useEffect(() => {
    if (MODAL_PAUSED) return;
    if (authLoading) return;
    if (currentUser) return;
    if (visible) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, [authLoading, currentUser, dismissCount]);

  function close() {
    setVisible(false);
    setError("");
    setSuccess("");
    const newCount = dismissCount + 1;
    setDismissCount(newCount);
    incrementDismissCount();
  }

  const canDismiss = dismissCount < 2;

  function switchMode(m: AuthMode) {
    setMode(m);
    setError("");
    setSuccess("");
    setFieldErrors({});
  }

  function validateSignup(): boolean {
    const errs: Record<string, string | null> = {
      name: !fullName.trim() ? "Full name is required" : null,
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setFieldErrors(errs);
    return !Object.values(errs).some(Boolean);
  }

  function validateSignin(): boolean {
    const errs: Record<string, string | null> = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setFieldErrors(errs);
    return !Object.values(errs).some(Boolean);
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!validateSignup()) return;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        fullName: fullName.trim(),
        email,
        phone: contactNumber.replace(/\D/g, ""),
        createdAt: serverTimestamp(),
      });
      setVisible(false);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      setError(getSignupErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignin(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!validateSignin()) return;
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const userRef = doc(db, "users", cred.user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      const userRole = userData?.role as string;

      if (userRole === "employee") {
        router.push("/employee");
      } else if (userRole === "admin") {
        router.push("/admin");
      } else {
        setVisible(false);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      setError(getLoginErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors({ email: emailError });
      return;
    }
    setLoading(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      setError(getLoginErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full min-h-[48px] pl-10 pr-4 py-3 text-sm rounded-xl bg-white/[0.03] border text-white placeholder:text-zinc-600 focus:outline-none transition-all duration-200 ${
      hasError
        ? "border-red-500/50 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20"
        : "border-white/[0.08] focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 focus:shadow-[0_0_16px_rgba(244,63,94,0.08)]"
    }`;

  return (
    <AnimatePresence>
      {visible && !currentUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={canDismiss ? close : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[90vw] max-h-[90vh] overflow-y-auto rounded-3xl border border-white/[0.06] bg-gradient-to-b from-[#0c0c18]/95 to-[#090912]/95 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.4)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header glow */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-rose-400/30 to-transparent" />
            <div className="absolute -top-[1px] left-1/3 right-1/3 h-[2px] bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full blur-[1px]" />

            {canDismiss && (
              <button
                onClick={close}
                className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 text-gray-400 hover:text-white hover:bg-black/60 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="flex flex-col lg:flex-row">
              {/* ── Left Brand Panel ── */}
              <div className="hidden lg:flex lg:w-[42%] relative items-center justify-center py-16 px-10 overflow-hidden rounded-l-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/15 via-amber-800/10 to-transparent" />
                <div className="absolute top-1/3 -left-20 w-72 h-72 bg-amber-500/15 rounded-full blur-[160px]" />
                <div className="absolute bottom-1/4 -right-10 w-56 h-56 bg-yellow-500/10 rounded-full blur-[120px]" />
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
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-900 flex items-center justify-center shadow-xl shadow-rose-400/20 mb-8 ring-1 ring-white/[0.06] relative">
                      <Image
                        src="/RGLogo.png"
                        alt="Robot Genie"
                        fill
                        className="object-cover"
                        priority
                        sizes="48px"
                      />
                    </div>

                    <h2 className="text-3xl md:text-[2.5rem] font-black text-white leading-[1.1] mb-4 tracking-tight">
                      {mode === "signup" ? (
                        <>Unlock Your<br /><span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-yellow-200 bg-clip-text text-transparent">Future Today</span></>
                      ) : (
                        <>Welcome<br /><span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-yellow-200 bg-clip-text text-transparent">Back</span></>
                      )}
                    </h2>

                    <p className="text-zinc-500 text-sm leading-relaxed max-w-sm mb-8">
                      {mode === "signup"
                        ? "Join 5000+ learners mastering industry-relevant skills with expert mentorship and guaranteed placement support."
                        : "Sign in to continue your learning journey with 5000+ learners."}
                    </p>

                    <div className="space-y-4">
                      {[
                        { label: "Expert Mentorship", sub: "Learn from industry professionals" },
                        { label: "Live Projects", sub: "Build real-world portfolio" },
                        { label: "Placement Guarantee", sub: "5000+ successful placements" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-amber-500/20">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-semibold">{item.label}</p>
                            <p className="text-zinc-600 text-xs mt-0.5">{item.sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[...Array(4)].map((_, i) => (
                          <div key={i}
                            className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-yellow-400 border-2 border-[#07070b] flex items-center justify-center text-[9px] font-bold text-white shadow-lg"
                          >
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <p className="text-zinc-600 text-[10px] mt-0.5">Rated 4.9 by our students</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* ── Right Form Panel ── */}
              <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-12 lg:px-10">
                <div className="w-full max-w-lg">
                  {/* Mobile logo */}
                  <div className="lg:hidden flex items-center justify-center gap-2.5 mb-6">
                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center shadow-lg shadow-rose-400/20 ring-1 ring-white/[0.06] relative">
                      <Image
                        src="/RGLogo.png"
                        alt="Robot Genie"
                        fill
                        className="object-cover"
                        sizes="32px"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-white font-semibold text-sm">Robot Genie</span>
                  </div>

                  {/* Tabs / Header */}
                  {mode !== "forgot" ? (
                    <div className="flex mb-6 rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
                      <button
                        onClick={() => switchMode("signup")}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                          mode === "signup"
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-lg shadow-amber-500/20"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Sign Up
                      </button>
                      <button
                        onClick={() => switchMode("signin")}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                          mode === "signin"
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-lg shadow-amber-500/20"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Sign In
                      </button>
                    </div>
                  ) : (
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-black text-white tracking-tight">
                        Reset{" "}
                        <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-yellow-200 bg-clip-text text-transparent">
                          Password
                        </span>
                      </h3>
                      <p className="text-zinc-500 text-xs mt-1.5">Enter your email to receive a password reset link</p>
                    </div>
                  )}

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{success}</span>
                    </motion.div>
                  )}

                  <form onSubmit={mode === "signup" ? handleSignup : mode === "signin" ? handleSignin : handleForgotPassword} noValidate className="space-y-4">
                    {mode === "signup" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="am-fullName" className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input id="am-fullName" type="text" autoComplete="name" value={fullName}
                              onChange={(e) => { setFullName(e.target.value); setFieldErrors((p) => ({ ...p, name: null })); }}
                              className={inputClass(!!fieldErrors.name)}
                              placeholder="John Doe" />
                          </div>
                          {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>}
                        </div>

                        <div>
                          <label htmlFor="am-contact" className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest">Contact</label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input id="am-contact" type="tel" autoComplete="tel" value={contactNumber}
                              onChange={(e) => setContactNumber(e.target.value)}
                              className={inputClass(false)}
                              placeholder="9876543210" maxLength={14} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    <div>
                      <label htmlFor="am-email" className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <input id="am-email" type="email" autoComplete="email" value={email}
                          onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: null })); }}
                          className={inputClass(!!fieldErrors.email)}
                          placeholder="you@example.com" />
                      </div>
                      {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
                    </div>

                    {/* Password */}
                    {mode !== "forgot" && (
                      <div>
                        <label htmlFor="am-password" className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                          <input id="am-password" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password}
                            onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: null })); }}
                            className={`${inputClass(!!fieldErrors.password)} pl-10 pr-10`}
                            placeholder={mode === "signup" ? "Min. 6 characters" : "Enter your password"} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
                        {mode === "signin" && (
                          <div className="mt-2 text-right">
                            <button
                              type="button"
                              onClick={() => switchMode("forgot")}
                              className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium"
                            >
                              Forgot Password?
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <motion.button type="submit" disabled={loading}
                      whileHover={!loading ? { y: -2, scale: 1.01 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}
                      className="relative w-full min-h-[50px] mt-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-bold text-sm shadow-[0_4px_24px_rgba(244,63,94,0.3)] hover:shadow-[0_8px_40px_rgba(244,63,94,0.45)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-300" />
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {mode === "signup" ? "Creating account..." : mode === "signin" ? "Signing in..." : "Sending..."}</>
                      ) : (
                        <>{mode === "signup" ? <><ArrowRight className="w-4 h-4" /> <span>Create Account</span></> : mode === "signin" ? <><LogIn className="w-4 h-4" /> <span>Sign In</span></> : <><Mail className="w-4 h-4" /> <span>Send Reset Link</span></>}</>
                      )}
                    </motion.button>
                  </form>

                  {mode !== "forgot" ? (
                    <>
                      <div className="flex items-center gap-3 mt-5">
                        <span className="h-px flex-1 bg-white/[0.06]" />
                        <span className="text-zinc-600 text-xs font-medium">or</span>
                        <span className="h-px flex-1 bg-white/[0.06]" />
                      </div>

                      <p className="text-center text-zinc-500 text-sm mt-4">
                        {mode === "signup" ? (
                          <>Already have an account? <button onClick={() => switchMode("signin")} className="text-rose-400 hover:text-rose-300 transition-colors font-semibold">Sign in</button></>
                        ) : (
                          <>Don&apos;t have an account? <button onClick={() => switchMode("signup")} className="text-rose-400 hover:text-rose-300 transition-colors font-semibold">Create one</button></>
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-center text-zinc-500 text-sm mt-5">
                      <button
                        type="button"
                        onClick={() => switchMode("signin")}
                        className="text-rose-400 hover:text-rose-300 transition-colors font-semibold flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to Sign In
                      </button>
                    </p>
                  )}

                  <p className="text-center text-zinc-600 text-xs mt-4">
                    By continuing, you agree to our{" "}
                    <span className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 cursor-pointer">Terms</span>{" "}
                    and{" "}
                    <span className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 cursor-pointer">Privacy Policy</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

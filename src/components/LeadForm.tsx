"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useDynamicSeats } from "@/hooks/useDynamicSeats";
import { CalendarCheck, ChevronDown, CheckCircle, AlertCircle, Mail, ShieldCheck, Loader2, MapPin, User, Phone, Calendar, Star, ArrowRight, GraduationCap, Users, Trophy } from "lucide-react";
import {
  hiddenReveal,
  hiddenRevealUp,
  staggerDelay,
  transitionReveal,
  transitionRevealShort,
  transitionTap,
  viewportReveal,
  visibleReveal,
} from "@/lib/motion";
import { sendOtp, verifyOtp } from "@/lib/otpService";

const FORMSPREE_URL = "https://formspree.io/f/meenrpbn";

const courseOptions = [
  { value: "", label: "Select a course" },
  { value: "digital-marketing", label: "Advanced Digital Marketing" },
  { value: "data-science", label: "Data Science & Data Analytics" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "HR" },
  {value: "ai-tools-and-automation", label: "AI Tools & Automation"},
  { value: "marketing-diploma", label: "Digital Marketing Diploma" },
] as const;

function validateIndianMobile(value: string): true | string {
  const d = value.replace(/\D/g, "");
  let mobile: string;
  if (d.length === 10) mobile = d;
  else if (d.length === 12 && d.startsWith("91")) mobile = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) mobile = d.slice(1);
  else return "Enter a 10-digit number, or +91 followed by 10 digits";
  if (!/^[6-9]\d{9}$/.test(mobile)) return "Enter a valid Indian mobile number (starts with 6–9)";
  return true;
}

function validateEmail(v: string): string | null {
  if (!v) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address";
  return null;
}

interface LeadFormProps {
  embedded?: boolean;
}

export default function LeadForm({ embedded }: LeadFormProps) {
  const { seats } = useDynamicSeats();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dob: "",
    phone: "",
    location: "",
    course: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setFieldErrors((p) => ({ ...p, [field]: null }));
  };

  function validate(): boolean {
    const errs: Record<string, string | null> = {
      name: !formData.name.trim() ? "Name is required" : formData.name.trim().length < 2 ? "Enter at least 2 characters" : null,
      email: validateEmail(formData.email),
      dob: !formData.dob ? "Date of birth is required" : null,
      phone: (() => { const r = validateIndianMobile(formData.phone); return r === true ? null : r; })(),
      location: !formData.location.trim() ? "Location is required" : null,
      course: !formData.course ? "Please select a course" : null,
    };
    setFieldErrors(errs);
    return !Object.values(errs).some(Boolean);
  }

  const handleSendOtp = async () => {
    const emailErr = validateEmail(formData.email);
    if (emailErr) { setFieldErrors((p) => ({ ...p, email: emailErr })); return; }
    setFieldErrors((p) => ({ ...p, email: null }));
    setOtpError("");
    setSendingOtp(true);
    try {
      await sendOtp(formData.email);
      setOtpSent(true);
      setOtpVerified(false);
    } catch { setOtpError("Something went wrong."); }
    finally { setSendingOtp(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput.trim() || otpInput.length < 6) { setOtpError("Enter a valid 6-digit OTP"); return; }
    setOtpError("");
    setVerifyingOtp(true);
    try {
      const ok = await verifyOtp(formData.email, otpInput.trim());
      if (!ok) setOtpError("Invalid or expired OTP");
      else { setOtpVerified(true); setOtpError(""); }
    } catch { setOtpError("Something went wrong."); }
    finally { setVerifyingOtp(false); }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("idle");
    setErrorMessage("");
    if (!otpVerified) { setErrorMessage("Please verify your email with OTP first"); return; }
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setSubmitStatus("success");
        localStorage.setItem("leadFormFilled", "true");
        setFormData({ name: "", email: "", dob: "", phone: "", location: "", course: "" });
        setOtpSent(false); setOtpVerified(false); setOtpInput("");
        setTimeout(() => setSubmitStatus("idle"), 5000);
        const msg = `🔔 New Lead%0AName: ${formData.name}%0AEmail: ${formData.email}%0ADOB: ${formData.dob}%0APhone: ${formData.phone}%0ALocation: ${formData.location}%0ACourse: ${formData.course}`;
        window.open(`https://wa.me/919891707129?text=${msg}`, "_blank");
      } else { setSubmitStatus("error"); setErrorMessage("Something went wrong"); }
    } catch { setSubmitStatus("error"); setErrorMessage("Failed to submit. Please try again."); }
    finally { setIsSubmitting(false); }
  };

  const inputClass = (field: string, base = "") =>
    `w-full min-h-[48px] pl-10 pr-4 py-3 text-sm rounded-xl bg-white/[0.03] border text-white placeholder:text-zinc-600 focus:outline-none transition-colors duration-200 ${
      fieldErrors[field]
        ? "border-red-500/50 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20"
        : "border-white/[0.08] focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 focus:shadow-[0_0_16px_rgba(244,63,94,0.08)]"
    } ${base}`;

  const selectClass = (field: string) =>
    `w-full min-h-[48px] pl-10 pr-10 py-3 text-sm rounded-xl bg-white/[0.03] border text-white placeholder:text-zinc-600 focus:outline-none transition-colors duration-200 appearance-none ${
      fieldErrors[field]
        ? "border-red-500/50 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20"
        : "border-white/[0.08] focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/20 focus:shadow-[0_0_16px_rgba(244,63,94,0.08)]"
    }`;

  const inner = (
    <>
    {!embedded && <>
      <div className="pointer-events-none absolute inset-0 max-md:bg-[linear-gradient(180deg,#07070a_0%,#0c0c18_45%,#07070a_100%)] md:bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(251,191,36,0.15),transparent_55%),radial-gradient(ellipse_90%_70%_at_80%_100%,rgba(244,63,94,0.12),transparent_50%),radial-gradient(ellipse_80%_60%_at_10%_90%,rgba(251,191,36,0.08),transparent_45%),linear-gradient(180deg,#07070a_0%,#0c0c18_45%,#07070a_100%)]" />
      <div className="pointer-events-none absolute -left-[20%] top-1/2 h-[min(90vw,520px)] w-[min(90vw,520px)] -translate-y-1/2 rounded-full bg-amber-500/20 blur-[40px] md:blur-[140px] hidden md:block" />
      <div className="pointer-events-none absolute -right-[15%] top-1/3 h-[min(70vw,440px)] w-[min(70vw,440px)] rounded-full bg-rose-500/15 blur-[35px] md:blur-[120px] hidden md:block" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.35)_0%,transparent_18%,transparent_82%,rgba(0,0,0,0.35)_100%)]" />
    </>}

      <div className={embedded ? "" : "relative !pt-2 section-spacing"}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-400/20 to-transparent" />

        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-4 md:mb-5">
            <motion.div initial={hiddenRevealUp} whileInView={visibleReveal} viewport={viewportReveal} transition={transitionReveal}>
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-transparent border border-rose-400/10 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <span className="text-[10px] font-semibold tracking-[0.2em] text-rose-400/60 uppercase">Limited Enrollment</span>
              </div>
              <h2 className="text-4xl md:text-[2.8rem] font-black text-white leading-[1.1] mb-1 tracking-tight">
                Reserve {" "}
                <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-yellow-200 bg-clip-text text-transparent">
                your Seat
                </span>
              </h2>
              <p className="text-zinc-500 text-base leading-relaxed max-w-xl mx-auto">
                 We will call you to confirm your batch and timings.
              </p>
            </motion.div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
            <motion.div initial={hiddenReveal} whileInView={visibleReveal} viewport={viewportReveal}
              transition={{ ...transitionReveal, delay: 0.05 }}
              className="lg:w-[38%] w-full lg:sticky lg:top-32 space-y-8"
            >
              <motion.div
                whileHover={{ scale: 1.02, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
                className="p-8 rounded-2xl bg-gradient-to-br from-amber-600/15 via-amber-800/10 to-transparent border border-rose-400/10 hover:shadow-[0_8px_48px_rgba(244,63,94,0.12),0_0_80px_rgba(251,191,36,0.08)] transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-5">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed italic">
                  &ldquo;Robot Genie transformed my career. The mentorship and live projects helped me land my dream role.&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center text-white font-bold text-xs">AK</div>
                  <div>
                    <p className="text-white text-sm font-semibold">Ananya K.</p>
                    <p className="text-zinc-500 text-xs">Data Analyst at Deloitte</p>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Users, label: "Learners", value: "5000+" },
                  { icon: GraduationCap, label: "Courses", value: "6+" },
                  { icon: Trophy, label: "Placements", value: "100%" },
                ].map((s) => (
                  <motion.div
                    key={s.label}
                    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                    className="text-center p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:shadow-[0_4px_24px_rgba(251,191,36,0.12),0_0_40px_rgba(244,63,94,0.06)] hover:border-rose-400/20 transition-all duration-300"
                  >
                    <s.icon className="w-4 h-4 text-amber-400 mx-auto mb-2" />
                    <p className="text-white text-lg font-bold">{s.value}</p>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-wider mt-0.5">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:shadow-[0_4px_32px_rgba(251,191,36,0.12),0_0_60px_rgba(244,63,94,0.08)] hover:border-rose-400/20 transition-all duration-300"
              >
                <div className="flex -space-x-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 border-2 border-[#07070a] flex items-center justify-center text-[8px] font-bold text-white">
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (<Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />))}
                  </div>
                  <p className="text-zinc-500 text-xs">Trusted by 5000+ learners</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div initial={hiddenReveal} whileInView={visibleReveal} viewport={viewportReveal}
              transition={{ ...transitionReveal, delay: 0.1 }}
              className="lg:w-[62%] w-full"
            >
              <div className="relative rounded-3xl bg-gradient-to-r from-amber-500 to-yellow-400 p-[1px] max-md:shadow-none shadow-[0_0_40px_rgba(245,158,11,0.15)]">
                <motion.form onSubmit={onSubmit}
                  className="relative rounded-3xl bg-gradient-to-b from-[#0c0c18]/95 to-[#090912]/95 p-8 sm:p-10 md:p-12 max-md:shadow-none shadow-[0_0_80px_rgba(0,0,0,0.4)]"
                  noValidate
                >

                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center shadow-lg shadow-rose-400/20 ring-1 ring-white/[0.06] relative">
                      <Image
                        src="/RGLogo.png"
                        alt="Robot Genie"
                        fill
                        className="object-cover"
                        sizes="36px"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-white font-semibold text-base">Robot Genie</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Get
                    <br className="sm:hidden" />{" "}
                    <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-yellow-200 bg-clip-text text-transparent">
                      Started
                    </span>
                  </h3>
                  <p className="text-zinc-500 text-sm mt-2">Fill in your details below to reserve your seat</p>
                </div>

                <div className="space-y-5">
                  {/* Name — full width, prominent */}
                  <div>
                    <label htmlFor="lead-name" className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                      <input id="lead-name" type="text" autoComplete="name" value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className={inputClass("name")}
                        placeholder="Your full name" />
                    </div>
                    {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>}
                  </div>

                  {/* Phone + DOB */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="lead-phone" className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <input id="lead-phone" type="tel" autoComplete="tel" value={formData.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          className={inputClass("phone")}
                          placeholder="98765 43210 or +91 9876543210" />
                      </div>
                      {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
                    </div>
                    <div>
                      <label htmlFor="lead-dob" className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest">Date of Birth</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <input id="lead-dob" type="date" autoComplete="bday" value={formData.dob}
                          onChange={(e) => updateField("dob", e.target.value)}
                          className={inputClass("dob")} />
                      </div>
                      {fieldErrors.dob && <p className="text-red-400 text-xs mt-1">{fieldErrors.dob}</p>}
                    </div>
                  </div>

                  {/* Email + OTP — full width */}
                  <div>
                    <label htmlFor="lead-email" className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                      <input id="lead-email" type="email" autoComplete="email" value={formData.email}
                        onChange={(e) => { updateField("email", e.target.value); setOtpSent(false); setOtpVerified(false); }}
                        className={inputClass("email")}
                        placeholder="your@email.com" disabled={otpVerified} />
                    </div>
                    {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}

                    {!otpVerified && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <motion.button type="button" onClick={handleSendOtp} disabled={sendingOtp || !formData.email}
                          whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {sendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          {sendingOtp ? "Sending..." : "Send OTP"}
                        </motion.button>
                        {otpSent && (
                          <>
                            <input type="text" placeholder="Enter 6-digit OTP" maxLength={6} value={otpInput}
                              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                              className="flex-1 min-w-0 max-w-[140px] px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-rose-400/50 text-xs" />
                            <motion.button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp || otpInput.length < 6}
                              whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {verifyingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              {verifyingOtp ? "Verifying..." : "Verify"}
                            </motion.button>
                          </>
                        )}
                      </div>
                    )}
                    {otpVerified && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex items-center gap-1.5 text-emerald-400 text-xs mt-2">
                        <CheckCircle className="w-3.5 h-3.5" /> Email verified successfully
                      </motion.p>
                    )}
                    {otpError && <p className="text-red-400 text-xs mt-1">{otpError}</p>}
                  </div>

                  {/* Location + Course */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="lead-location" className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <input id="lead-location" type="text" autoComplete="country-name" value={formData.location}
                          onChange={(e) => updateField("location", e.target.value)}
                          className={inputClass("location")}
                          placeholder="New Delhi, India" />
                      </div>
                      {fieldErrors.location && <p className="text-red-400 text-xs mt-1">{fieldErrors.location}</p>}
                    </div>
                    <div>
                      <label htmlFor="lead-course" className="block text-[11px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest">Course</label>
                      <div className="relative">
                        <select id="lead-course" value={formData.course}
                          onChange={(e) => updateField("course", e.target.value)}
                          className={selectClass("course")}
                        >
                          {courseOptions.map((opt) => (
                            <option key={opt.value || "placeholder"} value={opt.value} disabled={!opt.value} className="bg-[#0a0a1a] text-white">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                      </div>
                      {fieldErrors.course && <p className="text-red-400 text-xs mt-1">{fieldErrors.course}</p>}
                    </div>
                  </div>
                </div>

                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }} className="text-center mt-6"
                >
                  <p className="text-xs sm:text-sm font-bold animate-[blink_1.5s_ease-in-out_infinite]">
                    <span className="text-rose-400">⚠️ Only {seats} Seats Remaining</span>
                    <span className="text-zinc-600 mx-2">•</span>
                    <span className="text-amber-400">👉 Fill the form now to secure your admission</span>
                  </p>
                </motion.div>

                <motion.button type="submit" disabled={isSubmitting || submitStatus === "success"}
                  whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="relative w-full min-h-[50px] mt-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-bold text-sm shadow-[0_4px_24px_rgba(244,63,94,0.3)] hover:shadow-[0_8px_40px_rgba(244,63,94,0.45)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-300" />
                  {isSubmitting ? (
                    <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                  ) : (
                    <><CalendarCheck className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" /> Reserve <span className="whitespace-nowrap">Your</span> Seat <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </motion.button>

                {submitStatus === "success" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 p-4 mt-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span className="font-medium">✅ Request submitted! We will contact you shortly.</span>
                  </motion.div>
                )}

                {submitStatus === "error" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 p-4 mt-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{errorMessage}</span>
                  </motion.div>
                )}
              </motion.form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return <div className="w-full">{inner}</div>;
  }

  return (
    <section id="contact" className="relative z-10 w-full border-y border-white/10" style={{ isolation: "isolate" }}>
      {inner}
    </section>
  );
}

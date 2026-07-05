"use client";

import { useState } from "react";
import { Send, CheckCircle, Star, Users, Award, Loader2, ShieldCheck, ChevronDown } from "lucide-react";
import { sendOtp, verifyOtp } from "@/lib/otpService";

const FORMSPREE_URL = "https://formspree.io/f/meenrpbn";

const courseOptions = [
  { value: "", label: "Select a course" },
  { value: "digital-marketing", label: "Advanced Digital Marketing" },
  { value: "data-science", label: "Data Science & Data Analytics" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "HR" },
  { value: "ai-tools-and-automation", label: "AI Tools & Automation" },
  { value: "marketing-diploma", label: "Digital Marketing Diploma" },
] as const;

export default function HeroContentSection() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", course: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");

  const handleSendOtp = async () => {
    if (!formData.email) return;
    setOtpError("");
    setSendingOtp(true);
    try {
      await sendOtp(formData.email);
      setOtpSent(true);
      setOtpVerified(false);
    } catch {
      setOtpError("Something went wrong.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput.trim() || otpInput.length < 6) {
      setOtpError("Enter a valid 6-digit OTP");
      return;
    }
    setOtpError("");
    setVerifyingOtp(true);
    try {
      const ok = await verifyOtp(formData.email, otpInput.trim());
      if (!ok) setOtpError("Invalid or expired OTP");
      else {
        setOtpVerified(true);
        setOtpError("");
      }
    } catch {
      setOtpError("Something went wrong.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) return;
    if (!otpVerified) {
      setOtpError("Please verify your email with OTP first");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setSubmitted(true);
        const courseLabel = courseOptions.find((c) => c.value === formData.course)?.label || formData.course;
        const msg = `🔔 New Lead%0AName: ${formData.name}%0AEmail: ${formData.email}%0APhone: ${formData.phone}%0ACourse: ${courseLabel}`;
        window.open(`https://wa.me/919891707129?text=${msg}`, "_blank");
      }
    } catch {
      // silent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative overflow-hidden pt-6 pb-8 md:pb-12">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--neon-purple)]/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--neon-blue)]/8 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          {/* Left - Content */}
          <div className="lg:col-span-3">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--neon-purple)]/10 border border-[var(--neon-purple)]/20 text-[var(--neon-purple)] text-xs font-medium mb-4">
              <Star className="w-3 h-3" />
              Top 10 Digital Marketing Institutes in Delhi
            </p>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.15] mb-4">
              Robot Genie &mdash; Best Digital Marketing Course in Delhi
            </h1>

            <p className="text-lg text-[var(--neon-blue)] font-semibold mb-5">
              AI-Powered Digital Marketing Course
            </p>

            <p className="text-gray-300 leading-relaxed text-[15px] mb-6">
              Start your digital marketing course in Delhi with Robot Genie &mdash; the best digital marketing training institute in Delhi. We at Robot Genie understand the dreams of our students, and therefore, we are here to help them achieve their goals. The courses we offer are designed with you in mind, and we bring you real-live project training (no dummy projects), expert support, and hands-on training. No matter if you&rsquo;re starting from no experience or polishing your skills, Robot Genie is the place to go so you can get the right coaching. Take a Digital Marketing Course in Delhi with us and change your life.
            </p>

            <div className="flex flex-wrap gap-5 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--neon-purple)]" />
                Live Projects
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--neon-purple)]" />
                Expert Trainers
              </span>
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[var(--neon-purple)]" />
                Placement Support
              </span>
            </div>
          </div>

          {/* Right - Lead Form */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-[var(--neon-purple)]/25 to-[var(--neon-blue)]/20 rounded-2xl blur-sm" />
              <div className="relative bg-[#0a0a0f]/90 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6 md:p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">Enroll Now</h3>
                  <p className="text-gray-400 text-[13px]">Fill the form to get free counselling</p>
                </div>

                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-white font-semibold">Thank You!</p>
                    <p className="text-gray-400 text-[13px] mt-1">We&rsquo;ll get back to you shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="hero-name" className="block text-[13px] text-gray-400 mb-1.5">Full Name</label>
                      <input
                        id="hero-name"
                        name="name"
                        autoComplete="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[14px] placeholder:text-gray-500 focus:outline-none focus:border-[var(--neon-purple)]/50 focus:ring-1 focus:ring-[var(--neon-purple)]/30 transition-all"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="hero-email" className="block text-[13px] text-gray-400 mb-1.5">Email Address</label>
                      <input
                        id="hero-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          setOtpSent(false);
                          setOtpVerified(false);
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[14px] placeholder:text-gray-500 focus:outline-none focus:border-[var(--neon-purple)]/50 focus:ring-1 focus:ring-[var(--neon-purple)]/30 transition-all"
                        placeholder="Enter your email"
                        disabled={otpVerified}
                      />

                      {!otpVerified && (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={sendingOtp || !formData.email}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--neon-purple)]/15 border border-[var(--neon-purple)]/30 text-[var(--neon-purple)] text-xs font-semibold hover:bg-[var(--neon-purple)]/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {sendingOtp ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                            {sendingOtp ? "Sending..." : "Send OTP"}
                          </button>
                          {otpSent && (
                            <>
                              <input
                                id="hero-otp"
                                name="otp"
                                autoComplete="one-time-code"
                                aria-label="OTP"
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                                className="flex-1 min-w-0 max-w-[140px] px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--neon-purple)]/50 text-xs"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={verifyingOtp || otpInput.length < 6}
                                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {verifyingOtp ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                {verifyingOtp ? "Verifying..." : "Verify"}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {otpVerified && (
                        <p className="flex items-center gap-1.5 text-emerald-400 text-xs mt-2">
                          <CheckCircle className="w-3.5 h-3.5" /> Email verified successfully
                        </p>
                      )}
                      {otpError && <p className="text-red-400 text-xs mt-1.5">{otpError}</p>}
                    </div>
                    <div>
                      <label htmlFor="hero-phone" className="block text-[13px] text-gray-400 mb-1.5">Phone Number</label>
                      <input
                        id="hero-phone"
                        name="phone"
                        autoComplete="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[14px] placeholder:text-gray-500 focus:outline-none focus:border-[var(--neon-purple)]/50 focus:ring-1 focus:ring-[var(--neon-purple)]/30 transition-all"
                        placeholder="Enter your phone"
                      />
                    </div>
                    <div>
                      <label htmlFor="hero-course" className="block text-[13px] text-gray-400 mb-1.5">Course</label>
                      <div className="relative">
                        <select
                          id="hero-course"
                          name="course"
                          value={formData.course}
                          onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[14px] focus:outline-none focus:border-[var(--neon-purple)]/50 focus:ring-1 focus:ring-[var(--neon-purple)]/30 transition-all appearance-none"
                        >
                          {courseOptions.map((opt) => (
                            <option key={opt.value || "placeholder"} value={opt.value} disabled={!opt.value} className="bg-[#0a0a1a] text-white">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(181,0,255,0.3)] hover:shadow-[0_8px_30px_rgba(181,0,255,0.4)] transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                      ) : (
                        <><Send className="w-4 h-4" /> Send Message</>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

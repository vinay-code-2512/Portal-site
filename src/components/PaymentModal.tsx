"use client";
import { useState } from "react";
import { initiatePayment } from "@/lib/razorpay";
import { validateCoupon, calcDiscount } from "@/lib/coupons";
import type { Coupon } from "@/lib/coupons";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Loader, Ticket, CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createEnrollment } from "@/lib/enrollments";

const COURSE_PRICE = 30000;
const GST_RATE = 0.18;

function calcBreakdown(discount: number) {
  const subtotal = COURSE_PRICE - discount;
  const gst = Math.round(subtotal * GST_RATE);
  const total = subtotal + gst;
  return { subtotal, gst, total };
}

interface PaymentModalProps {
  courseId: string;
  courseName: string;
  isOpen: boolean;
  onClose: () => void;
}

type Step = "form" | "razorpay" | "success" | "error";

export default function PaymentModal({ courseId, courseName, isOpen, onClose }: PaymentModalProps) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const discount = appliedCoupon ? calcDiscount(appliedCoupon, COURSE_PRICE) : 0;
  const { subtotal, gst, total } = calcBreakdown(discount);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    const c = await validateCoupon(couponInput.trim());
    setCouponLoading(false);
    if (c) {
      setAppliedCoupon(c);
      setCouponMsg({ ok: true, text: `${c.type === "percentage" ? `${c.value}%` : `₹${c.value}`} off applied!` });
    } else {
      setAppliedCoupon(null);
      setCouponMsg({ ok: false, text: "Invalid coupon code" });
    }
  };

  const handleProceed = async () => {
    if (!currentUser) {
      setErrorMsg("Please log in to continue.");
      setStep("error");
      return;
    }

    setStep("razorpay");
    const result = await initiatePayment(courseId, courseName, currentUser.displayName || "Student", total, discount);

    if (result.success) {
      try {
        await createEnrollment({
          userId: currentUser.uid,
          userName: currentUser.displayName || currentUser.email || "Student",
          userEmail: currentUser.email || "",
          courseId,
          courseName,
          amount: total,
        });
      } catch (e) {
        console.error("Failed to save enrollment:", e);
      }
      setStep("success");
    } else {
      setErrorMsg(result.error || "Payment failed. Please try again.");
      setStep("error");
    }
  };

  const handleClose = () => {
    setStep("form");
    setCouponInput("");
    setAppliedCoupon(null);
    setCouponMsg(null);
    setErrorMsg("");
    onClose();
  };

  const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0a0a1a] p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {step === "success" ? (
              <div className="flex flex-col items-center text-center py-4">
                <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-gray-400">
                  Payment of <strong>{formatPrice(total)}</strong> for <strong>{courseName}</strong> was successful!
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  We&apos;ll contact you shortly.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-6 btn-primary inline-flex items-center justify-center px-8 py-3"
                >
                  Done
                </button>
              </div>
            ) : step === "error" ? (
              <div className="flex flex-col items-center text-center py-4">
                <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Payment Failed</h3>
                <p className="text-red-400 text-sm mb-6">{errorMsg}</p>
                <button
                  onClick={() => setStep("form")}
                  className="btn-primary inline-flex items-center justify-center px-8 py-3"
                >
                  Try Again
                </button>
              </div>
            ) : step === "razorpay" ? (
              <div className="flex flex-col items-center text-center py-8">
                <Loader className="w-10 h-10 text-[var(--neon-blue)] animate-spin mb-4" />
                <p className="text-white">Opening payment gateway...</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-white mb-1">Order Summary</h3>
                <h2 className="heading-md text-white mb-6">
                  <span className="gradient-text">{courseName}</span>
                </h2>

                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-1.5">
                    <Ticket className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Coupon Code
                    <span className="text-gray-600 ml-1">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--neon-blue)]/50 uppercase"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponInput.trim() || couponLoading}
                      className="px-4 py-3 rounded-xl bg-[var(--neon-blue)]/10 border border-[var(--neon-blue)]/30 text-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponMsg && (
                    <p className={`flex items-center gap-1 text-sm mt-1.5 ${couponMsg.ok ? "text-green-400" : "text-red-400"}`}>
                      {couponMsg.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {couponMsg.text}
                    </p>
                  )}
                  {appliedCoupon && (
                    <button
                      onClick={() => { setAppliedCoupon(null); setCouponMsg(null); }}
                      className="text-xs text-gray-500 hover:text-gray-300 mt-1"
                    >
                      Remove coupon
                    </button>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 md:p-5 space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Original Price</span>
                    <span className="text-white">{formatPrice(COURSE_PRICE)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">Discount (10%)</span>
                      <span className="text-green-400">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">GST @ 18%</span>
                    <span className="text-white">{formatPrice(gst)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-lg text-[var(--neon-blue)]">{formatPrice(total)}</span>
                  </div>
                </div>

                <motion.button
                  onClick={handleProceed}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_8px_32px_rgba(34,197,94,0.45)] transition-all duration-200"
                >
                  <CreditCard className="w-5 h-5" />
                  Pay {formatPrice(total)}
                </motion.button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

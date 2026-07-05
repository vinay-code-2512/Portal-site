"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface CourseData {
  id: string;
  name: string;
  image: string;
  duration: string;
  language: string;
  highlights: string[];
  descriptions: string[];
  price: number;
  originalPrice: number;
}

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuyNow: () => void;
  course: CourseData;
}

export default function CourseDetailModal({ isOpen, onClose, onBuyNow, course }: CourseDetailModalProps) {
  const { currentUser, loading } = useAuth();

  const handleBuyNow = () => {
    if (currentUser) {
      onBuyNow();
    } else {
      sessionStorage.setItem("pendingPayment", "true");
      window.location.href = "/login?redirect=" + encodeURIComponent("/courses/" + course.id);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (currentUser && sessionStorage.getItem("pendingPayment")) {
        sessionStorage.removeItem("pendingPayment");
        onBuyNow();
      }
    }
  }, [loading, currentUser, onBuyNow]);

  const discountPercent = Math.round((1 - course.price / course.originalPrice) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[68rem] max-h-[96vh] flex flex-col rounded-2xl border border-white/10 bg-[#0a0a1a]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 text-gray-400 hover:text-white hover:bg-black/60 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative w-full h-48 md:h-56 shrink-0 overflow-hidden rounded-t-2xl">
              <Image
                src={course.image}
                alt={course.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <h2 className="heading-lg text-white mb-6">
                <span className="gradient-text">{course.name}</span>
              </h2>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-white font-semibold text-sm">{course.duration}</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-white font-semibold text-sm">{course.language}</span>
                </div>
              </div>

              <h3 className="text-white font-semibold text-base mb-3">Course Highlights:</h3>
              <ul className="space-y-2 mb-6">
                {course.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-gray-400 text-[14px]">
                    <CheckCircle className="w-4 h-4 text-[var(--neon-blue)] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h3 className="text-white font-semibold text-base mb-3">Description:</h3>
              {course.descriptions.map((text, i) => (
                <p key={i} className="text-gray-400 text-[14px] leading-relaxed mb-4">
                  {text}
                </p>
              ))}
            </div>

            <div className="shrink-0 sticky bottom-0 p-6 md:p-8 border-t border-white/10 bg-[#0a0a1a] rounded-b-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 md:p-6 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center flex-wrap gap-3">
                  <span className="text-2xl font-bold text-white">₹{course.price.toLocaleString("en-IN")}</span>
                  <span className="text-lg text-gray-500 line-through">₹{course.originalPrice.toLocaleString("en-IN")}</span>
                  <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)] text-white text-xs font-bold">{discountPercent}% OFF</span>
                </div>
                <motion.button
                  onClick={handleBuyNow}
                  disabled={loading}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Please wait..." : "Buy Now"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

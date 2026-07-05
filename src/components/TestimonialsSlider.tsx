"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
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

const awardImages = [
  { src: "/new1.webp", title: "Excellence Award", alt: "Excellence Award Certificate 1" },
  { src: "/new2.webp", title: "Excellence Award", alt: "Excellence Award Certificate 2" },
  { src: "/new3.webp", title: "Excellence Award", alt: "Excellence Award Certificate 3" },
];

const VISIBLE_COUNT = 3;
const AUTOPLAY_INTERVAL = 4000;

const springConfig = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export default function TestimonialsSlider() {
  const [centerIdx, setCenterIdx] = useState(0);
  const [direction, setDirection] = useState(0);
  const directionRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const check = () => setVisibleCount(window.innerWidth < 640 ? 1 : 3);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const resetAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        directionRef.current = 1;
        setDirection(1);
        setCenterIdx((i) => (i + 1) % awardImages.length);
      }, AUTOPLAY_INTERVAL);
    }
  }, [isPaused]);

  const updateCenter = useCallback(
    (newIdx: number, dir: number) => {
      directionRef.current = dir;
      setDirection(dir);
      setCenterIdx(newIdx);
      resetAutoplay();
    },
    [resetAutoplay]
  );

  const navigate = useCallback(
    (dir: number) => {
      directionRef.current = dir;
      setDirection(dir);
      setCenterIdx((i) => (i + dir + awardImages.length) % awardImages.length);
      resetAutoplay();
    },
    [resetAutoplay]
  );

  const goTo = useCallback(
    (idx: number) => {
      if (idx === centerIdx) return;
      const dir = idx > centerIdx ? 1 : -1;
      updateCenter(idx, dir);
    },
    [centerIdx, updateCenter]
  );

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      directionRef.current = 1;
      setDirection(1);
      setCenterIdx((i) => (i + 1) % awardImages.length);
    }, AUTOPLAY_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  const getVisible = () => {
    const len = awardImages.length;
    const half = Math.floor(visibleCount / 2);
    return Array.from({ length: visibleCount }, (_, offset) => {
      const idx = (centerIdx + offset - half + len) % len;
      return { item: awardImages[idx], position: offset, idx };
    });
  };

  const visible = getVisible();

  return (
    <section
      id="testimonials"
      className="relative section-spacing"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 bg-[#0a0b1a] -z-10" />
      <div className="absolute top-[20%] left-[8%] w-[400px] h-[400px] bg-blue-600/[0.05] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[8%] w-[500px] h-[500px] bg-purple-600/[0.05] rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-[50%] right-[20%] w-[300px] h-[300px] bg-cyan-600/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="teacher-glow-center w-[900px] h-[700px]" />
      <div className="teacher-dot-grid" />
      <div className="teacher-scan-line" />
      <div className="teacher-border-line teacher-border-line-top" />
      <div className="teacher-border-line teacher-border-line-bottom" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`particle-${i}`}
          className={`teacher-particle ${i % 2 === 0 ? "teacher-particle-blue" : "teacher-particle-purple"}`}
          style={{
            left: `${5 + i * 15}%`,
            top: `${85 + (i % 3) * 8}%`,
            width: `${2 + (i % 2)}px`,
            height: `${2 + (i % 2)}px`,
            animationDelay: `${i * 3}s`,
            animationDuration: `${20 + i * 4}s`,
          }}
        />
      ))}
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={`pulse-${i}`}
          className="teacher-pulse-ring"
          style={{
            top: `${25 + i * 30}%`,
            left: `${15 + i * 35}%`,
            width: `${120 + i * 80}px`,
            height: `${120 + i * 80}px`,
            animationDelay: `${i * 3}s`,
          }}
        />
      ))}

      <div className="relative w-full px-4 sm:px-6 md:px-8 text-center">
        <motion.div
          initial={hiddenReveal}
          whileInView={visibleReveal}
          viewport={viewportReveal}
          transition={{ ...transitionRevealShort, delay: staggerDelay(0, 0.06) }}
          className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl mb-8 shadow-[0_0_40px_rgba(59,130,246,0.06)] hover:border-white/[0.12] transition-colors duration-500"
        >
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-blue-400/20 blur-sm animate-pulse" />
            <div className="relative w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,1)]" />
          </div>
          <span className="text-[11px] font-semibold tracking-[0.25em] text-blue-300/80 uppercase">
            Success Stories
          </span>
        </motion.div>

        <motion.h2
          initial={hiddenRevealUp}
          whileInView={visibleReveal}
          viewport={viewportReveal}
          transition={transitionReveal}
          className="heading-lg text-white mb-4"
        >
          Our <span className="gradient-text">Awards & Recognition</span>
        </motion.h2>

        <motion.p
          initial={hiddenReveal}
          whileInView={visibleReveal}
          viewport={viewportReveal}
          transition={{ ...transitionRevealShort, delay: staggerDelay(1, 0.06) }}
          className="text-body text-gray-300 max-w-2xl mx-auto"
        >
          Celebrating our commitment to excellence through prestigious awards and industry recognition
        </motion.p>

        <div
          className="relative flex items-center justify-center gap-4 md:gap-8 perspective-1000 mt-12"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchMove={(e) => { touchEndX.current = e.touches[0].clientX; }}
          onTouchEnd={() => {
            const diff = touchStartX.current - touchEndX.current;
            if (Math.abs(diff) > 50) {
              navigate(diff > 0 ? 1 : -1);
            }
          }}
        >
          <motion.button
            type="button"
            onClick={() => navigate(-1)}
            whileHover={{
              scale: 1.15,
              boxShadow: "0 0 40px rgba(0,240,255,0.4), 0 0 80px rgba(0,240,255,0.2)",
            }}
            whileTap={{ scale: 0.9 }}
            transition={transitionTap}
            className="group relative z-40 flex h-9 w-9 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-full border border-[var(--neon-blue)]/20 bg-[#0a0b1a]/95 text-gray-400 backdrop-blur-xl transition-all duration-500 hover:border-[var(--neon-blue)]/60 hover:text-[var(--neon-blue)] hover:bg-[#0a0b1a]"
            aria-label="Previous award"
          >
            <div className="absolute -inset-[2px] rounded-full bg-gradient-to-r from-[var(--neon-blue)]/0 via-[var(--neon-blue)]/10 to-[var(--neon-blue)]/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="absolute -inset-2 rounded-full bg-[var(--neon-blue)]/0 blur-xl transition-all duration-500 group-hover:bg-[var(--neon-blue)]/15" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--neon-blue)]/[0.03] to-[var(--neon-purple)]/[0.03] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <ChevronLeft className="relative h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </motion.button>

          <div className="relative h-[440px] sm:h-[480px] md:h-[520px] flex items-center justify-center" style={{ width: visibleCount === 1 ? "calc(100% - 100px)" : "calc(100% - 140px)" }}>
            {visible.map(({ item, position, idx }) => {
              const centerPos = Math.floor(visibleCount / 2);
              const isCenter = position === centerPos;
              const distance = Math.abs(position - centerPos);
              const isAdjacent = distance === 1;

              return (
                <motion.div
                  key={`${centerIdx}-${position}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    scale: isCenter ? 1 : isAdjacent ? 0.92 : 0.85,
                    opacity: isCenter ? 1 : isAdjacent ? 0.6 : 0.4,
                    zIndex: isCenter ? 30 : isAdjacent ? 20 : 10,
                    transition: springConfig,
                  }}
                  className={`relative rounded-3xl overflow-hidden border backdrop-blur-xl will-change-transform cursor-pointer
                    ${isCenter
                      ? "border-[var(--neon-blue)]/30 shadow-[0_0_80px_rgba(0,240,255,0.2),0_0_120px_rgba(181,0,255,0.1),0_8px_32px_rgba(0,0,0,0.4)]"
                      : isAdjacent
                      ? "border-white/[0.08] shadow-[0_0_40px_rgba(0,0,0,0.3)]"
                      : "border-white/[0.04] shadow-[0_0_20px_rgba(0,0,0,0.2)]"
                    }`}
                  style={{
                    width: visibleCount === 1 ? "min(340px, 82vw)" : isCenter ? "340px" : isAdjacent ? "280px" : "240px",
                    background: isCenter
                      ? "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                    transformStyle: "preserve-3d",
                  }}
                  onClick={() => goTo(idx)}
                >
                  {isCenter && (
                    <motion.div
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--neon-blue)] to-transparent origin-center"
                    />
                  )}
                  {isCenter && (
                    <>
                      <div className="absolute -top-px -left-px w-20 h-20 bg-gradient-to-br from-[var(--neon-blue)]/20 to-transparent rounded-tl-3xl pointer-events-none" />
                      <div className="absolute -top-px -right-px w-20 h-20 bg-gradient-to-bl from-[var(--neon-purple)]/20 to-transparent rounded-tr-3xl pointer-events-none" />
                      <div className="absolute -bottom-px -left-px w-20 h-20 bg-gradient-to-tl from-[var(--neon-blue)]/10 to-transparent rounded-bl-3xl pointer-events-none" />
                      <div className="absolute -bottom-px -right-px w-20 h-20 bg-gradient-to-tr from-[var(--neon-purple)]/10 to-transparent rounded-br-3xl pointer-events-none" />
                    </>
                  )}

                  <div className="p-4 md:p-5 flex flex-col items-center justify-center h-full">
                    <div className={`relative w-full ${isCenter ? "max-w-[280px]" : "max-w-[220px]"}`}>
                      {isCenter && (
                        <>
                          <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                            className="absolute -inset-4 rounded-2xl bg-gradient-to-tr from-[var(--neon-blue)]/20 to-[var(--neon-purple)]/20 blur-2xl"
                          />
                          <div className="absolute -inset-3 rounded-2xl bg-gradient-to-tr from-[var(--neon-blue)]/30 to-[var(--neon-purple)]/30 blur-xl animate-pulse" />
                        </>
                      )}
                      <div
                        className={`relative overflow-hidden rounded-2xl border-2 ${
                          isCenter
                            ? "border-[var(--neon-blue)]/40 shadow-[0_0_30px_rgba(0,240,255,0.3)]"
                            : isAdjacent
                            ? "border-white/10"
                            : "border-white/[0.05]"
                        }`}
                      >
                        <Image
                          src={item.src}
                          alt={item.alt}
                          width={400}
                          height={500}
                          className="w-full h-auto object-cover aspect-[4/5]"
                          loading="lazy"
                          decoding="async"
                        />
                        {!isCenter && (
                          <div className="absolute inset-0 bg-black/20 rounded-2xl" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.button
            type="button"
            onClick={() => navigate(1)}
            whileHover={{
              scale: 1.15,
              boxShadow: "0 0 40px rgba(0,240,255,0.4), 0 0 80px rgba(0,240,255,0.2)",
            }}
            whileTap={{ scale: 0.9 }}
            transition={transitionTap}
            className="group relative z-40 flex h-9 w-9 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-full border border-[var(--neon-blue)]/20 bg-[#0a0b1a]/95 text-gray-400 backdrop-blur-xl transition-all duration-500 hover:border-[var(--neon-blue)]/60 hover:text-[var(--neon-blue)] hover:bg-[#0a0b1a]"
            aria-label="Next award"
          >
            <div className="absolute -inset-[2px] rounded-full bg-gradient-to-r from-[var(--neon-blue)]/0 via-[var(--neon-blue)]/10 to-[var(--neon-blue)]/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="absolute -inset-2 rounded-full bg-[var(--neon-blue)]/0 blur-xl transition-all duration-500 group-hover:bg-[var(--neon-blue)]/15" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--neon-blue)]/[0.03] to-[var(--neon-purple)]/[0.03] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <ChevronRight className="relative h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </motion.button>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3">
          {awardImages.map((item, i) => (
            <button
              key={item.src}
              type="button"
              onClick={() => goTo(i)}
              className={`relative h-2.5 overflow-hidden rounded-full transition-all duration-700 ${
                i === centerIdx ? "w-12" : "w-2.5 hover:w-3"
              }`}
              aria-label={`Show ${item.title}`}
            >
              <span
                className={`absolute inset-0 rounded-full transition-colors duration-500 ${
                  i === centerIdx
                    ? "bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)] shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                    : "bg-white/15 hover:bg-white/30"
                }`}
              />
              {i === centerIdx && !isPaused && (
                <motion.span
                  key={`progress-${centerIdx}`}
                  className="absolute inset-0 rounded-full bg-white/20"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: AUTOPLAY_INTERVAL / 1000,
                    ease: "linear",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2.5">
          <div
            className={`relative h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
              isPaused ? "bg-gray-600" : "bg-[var(--neon-blue)]"
            }`}
          >
            {!isPaused && (
              <div className="absolute inset-0 rounded-full bg-[var(--neon-blue)] animate-ping opacity-75" />
            )}
          </div>
          <span className="text-[11px] text-gray-600 font-medium">
            {isPaused ? "Paused" : "Auto-playing"}
          </span>
        </div>
      </div>
    </section>
  );
}

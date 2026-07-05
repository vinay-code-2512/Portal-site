"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export interface CarouselItem {
  id: string | number;
  content: React.ReactNode;
}

interface PremiumCarouselProps {
  items: CarouselItem[];
  title?: React.ReactNode;
  subtitle?: string;
  badge?: string;
  autoplayInterval?: number;
  visibleCards?: number;
  className?: string;
}

const SLIDE_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

export default function PremiumCarousel({
  items,
  title,
  subtitle,
  badge,
  autoplayInterval = 4000,
  visibleCards = 3,
  className = "",
}: PremiumCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = items.length;

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  const resetAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPaused) {
      intervalRef.current = setInterval(next, autoplayInterval);
    }
  }, [isPaused, next, autoplayInterval]);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(next, autoplayInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, next, autoplayInterval]);

  const getVisibleItems = () => {
    const result = [];
    const half = Math.floor(visibleCards / 2);
    for (let i = -half; i <= half; i++) {
      const idx = (current + i + total) % total;
      result.push({ item: items[idx], offset: i, index: idx });
    }
    return result;
  };

  const visibleItems = getVisibleItems();

  return (
    <section
      className={`relative section-spacing ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[#0a0b1a] -z-10" />
      <div className="absolute top-[30%] left-[5%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[5%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[170px] pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 md:px-8">
        {/* Header */}
        {(badge || title || subtitle) && (
          <div className="text-center mb-12 md:mb-16">
            {badge && (
              <motion.div
                initial={hiddenReveal}
                whileInView={visibleReveal}
                viewport={viewportReveal}
                transition={{ ...transitionRevealShort, delay: staggerDelay(0, 0.06) }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md mb-6 shadow-[0_0_30px_rgba(59,130,246,0.08)]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" />
                <span className="text-xs font-medium tracking-[0.2em] text-blue-300/90 uppercase">
                  {badge}
                </span>
              </motion.div>
            )}

            {title && (
              <motion.h2
                initial={hiddenRevealUp}
                whileInView={visibleReveal}
                viewport={viewportReveal}
                transition={transitionReveal}
                className="heading-lg text-white mb-4 leading-tight"
              >
                {title}
              </motion.h2>
            )}

            {subtitle && (
              <motion.p
                initial={hiddenReveal}
                whileInView={visibleReveal}
                viewport={viewportReveal}
                transition={{ ...transitionRevealShort, delay: staggerDelay(1, 0.06) }}
                className="text-body text-gray-300/90 max-w-3xl mx-auto leading-relaxed"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        )}

        {/* Carousel container */}
        <div className="relative flex items-center justify-center gap-4 md:gap-6">
          {/* Premium glowing left arrow */}
          <motion.button
            type="button"
            onClick={prev}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.92 }}
            transition={transitionTap}
            className="group relative z-30 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--neon-blue)]/30 bg-[#0a0b1a]/90 text-gray-400 backdrop-blur-md transition-all duration-300 hover:border-[var(--neon-blue)]/80 hover:text-[var(--neon-blue)] hover:shadow-[0_0_30px_rgba(0,240,255,0.3),0_0_60px_rgba(0,240,255,0.15)]"
            aria-label="Previous"
          >
            <div className="absolute -inset-1 rounded-full bg-[var(--neon-blue)]/0 blur-md transition-all duration-500 group-hover:bg-[var(--neon-blue)]/20 group-hover:blur-lg" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--neon-blue)]/0 via-[var(--neon-blue)]/10 to-[var(--neon-blue)]/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute -inset-[2px] rounded-full bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-purple)]/20 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100" />
            <ChevronLeft className="relative h-5 w-5" />
          </motion.button>

          {/* Cards viewport - overflow hidden with peek */}
          <div className="relative overflow-hidden" style={{ width: "calc(100% - 120px)" }}>
            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={current}
                className="flex items-center justify-center gap-4 md:gap-6"
                initial={{
                  x: direction > 0 ? "100%" : "-100%",
                  opacity: 0.5,
                }}
                animate={{
                  x: "0%",
                  opacity: 1,
                  transition: {
                    duration: 0.5,
                    ease: SLIDE_EASE,
                  },
                }}
                exit={{
                  x: direction > 0 ? "-100%" : "100%",
                  opacity: 0.5,
                  transition: {
                    duration: 0.4,
                    ease: SLIDE_EASE,
                  },
                }}
              >
                {visibleItems.map(({ item, offset }) => {
                  const isCenter = offset === 0;
                  const distance = Math.abs(offset);

                  return (
                    <motion.div
                      key={item.id}
                      animate={{
                        scale: isCenter ? 1 : 1 - distance * 0.08,
                        opacity: isCenter ? 1 : 0.5 - distance * 0.15,
                        filter: isCenter ? "blur(0px)" : `blur(${distance * 1}px)`,
                        zIndex: isCenter ? 10 : 10 - distance,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        mass: 0.8,
                      }}
                      className={`
                        relative rounded-3xl overflow-hidden border backdrop-blur-md will-change-transform
                        ${isCenter
                          ? "border-[var(--neon-blue)]/40 shadow-[0_0_60px_rgba(0,240,255,0.25),0_0_100px_rgba(181,0,255,0.15)]"
                          : "border-white/6 shadow-[0_0_30px_rgba(0,0,0,0.3)]"
                        }
                      `}
                      style={{
                        width: isCenter ? "340px" : "280px",
                        flexShrink: 0,
                        background: isCenter
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(255,255,255,0.02)",
                      }}
                    >
                      {/* Glow accent for center card */}
                      {isCenter && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--neon-blue)] to-transparent opacity-80 origin-center"
                        />
                      )}

                      {/* Subtle corner glow for center */}
                      {isCenter && (
                        <div className="absolute -top-px -left-px w-16 h-16 bg-gradient-to-br from-[var(--neon-blue)]/20 to-transparent rounded-tl-3xl pointer-events-none" />
                      )}
                      {isCenter && (
                        <div className="absolute -top-px -right-px w-16 h-16 bg-gradient-to-bl from-[var(--neon-purple)]/20 to-transparent rounded-tr-3xl pointer-events-none" />
                      )}

                      {item.content}
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Premium glowing right arrow */}
          <motion.button
            type="button"
            onClick={next}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.92 }}
            transition={transitionTap}
            className="group relative z-30 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--neon-blue)]/30 bg-[#0a0b1a]/90 text-gray-400 backdrop-blur-md transition-all duration-300 hover:border-[var(--neon-blue)]/80 hover:text-[var(--neon-blue)] hover:shadow-[0_0_30px_rgba(0,240,255,0.3),0_0_60px_rgba(0,240,255,0.15)]"
            aria-label="Next"
          >
            <div className="absolute -inset-1 rounded-full bg-[var(--neon-blue)]/0 blur-md transition-all duration-500 group-hover:bg-[var(--neon-blue)]/20 group-hover:blur-lg" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--neon-blue)]/0 via-[var(--neon-blue)]/10 to-[var(--neon-blue)]/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute -inset-[2px] rounded-full bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-purple)]/20 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100" />
            <ChevronRight className="relative h-5 w-5" />
          </motion.button>
        </div>

        {/* Premium pagination dots with progress */}
        <div className="mt-8 flex items-center justify-center gap-3">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(i)}
              className={`relative h-2 overflow-hidden rounded-full transition-all duration-500 ${
                i === current ? "w-10" : "w-2 hover:w-3"
              }`}
              aria-label={`Show item ${i + 1}`}
            >
              <span
                className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                  i === current
                    ? "bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)]"
                    : "bg-white/20 hover:bg-white/40"
                }`}
              />
              {/* Progress bar for active dot */}
              {i === current && !isPaused && (
                <motion.span
                  key={`progress-${current}`}
                  className="absolute inset-0 rounded-full bg-white/30"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: autoplayInterval / 1000,
                    ease: "linear",
                  }}
                />
              )}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}

"use client";

import { memo, useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface ProgramCardProps {
  icon: LucideIcon;
  title: string;
  color: string;
  items: string[];
  index: number;
}

interface TiltTransform {
  rotateX: number;
  rotateY: number;
}

function ProgramCardInner({ icon: Icon, title, color, items, index }: ProgramCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<TiltTransform>({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setTilt({
      rotateX: ((y - centerY) / centerY) * -15,
      rotateY: ((x - centerX) / centerX) * 15,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="relative h-full perspective-1000"
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        className={`
          relative h-full rounded-2xl p-6 md:p-8 flex flex-col
          overflow-hidden
          transition-all duration-300 ease-out
          ${isHovered
            ? "border-[var(--neon-blue)]/50 shadow-[0_12px_48px_rgba(0,240,255,0.15),0_0_60px_rgba(181,0,255,0.08),0_24px_64px_rgba(0,0,0,0.4)]"
            : ""
          }
        `}
        style={{
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) ${isHovered ? "translateZ(30px)" : ""}`,
          transition: isHovered ? "transform 0.08s ease-out, box-shadow 0.3s ease-out, border-color 0.3s ease-out" : "transform 0.5s ease-out",
        }}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/[0.06]" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent rounded-2xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--neon-blue)]/[0.03] via-transparent to-transparent rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none" style={{ opacity: isHovered ? 1 : 0 }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full opacity-50" />

        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center gap-4 mb-5" style={{ transform: "translateZ(40px)" }}>
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg transition-all duration-300`}
              style={{
                boxShadow: isHovered ? "0 0 25px rgba(0,240,255,0.15)" : undefined,
              }}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3
              className="text-lg font-bold transition-all duration-300"
              style={{
                background: isHovered ? "linear-gradient(135deg, var(--neon-blue), var(--neon-purple))" : "none",
                WebkitBackgroundClip: isHovered ? "text" : "unset",
                WebkitTextFillColor: isHovered ? "transparent" : "unset",
                backgroundClip: isHovered ? "text" : "unset",
              }}
            >
              {title}
            </h3>
          </div>

          <div className="space-y-2.5 flex-grow" style={{ transform: "translateZ(30px)" }}>
            {items.map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon-blue)]/60 shrink-0 shadow-[0_0_6px_rgba(0,240,255,0.3)]" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isHovered && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.1) 0%, transparent 70%)",
            transform: `translateX(${tilt.rotateY * 3}px) translateY(${tilt.rotateX * -3}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </motion.div>
  );
}

export default memo(ProgramCardInner);

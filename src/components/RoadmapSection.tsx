"use client";

import { useRef, useCallback, useEffect } from "react";
import Image from "next/image";

export default function RoadmapSection() {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  // Floating animation
  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      @keyframes roadmapFloat {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Mobile devices par effect disable
      if (!window.matchMedia("(hover: hover)").matches) return;

      if (!cardRef.current || !glowRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const maxRotate = 20;
      const maxTranslate = 18;

      const rotateX = ((y - centerY) / centerY) * -maxRotate;
      const rotateY = ((x - centerX) / centerX) * maxRotate;

      const translateX = ((x - centerX) / centerX) * maxTranslate;
      const translateY = ((y - centerY) / centerY) * maxTranslate;

      cardRef.current.style.transform = `
        perspective(1400px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateX(${translateX}px)
        translateY(${translateY}px)
        scale3d(1.05, 1.05, 1.05)
      `;

      cardRef.current.style.transition = "transform 0.04s linear";

      glowRef.current.style.background = `
        radial-gradient(
          circle at ${x}px ${y}px,
          rgba(0, 240, 255, 0.25),
          rgba(168, 85, 247, 0.15) 20%,
          transparent 45%
        )
      `;
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current || !glowRef.current) return;

    cardRef.current.style.transform = `
      perspective(1400px)
      rotateX(0deg)
      rotateY(0deg)
      translateX(0px)
      translateY(0px)
      scale3d(1, 1, 1)
    `;

    cardRef.current.style.transition = "transform 0.6s ease-out";

    glowRef.current.style.background = "transparent";
  }, []);

  return (
    <section className="relative pt-6 pb-8 md:pb-12 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[#0a0b1a]" />

      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,900px)] h-[500px] rounded-full bg-[var(--neon-purple)]/10 blur-[150px] pointer-events-none -z-10" />

      <div className="w-full px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div
            className="group relative rounded-3xl p-[2px] bg-gradient-to-br from-cyan-400/40 via-transparent to-purple-500/40 shadow-[0_0_80px_rgba(0,240,255,0.12)] transition-all duration-500 hover:shadow-[0_0_100px_rgba(0,240,255,0.25)] max-w-3xl mx-auto"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              animation: "roadmapFloat 6s ease-in-out infinite",
            }}
          >
            {/* Animated Border Glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-400/20 via-transparent to-purple-500/20 blur-xl opacity-70 pointer-events-none" />

            <div
              ref={cardRef}
              className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#08081a] will-change-transform"
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              {/* Cursor Glow */}
              <div
                ref={glowRef}
                className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-200"
              />

              {/* Glass Reflection */}
              <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-br from-white/10 via-transparent to-transparent" />

              <Image
                src="/roadmap.png"
                alt="Learning Roadmap"
                width={1536}
                height={1024}
                draggable={false}
                className="w-full max-h-[650px] select-none transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
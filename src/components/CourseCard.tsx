"use client";

import { memo, useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Briefcase, ArrowRight } from "lucide-react";

interface CourseCardProps {
  title: string;
  description: string;
  duration: string;
  career: string;
  href?: string;
}

interface TiltTransform {
  rotateX: number;
  rotateY: number;
}

function CourseCardInner({ title, description, duration, career, href }: CourseCardProps) {
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

    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    setTilt({ rotateX, rotateY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className="relative h-full perspective-1000"
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
    >
      <div
        className={`
          relative h-full rounded-2xl p-4 sm:p-8 flex flex-col
          overflow-hidden aspect-auto
          transition-all duration-300 ease-out
          ${isHovered 
            ? "border-[var(--neon-blue)] shadow-[0_0_60px_rgba(0,240,255,0.35),0_0_120px_rgba(181,0,255,0.15),0_24px_64px_rgba(0,0,0,0.4)]" 
            : ""
          }
        `}
        style={{
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) ${isHovered ? "translateZ(30px) scale3d(1.1,1.1,1.1)" : ""}`,
          transition: isHovered ? "transform 0.08s ease-out, box-shadow 0.3s ease-out, border-color 0.3s ease-out" : "transform 0.5s ease-out",
        }}
      >
        {/* Glass Morphism Background */}
        <div className="absolute inset-0 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl" />
        
        {/* Glass Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent rounded-2xl pointer-events-none" />
        
        {/* Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--neon-blue)]/[0.08] via-transparent to-transparent rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none" style={{ opacity: isHovered ? 1 : 0 }} />
        
        {/* Top Reflection Shine */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full opacity-50" />
        
        {/* Card Content */}
        <div className="relative z-10 h-full flex flex-col min-h-0">
        <div className="relative mb-2 sm:mb-5" style={{ transform: "translateZ(40px)" }}>
          <h3 
            className="text-lg sm:text-2xl font-bold text-white transition-all duration-300 leading-tight sm:leading-normal"
            style={{
              background: isHovered ? "linear-gradient(135deg, var(--neon-blue), var(--neon-purple))" : "none",
              WebkitBackgroundClip: isHovered ? "text" : "unset",
              WebkitTextFillColor: isHovered ? "transparent" : "unset",
              backgroundClip: isHovered ? "text" : "unset",
            }}
          >
            {title}
          </h3>
          <div 
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-[var(--neon-blue)] to-[var(--neon-purple)] rounded-full transition-all duration-300"
            style={{ 
              height: isHovered ? "2rem" : "0",
              opacity: isHovered ? 1 : 0
            }} 
          />
        </div>
        
        <p 
          className="text-gray-400 mb-3 sm:mb-8 text-[13px] sm:text-[15px] leading-relaxed line-clamp-2 sm:line-clamp-none sm:flex-grow"
          style={{ transform: "translateZ(30px)" }}
        >
          {description}
        </p>

        <div 
          className="flex flex-col gap-1.5 sm:gap-3.5 mt-auto pt-1.5 sm:pt-6 border-t border-white/[0.08]"
          style={{ transform: "translateZ(35px)" }}
        >
          <div className="flex flex-row gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-[14px] text-gray-300 whitespace-nowrap">
              <div className="relative">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--neon-purple)]" />
              </div>
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-[14px] text-gray-300 min-w-0">
              <div className="relative shrink-0">
                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--neon-blue)]" />
              </div>
              <span className="truncate">{career}</span>
            </div>
          </div>
          <Link
            href={href || "#"}
            className={`w-full px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl border border-white/[0.12] text-gray-300 text-[12px] sm:text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 ${isHovered ? "bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)] text-white border-transparent shadow-lg shadow-[var(--neon-blue)]/20" : ""}`}
          >
            Explore Course
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        </div>
      </div>

      {isHovered && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.3) 0%, rgba(181, 0, 255, 0.1) 40%, transparent 70%)`,
            transform: `translateX(${tilt.rotateY * 3}px) translateY(${tilt.rotateX * -3}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
}

export default memo(CourseCardInner);

"use client";

import { useRef, useEffect, useState, memo } from "react";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";

const CountdownTimer = dynamic(() => import("./CountdownTimer"), {
  loading: () => <div className="h-12" aria-hidden />,
});
import { useDynamicSeats } from "@/hooks/useDynamicSeats";

const trustBadges = [
  { value: "5000+", label: "Students Trained" },
  { value: "7 LPA", label: "Highest Package" },
  { value: "300+", label: "Hiring Partners" },
];

function HeroSection() {
  const { seats } = useDynamicSeats();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.preload = "auto";
          el.src = "/herosec.mp4";
          el.load();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el.parentElement!);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative min-h-[calc(100vh-92px)] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#05050f] via-[#0a0a2e] to-[#05050f]">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/hero-poster.webp"
          onCanPlay={() => setVideoReady(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className="absolute inset-0 bg-[#05050f]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>
      <div className="absolute inset-0 hero-gradient-bg" />
      <div className="hero-orb hero-orb--blue md:block hidden" />
      <div className="hero-orb hero-orb--purple md:block hidden" />
      <div className="hero-orb hero-orb--small md:block hidden" />
      <div className="hero-video-grid" />
      <div className="hero-vignette" />
      
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 relative z-10 animate-fade-in">
        <div className="flex flex-col items-center justify-center">
          <div className="text-center mt-4">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--neon-blue)]/30 bg-[var(--neon-blue)]/[0.08] backdrop-blur-xl mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--neon-blue)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--neon-blue)]" />
              </span>
              <span className="text-[var(--neon-blue)] text-sm font-semibold tracking-wide">
                AI-Powered Learning Platform
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.05] text-white mb-6 font-heading hero-heading-glow">
              India&apos;s Most Advanced{" "}
              <span className="gradient-text relative">
                AI-Powered
              </span>
              <br />
              Career Institute
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 max-w-lg mx-auto leading-relaxed">
              <span className="text-[var(--neon-blue)]">Digital Marketing</span> •{" "}
              <span className="text-[var(--neon-purple)]">Data Science</span> •{" "}
              <span className="text-white">Finance</span> •{" "}
              <span className="text-white">HR</span>
              <br />
              <span className="text-white font-medium">AI Skills</span>
              <br />
              <span className="text-gray-300">
                Get Paid Digital Marketing Internship with 100% Placement Support
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                type="button"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary btn-cta-pulse flex items-center justify-center gap-2.5 text-base sm:text-lg px-8 py-4 sm:px-10 sm:py-5 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.97] transition-transform duration-200"
              >
                Book Free Counseling (Limited Seats)
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mt-6 mb-8">
              <p className="text-xs sm:text-sm font-medium tracking-wide">
                <span className="gradient-urgency">🔥 Only {seats} Seats Left for This Batch</span>
                <span className="text-gray-500 mx-2">•</span>
                <span className="gradient-urgency">⏳ Admissions Closing Soon</span>
              </p>
            </div>

            <div className="text-center mt-8">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                ⏳ Admission Deadline Ending In
              </p>
              <CountdownTimer />
            </div>

            <div className="flex flex-wrap gap-8 md:gap-12 justify-center mt-10 animate-reveal visible">
              {trustBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="trust-badge text-center min-w-[100px] px-4"
                >
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black gradient-text">
                    {badge.value}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2 font-medium tracking-wide">
                    {badge.label}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(HeroSection);
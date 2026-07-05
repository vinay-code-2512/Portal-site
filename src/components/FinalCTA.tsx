"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const WHATSAPP_NUMBER = "919891707129";

export default function FinalCTA() {
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}`;

  return (
    <section className="relative z-10 w-full overflow-hidden border-y border-white/10 py-4 sm:py-6 lg:py-8" aria-labelledby="final-cta-heading">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(0,240,255,0.22),transparent_55%),radial-gradient(ellipse_90%_70%_at_80%_100%,rgba(181,0,255,0.2),transparent_50%),radial-gradient(ellipse_80%_60%_at_10%_90%,rgba(0,240,255,0.12),transparent_45%),linear-gradient(180deg,#05050f_0%,#08081c_45%,#05050f_100%)]" />
      <div className="pointer-events-none absolute -left-[20%] top-1/2 h-[min(90vw,520px)] w-[min(90vw,520px)] -translate-y-1/2 rounded-full bg-[var(--neon-blue)]/35 blur-[100px] md:blur-[140px]" />
      <div className="pointer-events-none absolute -right-[15%] top-1/3 h-[min(70vw,440px)] w-[min(70vw,440px)] rounded-full bg-[var(--neon-purple)]/30 blur-[90px] md:blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.35)_0%,transparent_18%,transparent_82%,rgba(0,0,0,0.35)_100%)]" />

      <div className="relative z-10 mx-auto max-w-5xl px-3 sm:px-4 md:px-6 text-center">
        <div className="mx-auto rounded-2xl sm:rounded-[2rem] border border-white/10 bg-black/25 px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10 shadow-[0_0_0_1px_rgba(0,240,255,0.12),0_0_60px_rgba(0,240,255,0.18),0_0_120px_rgba(181,0,255,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
          <p className="mb-1 sm:mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--neon-blue)]">
            Start Today
          </p>
          <h2
            id="final-cta-heading"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight md:leading-[1.1]"
          >
            Ready to Land Your <span className="gradient-text">Dream Job?</span>
          </h2>
          <p className="mx-auto mt-2 sm:mt-3 max-w-xl text-sm sm:text-base text-gray-300">
            Free counseling session. No commitment. Just your career goals.
          </p>

          <div className="mt-4 sm:mt-5 flex flex-col gap-3 sm:gap-4 items-center">
            <a
              href="#contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 min-h-[52px] px-8 py-4 rounded-full border border-[var(--neon-blue)]/50 bg-[var(--neon-blue)]/10 text-white font-bold shadow-[0_0_32px_rgba(0,240,255,0.25)] hover:border-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/20 hover:shadow-[0_0_48px_rgba(0,240,255,0.4)] transition-all duration-200 active:scale-95"
            >
              <ArrowRight className="h-5 w-5 shrink-0 text-[var(--neon-blue)]" aria-hidden />
              Book Free Session
            </a>

            <a
              href="#courses"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 min-h-[52px] px-8 py-4 rounded-full border border-[var(--neon-purple)]/50 bg-[var(--neon-purple)]/10 text-white font-bold shadow-[0_0_32px_rgba(181,0,255,0.2)] hover:border-[var(--neon-purple)] hover:bg-[var(--neon-purple)]/18 hover:shadow-[0_0_48px_rgba(181,0,255,0.35)] transition-all duration-200 active:scale-95"
            >
              <Sparkles className="h-5 w-5 shrink-0 text-[var(--neon-purple)]" aria-hidden />
              View Courses
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

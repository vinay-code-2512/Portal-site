"use client";

import { memo, useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Monitor, Users, Rocket } from "lucide-react";

const features = [
  {
    icon: Monitor,
    title: "Live Online Classes",
    description:
      "Facilitated live sessions with Q&A, breakout practice, and same-week assignments—so accountability stays high even when you learn remotely.",
    video: "/L1.mp4",
  },
  {
    icon: Users,
    title: "Small Batch Size",
    description:
      "Capped cohorts so mentors can review your work personally; you graduate with corrections and comments—not generic rubrics.",
    video: "/L2.mp4",
  },
  {
    icon: Rocket,
    title: "Career Launchpad",
    description:
      "ATS-friendly resumes, referral introductions, and mock interviews tuned to IT services hiring bars—so you graduate placement-ready.",
    video: "/L3.mp4",
  },
];

const steps = [
  {
    number: "01",
    title: "Research & Planning",
    description:
      "We study market trends, competition, and consumer behaviour to develop a strategic roadmap to suit your business aspirations and business expansion objectives.",
    image: "/digital1.webp",
    alt: "Research and planning strategy",
  },
  {
    number: "02",
    title: "Execution & Optimization",
    description:
      "Campaigns are initiated accurately and constantly optimized depending on the performance measures to achieve optimal efficiency and outcomes.",
    image: "/digital2.webp",
    alt: "Campaign execution and optimization",
  },
  {
    number: "03",
    title: "Tracking",
    description:
      "We track important indicators and send you comprehensive reports, which allow you to see the performance of the campaigns and the ways to improve it in a clear way.",
    image: "/digital3.webp",
    alt: "Performance tracking and reporting",
  },
  {
    number: "04",
    title: "Scaling & Growth",
    description:
      "Effective strategies are scaled so as to reach as many people as possible and bring about the maximum revenue and at the same time keep the efficiency and performance steady.",
    image: "/digitalmain.webp",
    alt: "Business scaling and growth",
  },
];

function LazyVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.src = src.replace('.webm', '.mp4');
          el.load();
          setLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el.parentElement!);
    return () => observer.disconnect();
  }, [src]);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      className={`absolute inset-0 w-full h-full object-cover brightness-150 contrast-110 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
    >
      <source src="" type="video/webm" />
    </video>
  );
}

function TrainingShowcase() {
  return (
    <section
      id="training"
      className="relative bg-[var(--background)] min-h-[85vh] flex flex-col justify-center overflow-hidden !pt-2 !pb-4 sm:!pb-6 lg:!pb-8"
      aria-labelledby="training-showcase-heading"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(95vw,1100px)] h-[800px] bg-[var(--neon-blue)]/15 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[min(60vw,700px)] h-[600px] bg-[var(--neon-purple)]/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[min(50vw,600px)] h-[500px] bg-[var(--neon-blue)]/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 w-full">
        <div className="mb-4 md:mb-5">
          <div className="text-center mb-4 md:mb-5 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--neon-purple)]/10 border border-[var(--neon-purple)]/20 text-[var(--neon-purple)] text-xs font-medium mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon-purple)]" />
              Our Growth Process
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
              How We Turn Marketing Efforts into{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)]">
                Measurable Results
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="group relative"
              >
                <div className="relative h-full rounded-2xl border border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl overflow-hidden">
                  {step.image && (
                    <>
                      <div className="absolute inset-0">
                        <Image
                          src={step.image}
                          alt={step.alt}
                          fill
                          className="object-cover opacity-50"
                          sizes="(max-width: 768px) 100vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-[#0a0a0f]/20" />
                      </div>
                    </>
                  )}
                  <div className="relative z-10 p-6 md:p-8">
                    <div className="relative mb-3 flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center overflow-hidden"
                          style={{
                            background: "linear-gradient(135deg, rgba(181,0,255,0.25) 0%, rgba(0,240,255,0.15) 100%)",
                            border: "1px solid rgba(181,0,255,0.25)",
                          }}
                        >
                          {step.image && (
                            <Image
                              src={step.image}
                              alt={step.alt}
                              fill
                              className="object-cover opacity-70"
                              sizes="80px"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/80 via-[#0a0a0f]/30 to-transparent" />
                          <span className="relative z-10 text-2xl md:text-3xl font-black text-white">
                            {step.number}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-white mt-3">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-400 text-[14px] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-4 md:mb-5 max-w-4xl mx-auto">
          <h2
            id="training-showcase-heading"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]"
          >
            Learning That Creates{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)]">
              Professionals
            </span>
          </h2>
          <p className="mt-2 text-gray-300 text-lg md:text-xl max-w-2xl mx-auto">
            Cohort-based delivery with weekly milestones—built for professionals who need proof of skill, not another certificate to file away.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {features.map((feat, i) => {
            const card = (
              <div
                key={feat.title}
                className="glass-panel p-10 rounded-2xl relative overflow-hidden group border border-white/10 bg-black/25 backdrop-blur-md"
              >
                {feat.video && <LazyVideo src={feat.video} />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-[var(--neon-blue)]/10 flex items-center justify-center mb-6 transition-all duration-300">
                  <feat.icon className="w-7 h-7 text-[var(--neon-blue)]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feat.description}</p>
                </div>
              </div>
            );

            const links = ["/live-online-classes", "/small-batch-size", "/career-launchpad"];
            const href = links[i];

            return href ? (
              <Link key={feat.title} href={href} className="block">
                {card}
              </Link>
            ) : (
              card
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default memo(TrainingShowcase);

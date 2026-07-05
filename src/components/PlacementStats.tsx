"use client";

import { memo, useEffect, useRef, useState, useCallback } from "react";
import { ArrowRight, Volume2, VolumeX, GraduationCap, Briefcase, TrendingUp, Building2 } from "lucide-react";
import Image from "next/image";
import { hiredStudents } from "@/data/hiredStudents";

const selectedStudents = [
  hiredStudents[0],   // Piyush Joshi - Deloitte
  hiredStudents[27],  // Vaishnavi Gupta - Coca-Cola
  hiredStudents[48],  // Sanskriti Khodre - Federal Bank
  hiredStudents[15],  // Krishna Rathore - Hindware
  hiredStudents[59],  // Mohnish Baviskar - Seagate
  hiredStudents[65],  // Harshita Jain - Synergetics
  hiredStudents[61],  // Harsh Parmar - Sparx IT
  hiredStudents[62],  // Dhaval Dholariya - UTO
];
const reviewVideos = [
  { src: "/review1.mp4" },
  { src: "/review2.mp4" },
  { src: "/review3.mp4" },
  { src: "/review4.mp4" },
  { src: "/review5.mp4" },
  { src: "/r6.mp4" },
  { src: "/r7.mp4" },
  { src: "/r8.mp4" },
];

const stats = [
  {
    value: 5000,
    suffix: "+",
    label: "Students",
    icon: GraduationCap,
    color: "var(--neon-blue)",
  },
  {
    value:7,
    suffix: " LPA",
    label: "Highest Package",
    icon: TrendingUp,
    color: "#34d399",
  },
  {
    value: 4900,
    suffix: "+",
    label: "Placements",
    icon: Briefcase,
    color: "#a78bfa",
  },
  {
    value: 300,
    suffix: "+",
    label: "Companies",
    icon: Building2,
    color: "var(--neon-purple)",
  },
];

const companies = [
  {name: "Deloitte" , logo: "/logos/deloitte.webp" },
  {name : "TCS", logo: "/logos/tcs.webp" },
  {name : "Zoho", logo: "/logos/zoho.webp" },
  { name: "Infosys", logo: "/logos/infosys.png" },
  { name: "Wipro", logo: "/logos/wipro.jpg" },
  { name: "HCLTech", logo: "/logos/hcl.png" },
  { name: "Tech Mahindra", logo: "/logos/Tech Mahindra.png" },
  {name: "Mphasis", logo: "/logos/mphasis.webp" },
  { name: "LTIMindtree", logo: "/logos/ltimindtree.png" },
  { name: "EY", logo: "/logos/ey.jpg" },
  { name: "Accenture", logo: "/logos/accenture.png" },
  { name: "Capgemini", logo: "/logos/capgemini.png" },
  { name: "Genpact", logo: "/logos/genpact.png" },
  { name: "IBM", logo: "/logos/ibm.png" },
  { name: "EY", logo: "/logos/ey.jpg" },
  { name: "PwC", logo: "/logos/pwc.png" },
  { name: "Amazon", logo: "/logos/amazon.jpg" },
  { name: "Flipkart", logo: "/logos/flipkart.png" },
  { name: "HCLTech", logo: "/logos/hcl.png" },
];

const AnimatedCounter = memo(function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2200;
    let startTime: number | null = null;
    let rafId: number;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  return (
    <span>
      {count.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
});

function VideoCard({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.src = src;
          video.load();
          setLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(video.parentElement!);
    return () => observer.disconnect();
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.muted) return;
      if (video.currentTime >= 6) {
        video.currentTime = 3;
      }
    };

    const handlePlay = () => {
      if (video.muted) {
        video.currentTime = 3;
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      videoRef.current?.play();
    }
  }, [loaded]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted) {
      video.play();
    } else {
      video.loop = false;
    }
    setMuted(video.muted);
  }, []);

  return (
    <div className="group relative w-full rounded-2xl p-[1.5px] hover:-translate-y-1.5 transition-transform duration-300">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--neon-blue)]/40 via-[var(--neon-purple)]/20 to-[var(--neon-blue)]/40 opacity-60 blur-lg transition-all duration-500 group-hover:opacity-100 group-hover:blur-xl group-hover:scale-105" />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a16]/95 shadow-[0_0_0_1px_rgba(0,240,255,0.08),0_0_24px_rgba(0,240,255,0.08)] transition-all duration-500 group-hover:border-[var(--neon-blue)]/40 group-hover:shadow-[0_0_0_1px_rgba(0,240,255,0.2),0_0_40px_rgba(0,240,255,0.15)]">
        <div className="relative aspect-[3/4] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-blue)]/5 via-transparent to-[var(--neon-purple)]/5 opacity-0 group-hover:opacity-100 transition-all duration-500 z-[1] pointer-events-none" />
          <video
            ref={videoRef}
            muted
            playsInline
            preload="none"
            poster={src.replace(/\.mp4$/, "-poster.jpg")}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        <div className="absolute top-0 left-0 right-0 z-10 px-2 py-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
            <span className="text-white/60 text-[9px] font-medium tracking-widest uppercase">Review</span>
          </div>
        </div>

        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="absolute bottom-2 right-2 z-20 w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:border-[var(--neon-blue)]/60 hover:bg-[var(--neon-blue)]/20 shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all duration-300"
        >
          {muted ? (
            <VolumeX className="w-3 h-3 text-white/60 group-hover:text-white/90 transition-colors" />
          ) : (
            <Volume2 className="w-3 h-3 text-[var(--neon-blue)] drop-shadow-[0_0_6px_rgba(0,240,255,0.6)]" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function PlacementStats() {
  return (
    <section id="placement-stats" className="py-10 sm:py-12 lg:py-14 relative z-10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,700px)] h-[400px] bg-[var(--neon-blue)]/[0.12] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-[5%] w-[500px] h-[500px] bg-[var(--neon-purple)]/[0.08] rounded-full blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Student <span className="gradient-text">Reviews</span>
            </h2>
            <p className="text-[var(--neon-blue)] max-w-2xl mx-auto text-base md:text-lg font-medium">
              🎉 Hear from our students about their journey!
            </p>
          </div>

        <div className="relative overflow-hidden mb-6">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[var(--background)] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[var(--background)] to-transparent z-10 pointer-events-none" />

            <div className="flex gap-4 animate-scroll-right w-max">
              {[...selectedStudents, ...selectedStudents].map((student, i) => (
                <div
                  key={`${student.name}-${i}`}
                  className="relative backdrop-blur-md text-center shadow-lg shadow-black/20 hover:shadow-xl transition-all duration-500 group rounded-2xl border border-[var(--neon-blue)]/30 shadow-[0_0_80px_rgba(0,240,255,0.2),0_0_120px_rgba(181,0,255,0.1),0_8px_32px_rgba(0,0,0,0.4)] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3 w-[160px] hover:border-[var(--neon-blue)]/60 hover:shadow-[0_0_100px_rgba(0,240,255,0.4),0_0_150px_rgba(181,0,255,0.2),0_0_40px_rgba(0,240,255,0.6)]"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--neon-blue)]/5 via-transparent to-[var(--neon-purple)]/5 group-hover:from-[var(--neon-blue)]/20 group-hover:to-[var(--neon-purple)]/20 transition-all duration-500" />
                  <div className="relative z-10">
                    <div className="flex justify-center mb-3">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 ring-2 ring-[var(--neon-blue)]/40 shadow-[0_0_20px_rgba(0,240,255,0.3)] bg-white/10">
                        <Image
                          src={student.image}
                          alt={student.name}
                          width={56}
                          height={56}
                          sizes="56px"
                          loading="lazy"
                          decoding="async"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white mb-0.5 truncate">{student.name}</p>
                    <p className="text-gray-400 text-[10px] mb-1 truncate">{student.state}</p>
                    <p className="text-xs font-semibold mb-1.5 text-[var(--neon-blue)] truncate">{student.company}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 text-[10px] font-semibold border border-green-400/20">
                      {student.package}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mb-6 mt-10">
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              <span className="gradient-text">Testimonials</span>
            </h3>
            <p className="text-gray-400 text-sm mt-1">What our students say about us</p>
          </div>

          <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4 mb-8 max-w-6xl mx-auto px-1 md:px-0">
            {reviewVideos.map((video) => (
              <VideoCard key={video.src} src={video.src} />
            ))}
          </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="relative bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-2xl p-3 md:p-4 text-center shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-[var(--neon-blue)]/20 hover:border-[var(--neon-blue)]/50 transition-all duration-300 group hover:-translate-y-2"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--neon-blue)]/0 via-[var(--neon-blue)]/5 to-[var(--neon-purple)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10">
                  <div
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-none mb-1" style={{ color: stat.color }}>
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-gray-400 text-xs md:text-sm font-medium">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#contact"
            aria-label="Start Your Placement Journey"
            className="btn-primary flex items-center justify-center gap-2.5 px-8 py-4 w-full sm:w-auto hover:-translate-y-0.5 active:scale-[0.97] transition-transform duration-200"
          >
            Start Your Placement Journey
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />
          <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold">
            300+ Hiring Partners
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />
        </div>

        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[var(--background)] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[var(--background)] to-transparent z-10 pointer-events-none" />

          <div className="flex gap-1 animate-scroll w-max">
            {[...companies, ...companies].map((company, i) => (
              <div key={`${company.name}-${i}`} className="w-[120px] h-10 flex items-center justify-center shrink-0">
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={120}
                  height={40}
                  sizes="120px"
                  loading="lazy"
                  className="h-full w-auto object-contain hover:scale-105 transition-all duration-300 hover:drop-shadow-[0_0_12px_rgba(0,240,255,0.6)] hover:filter"
                  style={{ width: 'auto', height: '100%' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .review-video-swiper {
          padding: 20px 0 40px;
          overflow: visible;
        }

        .review-video-swiper .swiper-slide {
          opacity: 0.45;
          filter: blur(2px);
          transition: all 0.5s ease;
        }

        .review-video-swiper .swiper-slide-active {
          opacity: 1;
          filter: blur(0);
        }

        .review-video-swiper .swiper-slide-active button {
          transform: scale(1.05);
        }
      `}</style>
    </section>
  );
}

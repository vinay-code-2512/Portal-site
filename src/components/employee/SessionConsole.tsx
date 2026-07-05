"use client";

import { useState, useEffect, useRef } from "react";
import { motion, PanInfo } from "framer-motion";
import { Clock, MapPin, Lock, Sparkles } from "lucide-react";
import type { AttendanceRecord } from "@/hooks/useAttendance";
import AttendanceSelfie from "./AttendanceSelfie";

interface SessionConsoleProps {
  todayRecord: AttendanceRecord | null;
  sessionStatus?: "idle" | "working" | "on-break" | "checked-out";
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  onStartBreak?: () => void;
  onEndBreak?: () => void;
  loading?: boolean;
  hideSelfie?: boolean;
  slidePaddingTop?: string;
  lastPlayedVideo?: { title: string; url: string } | null;
}

function getFormattedTimeParts(date: Date) {
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const parts = timeStr.split(" ");
  const time = parts[0];
  const meridiem = parts[1] || "";
  const timeParts = time.split(":");
  const hhmm = `${timeParts[0]}:${timeParts[1]}`;
  const ss = timeParts[2] || "00";
  return { hhmm, ss, meridiem };
}

interface SliderProps {
  label: string;
  onTrigger: () => void;
  color?: string;
}

function SlideButton({ label, onTrigger, color = "from-[var(--color-primary)] to-[var(--color-primary-light)]" }: SliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [handleX, setHandleX] = useState(0);
  const [success, setSuccess] = useState(false);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (success) return;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const maxDrag = containerWidth - 74;
    if (info.offset.x >= maxDrag * 0.8) {
      setSuccess(true);
      setHandleX(maxDrag);
      onTrigger();
      setTimeout(() => {
        setSuccess(false);
        setHandleX(0);
      }, 2000);
    } else {
      setHandleX(0);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-20 bg-zinc-100 dark:bg-white/[0.04] border-2 border-zinc-500 dark:border-white/10 rounded-full flex items-center overflow-hidden cursor-pointer select-none"
      onClick={() => {
        if (success) return;
        setSuccess(true);
        onTrigger();
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
      }}
    >
      <span className="text-sm font-extrabold text-zinc-300 uppercase pl-[76px] select-none pointer-events-none whitespace-nowrap">
        {success ? "Activating..." : label}
      </span>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: containerRef.current ? containerRef.current.offsetWidth - 74 : 200 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={{ x: success ? (containerRef.current ? containerRef.current.offsetWidth - 74 : 200) : handleX }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute left-1.5 w-[68px] h-[68px] rounded-full bg-gradient-to-r ${color} flex items-center justify-center text-white shadow-md cursor-grab active:cursor-grabbing`}
      >
        <span className="text-lg font-bold">➔</span>
      </motion.div>
    </div>
  );
}

export default function SessionConsole({
  todayRecord,
  sessionStatus = "idle",
  onCheckIn,
  onCheckOut,
  onStartBreak,
  onEndBreak,
  loading,
  hideSelfie,
  slidePaddingTop,
  lastPlayedVideo,
}: SessionConsoleProps) {
  const [now, setNow] = useState(new Date());
  const [locationName, setLocationName] = useState("Detecting location...");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchWithTimeout(url: string, ms = 5000): Promise<Response> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ms);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        return res;
      } catch (e) {
        clearTimeout(timer);
        throw e;
      }
    }

    async function getLocationFromIP(): Promise<string | null> {
      // Try multiple services one by one
      try {
        const res = await fetchWithTimeout("https://ipwho.is/");
        const data = await res.json();
        if (data.city && data.region) return `${data.city}, ${data.region}`;
      } catch {}

      try {
        const res = await fetchWithTimeout("https://ipapi.co/json/");
        const data = await res.json();
        if (data.city && data.region) return `${data.city}, ${data.region}`;
      } catch {}

      try {
        const res = await fetchWithTimeout("https://freeipapi.com/api/json");
        const data = await res.json();
        if (data.cityName && data.regionName) return `${data.cityName}, ${data.regionName}`;
      } catch {}

      return null;
    }

    async function getLocationFromGPS(): Promise<string | null> {
      return new Promise((resolve) => {
        if (!navigator.geolocation) { resolve(null); return; }

        const timeout = setTimeout(() => resolve(null), 10000);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            clearTimeout(timeout);
            const { latitude, longitude } = position.coords;
            try {
              const res = await fetchWithTimeout(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                8000
              );
              const data = await res.json();
              const addr = data.address;
              const city = addr.city || addr.town || addr.village || addr.county || addr.state_district;
              const region = addr.state || addr.country;
              if (city && region) { resolve(`${city}, ${region}`); return; }
            } catch {}
            resolve(null);
          },
          () => { clearTimeout(timeout); resolve(null); },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    }

    async function detectLocation() {
      // Race GPS and IP — use the first one that succeeds
      const results = await Promise.allSettled([
        getLocationFromGPS(),
        getLocationFromIP(),
      ]);

      if (cancelled) return;

      // Prefer GPS result, then IP
      const gpsResult = results[0].status === "fulfilled" ? results[0].value : null;
      const ipResult = results[1].status === "fulfilled" ? results[1].value : null;

      const location = gpsResult || ipResult;
      setLocationName(location || "Location not available");
    }

    detectLocation();

    return () => { cancelled = true; };
  }, []);

  const { hhmm, ss, meridiem } = getFormattedTimeParts(now);

  const checkInTime = todayRecord?.checkIn?.toDate
    ? todayRecord.checkIn.toDate()
    : todayRecord?.checkIn
      ? new Date(todayRecord.checkIn)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="hrms-glass rounded-[24px] p-10 sm:p-14"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-0 items-stretch">
        
        {/* Left Column - Session Clock & Location */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-8 lg:pr-10">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#5B4CFF] to-[#4F46E5] flex items-center justify-center">
                <Clock className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-sm sm:text-base uppercase tracking-widest font-black flex items-center gap-1.5 select-none">
                <span className="text-black dark:text-white">Session</span>
                <span style={{ background: 'linear-gradient(to right, #5B4CFF, #4F46E5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Console</span>
              </span>
            </div>
            
            {/* Time Card Container */}
            <div className="hrms-time-card flex flex-col justify-center items-center text-center p-12 sm:p-16 bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/5 rounded-2xl w-full overflow-hidden">
              <div className="flex items-baseline justify-center flex-wrap gap-2">
                <span className="text-6xl sm:text-7xl font-black text-zinc-800 dark:text-white tabular-nums tracking-tight leading-none">
                  {hhmm}
                  <span style={{ background: 'linear-gradient(to right, #5B4CFF, #4F46E5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} className="text-3xl sm:text-4xl font-bold ml-1">:{ss}</span>
                  <span className="text-3xl sm:text-4xl text-[var(--color-primary-light)] font-black uppercase leading-none select-none ml-2">
                    {meridiem}
                  </span>
                </span>
              </div>
              <span className="text-xs text-zinc-500 font-extrabold tracking-widest uppercase mt-4 block">
                Indian Standard Time
              </span>
            </div>
          </div>

          {/* Location Badge */}
          <div className="hrms-location-badge flex items-center justify-between gap-4 p-6 bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/5 rounded-2xl w-full">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center shrink-0">
                <MapPin className="w-7 h-7 text-[var(--color-primary-light)]" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="hrms-location-label text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Presence Location</p>
                <p className="hrms-location-value text-sm font-bold text-zinc-200 truncate font-sans mt-0.5">{locationName}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE GPS
            </span>
          </div>
        </div>

        {/* Right Column - Selfie Capture & Action Slider */}
        <div className={`lg:col-span-4 flex flex-col justify-between gap-8 lg:pl-10 border-t border-zinc-200 dark:border-white/5 ${hideSelfie ? "pt-0 lg:pt-0 lg:border-t-0 lg:border-l-0" : "pt-8 lg:pt-0 lg:border-t-0 lg:border-l"}`}>
          {!hideSelfie && (
            <div className="space-y-5">
              <span className="text-xs text-zinc-500 uppercase tracking-widest font-black block">
                Attendance Selfie
              </span>

              <AttendanceSelfie sessionStatus={sessionStatus} />
            </div>
          )}

          {/* Action Slider Container */}
          <div className={`space-y-2 ${slidePaddingTop ?? ""}`}>
            {sessionStatus === "idle" && onCheckIn && (
              <SlideButton label="Check In" onTrigger={onCheckIn} />
            )}

            {sessionStatus === "working" && onCheckOut && (
              <SlideButton
                label="Check Out"
                onTrigger={onCheckOut}
                color="from-red-500 to-rose-500"
              />
            )}

            {sessionStatus === "on-break" && onEndBreak && (
              <SlideButton
                label="Resume Work"
                onTrigger={onEndBreak}
                color="from-amber-500 to-yellow-500"
              />
            )}

            {sessionStatus === "checked-out" && (
              <button
                disabled
                className="w-full h-20 rounded-full bg-zinc-100 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 text-zinc-500 text-sm font-bold flex items-center justify-center gap-1.5 opacity-60"
              >
                <span>SHIFT COMPLETED</span>
              </button>
            )}

            {/* Secure Session Active badge */}
            <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest">
              <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Secure Session Active</span>
            </div>

            {lastPlayedVideo && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/5 space-y-2">
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Last Played</p>
                <div className="rounded-lg overflow-hidden bg-black/5 border border-zinc-200 dark:border-white/10">
                  <video
                    src={lastPlayedVideo.url}
                    className="w-full aspect-video object-contain bg-black/10"
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                    playsInline
                  />
                </div>
                <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 truncate">{lastPlayedVideo.title}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

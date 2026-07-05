"use client";

import { useEffect, useState, useRef } from "react";

function getEndOfToday(): Date {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return end;
}

function getEndOfTomorrow(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const end = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59, 999);
  return end;
}

function calculateTimeRemaining(target: Date): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const difference = target.getTime() - now.getTime();
  
  if (difference <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  
  return {
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function formatTime(num: number): string {
  const clamped = Math.max(0, Math.floor(num));
  return clamped.toString().padStart(2, "0");
}

export default function CountdownTimer() {
  const [targetDate, setTargetDate] = useState(() => getEndOfToday());
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeRemaining(targetDate));
  const [mounted, setMounted] = useState(false);
  const visibleRef = useRef(true);
  
  useEffect(() => {
    setMounted(true);
    const onVisibility = () => { visibleRef.current = !document.hidden; };
    document.addEventListener("visibilitychange", onVisibility);
    const timer = setInterval(() => {
      if (!visibleRef.current) return;
      const currentTarget = new Date(targetDate);
      const now = new Date();
      const remaining = currentTarget.getTime() - now.getTime();
      
      if (remaining <= 0) {
        const nextTarget = getEndOfTomorrow();
        setTargetDate(nextTarget);
        setTimeLeft(calculateTimeRemaining(nextTarget));
      } else {
        setTimeLeft(calculateTimeRemaining(currentTarget));
      }
    }, 1000);
    
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [targetDate]);
  
  const timeUnits = [
    { value: mounted ? timeLeft.hours : 0, label: "Hours" },
    { value: mounted ? timeLeft.minutes : 0, label: "Minutes" },
    { value: mounted ? timeLeft.seconds : 0, label: "Seconds" },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-orange-500 to-pink-600 animate-pulse drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
        ⏳ Offer Ends Today
      </h2>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
      {timeUnits.map((item, index) => (
        <div key={item.label} className="flex flex-col items-center">
          <div className="relative group">
            <div
              className="
                w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20
                bg-gray-900/70 backdrop-blur-md
                border border-purple-500/40
                rounded-xl
                flex items-center justify-center
                shadow-[0_0_25px_rgba(168,85,247,0.25)]
                before:absolute before:inset-0 before:rounded-xl before:p-[1px]
                before:border before:border-cyan-400/30
                before:shadow-[0_0_15px_rgba(6,182,212,0.3)_inset]
                animate-[pulse_2s_ease-in-out_infinite]
              "
            >
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                {formatTime(item.value)}
              </span>
            </div>
          </div>
          <span className="mt-2 text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wider">
            {item.label}
          </span>
        </div>
      ))}
      </div>
    </div>
  );
}
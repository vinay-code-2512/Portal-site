"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "click",
  "keydown",
  "scroll",
  "touchstart",
  "pointermove",
] as const;

interface UseIdleOptions {
  idleTime?: number;
}

export function useIdle({ idleTime = 30000 }: UseIdleOptions = {}) {
  const [isIdle, setIsIdle] = useState(false);
  const lastActiveRef = useRef(Date.now());
  const idleTimeRef = useRef(idleTime);
  const hiddenStartRef = useRef(0);

  idleTimeRef.current = idleTime;

  const resetIdle = useCallback(() => {
    lastActiveRef.current = Date.now();
    if (document.hidden) {
      hiddenStartRef.current = Date.now();
    }
    setIsIdle(false);
  }, []);

  useEffect(() => {
    const handleActivity = () => {
      lastActiveRef.current = Date.now();
      setIsIdle(false);
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenStartRef.current = Date.now();
      } else {
        const hiddenDuration = Date.now() - hiddenStartRef.current;
        if (hiddenDuration >= idleTimeRef.current) {
          setIsIdle(true);
        }
        hiddenStartRef.current = 0;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (document.hidden) {
      hiddenStartRef.current = Date.now();
    }

    const checkIdle = setInterval(() => {
      if (Date.now() - lastActiveRef.current >= idleTimeRef.current) {
        setIsIdle(true);
      }
    }, 1000);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(checkIdle);
    };
  }, []);

  return { isIdle, resetIdle };
}

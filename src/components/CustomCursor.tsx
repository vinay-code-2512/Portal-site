"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface Ghost {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  vx: number;
  vy: number;
}

const SPAWN_INTERVAL = 80;
const MAX_GHOSTS = 3;
const POSITION_DEADZONE = 2;

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === "undefined") return true;
    if (!window.matchMedia) return false;
    return window.matchMedia("(pointer: coarse)").matches;
  });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const ghostsRef = useRef<Ghost[]>([]);
  const lastSpawnTime = useRef(0);
  const rawPosRef = useRef({ x: -100, y: -100 });
  const rafIdRef = useRef(0);
  const isVisibleRef = useRef(true);

  const onMouseMove = useCallback((e: MouseEvent) => {
    rawPosRef.current = { x: e.clientX, y: e.clientY };

    const now = Date.now();
    if (now - lastSpawnTime.current > SPAWN_INTERVAL) {
      ghostsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        age: 0,
        maxAge: 300,
        vx: 0,
        vy: 0,
      });

      if (ghostsRef.current.length > MAX_GHOSTS) {
        ghostsRef.current.shift();
      }

      lastSpawnTime.current = now;
    }
  }, []);

  const onMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest("a, button, [role='button'], input, textarea, select, label, [onClick], .cursor-hover");
    setIsHovering(!!isInteractive);
  }, []);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
    };

    checkTouch();
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const onResize = () => {
      checkTouch();
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;

    const syncPosition = () => {
      const raw = rawPosRef.current;
      setPosition((prev) => {
        const dx = raw.x - prev.x;
        const dy = raw.y - prev.y;
        if (Math.abs(dx) < POSITION_DEADZONE && Math.abs(dy) < POSITION_DEADZONE) return prev;
        return { x: raw.x, y: raw.y };
      });
    };

    const animate = () => {
      if (!isVisibleRef.current) {
        rafIdRef.current = requestAnimationFrame(animate);
        return;
      }

      syncPosition();

      const canvas = document.getElementById("ghost-canvas") as HTMLCanvasElement;
      if (!canvas) {
        rafIdRef.current = requestAnimationFrame(animate);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafIdRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const ghosts = ghostsRef.current;

      for (let i = ghosts.length - 1; i >= 0; i--) {
        ghosts[i].age += 16;

        if (ghosts[i].age >= ghosts[i].maxAge) {
          ghosts.splice(i, 1);
          continue;
        }

        const progress = ghosts[i].age / ghosts[i].maxAge;
        const opacity = Math.pow(1 - progress, 1.5) * 0.5;
        const scale = 0.7;

        ctx.save();
        ctx.globalAlpha = opacity;

        const centerX = ghosts[i].x;
        const centerY = ghosts[i].y;

        ctx.translate(centerX - 6, centerY - 9);
        ctx.scale(scale, scale);

        ctx.beginPath();
        ctx.moveTo(2, 2);
        ctx.lineTo(2, 32);
        ctx.lineTo(8, 26);
        ctx.lineTo(14, 36);
        ctx.lineTo(18, 34);
        ctx.lineTo(12, 24);
        ctx.lineTo(20, 24);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, 0, 20, 36);
        gradient.addColorStop(0, "rgba(0, 240, 255, 0.3)");
        gradient.addColorStop(1, "rgba(181, 0, 255, 0.2)");
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.stroke();

        ctx.restore();
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    const onVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };

    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        document.documentElement.classList.add("is-fullscreen");
      } else {
        document.documentElement.classList.remove("is-fullscreen");
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onMouseOver);

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
    };
  }, [isTouchDevice, onMouseMove, onMouseOver]);

  if (isTouchDevice) return null;

  const { width: cw, height: ch } = windowSize;

  return (
    <>
      {cw > 0 && ch > 0 && (<canvas
        id="ghost-canvas"
        className="cursor-trail-canvas"
        width={cw}
        height={ch}
      />)}
      <div
        className="cursor-glow"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          opacity: isHovering ? 0.6 : 0.3,
          transform: `translate(-50%, -50%) scale(${isHovering ? 2.5 : 1.5})`,
        }}
      />
      <svg
        className={`custom-cursor ${isHovering ? "hovering" : ""}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        width="12"
        height="18"
        viewBox="0 0 24 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 2L2 32L8 26L14 36L18 34L12 24L20 24L2 2Z"
          fill="#000000"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
}

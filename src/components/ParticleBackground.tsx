"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

function useLiteMode() {
  const [lite, setLite] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px), (pointer: coarse), (prefers-reduced-motion: reduce)");
    const apply = () => setLite(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return lite;
}

export default function ParticleBackground() {
  const [init, setInit] = useState(false);
  const lite = useLiteMode();

  useEffect(() => {
    if (lite) return;
    const timeout = setTimeout(() => {
      initParticlesEngine(async (engine) => {
        await loadSlim(engine);
      }).then(() => setInit(true));
    }, 4000);
    return () => clearTimeout(timeout);
  }, [lite]);

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: { value: "transparent" },
      },
      fpsLimit: 15,
      particles: {
        color: {
          value: ["#00f0ff", "#b500ff"],
        },
        links: {
          enable: false,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: false,
          speed: 0.3,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 10,
        },
        opacity: {
          value: 0.2,
        },
        shape: {
          type: "circle",
        },
        stroke: {
          width: 0,
        },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      detectRetina: false,
    }),
    []
  );

  if (lite || !init) {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10 bg-[#05050f]">
      <Particles id="tsparticles" options={options} />
    </div>
  );
}

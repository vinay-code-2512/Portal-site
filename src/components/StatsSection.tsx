"use client";

import { motion } from "framer-motion";
import { Users, Clock, GraduationCap, Building2 } from "lucide-react";
import {
  hiddenReveal,
  hiddenRevealUp,
  staggerDelay,
  transitionReveal,
  transitionRevealShort,
  viewportReveal,
  visibleReveal,
} from "@/lib/motion";

const stats = [
  {
    id: 1,
    label: "Expert Mentors",
    value: "25+",
    icon: Users,
    color: "from-blue-400 to-cyan-400",
    shadowColor: "rgba(96,165,250,0.3)",
  },
  {
    id: 2,
    label: "Years Avg Experience",
    value: "10+",
    icon: Clock,
    color: "from-purple-400 to-pink-400",
    shadowColor: "rgba(192,132,252,0.3)",
  },
  {
    id: 3,
    label: "Students Trained",
    value: "5000+",
    icon: GraduationCap,
    color: "from-emerald-400 to-teal-400",
    shadowColor: "rgba(52,211,153,0.3)",
  },
  {
    id: 4,
    label: "Top Companies",
    value: "50+",
    icon: Building2,
    color: "from-orange-400 to-amber-400",
    shadowColor: "rgba(251,146,60,0.3)",
  },
];

export default function StatsSection() {
  return (
    <section className="relative section-spacing">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[#0a0b1a] -z-10" />
      <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none" />

      <div className="relative w-full px-4 sm:px-6 md:px-8">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial={hiddenReveal}
            whileInView={visibleReveal}
            viewport={viewportReveal}
            transition={{ ...transitionRevealShort, delay: staggerDelay(0, 0.06) }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md mb-6 shadow-[0_0_30px_rgba(59,130,246,0.08)]"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" />
            <span className="text-xs font-medium tracking-[0.2em] text-blue-300/90 uppercase">
              Our Impact
            </span>
          </motion.div>

          <motion.h2
            initial={hiddenRevealUp}
            whileInView={visibleReveal}
            viewport={viewportReveal}
            transition={transitionReveal}
            className="heading-lg text-white mb-4 leading-tight"
          >
            Driving Results That{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Matter
            </span>
          </motion.h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={hiddenReveal}
                whileInView={visibleReveal}
                viewport={viewportReveal}
                transition={{
                  ...transitionRevealShort,
                  delay: staggerDelay(index, 0.08),
                }}
                whileHover={{
                  y: -4,
                  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                }}
                className="group relative"
              >
                {/* Glow effect on hover */}
                <div
                  className="absolute -inset-[1px] rounded-3xl opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, ${stat.shadowColor}, transparent)`,
                  }}
                />

                {/* Card */}
                <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md p-6 md:p-8 text-center overflow-hidden transition-all duration-500 group-hover:border-white/[0.15] group-hover:bg-white/[0.04]">
                  {/* Subtle corner glow */}
                  <div
                    className="absolute -top-px -left-px w-20 h-20 rounded-tl-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle at top left, ${stat.shadowColor}, transparent 70%)`,
                    }}
                  />

                  {/* Icon container */}
                  <div className="relative mb-4 md:mb-5 inline-flex">
                    {/* Icon glow */}
                    <div
                      className="absolute inset-0 rounded-2xl blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{ backgroundColor: stat.shadowColor }}
                    />

                    <div
                      className="relative p-3 md:p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] group-hover:border-white/[0.15] transition-colors duration-500"
                      style={{
                        boxShadow: `0 0 20px ${stat.shadowColor}00`,
                      }}
                    >
                      <Icon className={`h-6 w-6 md:h-7 md:w-7 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                    </div>
                  </div>

                  {/* Value */}
                  <h3
                    className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                  >
                    {stat.value}
                  </h3>

                  {/* Label */}
                  <p className="text-sm md:text-base text-gray-400 group-hover:text-gray-300 transition-colors duration-500">
                    {stat.label}
                  </p>

                  {/* Bottom glow line */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                    className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-80 transition-opacity duration-500 origin-center"
                    style={{
                      background: `linear-gradient(to right, transparent, ${stat.shadowColor}, transparent)`,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

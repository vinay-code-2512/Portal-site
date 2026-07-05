"use client";

import { memo } from "react";
import { Briefcase, Users, Sparkles } from "lucide-react";

const stats = [
  {
    icon: Briefcase,
    value: "8+",
    label: "Years",
    title: "Years of Digital Experience",
    description:
      "We manage campaigns across industries with strategies built for real growth and performance.",
    gradient: "from-[var(--neon-purple)] to-[var(--neon-blue)]",
  },
  {
    icon: Users,
    value: "300+",
    label: "Clients",
    title: "Happy Clients",
    description:
      "From startups to scaling brands, we\u2019ve helped businesses achieve measurable success.",
    gradient: "from-[var(--neon-blue)] to-[var(--neon-purple)]",
  },
  {
    icon: Sparkles,
    value: "10+",
    label: "Experts",
    title: "Creative & Performance Team",
    description:
      "A dedicated team focused on building high-converting creatives and data-driven campaigns.",
    gradient: "from-[var(--neon-purple)] to-[var(--neon-blue)]",
  },
];

function GrowthStats() {
  return (
    <section className="!pt-2 section-spacing overflow-hidden">
      <div className="absolute top-1/3 left-[10%] w-[500px] h-[500px] bg-[var(--neon-purple)]/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-[10%] w-[450px] h-[450px] bg-[var(--neon-blue)]/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h3 className="heading-lg text-white text-center mb-4">
          Boost Your Digital Growth With Leading{" "}
          <span className="gradient-text">Performance Marketing Agency</span>
        </h3>

        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-14 text-[15px]">
          We combine data-driven strategies with creative excellence to deliver measurable results for your business.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {stats.map((item) => (
            <div
              key={item.title}
              className="group relative hover:-translate-y-2.5 transition-transform duration-300"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-br from-[var(--neon-purple)]/15 to-[var(--neon-blue)]/15 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full rounded-2xl border border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl overflow-hidden p-6 md:p-8">
                <div className="flex items-start gap-5 mb-5">
                  <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      background: "linear-gradient(135deg, rgba(181,0,255,0.2) 0%, rgba(0,240,255,0.1) 100%)",
                      border: "1px solid rgba(181,0,255,0.2)",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-purple)]/10 to-transparent" />
                    <item.icon className="w-6 h-6 text-[var(--neon-purple)] relative z-10" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span
                        className="text-3xl md:text-4xl font-black text-transparent bg-clip-text"
                        style={{
                          backgroundImage: "linear-gradient(135deg, var(--neon-purple), var(--neon-blue))",
                        }}
                      >
                        {item.value}
                      </span>
                      <span className="text-sm text-gray-500 font-medium">{item.label}</span>
                    </div>
                    <h4 className="text-white font-semibold text-[15px] leading-tight">
                      {item.title}
                    </h4>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-[var(--neon-purple)]/20 via-[var(--neon-blue)]/10 to-transparent mb-4" />

                <p className="text-gray-400 text-[14px] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(GrowthStats);

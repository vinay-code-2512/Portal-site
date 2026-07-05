"use client";

import { memo } from "react";
import Link from "next/link";
import { Layers, Bot, HeadphonesIcon, GraduationCap, ArrowRight } from "lucide-react";

const reasons = [
  {
    icon: Layers,
    title: "Real Projects",
    href: "/real-projects",
    description:
      "Build portfolio-ready work that impresses recruiters: briefs, dashboards, and models reviewed by industry experts.",
    details: [
      "Work on real-world briefs from actual companies and brands, giving you the experience recruiters look for.",
      "Build dashboards, marketing strategies, content calendars, and analytics reports that you can showcase in your portfolio.",
      "Get your work reviewed by industry experts who provide actionable feedback to help you improve.",
      "Every project is designed to simulate real job tasks, so you're job-ready from day one.",
      "Portfolio pieces are tailored to your target role — whether it's Digital Marketing, Data Analytics, or HR.",
    ],
    video: "/v1.mp4",
    alt: "Real projects and achievements award",
  },
  {
    icon: Bot,
    title: "AI Tools Training",
    href: "/ai-tools-training",
    description:
      "Master modern AI assistants and analytics tools to accelerate your work without compromising quality.",
    details: [
      "Learn to use ChatGPT, Claude, Gemini, and other AI assistants to automate repetitive tasks and focus on strategy.",
      "Master analytics platforms like Google Analytics, Meta Business Suite, and Tableau to derive data-driven insights.",
      "Understand prompt engineering — how to ask the right questions to get high-quality, usable outputs from AI.",
      "Learn the ethical use of AI in business: when to automate and when to apply human judgment.",
      "Get hands-on practice with AI tools for content creation, ad optimization, report generation, and campaign analysis.",
    ],
    video: "/z3.mp4",
    alt: "AI tools and technology training illustration",
  },
  {
    icon: HeadphonesIcon,
    title: "Interview Support",
    href: "/interview-support",
    description:
      "Mock interviews, salary coaching, and feedback until you are confident and role-ready.",
    details: [
      "Participate in 1-on-1 mock interviews tailored to your target role and industry.",
      "Receive detailed feedback on your answers, body language, and presentation style.",
      "Get salary negotiation coaching so you know your worth and how to communicate it.",
      "Unlimited interview practice sessions until you and your trainer feel confident.",
      "Access a curated list of commonly asked interview questions with model answers for your field.",
    ],
    video: "/v3.mp4",
    alt: "Interview preparation and career support",
  },
  {
    icon: GraduationCap,
    title: "Expert Trainers",
    href: "/expert-trainers",
    description:
      "Learn from mentors with real industry experience who know what interviewers actually want.",
    details: [
      "All trainers are industry professionals with 5+ years of hands-on experience in their domains.",
      "Learn practical insights that only come from working in the field — not just textbook theory.",
      "Trainers provide personalized mentorship and career guidance beyond just course material.",
      "Regular guest sessions from hiring managers and industry leaders to give you insider perspectives.",
      "Small batch sizes ensure every student gets individual attention and support throughout the program.",
    ],
    video: "/v5.mp4",
    alt: "Expert trainers and mentors guiding students",
  },
];

const skillsList = [
  "Website Development & Sales Funnel Creation",
  "Google Analytics 4 (GA4) & GTM Tracking",
  "SEO, GEO & AI Optimization",
  "Technical SEO & Schema Markup",
  "Google Ads & Performance Marketing",
  "Facebook & Instagram Advertising",
  "CRM & Marketing Automation",
  "HubSpot, Zoho, Zapier & WhatsApp AI",
  "ChatGPT, Gemini & AI Marketing Tools",
  "AI Content & Prompt Engineering",
  "Content & Video Marketing",
  "LinkedIn Growth & B2B Lead Gen",
  "Freelancing & Agency Building",
  "Client Acquisition & Growth Strategies",
  "Live Projects, Case Studies & ROI",
];

function SkillItem({ item }: { item: string }) {
  return (
    <div className="relative flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border border-[var(--neon-blue)]/20 bg-gradient-to-br from-[var(--neon-blue)]/[0.04] via-[#0a0a16] to-[var(--neon-purple)]/[0.04] text-gray-300 text-[12px] sm:text-[13px] cursor-default shadow-[0_0_20px_rgba(0,240,255,0.06),0_2px_12px_rgba(0,0,0,0.2)] overflow-hidden">
      <span className="relative z-10 font-medium tracking-wide leading-snug">{item}</span>
    </div>
  );
}

function WhyChooseUs() {
  return (
    <section id="why-choose-us" className="!pt-2 section-spacing !pb-4 sm:!pb-6 lg:!pb-8 overflow-hidden">
      <div className="absolute top-0 right-[10%] w-[min(90vw,500px)] h-[500px] bg-[var(--neon-purple)]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-[5%] w-[400px] h-[400px] bg-[var(--neon-blue)]/12 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full px-3 sm:px-4 md:px-6">
        <div className="text-center mb-4 md:mb-5">
          <h2 className="heading-lg text-white mb-1">
            Why Choose <span className="gradient-text">Robot Genie AI?</span>
          </h2>
          <div className="w-full">
            <div className="text-center max-w-4xl mx-auto mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--neon-purple)]/10 border border-[var(--neon-purple)]/20 text-[var(--neon-purple)] text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon-purple)]" />
                AI-Powered Curriculum
              </div>
              <p className="text-gray-300 leading-relaxed text-[15px]">
                The marketing industry is rapidly evolving with Artificial Intelligence transforming SEO, content creation, advertising, analytics, and customer engagement. Traditional marketing education is no longer enough. That&apos;s why we bring you the most practical digital marketing training in Delhi.
              </p>
              <div className="mt-5 flex items-center gap-3 justify-center">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--neon-purple)]/50" />
                <span className="text-xs italic text-gray-500">Sheer coincidence of you to find us.</span>
                
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--neon-purple)]/50" />
              </div>
            </div>

            <div className="w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {skillsList.map((item) => (
                  <SkillItem key={item} item={item} />
                ))}
              </div>
            </div>

            <p className="text-gray-500 text-center mt-4 mx-auto text-xs max-w-full">
              Our practical digital marketing training with live projects ensures students gain real-world experience before entering the job market.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {reasons.map((item) => (
            <Link key={item.title} href={item.href} className="block">
              <div className="glass-panel-hover p-6 sm:p-8 rounded-2xl text-center border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.25)] transition-all duration-300 cursor-pointer relative overflow-hidden h-full group">
                {item.video && (
                  <>
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-cover brightness-150 contrast-110"
                    >
                      <source src={item.video.replace('.mp4', '.webm')} type="video/webm" />
                      <source src={item.video} type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-purple)]/10 via-transparent to-[var(--neon-blue)]/10 transition-opacity duration-500" />
                  </>
                )}
                <div className="relative z-10">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--neon-blue)]/10 flex items-center justify-center mx-auto mb-4 transition-all duration-300">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--neon-purple)]/20 to-transparent blur-xl transition-opacity duration-300" />
                  <item.icon className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--neon-purple)] relative z-10 transition-colors duration-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-[14px] sm:text-[15px] leading-relaxed">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#contact"
            className="btn-primary flex items-center justify-center gap-2.5 px-8 py-4 w-full sm:w-auto"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default memo(WhyChooseUs);

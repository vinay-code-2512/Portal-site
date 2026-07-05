"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck, CheckCircle, AlertTriangle, Compass,
  FileEdit, Briefcase, Rocket, TrendingUp,
  Sparkles,
} from "lucide-react";
import {
  hiddenReveal,
  hiddenRevealUp,
  staggerDelay,
  transitionReveal,
  transitionRevealShort,
  viewportReveal,
  visibleReveal,
} from "@/lib/motion";

const agreementRules = [
  "Attend sessions responsibly",
  "Maintain respectful behavior",
  "Avoid sharing course materials illegally",
  "Complete assignments honestly",
  "Follow platform guidelines",
];

const outcomes = [
  {
    title: "Jobs",
    icon: Briefcase,
    description: "Gain job-ready digital marketing skills for roles like SEO specialist, social media manager, content strategist, and paid ads expert.",
    details: [
      "Build a strong portfolio that helps you crack interviews at agencies, startups, and brands",
      "Get trained on in-demand tools and platforms used by employers",
      "Receive placement guidance and mock interview preparation",
      "Connect with companies hiring digital marketing freshers and interns",
    ],
  },
  {
    title: "Freelancing",
    icon: Rocket,
    description: "Start your freelancing journey with platforms like Fiverr, Upwork, and Instagram to earn from anywhere with digital marketing skills.",
    details: [
      "Learn client acquisition, proposal writing, and pricing strategies",
      "Deliver high-quality digital marketing services from anywhere in the world",
      "Build a freelance portfolio that attracts paying clients",
      "Scale your income from ₹5K/month to ₹50K+ as you gain experience",
    ],
  },
  {
    title: "Business Marketing",
    icon: TrendingUp,
    description: "Master business marketing strategies to help brands grow their online presence, drive sales, and build a strong digital footprint.",
    details: [
      "Learn brand positioning, lead generation, and campaign management",
      "Track and optimize ROI using real-time analytics",
      "Create marketing funnels that convert visitors into customers",
      "Work with real businesses to build case studies for your profile",
    ],
  },
  {
    title: "Content Creation",
    icon: FileEdit,
    description: "Develop skills in creating engaging posts, reels, ad creatives, blogs, and video content that captures attention and drives engagement.",
    details: [
      "Master Canva, AI tools, and storytelling techniques",
      "Create content that captures audience attention and drives engagement",
      "Build a content portfolio across Instagram, YouTube, and blogs",
      "Monetize your content skills through brand collaborations",
    ],
  },
  {
    title: "AI-Powered Productivity",
    icon: Sparkles,
    description: "Leverage AI tools like ChatGPT, Google Gemini, and Canva AI to work 10x faster by automating content and optimization.",
    details: [
      "Automate content creation, captions, and marketing strategies with AI",
      "Generate high-quality copy, scripts, and ad creatives in seconds",
      "Use AI for data analysis, audience insights, and campaign optimization",
      "Stay ahead with the latest AI trends transforming digital marketing",
    ],
  },
  {
    title: "Digital Career Opportunities",
    icon: Compass,
    description: "Explore diverse career paths in the digital ecosystem and build a future-proof career across agencies.",
    details: [
      "From social media management and SEO to paid advertising and e-commerce",
      "Opportunities across agencies, startups, corporates, and self-employment",
      "Diverse income streams — salary, freelance, affiliate, and digital products",
      "A skill-based career that grows with experience and industry demand",
    ],
  },
];

export default function AdmissionAgreement() {
  return (
    <section className="overflow-hidden pt-2 pb-4 sm:pb-6 lg:pb-8 relative z-10">
      <div className="absolute top-1/3 left-[5%] w-[550px] h-[550px] bg-[var(--neon-blue)]/15 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-[5%] w-[500px] h-[500px] bg-[var(--neon-purple)]/12 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[var(--neon-blue)]/8 rounded-full blur-[200px] pointer-events-none" />

      <div className="w-full px-3 sm:px-4 md:px-6">
        <div className="text-center mb-4 md:mb-5">
          <motion.div
            initial={hiddenRevealUp}
            whileInView={visibleReveal}
            viewport={viewportReveal}
            transition={transitionReveal}
          >
            <div className="inline-flex items-center gap-1 mb-0">
              
            </div>
            <h2 className="heading-lg text-white mb-1">
              Admission <span className="gradient-text">Agreement</span>
            </h2>
            <p className="text-body text-gray-300 max-w-2xl mx-auto">
              Know Before You Enroll — Our Commitment to a Quality Learning Experience
            </p>
          </motion.div>
        </div>

        {/* Admission Agreement Card */}
        <motion.div
          initial={hiddenReveal}
          whileInView={visibleReveal}
          viewport={viewportReveal}
          transition={{ ...transitionRevealShort, delay: staggerDelay(0, 0.09) }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="relative max-w-3xl mx-auto mb-4 md:mb-5 p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl group hover:border-[var(--neon-blue)]/60 hover:shadow-[0_0_60px_rgba(0,240,255,0.25),0_0_120px_rgba(181,0,255,0.1),inset_0_0_80px_rgba(0,240,255,0.04)] transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent rounded-2xl pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full opacity-50" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[var(--neon-blue)]/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-purple)] flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">By enrolling in Robot Genie programs, students agree to:</p>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              {agreementRules.map((rule) => (
                <div key={rule} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--neon-blue)] shrink-0 mt-0.5" />
                  <span className="text-[15px] text-gray-300">{rule}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[14px] text-amber-300/90 leading-relaxed">
                Robot Genie reserves the right to suspend access for misconduct or policy violations.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Learning Outcome */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4 md:mb-5">
            <motion.div
              initial={hiddenRevealUp}
              whileInView={visibleReveal}
              viewport={viewportReveal}
              transition={transitionReveal}
            >
              <div className="inline-flex items-center gap-3 mb-1">

              </div>
              <h2 className="heading-lg text-white mb-1">
                Learning <span className="gradient-text">Outcome</span>
              </h2>
              <p className="text-body text-gray-300 max-w-2xl mx-auto">
                After completing the program, students gain practical industry-level skills that help them in:
              </p>
            </motion.div>
          </div>

          {/* Outcome cards — static */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {outcomes.map((outcome) => {
              const Icon = outcome.icon;
              const slugs: Record<string, string> = {
                "Jobs": "/jobs",
                "Freelancing": "/freelancing",
                "Business Marketing": "/business-marketing",
                "Content Creation": "/content-creation",
                "AI-Powered Productivity": "/ai-powered-productivity",
                "Digital Career Opportunities": "/digital-career-opportunities",
              };
              const href = slugs[outcome.title];
              const card = (
                <div
                  key={outcome.title}
                  className="relative rounded-xl border border-white/[0.06] bg-black/20 overflow-hidden p-4 sm:p-5 group hover:border-[var(--neon-blue)]/60 hover:shadow-[0_0_50px_rgba(0,240,255,0.4),0_0_100px_rgba(181,0,255,0.2),inset_0_0_60px_rgba(0,240,255,0.08)] hover:scale-[1.08] transition-all duration-300 aspect-auto"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-[var(--neon-blue)]/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="relative z-10 flex flex-col sm:flex-row items-start gap-2 sm:gap-4 h-full">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-[var(--neon-blue)]/20 to-[var(--neon-purple)]/20 flex items-center justify-center shrink-0 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] group-hover:from-[var(--neon-blue)]/30 group-hover:to-[var(--neon-purple)]/30 transition-all duration-300">
                      <Icon className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-[var(--neon-blue)]" />
                    </div>
                    <div className="min-w-0 flex flex-col flex-grow">
                      <span className="text-sm sm:text-base font-semibold text-white">{outcome.title}</span>
                      <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mt-1 line-clamp-3 sm:line-clamp-none">
                        {outcome.description}</p>
                    </div>
                  </div>
                </div>
              );
              return href ? (
                <Link key={outcome.title} href={href} className="block">
                  {card}
                </Link>
              ) : (
                card
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

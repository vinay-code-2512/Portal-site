"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import CourseCard from "./CourseCard";
import {
  hiddenReveal,
  hiddenRevealUp,
  staggerDelay,
  transitionReveal,
  transitionRevealShort,
  transitionTap,
  viewportReveal,
  visibleReveal,
} from "@/lib/motion";

const courses = [
  {
    id: 1,
    title: "Advanced Digital Marketing",
    description:
      "Build a full-funnel playbook: keyword research, on-page SEO, paid search and social, conversion tracking, and reporting with GA4.",
    duration: "3 Months",
    career: "Performance Marketing",
    href: "/courses/digital-marketing-diploma",
  },
  {
    id: 2,
    title: "Data Science & Data Analytics",
    description:
      "Move from statistics to supervised learning, model evaluation, and deployment concepts used in enterprise teams.",
    duration: "6 Months",
    career: "Data Scientist",
    href: "/courses/data-science-data-analytics",
  },
  {
    id: 3,
    title: "Finance",
    description:
      "Strengthen fundamentals in financial statements, budgeting, valuation basics, and Excel modeling.",
    duration: "2 Months",
    career: "Financial Analyst",
    href: "/courses/finance",
  },
  {
    id: 4,
    title: "HR Management",
    description:
      "Cover the employee lifecycle: sourcing, interviewing, compliance, and HR metrics that leadership cares about.",
    duration: "2 Months",
    career: "HR Generalist",
    href: "/courses/hr",
  },
  {
    id: 5,
    title: "AI Tools & Automation",
    description:
      "Learn AI-powered tools, workflow automation, ChatGPT, prompt engineering, productivity systems, and business automation used in modern digital industries.",
    duration: "3 Months",
    career: "AI Specialist",
    href: "/courses/ai-tools-automation",
  },
  {
    id: 6,
    title: "Digital Marketing Diploma",
    description:
      "Master SEO, paid advertising, social media marketing, lead generation, AI marketing tools, and performance campaigns used by modern brands and agencies.",
    duration: "9 Months",
    career: "Digital Marketing Executive",
    href: "/courses/digital-marketing-diploma-program",
  }
];

function CourseGrid() {
  return (
    <section id="courses" className="!pt-2 section-spacing !pb-4 sm:!pb-6 lg:!pb-8">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,800px)] h-[600px] bg-[var(--neon-blue)]/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full px-3 sm:px-4 md:px-6">
        <div className="text-center mb-4 md:mb-5">
          <motion.h2
            initial={hiddenRevealUp}
            whileInView={visibleReveal}
            viewport={viewportReveal}
            transition={transitionReveal}
            className="heading-lg text-white mb-1"
          >
            Courses offered <span className="gradient-text">by Robot Genie</span>
          </motion.h2>
          <motion.p
            initial={hiddenReveal}
            whileInView={visibleReveal}
            viewport={viewportReveal}
            transition={{ ...transitionRevealShort, delay: staggerDelay(1, 0.06) }}
            className="text-body text-gray-300 max-w-2xl mx-auto"
          >
            Industry-ready skills with job placement support
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={hiddenReveal}
              whileInView={visibleReveal}
              viewport={viewportReveal}
              transition={{ ...transitionRevealShort, delay: staggerDelay(course.id, 0.06) }}
            >
              <CourseCard {...course} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportReveal}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.a
            href="#contact"
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={transitionTap}
            className="btn-primary flex items-center justify-center gap-2.5 px-8 py-4 w-full sm:w-auto"
          >
            Get Course Details
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(CourseGrid);

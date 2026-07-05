"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, Star, Users, Award } from "lucide-react";
import {
  hiddenReveal,
  hiddenRevealUp,
  transitionReveal,
  transitionRevealShort,
  viewportReveal,
  visibleReveal,
} from "@/lib/motion";

export default function TopInstituteSection() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.phone) {
      setSubmitted(true);
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-12 md:pb-20">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--neon-purple)]/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--neon-blue)]/8 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          {/* Left - Content */}
          <motion.div
            initial={hiddenReveal}
            whileInView={visibleReveal}
            viewport={viewportReveal}
            transition={transitionReveal}
            className="lg:col-span-3"
          >
            <motion.p
              initial={hiddenReveal}
              whileInView={visibleReveal}
              viewport={viewportReveal}
              transition={{ ...transitionRevealShort, delay: 0.04 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--neon-purple)]/10 border border-[var(--neon-purple)]/20 text-[var(--neon-purple)] text-xs font-medium mb-4"
            >
              <Star className="w-3 h-3" />
              Top 10 Digital Marketing Institutes in Delhi
            </motion.p>

            <motion.h1
              initial={hiddenRevealUp}
              whileInView={visibleReveal}
              viewport={viewportReveal}
              transition={{ ...transitionReveal, delay: 0.06 }}
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.15] mb-4"
            >
              Robot Genie — Best Digital Marketing Course in Delhi
            </motion.h1>

            <motion.p
              initial={hiddenReveal}
              whileInView={visibleReveal}
              viewport={viewportReveal}
              transition={{ ...transitionRevealShort, delay: 0.08 }}
              className="text-lg text-[var(--neon-blue)] font-semibold mb-5"
            >
              AI-Powered Digital Marketing Course
            </motion.p>

            <motion.p
              initial={hiddenReveal}
              whileInView={visibleReveal}
              viewport={viewportReveal}
              transition={{ ...transitionRevealShort, delay: 0.1 }}
              className="text-gray-300 leading-relaxed text-[15px] mb-6"
            >
              Start your digital marketing course in Delhi with Robot Genie — the best digital marketing training institute in Delhi. We at Robot Genie understand the dreams of our students, and therefore, we are here to help them achieve their goals. The courses we offer are designed with you in mind, and we bring you real-live project training (no dummy projects), expert support, and hands-on training. No matter if you&rsquo;re starting from no experience or polishing your skills, Robot Genie is the place to go so you can get the right coaching. Take a Digital Marketing Course in Delhi with us and change your life.
            </motion.p>

            <motion.div
              initial={hiddenReveal}
              whileInView={visibleReveal}
              viewport={viewportReveal}
              transition={{ ...transitionRevealShort, delay: 0.12 }}
              className="flex flex-wrap gap-5 text-sm text-gray-400"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--neon-purple)]" />
                Live Projects
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--neon-purple)]" />
                Expert Trainers
              </span>
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[var(--neon-purple)]" />
                Placement Support
              </span>
            </motion.div>
          </motion.div>

          {/* Right - Lead Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportReveal}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-2"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-[var(--neon-purple)]/25 to-[var(--neon-blue)]/20 rounded-2xl blur-sm" />
              <div className="relative bg-[#0a0a0f]/90 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6 md:p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">Enroll Now</h3>
                  <p className="text-gray-400 text-[13px]">Fill the form to get free counselling</p>
                </div>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-white font-semibold">Thank You!</p>
                    <p className="text-gray-400 text-[13px] mt-1">We&rsquo;ll get back to you shortly.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[13px] text-gray-400 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[14px] placeholder:text-gray-500 focus:outline-none focus:border-[var(--neon-purple)]/50 focus:ring-1 focus:ring-[var(--neon-purple)]/30 transition-all"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-gray-400 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[14px] placeholder:text-gray-500 focus:outline-none focus:border-[var(--neon-purple)]/50 focus:ring-1 focus:ring-[var(--neon-purple)]/30 transition-all"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] text-gray-400 mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[14px] placeholder:text-gray-500 focus:outline-none focus:border-[var(--neon-purple)]/50 focus:ring-1 focus:ring-[var(--neon-purple)]/30 transition-all"
                        placeholder="Enter your phone"
                      />
                    </div>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(181,0,255,0.3)] hover:shadow-[0_8px_30px_rgba(181,0,255,0.4)] transition-all"
                    >
                      Send Message
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function UrgencyBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleApply = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 w-full z-[60] h-12 bg-gradient-to-r from-[#0f172a]/90 to-[#020617]/90 backdrop-blur-md border-b border-white/10"
    >
      <div className="flex items-center justify-between h-full max-w-7xl mx-auto px-4">
        <p className="text-sm text-gray-300 font-medium">
          Admissions closing soon | Limited seats available
        </p>
        
        <div className="flex items-center gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleApply}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm px-4 py-1.5 rounded-full hover:scale-105 transition-all duration-200"
          >
            Apply Now
          </motion.button>
          
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
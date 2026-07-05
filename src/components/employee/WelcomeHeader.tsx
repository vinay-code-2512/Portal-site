"use client";

import { motion } from "framer-motion";
import type { UserProfile } from "@/hooks/useCurrentUser";

interface WelcomeHeaderProps {
  profile: UserProfile | null;
  loading?: boolean;
}

const today = new Date();
const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
const dateStr = today.toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function WelcomeHeader({ profile, loading }: WelcomeHeaderProps) {
  const name = profile?.fullName || profile?.displayName || profile?.email?.split("@")[0] || "Employee";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white italic">
            Hello, <span className="bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary-glow)] bg-clip-text text-transparent">{name}</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {dayName}, {dateStr}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

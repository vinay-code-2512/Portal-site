"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login");
    }
  }, [loading, currentUser, router]);

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute top-1/3 -left-32 w-72 h-72 bg-[var(--neon-blue)]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-[var(--neon-purple)]/10 rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-white/[0.08] border-t-[var(--neon-blue)] border-r-[var(--neon-purple)] animate-spin" />
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-br from-[var(--neon-blue)]/5 to-[var(--neon-purple)]/5 blur-sm" />
          </div>
          <p className="text-gray-400 text-sm font-medium">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
}

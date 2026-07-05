"use client";

import { memo } from "react";
import { ShieldAlert } from "lucide-react";
import GlassCard from "@/components/dashboard/GlassCard";

interface Props {
  message?: string;
}

export default memo(function AccessDenied({ message }: Props) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <GlassCard className="max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
          <ShieldAlert className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Access Denied</h2>
        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
          {message || "You do not have permission to access this section. Contact your administrator if you believe this is a mistake."}
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 rounded-xl bg-[var(--color-primary-dim)] border border-[var(--color-primary)]/20 text-[var(--color-primary-light)] text-xs font-semibold hover:bg-[var(--color-primary-dim)] transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </GlassCard>
    </div>
  );
});

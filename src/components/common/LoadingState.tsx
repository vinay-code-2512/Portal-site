import { memo } from "react";

interface LoadingStateProps {
  variant?: "card" | "list" | "inline" | "page";
  count?: number;
}

export default memo(function LoadingState({ variant = "card", count = 1 }: LoadingStateProps) {
  if (variant === "page") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/[0.04] rounded-xl w-1/3" />
        <div className="h-32 bg-white/[0.04] rounded-[20px] w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="h-48 bg-white/[0.04] rounded-[20px]" />
          <div className="h-48 bg-white/[0.04] rounded-[20px]" />
        </div>
        <div className="h-36 bg-white/[0.04] rounded-[20px]" />
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-white/[0.04] rounded w-3/4" />
              <div className="h-2 bg-white/[0.04] rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-500 animate-pulse">
        <div className="w-4 h-4 rounded-full bg-white/[0.04]" />
        <div className="h-3 bg-white/[0.04] rounded w-24" />
      </div>
    );
  }

  return (
    <div className={`animate-pulse space-y-3 ${variant === "card" ? "p-5" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-lg bg-white/[0.04]" />
        <div className="w-8 h-3 bg-white/[0.04] rounded" />
      </div>
      <div className="h-8 bg-white/[0.04] rounded w-16" />
      <div className="h-3 bg-white/[0.04] rounded w-24" />
    </div>
  );
});

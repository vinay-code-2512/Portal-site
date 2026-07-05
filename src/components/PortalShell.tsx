import type { ReactNode } from "react";

interface PortalShellProps {
  children: ReactNode;
  className?: string;
}

export default function PortalShell({ children, className = "" }: PortalShellProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-[#07070a] text-[var(--foreground)] font-sans antialiased selection:bg-[#FFB300] selection:text-black ${className}`}>
      <div className="pointer-events-none absolute -left-[22%] top-0 h-[520px] w-[520px] rounded-full bg-amber-500/12" />
      <div className="pointer-events-none absolute right-0 top-[16%] h-[420px] w-[420px] rounded-full bg-rose-500/18" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

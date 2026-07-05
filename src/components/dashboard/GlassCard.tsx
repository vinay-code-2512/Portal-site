import { memo, type ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
}

export default memo(function GlassCard({ children, className = "", glow = false, hover = false }: GlassCardProps) {
  return (
    <div
      className={`hrms-glass rounded-[20px] p-5 ${
        hover ? "hrms-glass--hover" : ""
      } ${glow ? "hrms-glass--glow" : ""} ${className}`}
    >
      {children}
    </div>
  );
});

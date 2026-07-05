import { memo, type ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default memo(function SectionHeader({ title, description, action, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {description && <p className="text-xs text-zinc-500 mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
});

import { memo, type ReactNode } from "react";

export default memo(function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="portal-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center">{icon}</div>
        {highlight && <span className="w-2 h-2 rounded-full bg-[#FF8F00]" />}
      </div>
      <p className="text-2xl font-bold text-white">
        {value}
        {sub && <span className="text-xs text-zinc-500 font-normal ml-1">{sub}</span>}
      </p>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-1">{label}</p>
    </div>
  );
});

import { memo, type ReactNode } from "react";

export const MiniStat = memo(function MiniStat({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="portal-card p-4 text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="text-lg font-bold text-white leading-none">{value}</p>
      <p className="text-[9px] text-zinc-500 uppercase font-semibold mt-1">{label}</p>
    </div>
  );
});

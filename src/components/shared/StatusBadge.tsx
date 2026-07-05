import { memo } from "react";

export default memo(function StatusBadge({ status }: { status: "present" | "late" }) {
  return status === "late" ? (
    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FF8F00]/10 text-[#FF8F00] border border-[#FF8F00]/20">
      Late
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      Present
    </span>
  );
});

import { memo } from "react";

export default memo(function LeaveBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const styles = {
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    pending: "bg-[#FF8F00]/10 text-[#FF8F00] border-[#FF8F00]/20",
  };
  const labels = { approved: "Approved", rejected: "Rejected", pending: "Pending" };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
});

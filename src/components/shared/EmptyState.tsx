import { memo, type ReactNode } from "react";

export default memo(function EmptyState({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="text-zinc-700 mb-2">{icon}</div>
      <p className="text-xs text-zinc-500">{title}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
});

import { memo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default memo(function ErrorState({
  message = "Something went wrong",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-center ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <p className="text-sm text-zinc-400 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-purple-500/10 text-purple-300 text-xs font-semibold border border-purple-500/20 hover:bg-purple-500/20 transition-all cursor-pointer min-h-[40px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
});

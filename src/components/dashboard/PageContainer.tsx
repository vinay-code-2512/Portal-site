import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}

export default function PageContainer({ children, className = "", maxWidth = "1200px" }: PageContainerProps) {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 relative z-10" style={{ maxWidth }}>
      {children}
    </div>
  );
}

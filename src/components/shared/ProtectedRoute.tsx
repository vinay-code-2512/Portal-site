"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions, type UserRole } from "@/hooks/usePermissions";
import AccessDenied from "./AccessDenied";

interface Props {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export default function ProtectedRoute({ children, allowedRoles, fallback }: Props) {
  const { currentUser, loading: authLoading } = useAuth();
  const { role, loading: permLoading } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading || permLoading) return;
    if (!currentUser) {
      const role = pathname.startsWith("/employee") ? "employee" : "admin";
      router.replace(`/login?role=${role}`);
    }
  }, [currentUser, authLoading, permLoading, router, pathname]);

  if (authLoading || permLoading) {
    return (
      <div className="space-y-4 p-6 animate-pulse">
        <div className="h-6 w-48 bg-white/[0.04] rounded" />
        <div className="h-64 bg-white/[0.04] rounded-[20px]" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="space-y-4 p-6 animate-pulse">
        <div className="h-6 w-48 bg-white/[0.04] rounded" />
        <div className="h-64 bg-white/[0.04] rounded-[20px]" />
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return fallback || <AccessDenied />;
  }

  return <>{children}</>;
}

"use client";

import { type ReactNode } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { LayoutDashboard, BookOpen } from "lucide-react";
import FloatingChat from "@/components/FloatingChat";

const navItems = [
  { href: "/paid-user", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/paid-user/class", label: "Class", icon: <BookOpen className="w-4 h-4" /> },
];

export default function PaidUserLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["paid-user"]}>
      <DashboardLayout
        navItems={navItems}
        title="Student Portal"
        role="Student"
      >
        {children}
        <FloatingChat />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

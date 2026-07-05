"use client";

import { type ReactNode } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { User, BookOpen } from "lucide-react";

const navItems = [
  { href: "/dashboard/profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  { href: "/dashboard/classes", label: "Classes", icon: <BookOpen className="w-4 h-4" /> },
];

export default function DashboardPageLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["paid-user"]}>
      <DashboardLayout
        navItems={navItems}
        title="Dashboard"
        role="Student"
      >
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

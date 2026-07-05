"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import {
  LayoutDashboard,
  Users,
  Settings,
  Tag,
  CalendarDays,
  User,
  Clock,
  History,
  Briefcase,
  GraduationCap,
  BookOpen,
} from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/admin/employees", label: "Employees", icon: <Users className="w-4 h-4" /> },
  { href: "/admin/work", label: "Work", icon: <Briefcase className="w-4 h-4" /> },
  { href: "/admin/coupons", label: "Coupons", icon: <Tag className="w-4 h-4" /> },
  { href: "/admin/holidays", label: "Holidays", icon: <CalendarDays className="w-4 h-4" /> },
  { href: "/admin/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

function LayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDetails = pathname === "/admin/employees/details" || pathname.startsWith("/admin/employees/details/");
  const isAttendance = pathname === "/admin/employees/attendance" || pathname.startsWith("/admin/employees/attendance/");
  const isEmployeeWork = pathname === "/admin/employees/work" || pathname.startsWith("/admin/employees/work/");
  const isWorkPage = pathname === "/admin/work" || pathname.startsWith("/admin/work/");
  const isStudentDetails = pathname === "/admin/students/details" || pathname.startsWith("/admin/students/details/");
  const employeeId = searchParams.get("id");
  const tabParam = searchParams.get("tab");

  const currentTab = isStudentDetails
    ? tabParam || "profile"
    : isDetails
    ? tabParam || "profile"
    : isAttendance
    ? tabParam || "today"
    : isEmployeeWork
    ? tabParam || "today"
    : undefined;

  const navItems = isStudentDetails && employeeId
    ? [
        { href: `/admin/students/details?id=${employeeId}&tab=profile`, label: "Profile", icon: <User className="w-4 h-4" /> },
        { href: `/admin/students/details?id=${employeeId}&tab=class`, label: "Class", icon: <BookOpen className="w-4 h-4" /> },
      ]
    : isDetails && employeeId
    ? [
        { href: `/admin/employees/details?id=${employeeId}&tab=profile`, label: "Profile", icon: <User className="w-4 h-4" /> },
        { href: `/admin/employees/attendance?id=${employeeId}&tab=today`, label: "Attendance", icon: <Clock className="w-4 h-4" /> },
        { href: `/admin/employees/work?id=${employeeId}&tab=today`, label: "Work", icon: <Briefcase className="w-4 h-4" /> },
      ]
    : isAttendance && employeeId
    ? [
        { href: `/admin/employees/attendance?id=${employeeId}&tab=today`, label: "Today", icon: <Clock className="w-4 h-4" /> },
        { href: `/admin/employees/attendance?id=${employeeId}&tab=weekly`, label: "Weekly", icon: <CalendarDays className="w-4 h-4" /> },
        { href: `/admin/employees/attendance?id=${employeeId}&tab=history`, label: "History", icon: <History className="w-4 h-4" /> },
      ]
    : isEmployeeWork && employeeId
    ? [
        { href: `/admin/employees/work?id=${employeeId}&tab=today`, label: "Today", icon: <Clock className="w-4 h-4" /> },
        { href: `/admin/employees/work?id=${employeeId}&tab=weekly`, label: "Weekly", icon: <CalendarDays className="w-4 h-4" /> },
        { href: `/admin/employees/work?id=${employeeId}&tab=history`, label: "History", icon: <History className="w-4 h-4" /> },
      ]
    : adminNavItems;

  return (
    <DashboardLayout
      navItems={navItems}
      title={isStudentDetails ? "Student Details" : isDetails ? "Employee Details" : isAttendance ? "Attendance" : isEmployeeWork ? "Work" : isWorkPage ? "Work" : "Admin"}
      role="Administrator"
      currentTab={currentTab}
    >
      {children}
    </DashboardLayout>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <Suspense fallback={null}>
        <LayoutInner>{children}</LayoutInner>
      </Suspense>
    </ProtectedRoute>
  );
}

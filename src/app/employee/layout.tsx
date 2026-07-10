"use client";

import { useState, useEffect, type ReactNode } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import ActivityConfirmationProvider from "@/components/employee/ActivityConfirmationProvider";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import FloatingChat from "@/components/FloatingChat";
import {
  LayoutDashboard,
  CalendarOff,
  History,
  CalendarDays,
  ClipboardList,
  Briefcase,
  Video,
} from "lucide-react";
import type { NavItem } from "@/components/dashboard/TopNavbar";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const { currentUser, userData } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    if (pathname === "/employee/work") {
      localStorage.setItem("lastVisitedWork", Date.now().toString());
    }

    const taskQuery = query(
      collection(db, "tasks"),
      where("employeeId", "==", currentUser.uid),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(taskQuery, (snap) => {
      const lastVisitedStr = localStorage.getItem("lastVisitedWork");
      const lastVisited = lastVisitedStr ? parseInt(lastVisitedStr, 10) : 0;

      let count = 0;
      snap.forEach((d) => {
        const data = d.data();
        const createdAt = data.createdAt;
        if (createdAt?.toDate) {
          if (createdAt.toDate().getTime() > lastVisited) {
            count++;
          }
        }
      });

      setUnreadCount(count);
    });

    return () => unsub();
  }, [currentUser, pathname]);

  const navItems: NavItem[] = [
    { href: "/employee", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/employee/work", label: "Work", icon: <Briefcase className="w-4 h-4" />, badge: unreadCount > 0 ? unreadCount : undefined },
    { href: "/employee/attendance", label: "History", icon: <History className="w-4 h-4" /> },
    { href: "/employee/leaves", label: "Leaves", icon: <CalendarOff className="w-4 h-4" /> },
    { href: "/employee/activities", label: "Activities", icon: <ClipboardList className="w-4 h-4" /> },
    { href: "/employee/holidays", label: "Holidays", icon: <CalendarDays className="w-4 h-4" /> },
    ...((userData as any)?.canManageClasses ? [{ href: "/employee/manage-classes", label: "Manage Classes", icon: <Video className="w-4 h-4" /> }] : []),
  ];

  return (
    <ProtectedRoute allowedRoles={["admin", "manager", "employee"]}>
      <DashboardLayout
        navItems={navItems}
        title="Employee Portal"
        role="Employee"
      >
        <ActivityConfirmationProvider>
          {children}
          <FloatingChat />
        </ActivityConfirmationProvider>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

"use client";

import "../../app/portal.css";
import { useState, type ReactNode } from "react";
import TopNavbar from "./TopNavbar";
import type { NavItem } from "./TopNavbar";

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
  brand?: string;
  role?: string;
  currentTab?: string;
}

export default function DashboardLayout({
  children,
  navItems,
  title,
  brand = "Robot Genie",
  role = "HRMS",
  currentTab,
}: DashboardLayoutProps) {
  const isEmployee = role.toLowerCase() === "employee";
  const logoHref = role === "Administrator" ? "/admin" : role === "Employee" ? "/employee" : role === "Student" ? "/paid-user" : "/";

  return (
    <div className="employee-theme hrms-portal min-h-screen flex">
      <div className="hrms-mesh" />
      <div className="hrms-glow hrms-glow--a" />
      <div className="hrms-glow hrms-glow--b" />

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <TopNavbar
          title={title}
          items={navItems}
          brand={brand}
          role={role}
          logoHref={logoHref}
          currentTab={currentTab}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-6 lg:pb-8">
          <div className="mx-auto" style={{ maxWidth: "1200px" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import {
  User, Info, Briefcase, CalendarCheck, CalendarDays, Wallet, FileText, Settings,
} from "lucide-react";

export type ProfileTab = "overview" | "personal" | "employment" | "attendance" | "leaves" | "payroll" | "documents" | "settings";

interface ProfileSidebarProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

interface NavItem {
  key: ProfileTab;
  label: string;
  icon: typeof User;
}

const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Overview", icon: User },
  { key: "personal", label: "Personal Info", icon: Info },
  { key: "employment", label: "Employment", icon: Briefcase },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "leaves", label: "Leaves", icon: CalendarDays },
  { key: "payroll", label: "Payroll", icon: Wallet },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function ProfileSidebar({ activeTab, onTabChange }: ProfileSidebarProps) {
  return (
    <nav className="space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-left ${
              isActive
                ? "bg-[var(--color-primary-dim)] text-[var(--color-primary)] border border-[var(--color-primary-light)]/20 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-white/30 border border-transparent"
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

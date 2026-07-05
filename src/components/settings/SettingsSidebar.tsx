"use client";

import {
  LayoutDashboard, Building2, Shield, Lock, Bell, User, History, Settings2, Building, Briefcase, ShieldCheck,
} from "lucide-react";

export type SettingsTab = "dashboard" | "company" | "roles" | "permissions" | "security" | "notifications" | "profile" | "audit" | "preferences" | "departments" | "designations";

interface NavItem {
  key: SettingsTab;
  label: string;
  icon: typeof Building2;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "company", label: "Company", icon: Building2 },
  { key: "roles", label: "Roles", icon: Shield },
  { key: "permissions", label: "Permissions", icon: ShieldCheck },
  { key: "security", label: "Security", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "profile", label: "Profile", icon: User },
  { key: "audit", label: "Audit Logs", icon: History },
  { key: "departments", label: "Departments", icon: Building },
  { key: "designations", label: "Designations", icon: Briefcase },
  { key: "preferences", label: "Preferences", icon: Settings2 },
];

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export default function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
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

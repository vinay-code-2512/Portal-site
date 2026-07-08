"use client";

import { useCallback, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface SidebarProps {
  items: NavItem[];
  collapsed: boolean;
  onToggle: () => void;
  brand: string;
  role: string;
}

export default function Sidebar({ items, collapsed, onToggle, brand, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    window.location.href = "/login";
  }, []);

  const active = (href: string) => {
    const qIdx = href.indexOf('?');
    const cleanHref = qIdx === -1 ? href : href.slice(0, qIdx);
    if (cleanHref === '/admin' || cleanHref === '/employee') {
      return pathname === cleanHref || pathname === cleanHref + '/';
    }
    if (!(pathname === cleanHref || pathname.startsWith(cleanHref + "/"))) return false;
    if (qIdx !== -1) {
      const hrefTab = new URLSearchParams(href.slice(qIdx + 1)).get('tab');
      if (hrefTab && typeof window !== 'undefined') {
        return new URLSearchParams(window.location.search).get('tab') === hrefTab;
      }
    }
    return true;
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="hidden lg:flex flex-col shrink-0 border-r border-[var(--color-primary)]/10 bg-[#0a0a0f]/90 min-h-screen relative z-20 overflow-hidden"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 h-16 border-b border-[var(--color-primary)]/10 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center shadow-[0_0_20px_var(--color-primary-glow)] shrink-0">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-white truncate leading-tight">{brand}</h1>
              <p className="text-[9px] text-[var(--color-primary-light)] uppercase tracking-widest font-semibold truncate">{role}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = active(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-[var(--color-primary-dim)] text-white border border-[var(--color-primary)]/20"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-gradient-to-b from-[var(--color-primary-light)] to-[var(--color-primary)] shadow-[0_0_12px var(--color-primary-glow)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                  isActive
                    ? "text-white"
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}>
                  {item.icon}
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[var(--color-primary-dim)]" />
                  )}
                </span>
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-[var(--color-primary)]/10 space-y-1">
          <button
            onClick={onToggle}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0">
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </span>
            {!collapsed && <span className="text-sm">{collapsed ? "Expand" : "Collapse"}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-red-300 hover:bg-red-400/10 transition-all duration-200 cursor-pointer"
            title="Sign Out"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0">
              <LogOut className="w-4 h-4" />
            </span>
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
          {!collapsed && (
            <p className="text-[9px] text-zinc-700 text-center pt-2">HRMS v1.0</p>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

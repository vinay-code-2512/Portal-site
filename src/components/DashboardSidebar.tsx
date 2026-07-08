"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { useScrollLock } from "@/lib/useScrollLock";
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  X,
} from "lucide-react";

const sidebarItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  useScrollLock(open);
  const { currentUser } = useAuth();

  const handleLogout = useCallback(() => {
    window.location.href = "https://www.robotgenie.in/login/";
    onClose();
    signOut(auth);
  }, [onClose, router]);

  const isActive = (href: string) => pathname === href;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/[0.06]">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-1">
          <Image
            src="/RGLogo.png"
            alt="Robot Genie"
            width={36}
            height={45}
            sizes="36px"
            className="h-auto"
            style={{ width: 36 }}
          />
          <span className="font-bold text-lg text-white">
            Robot<span className="gradient-text">Genie</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative group ${
                active
                  ? "text-[var(--neon-blue)] bg-[var(--neon-blue)]/10 border border-[var(--neon-blue)]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{item.label}</span>
              {active && (
                <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[var(--neon-blue)] shadow-[0_0_6px_rgba(0,240,255,0.7)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        {currentUser && (
          <div className="px-3.5 py-2.5 mb-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-purple)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(currentUser.displayName || currentUser.email || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {currentUser.displayName || "Learner"}
                </p>
                <p className="text-gray-500 text-[10px] truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all duration-300"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/[0.06] bg-[#05050f]/60 backdrop-blur-xl min-h-screen">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-72 z-50 bg-[#05050f] border-r border-white/[0.06] lg:hidden"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

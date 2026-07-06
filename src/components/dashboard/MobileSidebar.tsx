"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useScrollLock } from "@/lib/useScrollLock";
import { X, LogOut, LayoutDashboard } from "lucide-react";
import type { NavItem } from "./Sidebar";

interface MobileSidebarProps {
  items: NavItem[];
  open: boolean;
  onClose: () => void;
  brand: string;
  role: string;
}

export default function MobileSidebar({ items, open, onClose, brand, role }: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  useScrollLock(open);

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

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "https://www.robotgenie.in/login/";
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden max-h-[85vh] rounded-t-2xl bg-[#0a0a0f] border-t border-[var(--color-primary)]/15 overflow-hidden"
          >
            <div className="flex flex-col h-full max-h-[85vh]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-primary)]/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center shadow-[0_0_16px_var(--color-primary-glow)] shrink-0">
                    <LayoutDashboard className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{brand}</p>
                    <p className="text-[8px] text-[var(--color-primary-light)] uppercase tracking-widest font-semibold">{role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto" />
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {items.map((item) => {
                  const isActive = active(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 ${
                        isActive
                          ? "bg-[var(--color-primary-dim)] text-white border border-[var(--color-primary)]/20"
                          : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent"
                      }`}
                    >
                      <span className={`relative flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                        isActive ? "text-[var(--color-primary-light)]" : "text-zinc-500"
                      }`}>
                        {item.icon}
                        {item.badge != null && item.badge > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[var(--color-primary-dim)]" />
                        )}
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)] shadow-[0_0_8px_var(--color-primary-glow)]" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-[var(--color-primary)]/10 shrink-0">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-red-300 hover:bg-red-400/10 transition-all duration-200 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

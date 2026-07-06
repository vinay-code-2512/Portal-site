"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, updateProfile } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Bell,
  LogOut,
  Search,
  Camera,
  Loader2,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface TopNavbarProps {
  title: string;
  items?: NavItem[];
  brand?: string;
  role?: string;
  onMenuClick?: () => void;
  currentTab?: string;
  logoHref?: string;
}

function isMeetingInFuture(meeting: MeetingNotification) {
  if (!meeting.date || !meeting.time) return true;
  const [year, month, day] = meeting.date.split("-").map(Number);
  const [timeStr, period] = meeting.time.split(" ");
  let [hours, minutes] = timeStr.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(start.getTime() + (meeting.duration || 60) * 60000);
  return end > new Date();
}

interface MeetingNotification {
  id: string;
  topic: string;
  link: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  participants: { uid: string; fullName: string; email: string }[];
}

export default function TopNavbar({ title, items, brand, role, onMenuClick, currentTab, logoHref = "/" }: TopNavbarProps) {
  const { currentUser, userData } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<MeetingNotification[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const uploadMsgTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const visibleNotifications = notifications.filter(n => isMeetingInFuture(n));

  // Audio ref for notification sound
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlocked = useRef(false);

  // Unlock audio on first user click (browser autoplay policy workaround)
  useEffect(() => {
    const unlock = () => {
      if (!audioRef.current || audioUnlocked.current) return;
      audioRef.current.volume = 0;
      audioRef.current.play().then(() => {
        audioRef.current!.pause();
        audioRef.current!.currentTime = 0;
        audioRef.current!.volume = 1;
        audioUnlocked.current = true;
      }).catch(() => {});
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("click", unlock, { once: true });
    return () => document.removeEventListener("click", unlock);
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Play notification sound when a new notification arrives
  const prevCountRef = useRef(-1);
  useEffect(() => {
    if (prevCountRef.current === -1) {
      prevCountRef.current = visibleNotifications.length;
      return;
    }
    if (visibleNotifications.length > prevCountRef.current && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      const timer = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }, 6000);
    }
    prevCountRef.current = visibleNotifications.length;
  }, [visibleNotifications.length]);

  // Load notifications for the logged-in employee in real-time
  useEffect(() => {
    if (!currentUser) return;

    const unsub = onSnapshot(collection(db, "meetings"), (snap) => {
      const list: MeetingNotification[] = [];
      snap.forEach((d) => {
        const data = d.data();
        const participants = data.participants || [];
        
        // Filter: employee is in participants and meeting status is "sent"
        const isParticipant = participants.some(
          (p: any) => p.uid === currentUser.uid || p.email?.toLowerCase() === currentUser.email?.toLowerCase()
        );

        if (isParticipant && data.status === "sent") {
          list.push({
            id: d.id,
            topic: data.topic || "",
            link: data.link || "",
            date: data.date || "",
            time: data.time || "",
            duration: data.duration || 60,
            status: data.status || "",
            participants,
          });
        }
      });
      // Sort descending by id
      list.sort((a, b) => b.id.localeCompare(a.id));
      setNotifications(list);
    }, (err) => {
      console.error("Failed to fetch meeting notifications:", err);
    });

    return () => unsub();
  }, [currentUser]);

  const handleNotificationClick = (meeting: MeetingNotification) => {
    window.open(meeting.link, "_blank");
  };

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    window.location.href = "https://www.robotgenie.in/login/";
  }, []);

  async function handlePhotoUpload(file: File) {
    if (!currentUser) return;
    if (!file.type.startsWith("image/")) {
      setUploadMsg({ type: "error", text: "Please select an image file" });
      if (uploadMsgTimer.current) clearTimeout(uploadMsgTimer.current);
      uploadMsgTimer.current = setTimeout(() => setUploadMsg(null), 3000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadMsg({ type: "error", text: "File too large (max 5MB)" });
      if (uploadMsgTimer.current) clearTimeout(uploadMsgTimer.current);
      uploadMsgTimer.current = setTimeout(() => setUploadMsg(null), 3000);
      return;
    }
    setUploading(true);
    setUploadMsg(null);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 15000)
    );

    try {
      const ref = storageRef(storage, `profile-images/${currentUser.uid}`);
      await Promise.race([uploadBytes(ref, file), timeout]);
      const url = await Promise.race([getDownloadURL(ref), timeout]);
      await Promise.race([updateProfile(currentUser, { photoURL: url }), timeout]);
      setUploadMsg({ type: "success", text: "Photo updated!" });
      if (uploadMsgTimer.current) clearTimeout(uploadMsgTimer.current);
      uploadMsgTimer.current = setTimeout(() => setUploadMsg(null), 3000);
    } catch (e: any) {
      console.error("Upload failed:", e);
      if (e?.message === "timeout") {
        setUploadMsg({
          type: "error",
          text: "Upload timed out. Firebase Storage may not be enabled — please enable it in the Firebase Console.",
        });
      } else {
        const msg =
          e?.code === "storage/unauthorized"
            ? "Upload denied — Firebase Storage rules may need updating."
            : "Upload failed. Check console for details.";
        setUploadMsg({ type: "error", text: msg });
      }
      if (uploadMsgTimer.current) clearTimeout(uploadMsgTimer.current);
      uploadMsgTimer.current = setTimeout(() => setUploadMsg(null), 6000);
    } finally {
      setUploading(false);
    }
  }

  const initials = userData?.fullName
    ? userData.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : currentUser?.displayName
    ? currentUser.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : currentUser?.email?.charAt(0).toUpperCase() || "U";

  const isActive = (href: string) => {
    const qIdx = href.indexOf('?');
    const cleanHref = qIdx === -1 ? href : href.slice(0, qIdx);
    if (cleanHref === '/admin' || cleanHref === '/employee' || cleanHref === '/paid-user') {
      return pathname === cleanHref || pathname === cleanHref + '/';
    }
    if (!(pathname === cleanHref || pathname.startsWith(cleanHref + "/"))) return false;
    if (qIdx !== -1) {
      const hrefTab = new URLSearchParams(href.slice(qIdx + 1)).get('tab');
      if (hrefTab !== null) {
        return currentTab === hrefTab;
      }
    }
    return true;
  };

  return (
    <>
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      <header className="sticky top-0 z-30 border-b border-[var(--color-primary)]/10 bg-[#0a0a0f]/80 backdrop-blur-xl shrink-0">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left — Logo */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          {brand && (
            <Link href={logoHref} className="flex items-center">
              <img src="/RGLogo.png" alt="Robot Genie" className="h-28 w-auto shrink-0" />
            </Link>
          )}
          {!brand && (
            <h1 className="text-base font-bold text-white truncate">{title}</h1>
          )}
        </div>

        {/* Center — Search + Nav */}
        <div className="hidden lg:flex items-center gap-4 flex-1 justify-center mx-6">
          {/* Search Bar */}
          <div className="relative w-56 xl:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/[0.06] border border-purple-400/25 text-xs text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:border-purple-400/60 focus:bg-white/[0.08] transition-all duration-200"
            />
          </div>

          {/* Nav Items */}
          {items && items.length > 0 && (
            <nav className="flex items-center bg-[var(--color-primary-dim)] rounded-xl p-1.5 border border-[var(--color-primary)]/20 gap-1">
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                      active
                        ? "bg-[var(--color-primary-dim)] text-white border border-[var(--color-primary)]/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>
                    {item.label}
                    {item.badge != null && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[var(--color-primary-dim)]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right — Bell + Divider + Name + Badge + Avatar + Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!pathname?.startsWith("/paid-user") && (
            <div 
              className="relative"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <button className="relative w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-[var(--color-primary)]/30 transition-all duration-200 cursor-pointer">
                <Bell className="w-4 h-4" />
                {visibleNotifications.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1">
                    {visibleNotifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3.5 border-b border-zinc-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-800 tracking-wide uppercase">Meeting Notifications</span>
                      {visibleNotifications.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          {visibleNotifications.length} New
                        </span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
                      {visibleNotifications.length > 0 ? (
                        visibleNotifications.map((meeting) => (
                          <div
                            key={meeting.id}
                            onClick={() => handleNotificationClick(meeting)}
                            className="p-4 hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer text-left space-y-1.5 group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-zinc-800 group-hover:text-purple-600 transition-colors line-clamp-2 leading-normal">
                                {meeting.topic}
                              </h4>
                              <span className="shrink-0 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 border border-purple-500/15">
                                Meeting
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold">
                              <span className="truncate">{meeting.date} at {meeting.time}</span>
                            </div>
                            <p className="text-[9.5px] text-purple-600 group-hover:text-purple-700 font-medium transition-colors">
                              Click to join meeting
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
                          <Bell className="w-6 h-6 text-zinc-400 opacity-60" />
                          <p className="text-[11px] font-bold text-zinc-500">No new meeting notifications</p>
                          <p className="text-[9px] font-medium text-zinc-500">You are all caught up!</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="w-px h-6 bg-zinc-400" />

          <div className="flex items-center gap-3">
            {/* User Name & Role Badge */}
            <div className="hidden sm:flex flex-col items-end justify-center">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                {userData?.fullName || currentUser?.displayName || currentUser?.email?.split("@")[0] || "User"}
              </span>
              <span className="text-[8.5px] text-[var(--color-primary-light)] uppercase tracking-widest font-extrabold px-1.5 py-0.5 rounded bg-[var(--color-primary-dim)] border border-[var(--color-primary)]/15 mt-0.5 leading-none">
                {role || "User"}
              </span>
            </div>

            {/* User Profile Image with Upload Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  if (pathname?.startsWith("/paid-user")) {
                    router.push("/paid-user/profile");
                  } else {
                    setProfileOpen((p) => !p);
                  }
                }}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-xs font-bold text-white shadow-sm overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (userData?.photoURL || currentUser?.photoURL) ? (
                  <img src={userData?.photoURL || currentUser?.photoURL || undefined} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </button>

              <AnimatePresence>
                {profileOpen && !pathname?.startsWith("/paid-user") && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-zinc-200 shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3.5 bg-gradient-to-br from-indigo-600 to-purple-600">
                      <span className="text-xs font-bold text-white tracking-wide uppercase">Profile</span>
                    </div>

                    <div className="flex flex-col items-center gap-3 p-4">
                      <div className="relative">
                        {(userData?.photoURL || currentUser?.photoURL) ? (
                          <img
                            src={userData?.photoURL || currentUser?.photoURL || undefined}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover border-2 border-zinc-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white text-2xl font-bold">
                            {uploading ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <span className="text-lg">{initials}</span>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white border border-zinc-300 flex items-center justify-center hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                          <Camera className="w-3 h-3 text-zinc-600" />
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(file);
                          e.target.value = "";
                        }}
                      />
                      {uploadMsg && (
                        <p className={`text-xs text-center ${uploadMsg.type === "success" ? "text-green-600" : "text-red-500"}`}>
                          {uploadMsg.text}
                        </p>
                      )}
                      <div className="text-center">
                        <span className="text-sm font-semibold text-zinc-800 block">
                          {currentUser?.displayName || currentUser?.email?.split("@")[0] || "User"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">
                          {currentUser?.email || ""}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sign Out Icon */}
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-600 transition-all duration-200 cursor-pointer"
              style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {items && items.length > 0 && (
        <nav className="lg:hidden flex items-center overflow-x-auto bg-[var(--color-primary-dim)] rounded-xl mx-4 mb-2 p-1.5 border border-[var(--color-primary)]/20 gap-3">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 whitespace-nowrap ${
                  active
                    ? "bg-[var(--color-primary-dim)] text-white border border-[var(--color-primary)]/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[var(--color-primary-dim)]" />
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
    </>
  );
}

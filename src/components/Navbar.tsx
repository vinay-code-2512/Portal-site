"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import Image from "next/image";
import { Menu, X, LogOut, LogIn, UserPlus, Pencil, Camera, Check, X as XIcon, Loader2 } from "lucide-react";
import { useScrollLock } from "@/lib/useScrollLock";

const linkClass =
  "text-gray-300 hover:text-white transition-colors duration-300 relative py-1";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, userData, loading } = useAuth();

  if (pathname?.startsWith("/employee") || pathname?.startsWith("/admin") || pathname?.startsWith("/paid-user")) return null;

  const isActive = (href: string) => {
    if (href.startsWith("#")) return false;
    return pathname === href;
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useScrollLock(isMenuOpen);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const uploadMsgTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  async function handleLogout() {
    const [{ signOut }, { auth }] = await Promise.all([
      import("firebase/auth"),
      import("@/lib/firebase"),
    ]);
    await signOut(auth);
    closeMenu();
    router.push("/");
  }

  const userInitial = userData?.fullName
    ? userData.fullName.charAt(0).toUpperCase()
    : currentUser?.displayName
    ? currentUser.displayName.charAt(0).toUpperCase()
    : currentUser?.email?.charAt(0).toUpperCase() || "?";

  const displayName = userData?.fullName
    ? userData.fullName
    : currentUser?.displayName
    ? currentUser.displayName
    : currentUser?.email?.split("@")[0] || "";

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
      const [{ ref: storageRef, uploadBytes, getDownloadURL }, { updateProfile }, { storage }] =
        await Promise.all([
          import("firebase/storage"),
          import("firebase/auth"),
          import("@/lib/firebase"),
        ]);
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

  async function handleNameSave() {
    if (!currentUser || !newName.trim()) return;
    const { updateProfile } = await import("firebase/auth");
    await updateProfile(currentUser, { displayName: newName.trim() });
    setEditingName(false);
  }

  function handleNameCancel() {
    setEditingName(false);
    setNewName("");
  }

  function startEditingName() {
    setNewName(displayName);
    setEditingName(true);
  }

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 border border-transparent bg-[#05050f]/95 animate-navbar-fade">
        <div className="light-beam" />
        <div className="w-full px-4 sm:px-6 md:px-8 h-20 flex items-center justify-between">
          <div className="hover-scale-subtle">
            <Link href="/" className="flex flex-col items-center gap-0 group" onClick={closeMenu}>
              <Image
                src="/RGLogo.png"
                alt="Robot Genie"
                width={144}
                height={144}
                sizes="144px"
                priority
              />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-10 min-h-[52px]">
            {[
              { href: "/", label: "Home" },
              { href: "/placements", label: "Placements" },
            ].map((item) => {
              const active = isActive(item.href);
              return (
                <span key={item.href} className="relative hover-lift">
                  {active && (
                    <span className="absolute -inset-3 bg-[var(--neon-blue)]/10 rounded-full blur-md" />
                  )}
                  <Link
                    href={item.href}
                    className={`${linkClass} group ${active ? "!text-white" : ""}`}
                  >
                    {item.label}
                    <span
                      className={`absolute -bottom-1 left-0 h-px bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)] transition-all duration-300 ${
                        active
                          ? "w-full shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                          : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                </span>
              );
            })}

            <div className="relative group">
              <span className="relative hover-lift">
                {isActive("/courses") && (
                  <span className="absolute -inset-3 bg-[var(--neon-blue)]/10 rounded-full blur-md" />
                )}
                <button
                  type="button"
                  aria-label="Courses dropdown"
                  className={`${linkClass} group/link cursor-pointer text-left ${isActive("/courses") ? "!text-white" : ""}`}
                >
                  Courses
                  <span
                    className={`absolute -bottom-1 left-0 h-px bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)] transition-all duration-300 ${
                      isActive("/courses")
                        ? "w-full shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                        : "w-0 group-hover/link:w-full"
                    }`}
                  />
                </button>
              </span>

              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                <div className="bg-[#0a0a1a]/95 border border-white/10 rounded-xl p-1.5 shadow-xl backdrop-blur-xl min-w-[220px]">
                  <Link
                    href="/courses"
                    className="block px-4 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm"
                  >
                    Digital Marketing Course
                  </Link>
                </div>
              </div>
            </div>

            {[
              { href: "/affiliated-colleges", label: "Affiliated Colleges" },
              { href: "/about", label: "About Us" },
              { href: "/contact", label: "Contact" },
            ].map((item) => {
              const active = isActive(item.href);
              return (
                <span key={item.href} className="relative hover-lift">
                  {active && (
                    <span className="absolute -inset-3 bg-[var(--neon-blue)]/10 rounded-full blur-md" />
                  )}
                  <Link
                    href={item.href}
                    className={`${linkClass} group ${active ? "!text-white" : ""}`}
                  >
                    {item.label}
                    <span
                      className={`absolute -bottom-1 left-0 h-px bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)] transition-all duration-300 ${
                        active
                          ? "w-full shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                          : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                </span>
              );
            })}

        <span className="relative hover-lift">
          <Link
            href="/blog"
            className={`${linkClass} group`}
            onClick={closeMenu}
          >
            Blog
            <span
              className={`absolute -bottom-1 left-0 h-px bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)] transition-all duration-300 w-0 group-hover:w-full`}
            />
          </Link>
        </span>

            <div className="flex items-center gap-3 min-w-[200px] justify-end" style={loading ? { visibility: 'hidden' } : undefined}>
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="relative" ref={profileRef}>
                    <button
                      type="button"
                      onClick={() => setProfileOpen((p) => !p)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.06] transition-colors cursor-pointer hover-scale-subtle"
                    >
                      {(userData?.photoURL || currentUser?.photoURL) ? (
                        <Image
                          src={userData?.photoURL || currentUser?.photoURL || ""}
                          alt="Profile"
                            width={32}
                            height={32}
                            sizes="32px"
                            className="w-8 h-8 rounded-full object-cover shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-purple)] flex items-center justify-center text-white text-sm font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                            {userInitial}
                          </div>
                        )}
                        <span className="text-gray-300 text-sm font-medium max-w-[120px] truncate">
                          {displayName}
                        </span>
                      </button>

                      {profileOpen && (
                        <div
                          className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/[0.08] bg-[#0a0a1a]/95 backdrop-blur-xl p-4 shadow-[0_8px_40px_rgba(0,0,0,0.5)] z-50 animate-dropdown-in"
                        >
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                          <div className="flex flex-col items-center gap-3 mb-4">
                            <div className="relative">
                              {(userData?.photoURL || currentUser?.photoURL) ? (
                                <Image
                                  src={userData?.photoURL || currentUser?.photoURL || ""}
                                  alt="Profile"
                                  width={64}
                                  height={64}
                                  sizes="64px"
                                  className="w-16 h-16 rounded-full object-cover shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-purple)] flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                                  {uploading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    userInitial
                                  )}
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                aria-label="Upload profile photo"
                                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#1a1a2e] border border-white/20 flex items-center justify-center hover:bg-[#2a2a3e] transition-colors disabled:opacity-50"
                              >
                                <Camera className="w-3 h-3 text-gray-300" />
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
                              <p className={`text-xs text-center mt-1 ${uploadMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
                                {uploadMsg.text}
                              </p>
                            )}
                            <div className="text-center">
                              {editingName ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleNameSave();
                                      if (e.key === "Escape") handleNameCancel();
                                    }}
                                    className="w-40 text-sm font-semibold text-white bg-white/[0.06] border border-white/20 rounded-lg px-2 py-1 text-center outline-none focus:border-[var(--neon-blue)]/50"
                                    autoFocus
                                  />
                                  <button type="button" onClick={handleNameSave} aria-label="Save name" className="text-green-400 hover:text-green-300 transition-colors">
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button type="button" onClick={handleNameCancel} aria-label="Cancel edit name" className="text-red-400 hover:text-red-300 transition-colors">
                                    <XIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="text-white text-sm font-semibold">{displayName}</span>
                                  <button type="button" onClick={startEditingName} className="text-gray-400 hover:text-white transition-colors">
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              <p className="text-gray-500 text-xs mt-0.5">{currentUser?.email || ""}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 btn-secondary !py-2.5 !px-5 text-[14px] hover-scale-subtle"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/login"
                      className="flex items-center gap-1.5 btn-secondary !py-2.5 !px-5 text-[14px] hover-scale-subtle"
                    >
                      <LogIn className="w-4 h-4" />
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="flex items-center gap-1.5 btn-secondary !py-2.5 !px-5 text-[14px] hover-scale-subtle"
                    >
                      <UserPlus className="w-4 h-4" />
                      Sign Up
                    </Link>
                  </div>
                )}
            </div>

          </div>

          <button
            type="button"
            onClick={toggleMenu}
            className="md:hidden text-white p-2.5 rounded-lg hover:bg-white/[0.06] transition-colors active:scale-92"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="fixed top-20 left-0 w-full z-40 bg-[#05050f]/95 border-t border-white/10 md:hidden animate-mobile-menu-in">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
            {[
              { href: "/", label: "Home" },
              { href: "/placements", label: "Placements" },
            ].map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`transition-colors duration-300 py-2 text-lg relative ${
                    active
                      ? "text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="inline-block ml-2 w-1.5 h-1.5 rounded-full bg-[var(--neon-blue)] shadow-[0_0_6px_rgba(0,240,255,0.7)]" />
                  )}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setIsCoursesOpen(!isCoursesOpen)}
              aria-label="Toggle courses menu"
              className={`flex items-center gap-2 transition-colors duration-300 py-2 text-lg relative text-left ${
                isActive("/courses")
                  ? "text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Courses
              {isActive("/courses") && (
                <span className="inline-block ml-2 w-1.5 h-1.5 rounded-full bg-[var(--neon-blue)] shadow-[0_0_6px_rgba(0,240,255,0.7)]" />
              )}
            </button>
            {isCoursesOpen && (
              <div className="overflow-hidden animate-mobile-submenu-in">
                <Link
                  href="/courses"
                  onClick={() => { closeMenu(); setIsCoursesOpen(false); }}
                  className="block transition-colors duration-300 py-1.5 pl-6 text-base text-gray-400 hover:text-gray-200 relative"
                >
                  Digital Marketing Course
                </Link>
              </div>
            )}

            {[
              { href: "/affiliated-colleges", label: "Affiliated Colleges" },
              { href: "/about", label: "About Us" },
              { href: "/contact", label: "Contact" },
              { href: "/blog", label: "Blog"},
            ].map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`transition-colors duration-300 py-2 text-lg relative ${
                    active
                      ? "text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="inline-block ml-2 w-1.5 h-1.5 rounded-full bg-[var(--neon-blue)] shadow-[0_0_6px_rgba(0,240,255,0.7)]" />
                  )}
                </Link>
              );
            })}
            {!loading && (
              <>
                {currentUser ? (
                  <div className="flex items-center gap-3 py-2">
                    {(userData?.photoURL || currentUser?.photoURL) ? (
                      <Image
                        src={userData?.photoURL || currentUser?.photoURL || ""}
                        alt="Profile"
                        width={36}
                        height={36}
                        sizes="36px"
                        className="w-9 h-9 rounded-full object-cover shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-purple)] flex items-center justify-center text-white text-sm font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                        {userInitial}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-medium truncate max-w-[200px]">
                        {displayName}
                      </span>
                      <span className="text-gray-500 text-xs truncate max-w-[200px]">
                        {currentUser.email}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pt-1">
                    <Link
                      href="/login"
                      onClick={closeMenu}
                      className="flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors py-2.5 px-4 rounded-xl hover:bg-white/[0.04] text-lg"
                    >
                      <LogIn className="w-5 h-5" />
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={closeMenu}
                      className="flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors py-2.5 px-4 rounded-xl hover:bg-white/[0.04] text-lg"
                    >
                      <UserPlus className="w-5 h-5" />
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}

            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 btn-secondary !py-2.5 !px-5 text-[15px]"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}


    </>
  );
}

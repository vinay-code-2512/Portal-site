"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateEmployee } from "@/lib/employees";
import { User, Mail, Phone, Camera, Briefcase, Lock, Save, Loader2 } from "lucide-react";

export default function ProfileSettings() {
  const { currentUser, userData, refreshUserData } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Sync state with userData when it loads
  useEffect(() => {
    if (userData) {
      setName(userData.fullName || "");
      setPhone(userData.phone || "");
      setPhotoURL(userData.photoURL || "");
    }
  }, [userData]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaveError("");
    setSaved(false);
    try {
      setSaving(true);
      
      let finalPhotoURL = photoURL;
      
      // Upload raw file to Firebase Storage if a new file is chosen
      if (photoFile) {
        try {
          const { ref: storageRef, uploadBytes, getDownloadURL } = await import("firebase/storage");
          const { storage } = await import("@/lib/firebase");
          const fileRef = storageRef(storage, `profile-images/${currentUser.uid}`);
          await uploadBytes(fileRef, photoFile);
          finalPhotoURL = await getDownloadURL(fileRef);
          setPhotoURL(finalPhotoURL);
        } catch (storageErr: any) {
          console.error("Storage upload failed, falling back to base64 or current URL:", storageErr);
        }
      }

      // 1. Update Firestore user document
      await updateEmployee(currentUser.uid, { fullName: name, phone, photoURL: finalPhotoURL || "" }, currentUser.uid);
      
      // 2. Sync with Firebase Auth user profile (so changes reflect in the navbar)
      try {
        const { updateProfile } = await import("firebase/auth");
        await updateProfile(currentUser, {
          displayName: name,
          photoURL: finalPhotoURL || ""
        });
        await refreshUserData();
      } catch (authErr) {
        console.error("Auth profile sync failed:", authErr);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setPhotoFile(null);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoURL(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePasswordUpdate = async () => {
    if (!currentUser) return;
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordError("");
    setPasswordSuccess("");
    setUpdatingPassword(true);
    try {
      const { updatePassword } = await import("firebase/auth");
      await updatePassword(currentUser, newPassword);
      setPasswordSuccess("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPasswordSuccess("");
        setShowPasswordForm(false);
      }, 2000);
    } catch (err: any) {
      if (err.code === "auth/requires-recent-login") {
        setPasswordError("For security, please log out and log back in to change your password.");
      } else {
        setPasswordError(err.message || "Failed to update password.");
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
          <User className="w-4.5 h-4.5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Profile Settings</h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Manage your personal information</p>
        </div>
      </div>

      {/* Avatar Upload */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center overflow-hidden mb-2 shadow-md group">
          {photoURL ? (
            <img src={photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-extrabold text-white">
              {(name || userData?.fullName || "U").charAt(0).toUpperCase()}
            </span>
          )}
          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
            <Camera className="w-5 h-5 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>
        <p className="text-[10px] text-zinc-400 font-semibold">Click avatar to upload photo</p>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <Mail className="w-3.5 h-3.5" />
            Email
          </label>
          <div className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-500 select-none">
            {userData?.email || currentUser?.email || "—"}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            Designation
          </label>
          <div className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-500 select-none">
            {userData?.designation || "—"}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <User className="w-3.5 h-3.5" />
            Full Name
          </label>
          <input
            type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--color-primary-light)] transition-all"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <Phone className="w-3.5 h-3.5" />
            Phone
          </label>
          <input
            type="tel" value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
            className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--color-primary-light)] transition-all"
          />
        </div>
      </div>

      {saveError && <p className="text-[10px] text-red-500 font-bold mt-3">{saveError}</p>}
      {saved && <p className="text-[10px] text-emerald-600 font-bold mt-3">Profile updated successfully!</p>}

      {/* Actions Row */}
      <div className="mt-5 flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--border-light)]/40">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Updating..." : "Update Profile"}
        </button>
        <button
          onClick={() => { setShowPasswordForm(!showPasswordForm); setPasswordError(""); setPasswordSuccess(""); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-white/40 hover:bg-[var(--color-primary-dim)] transition-all cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          {showPasswordForm ? "Hide Form" : "Change Password"}
        </button>
      </div>

      {/* Expandable Password Form */}
      {showPasswordForm && (
        <div className="mt-6 p-4 rounded-xl bg-white/30 border border-[var(--border-light)]/40 space-y-4">
          <h4 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">Change Password</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)] transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)] transition-all"
              />
            </div>
          </div>
          {passwordError && <p className="text-[10px] text-red-500 font-bold">{passwordError}</p>}
          {passwordSuccess && <p className="text-[10px] text-emerald-600 font-bold">{passwordSuccess}</p>}
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={handlePasswordUpdate}
              disabled={updatingPassword || !newPassword}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
            >
              {updatingPassword ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {updatingPassword ? "Updating..." : "Update Password"}
            </button>
            <button
              onClick={() => { setShowPasswordForm(false); setNewPassword(""); setConfirmPassword(""); setPasswordError(""); }}
              className="px-4 py-2 rounded-xl text-[10px] font-bold border border-zinc-200 text-zinc-600 bg-white/40 hover:bg-zinc-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

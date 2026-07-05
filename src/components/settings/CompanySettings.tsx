"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCompanySettings, updateCompanySettings, type CompanySettings } from "@/lib/settings";
import { Building2, Globe, Clock, UserRound, Mail, Phone, MapPin, Link, Camera } from "lucide-react";

const TIMEZONES = [
  "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo",
  "America/New_York", "America/Chicago", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin", "Australia/Sydney", "Pacific/Auckland",
];

export default function CompanySettingsForm() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<CompanySettings>({
    organizationName: "", timezone: "Asia/Kolkata",
    workHoursStart: "09:00", workHoursEnd: "18:00",
    lateCutoffMinutes: 30, halfDayHours: 4,
  });
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getCompanySettings()
      .then((s) => { setSettings(s); setLogoPreview(s.logoURL || ""); setLoadError(null); })
      .catch((e) => setLoadError(e?.message || "Failed to load company settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      setSaving(true);
      await updateCompanySettings({ ...settings, logoURL: logoPreview || undefined }, currentUser.uid);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-36 bg-white/30 rounded" />
          <div className="h-10 bg-white/30 rounded-xl" />
          <div className="h-10 bg-white/30 rounded-xl" />
          <div className="h-10 bg-white/30 rounded-xl" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="flex flex-col items-center justify-center h-32 text-zinc-400">
          <Building2 className="w-6 h-6 text-rose-500 mb-2" />
          <p className="text-xs font-bold text-rose-600">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
          <Building2 className="w-4.5 h-4.5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Company Settings</h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Configure organization details</p>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-white/30 border border-[var(--border-light)]/30">
        <div className="relative w-16 h-16 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center overflow-hidden shrink-0">
          {logoPreview ? (
            <img src={logoPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-7 h-7 text-[var(--color-primary)]" />
          )}
          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
            <Camera className="w-4 h-4 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-800">Company Logo</p>
          <p className="text-[10px] text-zinc-500 font-semibold">Upload your organization logo</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Company Name
          </label>
          <input
            type="text" value={settings.organizationName}
            onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
            placeholder="Your organization name"
            className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--color-primary-light)]"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <Mail className="w-3.5 h-3.5" />
            Company Email
          </label>
          <input
            type="email" value="admin@company.com"
            placeholder="admin@company.com"
            className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--color-primary-light)]"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <Phone className="w-3.5 h-3.5" />
            Phone Number
          </label>
          <input
            type="tel" value="+91 98765 43210"
            placeholder="+91 98765 43210"
            className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--color-primary-light)]"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <Globe className="w-3.5 h-3.5" />
            Timezone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)] cursor-pointer appearance-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Address
          </label>
          <input
            type="text" value="Mumbai, India"
            placeholder="Office address"
            className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--color-primary-light)]"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <Link className="w-3.5 h-3.5" />
            Website
          </label>
          <input
            type="url" value="https://company.com"
            placeholder="https://company.com"
            className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[var(--color-primary-light)]"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <Clock className="w-3.5 h-3.5" />
            Work Hours Start
          </label>
          <input
            type="time" value={settings.workHoursStart}
            onChange={(e) => setSettings({ ...settings, workHoursStart: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)]"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <Clock className="w-3.5 h-3.5" />
            Work Hours End
          </label>
          <input
            type="time" value={settings.workHoursEnd}
            onChange={(e) => setSettings({ ...settings, workHoursEnd: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)]"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <UserRound className="w-3.5 h-3.5" />
            Late Cutoff (minutes)
          </label>
          <input
            type="number" value={settings.lateCutoffMinutes}
            onChange={(e) => setSettings({ ...settings, lateCutoffMinutes: Number(e.target.value) })}
            className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)]"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
            <UserRound className="w-3.5 h-3.5" />
            Half-Day Hours
          </label>
          <input
            type="number" value={settings.halfDayHours}
            onChange={(e) => setSettings({ ...settings, halfDayHours: Number(e.target.value) })}
            className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)]"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 pt-4 border-t border-[var(--border-light)]/40">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {saved && <span className="text-[10px] text-emerald-600 font-bold">Saved!</span>}
      </div>
    </div>
  );
}

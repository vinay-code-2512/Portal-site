"use client";

import { useState } from "react";
import { Settings2, Sun, CalendarDays, Clock, Globe, IndianRupee } from "lucide-react";

const TIMEZONES = [
  "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo",
  "America/New_York", "America/Chicago", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin", "Australia/Sydney",
];

const THEMES = [
  { value: "light", label: "Light Theme" },
  { value: "dark", label: "Dark Theme" },
  { value: "system", label: "System Default" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const TIME_FORMATS = [
  { value: "12h", label: "12-hour (AM/PM)" },
  { value: "24h", label: "24-hour" },
];

const CURRENCIES = [
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "AED", label: "UAE Dirham (د.إ)" },
  { value: "SGD", label: "Singapore Dollar (S$)" },
];

const PREFERENCES = [
  { key: "theme", label: "Theme", icon: Sun, options: THEMES },
  { key: "dateFormat", label: "Date Format", icon: CalendarDays, options: DATE_FORMATS },
  { key: "timeFormat", label: "Time Format", icon: Clock, options: TIME_FORMATS },
  { key: "timezone", label: "Timezone", icon: Globe, options: TIMEZONES.map((t) => ({ value: t, label: t })) },
  { key: "currency", label: "Currency", icon: IndianRupee, options: CURRENCIES },
];

export default function SystemPreferences() {
  const [prefs, setPrefs] = useState<Record<string, string>>({
    theme: "light",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    timezone: "Asia/Kolkata",
    currency: "INR",
  });

  const handleChange = (key: string, value: string) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
          <Settings2 className="w-4.5 h-4.5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">System Preferences</h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Configure system-wide defaults</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PREFERENCES.map((pref) => {
          const Icon = pref.icon;
          return (
            <div key={pref.key}>
              <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">
                <Icon className="w-3.5 h-3.5" />
                {pref.label}
              </label>
              <select
                value={prefs[pref.key]}
                onChange={(e) => handleChange(pref.key, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[var(--color-primary-light)] cursor-pointer appearance-none"
              >
                {pref.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

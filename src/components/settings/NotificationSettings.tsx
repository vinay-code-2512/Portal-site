"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getNotificationSettings, updateNotificationSettings, type NotificationSettings } from "@/lib/settings";
import { Bell, Mail, MessageSquare, AlertTriangle, Calendar, IndianRupee, BellRing } from "lucide-react";

const SECTIONS = [
  {
    title: "Email Notifications",
    icon: Mail,
    toggles: [
      { key: "attendanceReminders" as const, label: "Attendance Reminders", desc: "Email employees who haven't marked attendance" },
      { key: "leaveNotifications" as const, label: "Leave Notifications", desc: "Email admins on new leave requests" },
    ],
  },

  {
    title: "System Alerts",
    icon: BellRing,
    toggles: [
      { key: "payrollNotifications" as const, label: "Payroll Alerts", desc: "System alerts for payroll generation" },
    ],
  },
  {
    title: "Attendance Alerts",
    icon: Calendar,
    toggles: [
      { key: "attendanceReminders" as const, label: "Late Check-in Alerts", desc: "Alert when employees check in late" },
    ],
  },
  {
    title: "Leave Alerts",
    icon: AlertTriangle,
    toggles: [
      { key: "leaveNotifications" as const, label: "Leave Balance Alerts", desc: "Alert when leave balance is low" },
    ],
  },
  {
    title: "Payroll Alerts",
    icon: IndianRupee,
    toggles: [
      { key: "payrollNotifications" as const, label: "Payslip Alerts", desc: "Notify employees when payslips are ready" },
    ],
  },
];

export default function NotificationSettingsForm() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    attendanceReminders: true, leaveNotifications: true,
    payrollNotifications: true, dailyDigest: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getNotificationSettings()
      .then((s) => { setSettings(s); setLoadError(null); })
      .catch((e) => setLoadError(e?.message || "Failed to load notification settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (key: keyof NotificationSettings) => {
    if (!currentUser) return;
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      setSaving(true);
      await updateNotificationSettings(updated, currentUser.uid);
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/30 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="flex flex-col items-center justify-center h-32 text-zinc-400">
          <Bell className="w-6 h-6 text-rose-500 mb-2" />
          <p className="text-xs font-bold text-rose-600">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
          <Bell className="w-4.5 h-4.5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Notification Settings</h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Configure email, SMS, and system alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map((section) => {
          const SectionIcon = section.icon;
          return (
            <div key={section.title} className="p-4 rounded-xl bg-white/30 border border-[var(--border-light)]/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-dim)] flex items-center justify-center">
                  <SectionIcon className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                </div>
                <span className="text-[10px] font-extrabold text-zinc-700 uppercase tracking-wider">{section.title}</span>
              </div>
              <div className="space-y-2">
                {section.toggles.map((t) => {
                  const checked = settings[t.key];
                  return (
                    <div
                      key={t.label}
                      className="flex items-center justify-between gap-2 cursor-pointer"
                      onClick={() => handleToggle(t.key)}
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-zinc-800">{t.label}</p>
                        <p className="text-[9px] text-zinc-500 font-semibold">{t.desc}</p>
                      </div>
                      <div className={`shrink-0 w-9 h-5 rounded-full transition-colors ${
                        checked ? "bg-[var(--color-primary)]" : "bg-zinc-300"
                      } relative`}>
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            checked ? "translate-x-[18px]" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {saving && <p className="text-[10px] text-zinc-400 font-semibold mt-3">Saving...</p>}
    </div>
  );
}

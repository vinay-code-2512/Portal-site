"use client";

import { useState } from "react";
import { Lock, Shield, Clock, Monitor, LogIn, Smartphone } from "lucide-react";

interface SecurityToggle {
  key: string;
  label: string;
  icon: typeof Lock;
  desc: string;
  enabled: boolean;
}

export default function SecuritySettings() {
  const [items, setItems] = useState<SecurityToggle[]>([
    {
      key: "2fa", label: "Two-Factor Authentication",
      icon: Shield, desc: "Require OTP verification for admin logins",
      enabled: false,
    },
    {
      key: "passwordPolicy", label: "Password Policy",
      icon: Lock, desc: "Min 8 chars, mixed case, numbers, special characters required",
      enabled: true,
    },
    {
      key: "sessionTimeout", label: "Session Timeout",
      icon: Clock, desc: "Auto-logout inactive users after 60 minutes",
      enabled: true,
    },
    {
      key: "deviceMgmt", label: "Device Management",
      icon: Monitor, desc: "Manage and restrict trusted devices",
      enabled: false,
    },
    {
      key: "loginRestrictions", label: "Login Restrictions",
      icon: LogIn, desc: "Restrict login by IP range and geo-location",
      enabled: false,
    },
    {
      key: "mobileAccess", label: "Mobile Access Control",
      icon: Smartphone, desc: "Allow or restrict mobile app access",
      enabled: true,
    },
  ]);

  const handleToggle = (key: string) => {
    setItems((prev) => prev.map((item) =>
      item.key === key ? { ...item, enabled: !item.enabled } : item
    ));
  };

  return (
    <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-dim)] flex items-center justify-center">
          <Lock className="w-4.5 h-4.5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Security Settings</h3>
          <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Configure security policies and controls</p>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-white/20 border border-[var(--border-light)]/20 hover:bg-white/35 transition-all cursor-pointer"
              onClick={() => handleToggle(item.key)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  item.enabled ? "bg-emerald-500/10 text-emerald-600" : "bg-zinc-500/10 text-zinc-400"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-800">{item.label}</p>
                  <p className="text-[10px] text-zinc-500 font-semibold">{item.desc}</p>
                </div>
              </div>
              <div className={`shrink-0 w-11 h-6 rounded-full transition-colors ${
                item.enabled ? "bg-[var(--color-primary)]" : "bg-zinc-300"
              } relative`}>
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    item.enabled ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

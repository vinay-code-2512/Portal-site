"use client";

import { useAuth } from "@/context/AuthContext";
import { Monitor, Video, Calendar, Clock, Play } from "lucide-react";

export default function ClassesPage() {
  const { userData } = useAuth();
  const classType = (userData as any)?.classType || "live";

  if (classType === "recorded") {
    return (
      <div className="space-y-6 pb-12 pt-4 sm:pt-6">
        <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-800">Recorded Classes</h2>
              <p className="text-xs text-zinc-500">Access your pre-recorded lecture library</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="relative aspect-video rounded-xl bg-zinc-100 mb-3 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                <Play className="w-10 h-10 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">Session {i}</h3>
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                45 mins
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 pt-4 sm:pt-6">
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-800">Live Classes</h2>
            <p className="text-xs text-zinc-500">Upcoming live sessions schedule</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-zinc-700">Session {i}</span>
              </div>
              <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[9px] font-bold">
                Upcoming
              </span>
            </div>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Schedule to be announced
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

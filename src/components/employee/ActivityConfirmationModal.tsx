"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, FileText, ExternalLink, Calendar } from "lucide-react";
import { useScrollLock } from "@/lib/useScrollLock";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { trackMissedModal } from "@/lib/missedModalService";

interface MeetingInfo {
  id: string;
  topic: string;
  link: string;
  date: string;
  time: string;
  duration: number;
}

function isMeetingOver(meeting: MeetingInfo): boolean {
  const [year, month, day] = meeting.date.split("-").map(Number);
  const [timeStr, meridiem] = meeting.time.split(" ");
  const [hours, minutes] = timeStr.split(":").map(Number);
  let h = hours;
  if (meridiem === "PM" && hours !== 12) h += 12;
  if (meridiem === "AM" && hours === 12) h = 0;
  const start = new Date(year, month - 1, day, h, minutes);
  const end = new Date(start.getTime() + meeting.duration * 60000);
  return end <= new Date();
}

interface SelectedFile {
  file: File;
  previewUrl?: string;
}

interface ActivityConfirmationModalProps {
  open: boolean;
  onConfirm: (note: string, attachments: File[]) => void;
  onClose: () => void;
  timeout?: number;
  slotHour?: number;
}

export default function ActivityConfirmationModal({
  open,
  onConfirm,
  onClose,
  timeout = 120,
  slotHour,
}: ActivityConfirmationModalProps) {
  const [countdown, setCountdown] = useState(timeout);
  const [note, setNote] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetings, setMeetings] = useState<MeetingInfo[]>([]);
  const unsubMeetingsRef = useRef<(() => void) | null>(null);
  const missHandledRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { currentUser } = useAuth();

  useScrollLock(open);

  // Alert sound — pulsing beep for ~2.5 seconds
  const playAlertSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      audioCtxRef.current = ctx;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);

      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.connect(gain);
      osc.start();

      for (let i = 0; i < 5; i++) {
        const t = ctx.currentTime + i * 0.5;
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.setValueAtTime(0, t + 0.3);
      }

      setTimeout(() => {
        osc.stop();
        ctx.close();
        audioCtxRef.current = null;
      }, 2800);
    } catch (err) {
      console.error("Alert sound failed:", err);
    }
  }, []);

  const stopAlertSound = useCallback(() => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  // Play sound + vibrate when modal opens, stop when it closes
  useEffect(() => {
    if (open) {
      playAlertSound();
      try { navigator.vibrate(2000); } catch {}
      missHandledRef.current = false;
    } else {
      stopAlertSound();
      try { navigator.vibrate(0); } catch {}
    }
    return () => {
      stopAlertSound();
      try { navigator.vibrate(0); } catch {}
    };
  }, [open, playAlertSound, stopAlertSound]);

  // When timer expires without confirmation, auto-close + track miss
  const handleMiss = useCallback(async () => {
    if (!currentUser) return;
    onClose();
    try {
      await trackMissedModal(currentUser.uid, slotHour);
    } catch (err) {
      console.error("Failed to track missed modal:", err);
    }
  }, [currentUser, onClose, slotHour]);

  useEffect(() => {
    if (open && countdown === 0 && !missHandledRef.current) {
      missHandledRef.current = true;
      handleMiss();
    }
  }, [open, countdown, handleMiss]);

  useEffect(() => {
    if (!open) {
      setCountdown(timeout);
      setNote("");
      setSelectedFiles([]);
      return;
    }
    setCountdown(timeout);
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [open, timeout]);

  // Listen for upcoming meetings assigned to current user
  useEffect(() => {
    if (!open || !currentUser) {
      if (unsubMeetingsRef.current) {
        unsubMeetingsRef.current();
        unsubMeetingsRef.current = null;
      }
      if (!open) setMeetings([]);
      return;
    }

    const unsub = onSnapshot(
      collection(db, "meetings"),
      (snap) => {
        const list: MeetingInfo[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const participants = data.participants || [];
          const isParticipant = participants.some(
            (p: any) =>
              p.uid === currentUser.uid ||
              p.email?.toLowerCase() === currentUser.email?.toLowerCase()
          );
          if (isParticipant && data.status === "sent") {
            const meeting: MeetingInfo = {
              id: d.id,
              topic: data.topic || "",
              link: data.link || "",
              date: data.date || "",
              time: data.time || "",
              duration: data.duration || 60,
            };
            if (!isMeetingOver(meeting)) {
              list.push(meeting);
            }
          }
        });
        list.sort((a, b) => b.id.localeCompare(a.id));
        setMeetings(list);
      },
      (err) => {
        console.error("Failed to fetch meetings in modal:", err);
      }
    );

    unsubMeetingsRef.current = unsub;

    return () => {
      unsub();
      unsubMeetingsRef.current = null;
    };
  }, [open, currentUser]);

  const handleConfirm = useCallback(async () => {
    if (isSubmitting) return;
    missHandledRef.current = true;
    setIsSubmitting(true);
    try {
      const files = selectedFiles.map((sf) => sf.file);
      await onConfirm(note, files);
      setNote("");
      setSelectedFiles([]);
      setCountdown(timeout);
    } finally {
      setIsSubmitting(false);
    }
  }, [note, selectedFiles, onConfirm, timeout, isSubmitting]);

  const addFile = useCallback((file: File) => {
    const isImage = file.type.startsWith("image/");
    const sf: SelectedFile = { file };
    if (isImage) {
      sf.previewUrl = URL.createObjectURL(file);
    }
    setSelectedFiles((prev) => [...prev, sf]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => {
      const sf = prev[index];
      if (sf.previewUrl) URL.revokeObjectURL(sf.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handlePhotoPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addFile(file);
    e.target.value = "";
  }, [addFile]);

  const handlePdfPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addFile(file);
    e.target.value = "";
  }, [addFile]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[20px] flex flex-col max-h-[90vh] shadow-[0_30px_80px_rgba(0,0,0,0.5)] bg-white"
          >
            <div className="relative bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] px-6 sm:px-8 pt-6 sm:pt-8 pb-6 text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-xl font-bold text-white">Are you still working?</h2>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">
                We monitor activity to ensure accurate time logs.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-4 overflow-y-auto flex-1">

            <div className="flex justify-center py-2">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="rgba(91,76,255,0.12)"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="url(#timerGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40}
                    animate={{
                      strokeDashoffset: (2 * Math.PI * 40) * (1 - countdown / timeout),
                    }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                  <defs>
                    <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#5039F0" />
                      <stop offset="100%" stopColor="#6A55F5" />
                    </linearGradient>
                  </defs>
                </svg>
                <motion.span
                  key={countdown}
                  initial={{ opacity: 0.6, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums ${
                    countdown <= 5 ? "text-red-500" : "text-white"
                  }`}
                >
                  {display}
                </motion.span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider">
                What did you work on in the last few minutes?
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe your recent activity..."
                rows={3}
                className="w-full rounded-xl bg-white border border-[var(--color-primary)]/20 px-4 py-3 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-[var(--color-primary)]/40 focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[var(--color-primary)]/30 cursor-pointer hover:bg-white/[0.04] transition-all duration-200">
                <ImagePlus className="w-4 h-4 text-[var(--color-primary-light)]" />
                <span className="text-sm text-zinc-400 font-medium">Add Photo</span>
                <input type="file" accept="image/*" hidden onChange={handlePhotoPick} />
              </label>
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[var(--color-primary)]/30 cursor-pointer hover:bg-white/[0.04] transition-all duration-200">
                <FileText className="w-4 h-4 text-[var(--color-primary-light)]" />
                <span className="text-sm text-zinc-400 font-medium">Add PDF</span>
                <input type="file" accept="application/pdf" hidden onChange={handlePdfPick} />
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-1.5">
                {selectedFiles.map((sf, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10"
                  >
                    {sf.previewUrl ? (
                      <img src={sf.previewUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-[var(--color-primary-light)] shrink-0" />
                    )}
                    <span className="text-xs text-zinc-300 truncate flex-1">{sf.file.name}</span>
                    <button
                      onClick={() => removeFile(i)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {meetings.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <Calendar className="w-3.5 h-3.5" />
                  Upcoming Meetings
                </div>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {meetings.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-800 truncate">
                          {m.topic}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {m.date} at {m.time}
                        </p>
                      </div>
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold hover:bg-[var(--color-primary)]/20 transition-all duration-200"
                      >
                        Join
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={countdown === 0 || isSubmitting}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#4338CA] to-[#5B4CFF] text-white text-sm font-bold shadow-[0_4px_20px_rgba(67,56,202,0.4)] hover:shadow-[0_6px_28px_rgba(67,56,202,0.5)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer min-h-[48px]"
            >
              {isSubmitting ? "Submitting..." : "Yes, I'm Working"}
            </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

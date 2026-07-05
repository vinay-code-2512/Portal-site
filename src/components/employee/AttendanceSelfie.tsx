"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, RefreshCw, Check, Loader2, Clock } from "lucide-react";
import { uploadSelfie, saveAttendanceSelfie } from "@/lib/attendance";
import { getLocalDateString } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";

type SelfieState = "idle" | "camera" | "preview" | "saving" | "saved";

interface AttendanceSelfieProps {
  sessionStatus?: "idle" | "working" | "on-break" | "checked-out";
}

export default function AttendanceSelfie({ sessionStatus = "idle" }: AttendanceSelfieProps) {
  const { currentUser } = useAuth();
  const [state, setState] = useState<SelfieState>("idle");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const stopCamera = useCallback(() => {
    setVideoReady(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      setVideoReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("camera");
    } catch {
      setState("idle");
    }
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        blobRef.current = blob;
        setPhotoData(canvas.toDataURL("image/jpeg", 0.8));
        setState("preview");
        stopCamera();
      }
    }, "image/jpeg", 0.8);
  }, [stopCamera]);

  const retake = useCallback(() => {
    setPhotoData(null);
    blobRef.current = null;
    setState("idle");
    setError(null);
  }, []);

  const save = useCallback(async () => {
    if (!currentUser || !blobRef.current) return;
    setError(null);
    setState("saving");
    try {
      const today = getLocalDateString(new Date());
      const url = await uploadSelfie(currentUser.uid, today, blobRef.current);
      await saveAttendanceSelfie(currentUser.uid, today, url);
      blobRef.current = null;
      setState("saved");
    } catch (err: any) {
      setError(err?.message || "Failed to save selfie. Please try again.");
      setState("preview");
    }
  }, [currentUser]);

  const reset = useCallback(() => {
    setPhotoData(null);
    blobRef.current = null;
    setState("idle");
    setError(null);
  }, []);

  return (
    <div className="space-y-4">
      <div className={`relative rounded-2xl overflow-hidden bg-black border border-white/10 ${state === "camera" ? "block" : "hidden"}`}>
        {!videoReady && (
          <div className="w-full h-[240px] flex items-center justify-center">
            <p className="text-sm text-zinc-500">Starting camera...</p>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onCanPlay={() => setVideoReady(true)}
          className={`w-full max-h-[320px] object-cover ${videoReady ? "block" : "hidden"}`}
        />
      </div>

      {state === "idle" && (
        <>
          {sessionStatus === "idle" ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-zinc-400" />
                </div>
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-1 rounded-2xl border border-zinc-500/30"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-300">Check in first</p>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Start your shift to enable selfie capture for attendance
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/15">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="text-[11px] text-amber-400 font-semibold">Use the check-in button above</span>
              </div>
            </motion.div>
          ) : sessionStatus === "checked-out" ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-300">Shift completed</p>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Today&apos;s shift is complete. Attendance records are final.
                </p>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={startCamera}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-sm font-bold shadow-[0_4px_20px_var(--color-primary-glow)] hover:shadow-[0_6px_28px_var(--color-primary-glow)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Camera className="w-4 h-4" />
              Take Selfie
            </button>
          )}
        </>
      )}

      {state === "camera" && (
        <div className="flex gap-2">
          <button
            onClick={capture}
            disabled={!videoReady}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-sm font-bold shadow-[0_4px_20px_var(--color-primary-glow)] hover:shadow-[0_6px_28px_var(--color-primary-glow)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Camera className="w-4 h-4" />
            Capture
          </button>
          <button
            onClick={retake}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.08] border border-white/10 text-zinc-300 text-sm font-bold hover:bg-white/[0.12] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
          >
            <CameraOff className="w-4 h-4" />
            Cancel
          </button>
        </div>
      )}

      {state === "preview" && photoData && (
        <div className="space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}
          <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 min-h-[240px]">
            <img src={photoData} alt="Captured selfie" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-bold shadow-[0_4px_20px_rgba(52,211,153,0.3)] hover:shadow-[0_6px_28px_rgba(52,211,153,0.4)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={retake}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.08] border border-white/10 text-zinc-300 text-sm font-bold hover:bg-white/[0.12] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
              Retake
            </button>
          </div>
        </div>
      )}

      {state === "saving" && (
        <div className="h-[180px] flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/[0.04] border border-white/5">
          <Loader2 className="w-8 h-8 text-[var(--color-primary-light)] animate-spin" />
          <p className="text-sm text-zinc-400 font-medium">Saving selfie...</p>
        </div>
      )}

      {state === "saved" && (
        <div className="space-y-3">
          <div className="h-[180px] flex flex-col items-center justify-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm text-emerald-400 font-bold">Selfie saved!</p>
          </div>
          <button
            onClick={reset}
            className="w-full py-2.5 rounded-xl bg-white/[0.08] border border-white/10 text-zinc-300 text-sm font-bold hover:bg-white/[0.12] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
          >
            Take Another
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

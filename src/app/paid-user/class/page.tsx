"use client";

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCheckIn } from "@/hooks/useCheckIn";
import { getClassesByUserId, markClassCompleted, submitClassAnswers, isStorageUrl, type ClassEntry } from "@/lib/classes";
import { getCachedVideo, cacheVideo, isVideoCached, downloadFirebaseBlob } from "@/lib/videoCache";
import { Monitor, Video, Link, Lock, Download, CloudOff, LogIn, Play, Pause, Maximize2, CheckCircle, ChevronDown, FileText } from "lucide-react";

type SecureVideoHandle = {
  saveOffline: () => Promise<void>;
  cached: boolean;
  saving: boolean;
  getVideoElement: () => HTMLVideoElement | null;
};

const SecureVideo = forwardRef<SecureVideoHandle, {
  src: string;
  onEnded: () => void;
  hideToolbar?: boolean;
  onCachedChange?: (cached: boolean) => void;
  checkedIn?: boolean;
  onPlayClick?: () => void;
  controls?: boolean;
  autoPlay?: boolean;
  userId?: string;
  classId?: string;
  onTimeChange?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
}>(
  function SecureVideo({ src, onEnded, hideToolbar, onCachedChange, checkedIn, onPlayClick, controls, autoPlay, userId, classId, onTimeChange, onDurationChange }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const blobRef = useRef<Blob | null>(null);
    const blobUrlRef = useRef<string | null>(null);
    const [ready, setReady] = useState(false);
    const [cached, setCached] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [playing, setPlaying] = useState(false);

    const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      if (video) {
        onDurationChange?.(video.duration);
      }
      if (userId && classId) {
        const savedProgress = localStorage.getItem(`video-progress:${userId}:${classId}`);
        if (savedProgress) {
          const time = parseFloat(savedProgress);
          if (!isNaN(time) && isFinite(time) && time > 0) {
            e.currentTarget.currentTime = time;
          }
        }
      }
    };

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      if (video) {
        onTimeChange?.(video.currentTime);
      }
      if (userId && classId && video.currentTime > 0) {
        if (video.duration && video.duration - video.currentTime < 1) {
          return;
        }
        localStorage.setItem(`video-progress:${userId}:${classId}`, String(video.currentTime));
      }
    };

    const handleEnded = () => {
      if (userId && classId) {
        localStorage.removeItem(`video-progress:${userId}:${classId}`);
      }
      onEnded();
    };

    function loadBlob(url: string): Promise<Blob> {
      return Promise.race([
        new Promise<Blob>((resolve, reject) => {
          fetch(url, { mode: "cors" })
            .then((r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.blob();
            })
            .then(resolve)
            .catch(() => {
              const xhr = new XMLHttpRequest();
              xhr.open("GET", url, true);
              xhr.responseType = "blob";
              xhr.onload = () => { if (xhr.status === 200) resolve(xhr.response); else reject(new Error(String(xhr.status))); };
              xhr.onerror = () => {
                downloadFirebaseBlob(url).then(resolve).catch(reject);
              };
              xhr.send();
            });
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000))
      ]);
    }

    useEffect(() => {
      if (!src) return;
      let cancelled = false;

      (async () => {
        const cachedBlob = await getCachedVideo(src);
        if (cancelled) return;
        if (cachedBlob) {
          blobRef.current = cachedBlob;
          const url = URL.createObjectURL(cachedBlob);
          blobUrlRef.current = url;
          if (videoRef.current) videoRef.current.src = url;
          setCached(true);
          setReady(true);
          return;
        }

        blobUrlRef.current = src;
        if (videoRef.current) videoRef.current.src = src;
        setCached(false);
        setReady(true);
      })();

      return () => {
        cancelled = true;
        if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) URL.revokeObjectURL(blobUrlRef.current);
      };
    }, [src]);

    useImperativeHandle(ref, () => ({
      saveOffline: handleSaveOffline,
      cached,
      saving,
      getVideoElement: () => videoRef.current,
    }));

    const onCachedChangeRef = useRef(onCachedChange);
    useEffect(() => {
      onCachedChangeRef.current = onCachedChange;
    }, [onCachedChange]);

    useEffect(() => {
      onCachedChangeRef.current?.(cached);
    }, [cached]);

    async function handleSaveOffline() {
      if (saving) return;
      setSaveError("");
      setSaving(true);
      try {
        let blob = blobRef.current;
        if (!blob) {
          blob = await loadBlob(src);
          blobRef.current = blob;
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          if (videoRef.current) videoRef.current.src = url;
        }
        await cacheVideo(src, blob);
        setCached(true);
      } catch (e: any) {
        const msg = e?.message || String(e);
        if (msg === "timeout") {
          setSaveError("Save offline unavailable — configure CORS on Firebase Storage bucket");
        } else {
          setSaveError(msg);
        }
      } finally {
        setSaving(false);
      }
    }

    return (
      <div className="h-full">
        <div className="relative h-full">
          <video
            ref={videoRef}
            autoPlay={autoPlay}
            playsInline
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            preload="auto"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full rounded object-contain bg-black/5"
          >
            Your browser does not support the video tag.
          </video>
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded pointer-events-none">
              <span className="text-[6px] text-zinc-400">Loading...</span>
            </div>
          )}
          {ready && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent rounded-b pointer-events-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (checkedIn === false) return;
                  const v = videoRef.current;
                  if (!v) return;
                  if (v.paused) { v.play(); } else { v.pause(); }
                }}
                className="pointer-events-auto w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                title={checkedIn === false ? "Check in first" : playing ? "Pause" : "Play"}
              >
                {checkedIn === false ? (
                  <LogIn className="w-3.5 h-3.5 text-zinc-500" />
                ) : playing ? (
                  <Pause className="w-3.5 h-3.5 text-zinc-800" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-zinc-800 ml-0.5" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const v = videoRef.current;
                  if (!v) return;
                  if (v.requestFullscreen) { v.requestFullscreen(); }
                  else if ((v as any).webkitRequestFullscreen) { (v as any).webkitRequestFullscreen(); }
                }}
                className="pointer-events-auto w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                title="Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5 text-zinc-800" />
              </button>
            </div>
          )}
        </div>
        {!hideToolbar && (
          <div className="flex items-center gap-2 mt-1.5">
            {cached ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold">
                <CloudOff className="w-3 h-3" />
                Saved
              </span>
            ) : (
              <button
                onClick={handleSaveOffline}
                disabled={!ready || saving}
                className="w-6 h-6 rounded-full bg-emerald-500 text-black hover:bg-emerald-600 transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0"
                title="Save Offline"
              >
                <Download className="w-3 h-3" />
              </button>
            )}
            {saveError && (
              <p className="mt-1 text-[10px] text-red-500 break-all">{saveError}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default function PaidUserClassPage() {
  const { currentUser, userData } = useAuth();
  const { checkedIn, loading: checkInLoading } = useCheckIn();
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewQuestionsId, setViewQuestionsId] = useState<string | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [cachedMap, setCachedMap] = useState<Record<string, boolean>>({});
  const videoHandles = useRef<Record<string, SecureVideoHandle | null>>({});

  const classType = (userData as any)?.classType || "live";
  const isLive = classType === "live";
  const HeadingIcon = isLive ? Monitor : Video;
  const headingText = isLive ? "Live Class" : "Recorded Class";
  const liveNowClass = isLive ? classes.find((c) => c.isLiveNow) : null;

  const sortClasses = (list: ClassEntry[]) =>
    list.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));

  useEffect(() => {
    if (!currentUser) return;
      getClassesByUserId(currentUser.uid).then(sortClasses)
      .then(setClasses)
      .catch((err) => {
        console.error("Class fetch error:", err?.message || err);
      })
      .finally(() => setLoading(false));
  }, [currentUser, isLive]);

  async function handleMarkComplete(classId: string) {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId ? { ...c, completed: true } : c
      )
    );
    try {
      await markClassCompleted(classId);
    } catch (err: any) {
      console.error("Mark complete error:", err?.message || err);
    }
  }

  function handleVideoEnd(c: ClassEntry) {
    if (c.questions && c.questions.length > 0) {
      setViewQuestionsId(c.id!);
      setStudentAnswers(new Array(c.questions.length).fill(""));
    } else {
      handleMarkComplete(c.id!);
    }
  }

  async function handleSubmitQuestions(classId: string) {
    if (!currentUser) return;
    if (studentAnswers.some((a) => !a.trim())) {
      setSubmitError("Please answer all questions before submitting.");
      return;
    }
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId ? { ...c, completed: true } : c
      )
    );
    setViewQuestionsId(null);
    setStudentAnswers([]);
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitClassAnswers(
        classId,
        currentUser.uid,
        studentAnswers.map((answer, i) => ({ questionIndex: i, answer }))
      );
      const fresh = await getClassesByUserId(currentUser.uid);
      setClasses(isLive ? fresh : sortClasses(fresh));
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit. Try again.");
      setClasses((prev) =>
        prev.map((c) =>
          c.id === classId ? { ...c, completed: false } : c
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleAnswerChange(index: number, value: string) {
    setStudentAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  const currentIndex = isLive
    ? -1
    : classes.findIndex((c) => !c.completed);

  return (
    <div className="space-y-2 pb-8 pt-1 sm:pt-2">
      <div className="hrms-glass rounded-2xl p-4 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isLive
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-200"
                : "bg-gradient-to-br from-violet-400 to-violet-600 shadow-sm shadow-violet-200"
            }`}>
              <HeadingIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-800">{headingText}</h2>
              <p className="text-[11px] text-zinc-400 font-medium">
                {isLive ? "Your upcoming live sessions" : "Access your recorded classes"}
              </p>
            </div>
          </div>
          {isLive && !liveNowClass?.link && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-400/80 to-rose-400/80 text-white/90 text-sm font-black leading-none shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white/70" />
              LIVE
            </span>
          )}
          {isLive && liveNowClass?.link && (
            <a
              href={liveNowClass.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-black leading-none shadow-md shadow-red-200 hover:shadow-lg hover:shadow-red-300 hover:scale-105 transition-all duration-200 animate-[blink_1.5s_ease-in-out_infinite]"
            >
              <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
              LIVE
            </a>
          )}
        </div>
      </div>

      {!checkInLoading && checkedIn === false && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-orange-200">
          <LogIn className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <p className="text-[11px] font-bold text-orange-600">
            First you have to check in in dashboard to play videos.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-xs text-zinc-400">Loading...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="hrms-glass rounded-[20px] p-8 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center">
          <HeadingIcon className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-zinc-400">No {isLive ? "live" : "recorded"} classes available yet</p>
        </div>
      ) : isLive ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {classes.map((c, i) => (
            <div
              key={c.id}
              className="hrms-glass rounded-xl p-3 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <h3 className="text-sm font-bold text-zinc-800">{c.title}</h3>
              </div>
              {c.link && (
                <a
                  href={c.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium mb-2 break-all"
                >
                  <Link className="w-3 h-3 shrink-0" />
                  {c.link}
                </a>
              )}
              {c.liveVideoUrl && isStorageUrl(c.liveVideoUrl) && (
                <div className="mb-2 rounded-lg overflow-hidden bg-zinc-100 border border-[var(--border-light)]">
                  <video
                    src={c.liveVideoUrl}
                    poster={c.liveThumbnailUrl || undefined}
                    className="w-full h-auto max-h-[120px] object-contain"
                    controlsList="nodownload"
                    controls
                    preload="metadata"
                    playsInline
                  />
                </div>
              )}
              {c.fileUrl && (
                <a
                  href={c.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <FileText className="w-3 h-3 shrink-0" />
                  {c.fileName || "View PDF"}
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {classes.map((c, i) => {
            const isCompleted = c.completed === true;
            const isCurrent = i === currentIndex;
            const isLocked = !isCompleted && !isCurrent;
            const hasVideo = isStorageUrl(c.link);

            return (
              <div key={c.id} className="flex items-start gap-1.5">
                <span className="shrink-0 w-5 pt-1 text-center text-[8px] font-bold text-zinc-400 select-none leading-none">
                  {i + 1}
                </span>
                <div className={`flex-1 hrms-glass rounded-xl p-1.5 border bg-white/55 backdrop-blur-md shadow-sm transition-all duration-200 ${
                  isLocked
                    ? "border-zinc-200/60 opacity-55"
                    : isCompleted
                    ? "border-emerald-200/60 hover:shadow-md"
                    : "border-[var(--border-light)] hover:shadow-md"
                }`}>
                  {hasVideo ? (
                    <>
                      <div className="flex gap-1.5">
                         <div className="shrink-0 w-28 aspect-[3/2] sm:w-44">
                          {isLocked ? (
                            <div className="w-full h-full rounded bg-zinc-100 border border-[var(--border-light)] flex items-center justify-center">
                              <Lock className="w-3 h-3 text-zinc-300" />
                            </div>
                          ) : (
                            <SecureVideo
                              ref={(el) => { videoHandles.current[c.id!] = el; }}
                              src={c.link}
                              onEnded={() => handleVideoEnd(c)}
                              hideToolbar
                              checkedIn={checkedIn}
                              controls
                              onCachedChange={(cached) => {
                                if (cached && !cachedMap[c.id!]) {
                                  setCachedMap((p) => ({ ...p, [c.id!]: true }));
                                }
                              }}
                              userId={currentUser?.uid}
                              classId={c.id}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-between gap-0.5">
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="text-xs font-black text-violet-700 leading-tight break-words flex-1 min-w-0">{c.title}</h3>
                            {isCompleted && (
                              <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[7px] font-bold leading-none shadow-sm">
                                <CheckCircle className="w-2.5 h-2.5" />
                                Completed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-end gap-0.5">
                            {cachedMap[c.id!] && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[7px] font-bold leading-none shadow-sm">
                                <CloudOff className="w-2 h-2" />
                                Saved
                              </span>
                            )}
                            {!isLocked && !cachedMap[c.id!] && (
                              <button
                                onClick={() => videoHandles.current[c.id!]?.saveOffline()}
                                className="w-5 h-5 rounded-full bg-emerald-500 text-black hover:bg-emerald-600 transition-all cursor-pointer flex items-center justify-center shrink-0"
                                title="Save Offline"
                              >
                                <Download className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {c.questions && c.questions.length > 0 && (
                        <div className="mt-1">
                          <button
                            onClick={() => setViewQuestionsId(viewQuestionsId === c.id ? null : c.id!)}
                            className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
                          >
                            <ChevronDown className={`w-3 h-3 transition-transform ${viewQuestionsId === c.id ? "rotate-180" : ""}`} />
                            Questions ({c.questions.length})
                          </button>
                          {viewQuestionsId === c.id && (
                            <div className="mt-1.5 space-y-3">
                              {c.questions.map((q, qi) => (
                                <div key={qi} className="p-3 rounded-xl bg-white/60 border border-[var(--border-light)]">
                                  <p className="text-xs font-bold text-zinc-700 mb-2">{qi + 1}. {q}</p>
                                  <textarea
                                    value={studentAnswers[qi] || ""}
                                    onChange={(e) => handleAnswerChange(qi, e.target.value)}
                                    placeholder="Type your answer..."
                                    rows={2}
                                    className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-light)] text-xs font-medium focus:outline-none focus:border-violet-300 resize-none"
                                  />
                                </div>
                              ))}
                              {submitError && <p className="text-xs text-red-500 text-center">{submitError}</p>}
                              <button
                                onClick={() => handleSubmitQuestions(c.id!)}
                                disabled={submitting}
                                className="w-full min-h-[36px] px-4 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {submitting ? "Submitting..." : "Submit Answers"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="min-w-0 flex-1">
                        {c.link && (
                          isLocked ? (
                            <div className="flex items-center gap-1 text-[8px] text-zinc-400 cursor-not-allowed">
                              <Lock className="w-2.5 h-2.5 shrink-0" />
                              <span className="break-all line-clamp-1">{c.videoName || c.link}</span>
                            </div>
                          ) : (
                            <a
                              href={c.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[8px] text-indigo-600 hover:text-indigo-700 font-medium break-all"
                            >
                              <Link className="w-2.5 h-2.5 shrink-0" />
                              {c.videoName || c.link}
                            </a>
                          )
                        )}
                      </div>
                      <div className="shrink-0">
                        {isCompleted ? (
                          <span className="shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[6px] font-bold leading-none shadow-sm">
                            <CheckCircle className="w-2 h-2" />
                            Completed
                          </span>
                        ) : isCurrent ? null : (
                          <span className="shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-500 text-[6px] font-bold leading-none shadow-sm">
                            <Lock className="w-2 h-2" />
                            Locked
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

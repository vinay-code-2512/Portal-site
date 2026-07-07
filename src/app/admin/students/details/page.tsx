"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Mail, BookOpen, IndianRupee, User, Phone, Shield, Tag, Calendar, Plus, X, Link, Trash2, Edit3, Save, Monitor, Video, Image, Loader2, Upload, Lock, Eye, EyeOff, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getClassesByUserId, addClass, updateClass, deleteClass, uploadClassVideo, generateVideoThumbnail, uploadClassThumbnail, uploadClassFile, isStorageUrl, type ClassEntry } from "@/lib/classes";

interface StudentData {
  userId: string;
  userName: string;
  userEmail: string;
  phone: string;
  role: string;
  classType: string;
  paymentType: string;
  createdAt: string;
  courses: string[];
  totalPaid: number;
}

function ProfileTab({ student }: { student: StudentData }) {
  const { currentUser } = useAuth();
  const initial = student.userName.charAt(0).toUpperCase();
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleResetPassword() {
    setPwMsg(null);
    if (!pwNew) { setPwMsg({ type: "error", text: "Enter a new password" }); return; }
    if (pwNew.length < 6) { setPwMsg({ type: "error", text: "Password must be at least 6 characters" }); return; }
    if (pwNew !== pwConfirm) { setPwMsg({ type: "error", text: "Passwords do not match" }); return; }

    setPwSaving(true);
    try {
      const token = await currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const { updatePassword } = await import("@/lib/adminFunctions");
      await updatePassword(student.userId, pwNew, token);
      setPwMsg({ type: "success", text: "Password reset successfully!" });
      setPwNew("");
      setPwConfirm("");
    } catch (e: any) {
      setPwMsg({ type: "error", text: e?.message || "Something went wrong" });
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[var(--border-light)]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
            {initial}
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-800">{student.userName}</h2>
            <p className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
              <Mail className="w-3.5 h-3.5" />
              {student.userEmail}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3 h-3" /> Phone
            </p>
            <p className="text-sm font-bold text-zinc-800 mt-1">{student.phone || "—"}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3" /> Role
            </p>
            <p className="text-sm font-bold text-zinc-800 mt-1 capitalize">{student.role || "—"}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3 h-3" /> Class Type
            </p>
            <p className="text-sm font-bold text-zinc-800 mt-1 capitalize">{student.classType || "—"}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Member Since
            </p>
            <p className="text-sm font-bold text-zinc-800 mt-1">{student.createdAt || "—"}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> User ID
            </p>
            <p className="text-xs font-mono font-bold text-zinc-800 mt-1 truncate">{student.userId}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/40 border border-[var(--border-light)]">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <IndianRupee className="w-3 h-3" /> Total Paid
            </p>
            <p className="text-lg font-black text-emerald-600 mt-1">
              ₹{student.totalPaid.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Enrolled Courses ({student.courses.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {student.courses.length === 0 ? (
              <span className="text-xs text-zinc-400">No courses enrolled</span>
            ) : (
              student.courses.map((course) => (
                <span
                  key={course}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold"
                >
                  <BookOpen className="w-3 h-3" />
                  {course}
                </span>
              ))
            )}
            {student.paymentType && (
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                student.paymentType === "full"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-600"
                  : "bg-amber-50 border border-amber-200 text-amber-600"
              }`}>
                {student.paymentType === "full" ? "FULL PAID" : "EMI"}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--border-light)]">
          <button
            onClick={() => { setShowPwForm((p) => !p); setPwMsg(null); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            {showPwForm ? "Cancel" : "Reset Password"}
          </button>

          {showPwForm && (
            <div className="mt-3 p-4 rounded-xl bg-white/40 border border-[var(--border-light)] space-y-3">
              {pwMsg && (
                <p className={`text-xs text-center ${pwMsg.type === "success" ? "text-green-600" : "text-red-500"}`}>
                  {pwMsg.text}
                </p>
              )}

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type={showPw ? "text" : "password"}
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  placeholder="New password (min. 6 characters)"
                  className="w-full pl-10 pr-10 py-2 text-sm rounded-xl bg-white border border-[var(--border-light)] text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-amber-300 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type={showPw ? "text" : "password"}
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-10 py-2 text-sm rounded-xl bg-white border border-[var(--border-light)] text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-amber-300 transition-colors"
                />
              </div>

              <button
                onClick={handleResetPassword}
                disabled={pwSaving}
                className="w-full min-h-[38px] px-4 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pwSaving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                ) : (
                  <><Lock className="w-3.5 h-3.5" /> Set New Password</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClassTab({ student }: { student: StudentData }) {
  const isLive = student.classType === "live";
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoFileName, setVideoFileName] = useState("");
  const [videoName, setVideoName] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formIsLiveNow, setFormIsLiveNow] = useState(false);
  const [formQuestions, setFormQuestions] = useState<string[]>([]);
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [liveVideoUrl, setLiveVideoUrl] = useState("");
  const [liveVideoName, setLiveVideoName] = useState("");
  const [liveVideoUploading, setLiveVideoUploading] = useState(false);
  const [liveThumbnailUrl, setLiveThumbnailUrl] = useState("");
  const [liveThumbnailUploading, setLiveThumbnailUploading] = useState(false);
  const liveVideoInputRef = useRef<HTMLInputElement>(null);

  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!student.userId) return;
    getClassesByUserId(student.userId)
      .then(setClasses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [student.userId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!title.trim()) return;
    try {
      const order = classes.length > 0 ? Math.max(...classes.map((c) => c.order ?? 0)) + 1 : 1;
      const validQuestions = formQuestions.filter((q) => q.trim());
      const classData: any = {
        userId: student.userId,
        type: student.classType as "live" | "recorded",
        title: title.trim(),
        link: link.trim(),
        videoName: videoName || undefined,
        order,
      };
      if (validQuestions.length > 0) classData.questions = validQuestions;
      if (thumbnailUrl) classData.thumbnailUrl = thumbnailUrl;
      if (isLive && formIsLiveNow) classData.isLiveNow = true;
      if (liveVideoUrl) {
        classData.liveVideoUrl = liveVideoUrl;
        classData.liveVideoName = liveVideoName || undefined;
        if (liveThumbnailUrl) classData.liveThumbnailUrl = liveThumbnailUrl;
      }
      if (fileUrl) {
        classData.fileUrl = fileUrl;
        classData.fileName = fileName || undefined;
      }
      const id = await addClass(classData);
      setClasses((prev) => [{ id, ...classData }, ...prev]);
      setTitle("");
      setLink("");
      setFormQuestions([]);
      setFormIsLiveNow(false);
      setVideoUploading(false);
      setVideoFileName("");
      setVideoName("");
      setThumbnailUrl("");
      setLiveVideoUrl("");
      setLiveVideoName("");
      setLiveVideoUploading(false);
      setLiveThumbnailUrl("");
      setLiveThumbnailUploading(false);
      setFileUrl("");
      setFileName("");
      setFileUploading(false);
      setShowForm(false);
    } catch (e: any) {
      setFormError(e?.message || "Failed to save. Check Firestore permissions.");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!editId || !title.trim()) return;
    try {
      const validQuestions = formQuestions.filter((q) => q.trim());
      const updateData: any = { title: title.trim(), link: link.trim(), videoName: videoName || undefined };
      if (validQuestions.length > 0) updateData.questions = validQuestions;
      if (thumbnailUrl) updateData.thumbnailUrl = thumbnailUrl;
      updateData.isLiveNow = formIsLiveNow;
      if (liveVideoUrl) {
        updateData.liveVideoUrl = liveVideoUrl;
        updateData.liveVideoName = liveVideoName || undefined;
        if (liveThumbnailUrl) updateData.liveThumbnailUrl = liveThumbnailUrl;
      } else {
        updateData.liveVideoUrl = null;
        updateData.liveVideoName = null;
        updateData.liveThumbnailUrl = null;
      }
      if (fileUrl) {
        updateData.fileUrl = fileUrl;
        updateData.fileName = fileName || undefined;
      } else {
        updateData.fileUrl = null;
        updateData.fileName = null;
      }
      await updateClass(editId, updateData);
      setClasses((prev) => prev.map((c) => c.id === editId ? { ...c, ...updateData } : c));
      setEditId(null);
      setTitle("");
      setLink("");
      setFormQuestions([]);
      setFormIsLiveNow(false);
      setVideoUploading(false);
      setVideoFileName("");
      setVideoName("");
      setThumbnailUrl("");
      setLiveVideoUrl("");
      setLiveVideoName("");
      setLiveVideoUploading(false);
      setLiveThumbnailUrl("");
      setLiveThumbnailUploading(false);
      setFileUrl("");
      setFileName("");
      setFileUploading(false);
    } catch (e: any) {
      setFormError(e?.message || "Failed to update. Check Firestore permissions.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this class entry?")) return;
    try {
      await deleteClass(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  }

  function startEdit(c: ClassEntry) {
    setEditId(c.id!);
    setTitle(c.title);
    setLink(c.link);
    setVideoName(c.videoName || "");
    setThumbnailUrl(c.thumbnailUrl || "");
    setFormQuestions(c.questions ? [...c.questions] : []);
    setFormIsLiveNow(c.isLiveNow || false);
    setLiveVideoUrl(c.liveVideoUrl || "");
    setLiveVideoName(c.liveVideoName || "");
    setLiveThumbnailUrl(c.liveThumbnailUrl || "");
    setFileUrl(c.fileUrl || "");
    setFileName(c.fileName || "");
    setShowForm(true);
  }

  function addFormQuestion() {
    setFormQuestions((prev) => [...prev, ""]);
  }

  function removeFormQuestion(index: number) {
    setFormQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFormQuestion(index: number, value: string) {
    setFormQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));
  }

  const HeadingIcon = isLive ? Monitor : Video;
  const headingText = isLive ? "Live Class" : "Recorded Class";

  return (
    <div className="space-y-4">
      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLive ? "bg-emerald-500" : "bg-violet-500"}`}>
              <HeadingIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-black text-zinc-800">{headingText}</h2>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditId(null); setTitle(""); setLink(""); setFormQuestions([]); setFormIsLiveNow(false); setVideoUploading(false); setVideoFileName(""); setVideoName(""); setThumbnailUrl(""); setThumbnailUploading(false); }}
            className="min-h-[36px] px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? "Close" : `Add ${isLive ? "Live" : "Recorded"} Class`}
          </button>
        </div>

        {showForm && (
          <form onSubmit={editId ? handleUpdate : handleAdd} className="mb-4 p-4 rounded-xl bg-white/40 border border-[var(--border-light)] space-y-3">
            {formError && <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-500 text-xs">{formError}</div>}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Class title"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-light)] text-sm font-medium focus:outline-none focus:border-indigo-300"
              required
            />

            {isLive && (
              <label className="flex items-center gap-2 cursor-pointer select-none py-1.5 px-3 rounded-xl bg-red-50/50 border border-red-100">
                <input
                  type="checkbox"
                  checked={formIsLiveNow}
                  onChange={(e) => setFormIsLiveNow(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-[11px] font-bold shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-[blink_1.5s_ease-in-out_infinite]" />
                  Live Now
                </span>
              </label>
            )}

            <div className="space-y-1.5">
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder={isLive ? "Live meeting link (e.g. Zoom/Google Meet URL)" : "Recording link (e.g. YouTube/Drive URL)"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-light)] text-sm font-medium focus:outline-none focus:border-indigo-300"
              />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={videoInputRef}
                  accept="video/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (isLive) {
                      setLiveVideoUploading(true);
                      setLiveVideoName(file.name);
                      setFormError("");
                      try {
                        const { url, name } = await uploadClassVideo(student.userId, file);
                        setLiveVideoUrl(url);
                        setLiveVideoName(name);
                        setLiveThumbnailUploading(true);
                        try {
                          const thumbBlob = await generateVideoThumbnail(url);
                          const thumbUrl = await uploadClassThumbnail(student.userId, thumbBlob);
                          setLiveThumbnailUrl(thumbUrl);
                        } catch { }
                        setLiveThumbnailUploading(false);
                      } catch (err: any) {
                        const msg = err?.message || err?.code || "Failed to upload video";
                        console.error("Video upload error:", msg);
                        setFormError(msg);
                      } finally {
                        setLiveVideoUploading(false);
                        e.target.value = "";
                      }
                    } else {
                      setVideoUploading(true);
                      setVideoFileName(file.name);
                      setFormError("");
                      try {
                        const { url, name } = await uploadClassVideo(student.userId, file);
                        setLink(url);
                        setVideoName(name);
                        setThumbnailUploading(true);
                        try {
                          const thumbBlob = await generateVideoThumbnail(url);
                          const thumbUrl = await uploadClassThumbnail(student.userId, thumbBlob);
                          setThumbnailUrl(thumbUrl);
                        } catch { }
                        setThumbnailUploading(false);
                      } catch (err: any) {
                        const msg = err?.message || err?.code || "Failed to upload video";
                        console.error("Video upload error:", msg);
                        setFormError(msg);
                      } finally {
                        setVideoUploading(false);
                        e.target.value = "";
                      }
                    }
                  }}
                  className="hidden"
                />
                {isLive ? (
                  <>
                    {liveVideoUploading ? (
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading {liveVideoName}...
                      </span>
                    ) : liveVideoUrl && isStorageUrl(liveVideoUrl) ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <Video className="w-3.5 h-3.5" />
                        Video uploaded
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="min-h-[26px] px-2.5 rounded-lg border border-dashed border-[var(--border-light)] text-[11px] text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        Upload Video
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {videoUploading ? (
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading {videoFileName}...
                      </span>
                    ) : link && isStorageUrl(link) ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <Video className="w-3.5 h-3.5" />
                        Video uploaded
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="min-h-[26px] px-2.5 rounded-lg border border-dashed border-[var(--border-light)] text-[11px] text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        Upload from PC
                      </button>
                    )}
                  </>
                )}
              </div>
              {isLive && (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFileUploading(true);
                      setFileName(file.name);
                      setFormError("");
                      try {
                        const { url, name } = await uploadClassFile(student.userId, file);
                        setFileUrl(url);
                        setFileName(name);
                      } catch (err: any) {
                        const msg = err?.message || err?.code || "Failed to upload file";
                        console.error("File upload error:", msg);
                        setFormError(msg);
                      } finally {
                        setFileUploading(false);
                        e.target.value = "";
                      }
                    }}
                    className="hidden"
                  />
                  {fileUploading ? (
                    <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading {fileName}...
                    </span>
                  ) : fileUrl ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <Image className="w-3.5 h-3.5" />
                      PDF uploaded
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[26px] px-2.5 rounded-lg border border-dashed border-[var(--border-light)] text-[11px] text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      Upload PDF
                    </button>
                  )}
                </div>
              )}
            </div>
            {thumbnailUploading && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating thumbnail...
              </span>
            )}
            {thumbnailUrl && !thumbnailUploading && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <Image className="w-3.5 h-3.5" />
                Thumbnail ready
              </div>
            )}
            {isLive && liveThumbnailUploading && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating video thumbnail...
              </span>
            )}
              {isLive && liveThumbnailUrl && !liveThumbnailUploading && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                  <Image className="w-3.5 h-3.5" />
                  Video thumbnail ready
                </div>
              )}

              <div className="border-t border-[var(--border-light)] pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-zinc-600">Questions ({formQuestions.length})</h5>
                <button
                  type="button"
                  onClick={addFormQuestion}
                  className="min-h-[26px] px-2.5 rounded-lg bg-violet-600 text-white text-[10px] font-bold hover:bg-violet-700 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {formQuestions.length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-3">No questions yet. Click "Add" to create one.</p>
              )}
              {formQuestions.map((q, qi) => (
                <div key={qi} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 shrink-0">#{qi + 1}</span>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => updateFormQuestion(qi, e.target.value)}
                    placeholder="Enter question"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-light)] text-xs font-medium focus:outline-none focus:border-violet-300"
                  />
                    <button onClick={() => removeFormQuestion(qi)} type="button" className="p-1 rounded bg-white border border-red-200 text-red-500 hover:bg-rose-50 hover:text-red-700 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="min-h-[36px] px-5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {editId ? "Update" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditId(null); setTitle(""); setLink(""); setFormQuestions([]); setFormIsLiveNow(false); setVideoUploading(false); setVideoFileName(""); setVideoName(""); setThumbnailUrl(""); setThumbnailUploading(false); }}
                className="min-h-[36px] px-4 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-bold hover:bg-zinc-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-xs text-zinc-400 text-center py-8">Loading...</p>
        ) : classes.length === 0 ? (
          <div className="text-center py-8">
            <HeadingIcon className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-400">No {isLive ? "live" : "recorded"} classes added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-white/40 border border-[var(--border-light)]">
                <div className="flex gap-3">
                  {c.type === "recorded" && isStorageUrl(c.link) && (
                    <div className="shrink-0 w-[200px] h-[112px] rounded-lg overflow-hidden bg-zinc-100 border border-[var(--border-light)]">
                      <video
                        src={c.link}
                        poster={c.thumbnailUrl || undefined}
                        className="w-full h-full object-cover"
                        controlsList="nodownload"
                        controls
                        preload="metadata"
                        playsInline
                      />
                    </div>
                  )}
                  {c.type === "live" && c.liveVideoUrl && isStorageUrl(c.liveVideoUrl) && (
                    <div className="shrink-0 w-[200px] h-[112px] rounded-lg overflow-hidden bg-zinc-100 border border-[var(--border-light)]">
                      <video
                        src={c.liveVideoUrl}
                        poster={c.liveThumbnailUrl || undefined}
                        className="w-full h-full object-cover"
                        controlsList="nodownload"
                        controls
                        preload="metadata"
                        playsInline
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                      {c.title}
                      {c.isLiveNow && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold leading-none animate-[blink_1.5s_ease-in-out_infinite]">
                          LIVE
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {c.createdAt
                          ? (c.createdAt.toDate
                              ? c.createdAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                              : c.createdAt.seconds
                              ? new Date(c.createdAt.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                              : new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }))
                          : "—"}
                      </span>
                    </div>
                    {c.type === "live" && (c.link || c.fileUrl) && (
                      <div className="flex flex-col gap-0.5 mt-1">
                        {c.link && (
                          <a
                            href={c.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            <Link className="w-3 h-3" />
                            Join Meeting
                          </a>
                        )}
                        {c.fileUrl && (
                          <a
                            href={c.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            <Image className="w-3 h-3" />
                            {c.fileName || "View PDF"}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 self-start">
                    <button
                      onClick={() => startEdit(c)}
                      className="p-1.5 rounded-lg hover:bg-indigo-50 text-zinc-400 hover:text-indigo-600 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id!)}
                      className="p-1.5 rounded-lg bg-white border border-red-200 text-red-500 hover:bg-rose-50 hover:text-red-700 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {c.questions && c.questions.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => setOpenQuestionId(openQuestionId === c.id ? null : c.id!)}
                      className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${openQuestionId === c.id ? "rotate-180" : ""}`} />
                      Questions ({c.questions.length})
                    </button>
                    {openQuestionId === c.id && (
                      <div className="mt-1.5 p-2 rounded-lg bg-white border border-zinc-200 space-y-1 shadow-sm max-h-[120px] overflow-y-auto">
                        {c.questions.map((q, qi) => (
                          q.trim() ? (
                            <p key={qi} className="text-[11px] text-zinc-600 leading-relaxed">
                              <span className="font-semibold text-zinc-400 mr-1">#{qi + 1}</span>
                              {q}
                            </p>
                          ) : null
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StudentDetailsInner() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");
  const tab = searchParams.get("tab") || "profile";

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function formatDate(ts: any): string {
    if (!ts) return "—";
    if (ts.toDate) return ts.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  useEffect(() => {
    if (!userId) { setLoading(false); setError("No student ID provided"); return; }
    const uid: string = userId;

    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (!userSnap.exists()) {
          setError("Student not found");
          setLoading(false);
          return;
        }

        const userData = userSnap.data();

        const courses: string[] = [];
        let totalPaid = 0;

        try {
          const enrollmentSnap = await getDocs(
            query(collection(db, "enrollments"), where("userId", "==", uid))
          );
          enrollmentSnap.forEach((d) => {
            const data = d.data();
            if (data.courseName) courses.push(data.courseName);
            if (data.amount) totalPaid += data.amount;
          });
        } catch {
          // Enrollments read may fail due to security rules; fallback to user doc fields
          if (userData.courseName) courses.push(userData.courseName);
        }

        setStudent({
          userId: uid,
          userName: userData.fullName || userData.name || "Unknown",
          userEmail: userData.email || "",
          phone: userData.phone || "",
          role: userData.role || "",
          classType: userData.classType || "",
          paymentType: userData.paymentType || "",
          createdAt: formatDate(userData.createdAt),
          courses,
          totalPaid,
        });
      } catch (err: any) {
        setError(err?.message || "Failed to load student");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="hrms-glass rounded-[20px] p-8 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center">
        <p className="text-sm font-semibold text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="hrms-glass rounded-[20px] p-8 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center">
        <User className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-zinc-400">{error || "Student not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 pt-6 sm:pt-8">
      {tab === "profile" && <ProfileTab student={student} />}
      {tab === "class" && <ClassTab student={student} />}
    </div>
  );
}

export default function StudentDetailsPage() {
  return (
    <Suspense fallback={null}>
      <StudentDetailsInner />
    </Suspense>
  );
}

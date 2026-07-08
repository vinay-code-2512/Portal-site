"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  Search, ArrowLeft, Video, Monitor, Plus, X, Upload, Save, Trash2,
  Image as ImageIcon, Loader2, Calendar, Edit3, User as UserIcon,
  BookOpen, GraduationCap, CheckCircle, List, Grid3x3, ChevronDown, Link
} from "lucide-react";
import {
  getClassesByUserId, addClass, updateClass, deleteClass,
  uploadClassVideo, generateVideoThumbnail, uploadClassThumbnail,
  uploadClassFile, isStorageUrl, type ClassEntry
} from "@/lib/classes";
import { COURSES, BATCHES } from "@/lib/courses";
import ErrorState from "@/components/common/ErrorState";

interface StudentCard {
  userId: string;
  userName: string;
  userEmail: string;
  courses: string[];
  classType?: string;
  batchName?: string;
}

// Reusing the same ClassTab structure from Admin Student Details but tailored for the Employee portal
function ClassManagerView({ student, onBack }: { student: StudentCard; onBack: () => void }) {
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
    if (!title.trim()) { setFormError("Class title is required"); return; }
    try {
      const order = classes.length > 0 ? Math.max(...classes.map((c) => c.order ?? 0)) + 1 : 1;
      const validQuestions = formQuestions.filter((q) => q.trim());
      const classType = student.classType || "recorded";
      const classData: any = {
        userId: student.userId,
        type: classType as "live" | "recorded",
        title: title.trim(),
        link: link.trim(),
        videoName: videoName || undefined,
        order,
      };
      if (validQuestions.length > 0) classData.questions = validQuestions;
      if (thumbnailUrl) classData.thumbnailUrl = thumbnailUrl;
      if (liveVideoUrl) {
        classData.liveVideoUrl = liveVideoUrl;
        classData.liveVideoName = liveVideoName || undefined;
        if (liveThumbnailUrl) classData.liveThumbnailUrl = liveThumbnailUrl;
      }
      if (fileUrl) {
        classData.fileUrl = fileUrl;
        classData.fileName = fileName || undefined;
      }
      
      await addClass(classData);
      const fresh = await getClassesByUserId(student.userId);
      setClasses(fresh);
      
      setTitle("");
      setLink("");
      setFormQuestions([]);
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
    if (!editId) return;
    if (!title.trim()) { setFormError("Class title is required"); return; }
    try {
      const validQuestions = formQuestions.filter((q) => q.trim());
      const updateData: any = { title: title.trim(), link: link.trim(), videoName: videoName || undefined };
      if (validQuestions.length > 0) updateData.questions = validQuestions;
      if (thumbnailUrl) updateData.thumbnailUrl = thumbnailUrl;
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
      const fresh = await getClassesByUserId(student.userId);
      setClasses(fresh);
      
      setEditId(null);
      setTitle("");
      setLink("");
      setFormQuestions([]);
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
      setFormError(e?.message || "Failed to update. Check Firestore permissions.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this class entry?")) return;
    try {
      await deleteClass(id);
      const fresh = await getClassesByUserId(student.userId);
      setClasses(fresh);
    } catch (e: any) {
        alert(e?.message || "Failed to delete.");
    }
  }

  function startEdit(c: ClassEntry) {
    setEditId(c.id!);
    setTitle(c.title);
    setLink(c.link);
    setVideoName(c.videoName || "");
    setThumbnailUrl(c.thumbnailUrl || "");
    setFormQuestions(c.questions ? [...c.questions] : []);
    setLiveVideoUrl(c.liveVideoUrl || "");
    setLiveVideoName(c.liveVideoName || "");
    setLiveThumbnailUrl(c.liveThumbnailUrl || "");
    setFileUrl(c.fileUrl || "");
    setFileName(c.fileName || "");
    setShowForm(true);
  }

  function addFormQuestion() { setFormQuestions((prev) => [...prev, ""]); }
  function removeFormQuestion(index: number) { setFormQuestions((prev) => prev.filter((_, i) => i !== index)); }
  function updateFormQuestion(index: number, value: string) { setFormQuestions((prev) => prev.map((q, i) => (i === index ? value : q))); }

  const HeadingIcon = isLive ? Monitor : Video;
  const headingText = isLive ? "Live Class" : "Recorded Class";

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-indigo-600 font-semibold transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Students
      </button>

      <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[var(--border-light)]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shrink-0">
            {student.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-800">{student.userName}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500">
              <span>{student.userEmail}</span>
              {student.batchName && (
                <>
                  <span className="w-1 h-1 rounded-full bg-zinc-300" />
                  <span className="font-medium">Batch: {BATCHES.find(b => b.id === student.batchName)?.name || student.batchName}</span>
                </>
              )}
                  </div>
                </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLive ? "bg-emerald-500" : "bg-violet-500"}`}>
              <HeadingIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-black text-zinc-800">Manage {headingText}es</h2>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditId(null); setTitle(""); setLink(""); setFormQuestions([]); setVideoUploading(false); setVideoFileName(""); setVideoName(""); setThumbnailUrl(""); setThumbnailUploading(false); }}
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
                      <ImageIcon className="w-3.5 h-3.5" />
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
                <ImageIcon className="w-3.5 h-3.5" />
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
                <ImageIcon className="w-3.5 h-3.5" />
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
                onClick={() => { setShowForm(false); setEditId(null); setTitle(""); setLink(""); setFormQuestions([]); setVideoUploading(false); setVideoFileName(""); setVideoName(""); setThumbnailUrl(""); setThumbnailUploading(false); }}
                className="min-h-[36px] px-4 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-bold hover:bg-zinc-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-xs text-zinc-400 text-center py-8">Loading classes...</p>
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
                        controls
                        controlsList="nodownload"
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
                        controls
                        controlsList="nodownload"
                        preload="metadata"
                        playsInline
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-zinc-800">
                      {c.title}
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
                            <ImageIcon className="w-3 h-3" />
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


export default function ManageClassesPage() {
  const { userData, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<StudentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedClassType, setSelectedClassType] = useState<"all" | "live" | "recorded">("all");
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentCard | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "videos">("grid");

  // Bulk / Group Send
  const [bulkShowForm, setBulkShowForm] = useState(false);
  const [bulkType, setBulkType] = useState<"live" | "recorded">("recorded");
  const [bulkTitle, setBulkTitle] = useState("");
  const [bulkBatchName, setBulkBatchName] = useState("");
  const [bulkLink, setBulkLink] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkVideoFileName, setBulkVideoFileName] = useState("");
  const [bulkVideoName, setBulkVideoName] = useState("");
  const [bulkThumbnailUrl, setBulkThumbnailUrl] = useState("");
  const [bulkThumbnailUploading, setBulkThumbnailUploading] = useState(false);
  const [bulkQuestions, setBulkQuestions] = useState<string[]>([]);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");
  const bulkVideoInputRef = useRef<HTMLInputElement>(null);

  const [bulkLiveVideoUrl, setBulkLiveVideoUrl] = useState("");
  const [bulkLiveVideoName, setBulkLiveVideoName] = useState("");
  const [bulkLiveThumbnailUrl, setBulkLiveThumbnailUrl] = useState("");
  const [bulkLiveThumbnailUploading, setBulkLiveThumbnailUploading] = useState(false);
  const bulkLiveVideoInputRef = useRef<HTMLInputElement>(null);

  const [bulkFileUrl, setBulkFileUrl] = useState("");
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkFileUploading, setBulkFileUploading] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // All uploaded videos
  const [allClasses, setAllClasses] = useState<(ClassEntry & { userName?: string })[]>([]);
  const [allClassesLoading, setAllClassesLoading] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      if (authLoading) return;
      if (!(userData as any)?.canManageClasses) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const userSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "paid-user"))
        );

        const userIds: string[] = [];
        const userMap = new Map<string, any>();
        userSnap.forEach((d) => {
          const data = d.data();
          userIds.push(d.id);
          userMap.set(d.id, {
            fullName: data.fullName || data.name || "",
            email: data.email || "",
            courseName: data.courseName || undefined,
            classType: data.classType || data.class_type || undefined,
            batchName: data.batchName || undefined,
          });
        });

        let enrollmentSnap: any = null;
        const enrollmentMap = new Map<string, any>();
        try {
          enrollmentSnap = await getDocs(collection(db, "enrollments"));
          enrollmentSnap.forEach((d: any) => {
            const data = d.data();
            const uid = data.userId;
            if (!enrollmentMap.has(uid)) {
              enrollmentMap.set(uid, { courses: [] });
            }
            const entry = enrollmentMap.get(uid)!;
            if (data.courseName) entry.courses.push(data.courseName);
          });
        } catch {
          // Ignore if permission denied
        }

        const cards: StudentCard[] = [];
        const allIds = new Set([...userIds, ...enrollmentMap.keys()]);
        
        for (const uid of allIds) {
          const userInfo = userMap.get(uid);
          const enrollInfo = enrollmentMap.get(uid);
          if (!userInfo && !enrollInfo) continue;
          
          const enrollDoc = enrollmentSnap?.docs?.find((d: any) => d.data().userId === uid);
          const userCourseName = userInfo?.courseName;
          
          cards.push({
            userId: uid,
            userName: userInfo?.fullName || enrollDoc?.data()?.userName || "Unknown",
            userEmail: userInfo?.email || enrollDoc?.data()?.userEmail || "",
            courses: userCourseName ? [userCourseName] : (enrollInfo?.courses || []),
            classType: userInfo?.classType || enrollDoc?.data()?.classType || undefined,
            batchName: userInfo?.batchName || enrollDoc?.data()?.batchName || undefined,
          });
        }

        cards.sort((a, b) => a.userName.localeCompare(b.userName));
        setStudents(cards);
      } catch (err: any) {
        setError(err?.message || "Failed to load students");
      } finally {
        setLoading(false);
      }
    }
    
    fetchStudents();
  }, [authLoading, userData]);

  // Fetch all uploaded classes
  useEffect(() => {
    if (viewMode !== "videos") return;
    if (!(userData as any)?.canManageClasses) return;

    async function fetchAllClasses() {
      setAllClassesLoading(true);
      try {
        const snap = await getDocs(collection(db, "classes"));
        const classList: ClassEntry[] = [];
        snap.forEach((d) => classList.push({ id: d.id, ...d.data() } as ClassEntry));

        const userMap = new Map<string, string>();
        students.forEach((s) => userMap.set(s.userId, s.userName));

        const enriched = classList.map((c) => ({
          ...c,
          userName: userMap.get(c.userId) || c.userId,
        }));
        enriched.sort((a, b) => {
          const da = a.createdAt?.toDate?.()?.getTime() ?? a.createdAt?.seconds ?? 0;
          const db = b.createdAt?.toDate?.()?.getTime() ?? b.createdAt?.seconds ?? 0;
          return db - da;
        });
        setAllClasses(enriched);
      } catch (err: any) {
        console.error("Failed to fetch all classes:", err);
      } finally {
        setAllClassesLoading(false);
      }
    }

    fetchAllClasses();
  }, [viewMode, (userData as any)?.canManageClasses, students]);

  // Clear stale error when switching to grid view
  useEffect(() => {
    if (viewMode === "grid") setError("");
  }, [viewMode]);

  const courseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      s.courses.forEach((c) => {
        const key = c.toLowerCase().trim();
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return counts;
  }, [students]);

  const canManage = (userData as any)?.canManageClasses;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <ErrorState 
        message="Access Denied: You do not have permission to manage classes." 
      />
    );
  }

  if (selectedStudent) {
    return <ClassManagerView student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  const displayedStudents = students
    .filter((s) => !selectedCourse || s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()))
    .filter((s) => selectedClassType === "all" || s.classType === selectedClassType)
    .filter((s) => !selectedBatch || s.batchName === selectedBatch)
    .filter((s) =>
        s.userName.toLowerCase().includes(search.toLowerCase()) ||
        s.userEmail.toLowerCase().includes(search.toLowerCase())
    );

  const displayedClasses = allClasses.filter((c) => {
    if (selectedCourse) {
      const student = students.find((s) => s.userId === c.userId);
      if (!student || !student.courses.some((co) => co.toLowerCase().trim() === selectedCourse.toLowerCase().trim())) return false;
    }
    if (selectedClassType !== "all" && c.type !== selectedClassType) return false;
    if (selectedBatch) {
      const student = students.find((s) => s.userId === c.userId);
      if (student && student.batchName !== selectedBatch) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !(c.userName || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 pt-6 sm:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Manage Classes
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Add or edit recorded videos for paid students
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/55 rounded-xl border border-[var(--border-light)] p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              viewMode === "grid"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Grid3x3 className="w-3.5 h-3.5" />
            Students
          </button>
          <button
            onClick={() => setViewMode("videos")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              viewMode === "videos"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            All Videos
          </button>
        </div>
      </div>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/35 border border-[var(--border-light)]/50 text-zinc-700 cursor-pointer"
      >
        <GraduationCap className="w-3.5 h-3.5" />
        {sidebarOpen ? "Hide Courses" : "Show Courses"}
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Course Sidebar */}
        <div className={`${sidebarOpen ? "block" : "hidden"} lg:block w-full lg:w-60 shrink-0`}>
          <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm sticky top-6">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[var(--border-light)]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-black text-zinc-700 tracking-tight">
                  Courses
                </h3>
                <p className="text-[9px] text-zinc-400 font-semibold">
                  {selectedCourse ? `Filtering: ${selectedCourse}` : "All students"}
                </p>
              </div>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => { setSelectedCourse(null); setSelectedClassType("all"); setSelectedBatch(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all duration-200 group cursor-pointer ${
                  !selectedCourse
                    ? "bg-gradient-to-r from-indigo-50 to-purple-50/50 border border-indigo-200 text-indigo-700 shadow-sm"
                    : "bg-white/70 border border-transparent text-zinc-500 hover:bg-zinc-50 hover:border-zinc-200 hover:text-zinc-700"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${!selectedCourse ? "bg-indigo-500" : "bg-zinc-300 group-hover:bg-zinc-400"}`} />
                  <span className="text-[11px] font-bold">All Courses</span>
                </div>
                <span className={`shrink-0 ml-2 min-w-[22px] text-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  !selectedCourse
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-zinc-100 text-zinc-500"
                }`}>
                  {students.length}
                </span>
              </button>
              <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent mx-2 my-1.5" />
              {COURSES.map((course) => {
                const count = courseCounts[course.name.toLowerCase().trim()] || 0;
                const isActive = selectedCourse === course.name;
                return (
                  <button
                    key={course.id}
                    onClick={() => { setSelectedCourse(course.name); setSelectedClassType("all"); setSelectedBatch(null); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all duration-200 group cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50/50 border border-indigo-200 text-indigo-700 shadow-sm"
                        : "bg-white/70 border border-transparent text-zinc-500 hover:bg-zinc-50 hover:border-zinc-200 hover:text-zinc-700"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        isActive ? "bg-indigo-500" : "bg-zinc-300 group-hover:bg-zinc-400"
                      }`} />
                      <span className="text-[11px] font-bold leading-snug whitespace-normal break-words">{course.name}</span>
                    </div>
                    <span className={`shrink-0 ml-2 min-w-[22px] text-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                      isActive
                        ? "bg-indigo-100 text-indigo-600"
                        : count > 0
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-zinc-100 text-zinc-400"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Group Send / Bulk Upload */}
          {selectedCourse && viewMode === "grid" && !error && (
            <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <Monitor className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-700">Upload Class to All Students</h3>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                      {students.filter((s) => s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()) && (!bulkBatchName || s.batchName === bulkBatchName)).length} student{students.filter((s) => s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()) && (!bulkBatchName || s.batchName === bulkBatchName)).length !== 1 ? "s" : ""} enrolled in <span className="text-indigo-600">{selectedCourse}</span>
                      {bulkBatchName && <span className="text-cyan-600"> ({bulkBatchName})</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setBulkShowForm(!bulkShowForm);
                    if (bulkShowForm) {
                      setBulkTitle("");
                      setBulkBatchName("");
                      setBulkLink("");
                      setBulkQuestions([]);
                      setBulkThumbnailUrl("");
                      setBulkVideoFileName("");
                      setBulkError("");
                      setBulkSuccess("");
                    }
                  }}
                  className="min-h-[36px] px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {bulkShowForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {bulkShowForm ? "Close" : "Upload Class"}
                </button>
              </div>

              {bulkSuccess && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {bulkSuccess}
                </div>
              )}

              {bulkShowForm && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBulkError("");
                    setBulkSuccess("");

                    if (!bulkTitle.trim()) { setBulkError("Title is required"); return; }
                    if (!bulkLink.trim() && !bulkVideoFileName) { setBulkError("Link or video is required"); return; }

                    const enrolledStudents = students.filter((s) =>
                      s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()) &&
                      (!bulkBatchName || s.batchName === bulkBatchName)
                    );
                    if (enrolledStudents.length === 0) { setBulkError("No enrolled students found"); return; }

                    setBulkUploading(true);

                    try {
                      const order = Date.now();
                      const allResults = await Promise.allSettled(
                        enrolledStudents.map((s) =>
                          addClass({
                            userId: s.userId,
                            type: bulkType,
                            title: bulkTitle.trim(),
                            link: bulkLink.trim(),
                            videoName: bulkVideoName || undefined,
                            order,
                            questions: bulkQuestions.filter((q) => q.trim()).length > 0 ? bulkQuestions.filter((q) => q.trim()) : undefined,
                            thumbnailUrl: bulkThumbnailUrl || undefined,
                            liveVideoUrl: bulkLiveVideoUrl || undefined,
                            liveVideoName: bulkLiveVideoName || undefined,
                            liveThumbnailUrl: bulkLiveThumbnailUrl || undefined,
                            fileUrl: bulkFileUrl || undefined,
                            fileName: bulkFileName || undefined,
                          })
                        )
                      );

                      const success = allResults.filter((r) => r.status === "fulfilled").length;
                      const failed = allResults.filter((r) => r.status === "rejected").map((r: PromiseRejectedResult, i) => ({
                        userId: enrolledStudents[i].userId,
                        error: r.reason?.message || "Unknown error",
                      }));

                      setBulkSuccess(`Class created for ${success} student${success !== 1 ? "s" : ""}`);
                      if (failed.length > 0) {
                        setBulkError(`${failed.length} failed: ${failed.map((f) => f.error).join("; ")}`);
                      }

                      setBulkShowForm(false);
                      setBulkTitle("");
                      setBulkBatchName("");
                      setBulkLink("");
                      setBulkQuestions([]);
                      setBulkThumbnailUrl("");
                      setBulkVideoFileName("");
                      setBulkLiveVideoUrl("");
                      setBulkLiveVideoName("");
                      setBulkLiveThumbnailUrl("");
                      setBulkLiveThumbnailUploading(false);
                      setBulkFileUrl("");
                      setBulkFileName("");
                      setBulkFileUploading(false);
                    } catch (err: any) {
                      setBulkError(err?.message || "Something went wrong");
                    } finally {
                      setBulkUploading(false);
                    }
                  }}
                  className="mt-4 space-y-3 p-4 rounded-xl bg-white/40 border border-[var(--border-light)]"
                >
                  {bulkError && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-500 text-xs">{bulkError}</div>
                  )}

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bulkType"
                        value="recorded"
                        checked={bulkType === "recorded"}
                        onChange={() => setBulkType("recorded")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <Video className="w-4 h-4 text-violet-500" />
                      <span className="text-sm text-zinc-700 font-medium">Recorded</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bulkType"
                        value="live"
                        checked={bulkType === "live"}
                        onChange={() => setBulkType("live")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <Monitor className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-zinc-700 font-medium">Live</span>
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">Batch (optional)</label>
                      <select
                        value={bulkBatchName}
                        onChange={(e) => setBulkBatchName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-light)] text-sm font-medium focus:outline-none focus:border-indigo-300 appearance-none cursor-pointer bg-white"
                      >
                        <option value="">All Batches</option>
                        {BATCHES.map((b) => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">Class Title</label>
                      <input
                        type="text"
                        value={bulkTitle}
                        onChange={(e) => setBulkTitle(e.target.value)}
                        placeholder="Class title"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-light)] text-sm font-medium focus:outline-none focus:border-indigo-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="url"
                      value={bulkLink}
                      onChange={(e) => setBulkLink(e.target.value)}
                      placeholder={bulkType === "live" ? "Live meeting link (e.g. Zoom/Google Meet URL)" : "Recording link (e.g. YouTube/Drive URL)"}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-light)] text-sm font-medium focus:outline-none focus:border-indigo-300"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={bulkVideoInputRef}
                        accept="video/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (bulkType === "live") {
                            setBulkVideoFileName(file.name);
                            setBulkError("");
                            try {
                              const { url, name } = await uploadClassVideo("_bulk", file);
                              setBulkLiveVideoUrl(url);
                              setBulkLiveVideoName(name);
                              setBulkLiveThumbnailUploading(true);
                              try {
                                const thumbBlob = await generateVideoThumbnail(url);
                                const thumbUrl = await uploadClassThumbnail("_bulk", thumbBlob);
                                setBulkLiveThumbnailUrl(thumbUrl);
                              } catch { }
                              setBulkLiveThumbnailUploading(false);
                            } catch (err: any) {
                              setBulkError(err?.message || "Failed to upload video");
                            } finally {
                              setBulkVideoFileName("");
                              e.target.value = "";
                            }
                          } else {
                            setBulkVideoFileName(file.name);
                            setBulkError("");
                            try {
                              const { url, name } = await uploadClassVideo("_bulk", file);
                              setBulkLink(url);
                              setBulkVideoName(name);
                              setBulkThumbnailUploading(true);
                              try {
                                const thumbBlob = await generateVideoThumbnail(url);
                                const thumbUrl = await uploadClassThumbnail("_bulk", thumbBlob);
                                setBulkThumbnailUrl(thumbUrl);
                              } catch { }
                              setBulkThumbnailUploading(false);
                            } catch (err: any) {
                              setBulkError(err?.message || "Failed to upload video");
                            } finally {
                              setBulkVideoFileName("");
                              e.target.value = "";
                            }
                          }
                        }}
                        className="hidden"
                      />
                      {bulkType === "live" ? (
                        <>
                          {bulkLiveVideoUrl && isStorageUrl(bulkLiveVideoUrl) ? (
                            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                              <Video className="w-3.5 h-3.5" />
                              Video uploaded
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => bulkVideoInputRef.current?.click()}
                              className="min-h-[26px] px-2.5 rounded-lg border border-dashed border-[var(--border-light)] text-[11px] text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              Upload Video
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {bulkUploading && bulkVideoFileName ? (
                            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Uploading {bulkVideoFileName}...
                            </span>
                          ) : bulkLink && isStorageUrl(bulkLink) ? (
                            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                              <Video className="w-3.5 h-3.5" />
                              Video uploaded
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => bulkVideoInputRef.current?.click()}
                              className="min-h-[26px] px-2.5 rounded-lg border border-dashed border-[var(--border-light)] text-[11px] text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              Upload from PC
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {bulkType === "live" && (
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={bulkFileInputRef}
                          accept=".pdf,application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setBulkFileUploading(true);
                            setBulkFileName(file.name);
                            setBulkError("");
                            try {
                              const { url, name } = await uploadClassFile("_bulk", file);
                              setBulkFileUrl(url);
                              setBulkFileName(name);
                            } catch (err: any) {
                              setBulkError(err?.message || "Failed to upload file");
                            } finally {
                              setBulkFileUploading(false);
                              e.target.value = "";
                            }
                          }}
                          className="hidden"
                        />
                        {bulkFileUploading ? (
                          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Uploading {bulkFileName}...
                          </span>
                        ) : bulkFileUrl ? (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                            <ImageIcon className="w-3.5 h-3.5" />
                            PDF uploaded
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => bulkFileInputRef.current?.click()}
                            className="min-h-[26px] px-2.5 rounded-lg border border-dashed border-[var(--border-light)] text-[11px] text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            Upload PDF
                          </button>
                        )}
                      </div>
                    )}
                    {bulkLiveThumbnailUploading && (
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating video thumbnail...
                      </span>
                    )}
                    {bulkLiveThumbnailUrl && !bulkLiveThumbnailUploading && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Video thumbnail ready
                      </div>
                    )}
                    {bulkThumbnailUploading && (
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating thumbnail...
                      </span>
                    )}
                  </div>

                  <div className="border-t border-[var(--border-light)] pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-zinc-600">Questions ({bulkQuestions.length})</h5>
                      <button
                        type="button"
                        onClick={() => setBulkQuestions((prev) => [...prev, ""])}
                        className="min-h-[26px] px-2.5 rounded-lg bg-violet-600 text-white text-[10px] font-bold hover:bg-violet-700 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    {bulkQuestions.length === 0 && (
                      <p className="text-xs text-zinc-400 text-center py-2">No questions yet. Click "Add" to create one.</p>
                    )}
                    {bulkQuestions.map((q, qi) => (
                      <div key={qi} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 shrink-0">#{qi + 1}</span>
                        <input
                          type="text"
                          value={q}
                          onChange={(e) => setBulkQuestions((prev) => prev.map((v, i) => (i === qi ? e.target.value : v)))}
                          placeholder="Enter question"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-light)] text-xs font-medium focus:outline-none focus:border-violet-300"
                        />
                        <button
                          type="button"
                          onClick={() => setBulkQuestions((prev) => prev.filter((_, i) => i !== qi))}
                          className="p-1 rounded bg-white border border-red-200 text-red-500 hover:bg-rose-50 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={bulkUploading}
                    className="min-h-[44px] px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.45)] disabled:opacity-50 transition-all duration-200 cursor-pointer flex items-center gap-2"
                  >
                    {bulkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {bulkUploading
                      ? "Creating classes..."
                      : `Upload to All ${students.filter((s) => s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()) && (!bulkBatchName || s.batchName === bulkBatchName)).length} Student${students.filter((s) => s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()) && (!bulkBatchName || s.batchName === bulkBatchName)).length !== 1 ? "s" : ""}`}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Filter pills */}
          {viewMode === "grid" && !error && (
            <div className="flex flex-wrap items-center gap-3">
              {selectedCourse && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Class Type:</span>
                  {(["all", "live", "recorded"] as const).map((type) => {
                    const courseFiltered = students.filter((s) => !selectedCourse || s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim()));
                    const count = type === "all"
                      ? courseFiltered.length
                      : courseFiltered.filter((s) => s.classType === type).length;
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedClassType(type)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          selectedClassType === type
                            ? type === "live"
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm"
                              : type === "recorded"
                              ? "bg-violet-50 border border-violet-200 text-violet-700 shadow-sm"
                              : "bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm"
                            : "bg-white/70 border border-transparent text-zinc-500 hover:bg-zinc-50 hover:border-zinc-200"
                        }`}
                      >
                        {type === "all" ? null : type === "live" ? (
                          <Monitor className="w-3.5 h-3.5" />
                        ) : (
                          <Video className="w-3.5 h-3.5" />
                        )}
                        <span className="capitalize">{type === "all" ? "All" : type}</span>
                        <span className={`text-[10px] font-extrabold ml-0.5 ${
                          selectedClassType === type
                            ? type === "live" ? "text-emerald-500" : type === "recorded" ? "text-violet-500" : "text-indigo-500"
                            : "text-zinc-400"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="w-px h-5 bg-zinc-200 hidden sm:block" />

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Batch:</span>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    !selectedBatch
                      ? "bg-cyan-50 border border-cyan-200 text-cyan-700 shadow-sm"
                      : "bg-white/70 border border-transparent text-zinc-500 hover:bg-zinc-50 hover:border-zinc-200"
                  }`}
                >
                  All
                  <span className={`text-[10px] font-extrabold ${!selectedBatch ? "text-cyan-500" : "text-zinc-400"}`}>
                    {students.filter((s) => !selectedCourse || s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim())).length}
                  </span>
                </button>
                {BATCHES.map((batch) => {
                  const count = students.filter((s) => {
                    const courseMatch = !selectedCourse || s.courses.some((c) => c.toLowerCase().trim() === selectedCourse.toLowerCase().trim());
                    return courseMatch && s.batchName === batch.name;
                  }).length;
                  return (
                    <button
                      key={batch.id}
                      onClick={() => setSelectedBatch(batch.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        selectedBatch === batch.name
                          ? "bg-cyan-50 border border-cyan-200 text-cyan-700 shadow-sm"
                          : "bg-white/70 border border-transparent text-zinc-500 hover:bg-zinc-50 hover:border-zinc-200"
                      }`}
                    >
                      {batch.name}
                      <span className={`text-[10px] font-extrabold ${selectedBatch === batch.name ? "text-cyan-500" : "text-zinc-400"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative flex-1 min-w-[200px] max-w-xs ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border-light)] bg-white/55 text-sm font-medium text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-300 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Student Grid View */}
          {viewMode === "grid" && (
            <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
              {error ? (
                <div className="text-center py-12">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              ) : displayedStudents.length === 0 ? (
                <div className="text-center py-12">
                  <UserIcon className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-zinc-400">{search ? "No students match your search" : "No students found"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedStudents.map((s) => (
                    <div 
                      key={s.userId} 
                      onClick={() => setSelectedStudent(s)}
                      className="p-4 rounded-xl bg-white/40 border border-[var(--border-light)] hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                          {s.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-zinc-800 truncate group-hover:text-indigo-600 transition-colors">{s.userName}</h3>
                          <p className="text-[10px] text-zinc-500 truncate">{s.userEmail}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 pt-3 border-t border-[var(--border-light)]">
                        {s.courses.map((course, idx) => (
                           <div key={idx} className="text-[10px] font-medium text-zinc-600 truncate flex items-center gap-1.5">
                             <span className="w-1 h-1 rounded-full bg-zinc-300" /> {course}
                           </div>
                        ))}
                        
                        <div className="flex items-center justify-between mt-2 pt-1">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            s.classType === "live" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-violet-50 text-violet-600 border border-violet-200"
                          }`}>
                            {s.classType || "recorded"}
                          </span>
                          {s.batchName && (
                            <span className="text-[10px] font-semibold text-zinc-500">
                              {BATCHES.find(b => b.id === s.batchName)?.name || s.batchName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Already Uploaded Videos View */}
          {viewMode === "videos" && (
            <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-zinc-700 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Already Uploaded Videos
                </h3>
                {allClassesLoading && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading...
                  </div>
                )}
              </div>

              {allClassesLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-zinc-300 mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-semibold text-zinc-400">Loading videos...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              ) : displayedClasses.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-zinc-400">No videos uploaded yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-light)]">
                        <th className="text-left py-2.5 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Student</th>
                        <th className="text-left py-2.5 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Title</th>
                        <th className="text-left py-2.5 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Type</th>
                        <th className="text-left py-2.5 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                        <th className="text-right py-2.5 px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedClasses.map((c) => (
                        <tr key={c.id} className="border-b border-[var(--border-light)] hover:bg-white/40 transition-colors">
                          <td className="py-2.5 px-2 font-medium text-zinc-700 truncate max-w-[140px]">
                            {c.userName || c.userId}
                          </td>
                          <td className="py-2.5 px-2 text-zinc-600 truncate max-w-[200px]">
                            {c.title}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              c.type === "live" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-violet-50 text-violet-600 border border-violet-200"
                            }`}>
                              {c.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-zinc-500 whitespace-nowrap">
                            {c.createdAt
                              ? (c.createdAt.toDate
                                  ? c.createdAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                  : c.createdAt.seconds
                                  ? new Date(c.createdAt.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                  : new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }))
                              : "—"}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  const student = students.find((s) => s.userId === c.userId);
                                  if (student) setSelectedStudent(student);
                                }}
                                className="p-1.5 rounded-lg hover:bg-indigo-50 text-zinc-400 hover:text-indigo-600 transition-colors"
                                title="Manage classes for this student"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!window.confirm("Delete this class entry?")) return;
                                  try {
                                    await deleteClass(c.id!);
                                    setAllClasses((prev) => prev.filter((cl) => cl.id !== c.id));
                                  } catch (err: any) {
                                    alert(err?.message || "Failed to delete.");
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-white border border-red-200 text-red-500 hover:bg-rose-50 hover:text-red-700 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

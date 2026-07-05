"use client";

import { useState, useEffect, useRef } from "react";
import { doc, collection, query, where, orderBy, getDocs, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertCircle, Mic, Image as ImageIcon, FileText, Loader2, Send, X, CheckCircle, FileSpreadsheet } from "lucide-react";

interface Attachment {
  url: string;
  type: "recording" | "image" | "pdf" | "excel";
  name: string;
  uploadedBy?: "admin" | "employee";
}

interface Task {
  id: string;
  note: string;
  adminName: string;
  status: "pending" | "completed";
  createdAt: Timestamp;
  remark?: string;
  attachments?: Attachment[];
}

export default function EmployeeWork() {
  const { currentUser, userData } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkTaskId, setRemarkTaskId] = useState<string | null>(null);
  const [remarkText, setRemarkText] = useState("");
  const [remarkFiles, setRemarkFiles] = useState<{ file: File; preview: string; type: string }[]>([]);
  const [uploadingRemark, setUploadingRemark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "tasks"),
      where("employeeId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    getDocs(q).then((snap) => {
      const list: Task[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          note: data.note || "",
          adminName: data.adminName || "",
          status: data.status || "pending",
          createdAt: data.createdAt as Timestamp,
          remark: data.remark || "",
          attachments: data.attachments || [],
        });
      });
      setTasks(list);
      setTasksLoading(false);
    }).catch(() => setTasksLoading(false));
  }, [currentUser]);

  const handleOpenRemark = (taskId: string) => {
    setRemarkTaskId(taskId);
    setRemarkText("");
    setRemarkFiles([]);
    setError(null);
    setShowRemarkModal(true);
  };

  const handleCloseRemark = () => {
    if (uploadingRemark) return;
    setShowRemarkModal(false);
    setRemarkTaskId(null);
    setRemarkText("");
    setRemarkFiles([]);
    setError(null);
  };

  const handleRemarkFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const preview = URL.createObjectURL(file);
    setRemarkFiles((prev) => [...prev, { file, preview, type }]);
    e.target.value = "";
  };

  const removeRemarkFile = (index: number) => {
    setRemarkFiles((prev) => {
      const f = prev[index];
      if (f) URL.revokeObjectURL(f.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmitRemark = async () => {
    if (!remarkTaskId || !currentUser) return;
    setUploadingRemark(true);
    setError(null);
    try {
      const currentTask = tasks.find((t) => t.id === remarkTaskId);
      const existingAttachments = currentTask?.attachments || [];

      const newAttachments: Attachment[] = [];
      for (const rf of remarkFiles) {
        const path = `tasks/${remarkTaskId}/${Date.now()}_${rf.file.name}`;
        const ref = storageRef(storage, path);
        await uploadBytes(ref, rf.file);
        const url = await getDownloadURL(ref);
        newAttachments.push({
          url,
          type: rf.type as Attachment["type"],
          name: rf.file.name,
          uploadedBy: "employee",
        });
      }

      const allAttachments = [...existingAttachments, ...newAttachments];

      await updateDoc(doc(db, "tasks", remarkTaskId), {
        status: "completed",
        remark: remarkText.trim(),
        attachments: allAttachments,
        completedAt: serverTimestamp(),
      });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === remarkTaskId
            ? { ...t, status: "completed", remark: remarkText.trim(), attachments: allAttachments }
            : t
        )
      );

      handleCloseRemark();
    } catch (err: any) {
      setError(err?.message || "Failed to submit remark");
    } finally {
      setUploadingRemark(false);
    }
  };

  return (
    <div className="space-y-8 pt-6 sm:pt-8">
      <div className="space-y-3">
        <p className="hrms-breadcrumb">Employee / Work</p>
        <h1 className="hrms-page-title">My Work</h1>
        <p className="hrms-page-subtitle">Track your daily work and activity log</p>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 font-bold hover:text-red-800 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Assigned Tasks from Admin */}
      {!tasksLoading && tasks.length > 0 && (
        <div className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-extrabold text-[#111827]">Assigned Tasks ({tasks.length})</h3>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 rounded-xl border border-zinc-200 bg-white"
                >
                  <div className="flex items-start gap-3">
                    {task.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-zinc-300 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-green-700">
                          {task.note}
                        </p>
                        {task.status === "completed" && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider shrink-0">
                            Completed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-400 font-semibold">
                        <span>by {task.adminName}</span>
                        <span>·</span>
                        <span>
                          {task.createdAt?.toDate
                            ? task.createdAt.toDate().toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Just now"}
                        </span>
                      </div>

                      {((task.attachments?.length ?? 0) > 0 || (task.status === "completed" && task.remark)) && (
                        <div className={`mt-2 pt-2 border-t ${task.status === "completed" ? "border-emerald-200" : "border-zinc-200"}`}>
                          {task.status === "completed" && task.remark && (
                            <p className="text-xs text-emerald-700 mb-2">{task.remark}</p>
                          )}
                          {task.attachments && task.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              {task.attachments.map((att, ai) => (
                                <div key={ai} className="relative group">
                                  {att.type === "image" ? (
                                    <a href={att.url} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={att.url}
                                        alt={att.name}
                                        className="w-20 h-20 rounded-lg object-cover border border-zinc-200 hover:opacity-80 transition-opacity"
                                      />
                                    </a>
                                  ) : att.type === "recording" ? (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200">
                                      <Mic className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                      <audio controls className="h-8 max-w-[180px]">
                                        <source src={att.url} />
                                      </audio>
                                    </div>
                                  ) : att.type === "excel" ? (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                                    >
                                      <FileSpreadsheet className="w-3.5 h-3.5" />
                                      {att.name.length > 20 ? att.name.slice(0, 17) + "..." : att.name}
                                    </a>
                                  ) : (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      {att.name.length > 20 ? att.name.slice(0, 17) + "..." : att.name}
                                    </a>
                                  )}
                                  {att.uploadedBy && (
                                    <span className={`absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1 py-0.5 rounded-full border shadow-sm ${
                                      att.uploadedBy === "admin"
                                        ? "bg-indigo-500 text-white border-indigo-600"
                                        : "bg-emerald-500 text-white border-emerald-600"
                                    }`}>
                                          {att.uploadedBy === "admin" ? "Admin" : userData?.fullName || currentUser?.displayName || "You"}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center shrink-0">
                      {task.status === "pending" && (
                        <button
                          onClick={() => handleOpenRemark(task.id)}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition-all cursor-pointer"
                          title="Add remark"
                        >
                          Remark
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {!tasksLoading && tasks.length === 0 && (
        <div className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2 mb-0">
            <AlertCircle className="w-5 h-5 text-zinc-300" />
            <p className="text-sm text-zinc-500 font-semibold">No tasks assigned yet</p>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleRemarkFileSelect(e, "recording")}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleRemarkFileSelect(e, "image")}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleRemarkFileSelect(e, "pdf")}
      />
      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={(e) => handleRemarkFileSelect(e, "excel")}
      />

      {/* Remark Modal */}
      <AnimatePresence>
        {showRemarkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={handleCloseRemark}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[24px] p-6 w-full max-w-lg shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-[#111827]">Submit Your Work</h3>
                <button
                  onClick={handleCloseRemark}
                  disabled={uploadingRemark}
                  className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Describe what you did..."
                rows={3}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-[#111827] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              />

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" /> Recording
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Photo
                </button>
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                </button>
              </div>

              {remarkFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {remarkFiles.map((rf, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-[10px] font-semibold text-zinc-700"
                    >
                      {rf.type === "recording" ? (
                        <Mic className="w-3.5 h-3.5" />
                      ) : rf.type === "image" ? (
                        <ImageIcon className="w-3.5 h-3.5" />
                      ) : rf.type === "excel" ? (
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      <span className="max-w-[100px] truncate">{rf.file.name}</span>
                      <button onClick={() => removeRemarkFile(i)} className="text-red-400 hover:text-red-600 ml-1 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleSubmitRemark}
                disabled={uploadingRemark || (!remarkText.trim() && remarkFiles.length === 0)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {uploadingRemark ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {uploadingRemark ? "Uploading..." : "Submit Work"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

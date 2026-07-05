"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, Timestamp, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Briefcase, Send, CheckCircle, Clock, Trash2, Loader2, AlertCircle, Mic, FileText, Search, Users, ChevronRight, ImageIcon, X, FileSpreadsheet } from "lucide-react";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";

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

interface Employee {
  uid: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  photoURL?: string;
  employeeId: string;
}

function EmployeeListPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "users"),
          where("role", "==", "employee")
        );
        const snap = await getDocs(q);
        const list: Employee[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            uid: d.id,
            fullName: data.fullName || data.displayName || "",
            email: data.email || "",
            department: data.department || "",
            designation: data.designation || "",
            photoURL: data.photoURL || "",
            employeeId: data.employeeId || "",
          });
        });
        list.sort((a, b) => a.fullName.localeCompare(b.fullName));
        setEmployees(list);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filtered = search.trim()
    ? employees.filter(
        (e) =>
          e.fullName.toLowerCase().includes(search.toLowerCase()) ||
          e.department.toLowerCase().includes(search.toLowerCase()) ||
          e.employeeId.toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  return (
    <div className="space-y-6 pb-24 sm:pb-6 pt-6 sm:pt-8">
      <div>
        <p className="hrms-breadcrumb">Admin / Work / Assign</p>
        <h1 className="hrms-page-title">Assign Task</h1>
        <p className="hrms-page-subtitle">Select an employee to assign tasks or notes</p>
      </div>

      <button
        onClick={() => router.push("/admin/work")}
        className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Employees
      </button>

      {loading ? (
        <LoadingState variant="list" count={5} />
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, department or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white/50 backdrop-blur-sm border border-white/40 text-zinc-700 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((emp, i) => (
              <motion.div
                key={emp.uid}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                onClick={() => router.push(`/admin/work/assign?id=${emp.uid}`)}
                className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm text-white font-extrabold shrink-0 overflow-hidden ring-2 ring-white/50">
                    {emp.photoURL ? (
                      <img src={emp.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      emp.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#111827] truncate group-hover:text-indigo-600 transition-colors">
                      {emp.fullName}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-semibold truncate mt-0.5">
                      {emp.department || "—"} {emp.designation ? `/ ${emp.designation}` : ""}
                    </p>
                    <p className="text-[9px] text-zinc-400 font-bold tabular-nums mt-0.5">
                      {emp.employeeId || emp.uid.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="hrms-glass rounded-[20px] p-8 sm:p-10 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex flex-col items-center justify-center text-center min-h-[200px]">
              <Users className="w-8 h-8 text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500 font-semibold">No employees match your search</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AssignWorkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    setEmployeeId(searchParams.get("id"));
  }, [searchParams]);

  const [employee, setEmployee] = useState<{ fullName: string; department: string; photoURL?: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [assignFiles, setAssignFiles] = useState<{ file: File; preview: string; type: "image" | "pdf" | "excel" }[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAssignFiles((prev) => [...prev, { file, preview, type: "image" }]);
    e.target.value = "";
  };

  const handlePdfPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAssignFiles((prev) => [...prev, { file, preview: "", type: "pdf" }]);
    e.target.value = "";
  };

  const handleExcelPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAssignFiles((prev) => [...prev, { file, preview: "", type: "excel" }]);
    e.target.value = "";
  };

  const removeAssignFile = (index: number) => {
    setAssignFiles((prev) => {
      const f = prev[index];
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  useEffect(() => {
    if (!employeeId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const empSnap = await getDoc(doc(db, "users", employeeId));
        if (empSnap.exists()) {
          const d = empSnap.data();
          setEmployee({
            fullName: d.fullName || d.displayName || "Unknown",
            department: d.department || "",
            photoURL: d.photoURL || "",
          });
        }

        const q = query(
          collection(db, "tasks"),
          where("employeeId", "==", employeeId),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
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
      } catch (err: any) {
        setError(err?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId, searchParams]);

  const handleSubmit = async () => {
    if (!currentUser) { setError("You must be logged in"); return; }
    if (!employeeId) { setError("No employee selected"); return; }
    if (!note.trim() && assignFiles.length === 0) { setError("Please write a task or note, or attach a file"); return; }
    setSubmitting(true);
    setSuccess(null);
    setError(null);
    try {
      const attachments: Attachment[] = [];
      for (const af of assignFiles) {
        const path = `tasks/${employeeId}/${Date.now()}_${af.file.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, af.file);
        const url = await getDownloadURL(storageRef);
        attachments.push({ url, type: af.type, name: af.file.name, uploadedBy: "admin" });
      }

      await addDoc(collection(db, "tasks"), {
        employeeId,
        adminId: currentUser.uid,
        adminName: currentUser.displayName || currentUser.email || "Admin",
        note: note.trim(),
        status: "pending",
        attachments,
        createdAt: serverTimestamp(),
      });
      setSuccess("Task assigned successfully!");
      setNote("");
      setAssignFiles([]);

      const q = query(
        collection(db, "tasks"),
        where("employeeId", "==", employeeId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
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
      } catch (err: any) {
        const msg = err?.message || "";
        if (msg.includes("index")) {
          setError("Task assigned! The list will appear once the index finishes building (a few minutes).");
          setNote("");
        } else {
          setError(msg || "Failed to assign task");
        }
      } finally {
        setSubmitting(false);
      }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      setError(err?.message || "Failed to delete task");
    }
  };

  if (!employeeId) {
    return <EmployeeListPage />;
  }

  return (
    <div className="space-y-8 pb-24 sm:pb-6 pt-6 sm:pt-8">
      <button
        onClick={() => router.push("/admin/work/assign")}
        className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to employees
      </button>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 font-bold hover:text-red-800 cursor-pointer">Dismiss</button>
        </div>
      )}

      {loading ? (
        <LoadingState variant="list" count={3} />
      ) : (
        <>
          {/* Employee Header */}
          <div className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg text-white font-extrabold shrink-0 overflow-hidden ring-2 ring-white/50">
                {employee?.photoURL ? (
                  <img src={employee.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  employee?.fullName?.charAt(0).toUpperCase() || "?"
                )}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#111827]">{employee?.fullName || "Unknown"}</h2>
                <p className="text-xs text-zinc-500 font-semibold">{employee?.department || "—"}</p>
              </div>
            </div>
          </div>

          {/* New Task Form */}
          <div className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-extrabold text-[#111827]">Assign New Task / Note</h3>
            </div>

            {success && (
              <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" /> {success}
              </p>
            )}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write a task, note or instruction for this employee..."
              rows={4}
              className="w-full rounded-xl border border-[var(--border-light)] bg-white/60 px-4 py-3 text-sm text-[#111827] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
            />

            {/* File Pickers */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImagePick}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Add Photo
              </button>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                hidden
                onChange={handlePdfPick}
              />
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Add PDF
              </button>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                hidden
                onChange={handleExcelPick}
              />
              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Add Excel
              </button>
            </div>

            {/* File Previews */}
            {assignFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {assignFiles.map((af, i) => (
                  <div key={i} className="relative group">
                    {af.type === "image" ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-200">
                        <img src={af.preview} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : af.type === "excel" ? (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 text-xs font-semibold">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span className="max-w-[100px] truncate">{af.file.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 text-xs font-semibold">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="max-w-[100px] truncate">{af.file.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAssignFile(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || (!note.trim() && assignFiles.length === 0)}
              className="mt-4 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? "Assigning..." : "Assign Task"}
            </button>
          </div>

          {/* Existing Tasks */}
          <div className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-zinc-500" />
              <h3 className="text-sm font-extrabold text-[#111827]">
                Assigned Tasks & Notes ({tasks.length})
              </h3>
            </div>

            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-8 h-8 text-zinc-300 mb-2" />
                <p className="text-sm text-zinc-500 font-semibold">No tasks assigned yet</p>
              </div>
            ) : (
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
                                <div className="flex flex-wrap gap-2">
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
                                          {att.uploadedBy === "admin" ? "Admin" : employee?.fullName || "Employee"}
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
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useDesignations } from "@/hooks/useDesignations";
import { Plus, Trash2, Loader2 } from "lucide-react";

export default function AdminDesignationManager() {
  const { designations, loading, error, refresh } = useDesignations();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const inputClass = "w-full min-h-[44px] px-4 rounded-xl bg-white/35 border border-[var(--border-light)]/50 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-primary-light)] transition-colors";

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (designations.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) return;
    try {
      setSaving(true);
      const id = trimmed.toLowerCase().replace(/\s+/g, "-");
      await setDoc(doc(db, "designations", id), { name: trimmed });
      setName("");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeleting(id);
      await deleteDoc(doc(db, "designations", id));
      await refresh();
    } finally {
      setDeleting(null);
    }
  }

  if (error) {
    return <p className="text-xs text-red-500 font-bold">Failed to load designations: {error}</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Manage Designations</h4>
        <p className="text-[10px] text-zinc-500 font-semibold mb-3">Add or remove system job roles and designations</p>
      </div>

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Senior Developer, HR Manager..."
          className={inputClass}
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add
        </button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-white/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : designations.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-4">No designations yet</p>
      ) : (
        <div className="space-y-1.5">
          {designations.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/60 border border-[var(--border-light)]/30 text-xs hover:bg-white/80 transition-colors"
            >
              <span className="text-zinc-700 font-bold">{d.name}</span>
              <button
                onClick={() => handleDelete(d.id)}
                disabled={deleting === d.id}
                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting === d.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

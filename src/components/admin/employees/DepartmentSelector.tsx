"use client";

import { useState } from "react";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useDepartments } from "@/hooks/useDepartments";
import { Plus, Check, X, Loader2 } from "lucide-react";

interface DepartmentSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function DepartmentSelector({ value, onChange }: DepartmentSelectorProps) {
  const { departments, loading, refresh } = useDepartments();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (departments.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) {
      onChange(trimmed);
      setAdding(false);
      setNewName("");
      return;
    }
    try {
      setSaving(true);
      const id = trimmed.toLowerCase().replace(/\s+/g, "-");
      await setDoc(doc(db, "departments", id), { name: trimmed });
      onChange(trimmed);
      refresh();
      setNewName("");
      setAdding(false);
    } catch {
      onChange(trimmed);
      setAdding(false);
      setNewName("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === "__add__") {
              setAdding(true);
            } else {
              onChange(e.target.value);
            }
          }}
          className="flex-1 min-h-[44px] px-4 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 transition-colors appearance-none cursor-pointer disabled:opacity-50"
          disabled={loading}
        >
          <option value="">{loading ? "Loading..." : "Select department"}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
          <option value="__add__">+ Add new department</option>
        </select>
      </div>

      {adding && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter department name"
            className="flex-1 min-h-[36px] px-3 rounded-lg bg-white/[0.06] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/40"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="min-h-[36px] px-3 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName(""); }}
            className="min-h-[36px] px-3 rounded-lg bg-zinc-500/20 text-zinc-400 text-xs font-bold hover:bg-zinc-500/30 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

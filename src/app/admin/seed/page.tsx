"use client";

import { useState } from "react";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const DEPARTMENTS = [
  "Developer",
  "SEO expert",
  "Sales",
  "Human Resourse(HR)",
  "Customer Support",
];

const DESIGNATIONS = [
  "Junior",
  "Associate",
  "Senior",
  "Lead",
  "Manager",
  "Director",
  "VP",
  "Head",
];

export default function SeedPage() {
  const [seeding, setSeeding] = useState(false);
  const [results, setResults] = useState<{ type: string; name: string; ok: boolean }[]>([]);
  const [done, setDone] = useState(false);

  async function handleSeed() {
    setSeeding(true);
    setResults([]);
    const out: { type: string; name: string; ok: boolean }[] = [];

    for (const name of DEPARTMENTS) {
      try {
        const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, "");
        await setDoc(doc(db, "departments", id), { name });
        out.push({ type: "Department", name, ok: true });
      } catch {
        out.push({ type: "Department", name, ok: false });
      }
      setResults([...out]);
    }

    for (const name of DESIGNATIONS) {
      try {
        const id = name.toLowerCase().replace(/\s+/g, "-");
        await setDoc(doc(db, "designations", id), { name });
        out.push({ type: "Designation", name, ok: true });
      } catch {
        out.push({ type: "Designation", name, ok: false });
      }
      setResults([...out]);
    }

    setSeeding(false);
    setDone(true);
  }

  return (
    <div className="space-y-6 pb-12 pt-6 sm:pt-8 max-w-lg">
      <div>
        <h1 className="text-2xl font-black text-black tracking-tight">Seed Database</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Populate Firestore with default departments and designations.
        </p>
      </div>

      {!done && (
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="min-h-[48px] px-6 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
        >
          {seeding && <Loader2 className="w-4 h-4 animate-spin" />}
          {seeding ? "Seeding..." : "Seed Departments & Designations"}
        </button>
      )}

      {results.length > 0 && (
        <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm space-y-2">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Results</p>
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {r.ok
                ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                : <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              }
              <span className="text-zinc-600">
                <span className="font-semibold text-zinc-800">{r.type}:</span> {r.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {done && (
        <p className="text-xs text-emerald-600 font-semibold">
          All done! You can now create employees with departments and designations.
        </p>
      )}
    </div>
  );
}

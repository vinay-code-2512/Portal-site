"use client";

import { useState, useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  fetchCoupons,
  createCoupon,
  deleteCoupon,
  toggleCouponActive,
} from "@/lib/coupons";
import type { Coupon } from "@/lib/coupons";
import { motion } from "framer-motion";
import {
  Plus,
  X,
  Trash2,
  CheckCircle,
  XCircle,
  Tag,
} from "lucide-react";

export default function AdminCoupons() {
  const { isAdmin } = usePermissions();
  const isFullAdmin = isAdmin;

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: "",
    maxUses: "",
    expiresAt: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchCoupons();
      setCoupons(list);
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isFullAdmin) load();
  }, [isFullAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!form.code.trim() || !form.value) return;
    setError("");
    setCreating(true);
    try {
      await createCoupon({
        code: form.code.trim(),
        type: form.type,
        value: Number(form.value),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
        active: true,
      });
      setForm({ code: "", type: "percentage", value: "", maxUses: "", expiresAt: "" });
      setShowCreate(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create coupon");
    }
    setCreating(false);
  };

  const handleToggle = async (c: Coupon) => {
    if (!c.id) return;
    try {
      await toggleCouponActive(c.id, !c.active);
      await load();
    } catch {
      // silent
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCoupon(id);
      await load();
    } catch {
      // silent
    }
  };

  if (!isFullAdmin) {
    return (
      <div className="flex items-center justify-center min-h-48 pt-12">
        <p className="text-sm font-bold text-zinc-400">You don&apos;t have access to coupon management.</p>
      </div>
    );
  }

  const now = Date.now();

  return (
    <div className="space-y-6 pb-12 pt-6 sm:pt-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] text-[var(--color-primary)] uppercase tracking-wider font-extrabold">
            Admin / Coupons
          </p>
          <h1 className="text-2xl font-extrabold text-[#111827] mt-0.5 tracking-tight">
            Coupon Management
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Create and manage discount coupon codes.
          </p>
        </div>
        <button
          onClick={() => { setError(""); setShowCreate(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all cursor-pointer shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Coupon
        </button>
      </div>

      {/* Create Coupon Modal */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowCreate(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg rounded-2xl border border-[var(--border-light)] bg-white shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCreate(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-extrabold text-[#111827] mb-5">New Coupon</h2>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Code</label>
                <input
                  type="text"
                  placeholder="e.g. SAVE20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[var(--color-primary)]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "percentage" | "fixed" })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[var(--color-primary)]/50"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Value</label>
                <input
                  type="number"
                  min="1"
                  placeholder={form.type === "percentage" ? "e.g. 20" : "e.g. 500"}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[var(--color-primary)]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">
                  Max Uses <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[var(--color-primary)]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">
                  Expires At <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[var(--color-primary)]/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !form.code.trim() || !form.value}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {creating ? "Creating..." : "Create Coupon"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Coupon List */}
      <div className="hrms-glass rounded-[20px] border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Tag className="w-8 h-8 text-zinc-300 mb-2" />
            <p className="text-sm font-bold text-zinc-400">No coupons yet</p>
            <p className="text-xs text-zinc-300 mt-0.5">Create your first coupon to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-light)] text-left text-[10px] uppercase tracking-wider text-zinc-400 font-extrabold">
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Value</th>
                  <th className="px-5 py-4">Usage</th>
                  <th className="px-5 py-4">Expires</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const expired = c.expiresAt && c.expiresAt.toDate().getTime() < now;
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-[var(--border-light)] last:border-0 hover:bg-white/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-extrabold text-[#111827] tracking-wider">{c.code}</span>
                      </td>
                      <td className="px-5 py-4 text-zinc-500">
                        {c.type === "percentage" ? "%" : "₹"}
                      </td>
                      <td className="px-5 py-4 font-bold text-[#111827]">
                        {c.type === "percentage" ? `${c.value}%` : `₹${c.value.toLocaleString("en-IN")}`}
                      </td>
                      <td className="px-5 py-4 text-zinc-500">
                        {c.maxUses ? `${c.usedCount ?? 0} / ${c.maxUses}` : `${c.usedCount ?? 0}`}
                      </td>
                      <td className="px-5 py-4 text-zinc-500">
                        {c.expiresAt ? (
                          <span className={expired ? "text-red-400" : ""}>
                            {c.expiresAt.toDate().toLocaleDateString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-zinc-300">&mdash;</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {c.active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                        {expired && c.active && (
                          <span className="ml-1.5 text-[10px] font-bold text-red-400">(Expired)</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggle(c)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              c.active
                                ? "border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                                : "border-green-200 text-green-600 hover:bg-green-50"
                            }`}
                            title={c.active ? "Deactivate" : "Activate"}
                          >
                            {c.active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => { if (c.id) handleDelete(c.id); }}
                            className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-100 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" style={{ color: "#dc2626" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

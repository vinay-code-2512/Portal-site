"use client";

import { useCallback, useRef } from "react";
import { Search } from "lucide-react";

interface EmployeeFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  departmentFilter: string;
  onDepartmentChange: (val: string) => void;
  designationFilter: string;
  onDesignationChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  uniqueDepartments: string[];
  uniqueDesignations: string[];
}

const STATUSES = ["active", "inactive", "suspended", "on-leave"];

export default function EmployeeFilters({
  searchQuery, onSearchChange,
  departmentFilter, onDepartmentChange,
  designationFilter, onDesignationChange,
  statusFilter, onStatusChange,
  uniqueDepartments, uniqueDesignations,
}: EmployeeFiltersProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(val), 300);
  }, [onSearchChange]);

  return (
    <div className="hrms-glass rounded-[20px] p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search Left */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            defaultValue={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, ID or email..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-white/60 border border-[var(--border-light)] text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors"
          />
        </div>

        {/* Filters Right */}
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex flex-col">
            <select
              value={departmentFilter}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="min-h-[44px] px-3.5 rounded-xl bg-white/60 border border-[var(--border-light)] text-xs text-zinc-700 font-semibold focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors appearance-none cursor-pointer pr-8 relative"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', backgroundSize: '14px' }}
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <select
              value={designationFilter}
              onChange={(e) => onDesignationChange(e.target.value)}
              className="min-h-[44px] px-3.5 rounded-xl bg-white/60 border border-[var(--border-light)] text-xs text-zinc-700 font-semibold focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors appearance-none cursor-pointer pr-8"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', backgroundSize: '14px' }}
            >
              <option value="">All Designations</option>
              {uniqueDesignations.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="min-h-[44px] px-3.5 rounded-xl bg-white/60 border border-[var(--border-light)] text-xs text-zinc-700 font-semibold focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors appearance-none cursor-pointer pr-8"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', backgroundSize: '14px' }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          {(departmentFilter || designationFilter || statusFilter) && (
            <button
              onClick={() => { onDepartmentChange(""); onDesignationChange(""); onStatusChange(""); }}
              className="min-h-[44px] px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

export default function EmployeeTasks() {
  return (
    <div className="space-y-6">
      <div>
        <p className="hrms-breadcrumb">Employee / Tasks</p>
        <h1 className="hrms-page-title">My Tasks</h1>
        <p className="hrms-page-subtitle">Manage your daily tasks and assignments</p>
      </div>

      <div className="hrms-glass rounded-[20px] p-8 sm:p-10 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6" />
          </svg>
        </div>
        <h3 className="text-base font-extrabold text-[#111827] mb-1">No Tasks Assigned</h3>
        <p className="text-sm text-zinc-500 max-w-sm">Your tasks will appear here once assigned by your admin.</p>
      </div>
    </div>
  );
}

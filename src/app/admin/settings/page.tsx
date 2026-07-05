"use client";

import { useState, useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useDepartments } from "@/hooks/useDepartments";
import { useDesignations } from "@/hooks/useDesignations";
import SettingsSidebar, { type SettingsTab } from "@/components/settings/SettingsSidebar";
import SettingsDashboard from "@/components/settings/SettingsDashboard";
import CompanySettingsForm from "@/components/settings/CompanySettings";
import RoleManagement from "@/components/settings/RoleManagement";
import PermissionMatrix from "@/components/settings/PermissionMatrix";
import SecuritySettings from "@/components/settings/SecuritySettings";
import NotificationSettingsForm from "@/components/settings/NotificationSettings";
import ProfileSettings from "@/components/settings/ProfileSettings";
import AuditLogs from "@/components/settings/AuditLogs";
import SystemPreferences from "@/components/settings/SystemPreferences";
import AdminDepartmentManager from "@/components/admin/employees/AdminDepartmentManager";
import AdminDesignationManager from "@/components/admin/employees/AdminDesignationManager";
import { Settings2 } from "lucide-react";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAdmin } = usePermissions();
  const { departments } = useDepartments();
  const { designations } = useDesignations();
  const isFullAdmin = isAdmin;

  return (
    <div className="space-y-6 pb-12 pt-6 sm:pt-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] mt-0.5 tracking-tight">
            Settings &amp; Permissions
          </h1>
          <p className="text-xs text-zinc-500 mt-2">
            Manage organization settings, roles, permissions and security.
          </p>
        </div>


      </div>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/35 border border-[var(--border-light)]/50 text-zinc-700"
      >
        <Settings2 className="w-3.5 h-3.5" />
        {sidebarOpen ? "Hide Navigation" : "Show Navigation"}
      </button>

      {/* Sidebar + Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "block" : "hidden"} lg:block w-full lg:w-52 shrink-0`}>
          <div className="hrms-glass rounded-[20px] p-4 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm sticky top-6">
            <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {activeTab === "dashboard" && (
            <SettingsDashboard 
              departmentCount={departments.length} 
              designationCount={designations.length} 
              onTabChange={setActiveTab}
            />
          )}

          {activeTab === "company" && (
            isFullAdmin ? <CompanySettingsForm /> : (
              <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center py-12">
                <p className="text-xs font-bold text-zinc-400">You don&apos;t have access to company settings.</p>
              </div>
            )
          )}

          {activeTab === "roles" && (
            isFullAdmin ? (
              <div className="space-y-6">
                <RoleManagement />
              </div>
            ) : (
              <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center py-12">
                <p className="text-xs font-bold text-zinc-400">You don&apos;t have access to role management.</p>
              </div>
            )
          )}

          {activeTab === "permissions" && (
            isFullAdmin ? <PermissionMatrix /> : (
              <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center py-12">
                <p className="text-xs font-bold text-zinc-400">You don&apos;t have access to permissions.</p>
              </div>
            )
          )}

          {activeTab === "security" && (
            isFullAdmin ? <SecuritySettings /> : (
              <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center py-12">
                <p className="text-xs font-bold text-zinc-400">You don&apos;t have access to security settings.</p>
              </div>
            )
          )}

          {activeTab === "notifications" && (
            isFullAdmin ? <NotificationSettingsForm /> : (
              <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center py-12">
                <p className="text-xs font-bold text-zinc-400">You don&apos;t have access to notification settings.</p>
              </div>
            )
          )}

          {activeTab === "profile" && <ProfileSettings />}

          {activeTab === "audit" && (
            isFullAdmin ? <AuditLogs /> : (
              <div className="hrms-glass rounded-[20px] p-5 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm text-center py-12">
                <p className="text-xs font-bold text-zinc-400">You don&apos;t have access to audit logs.</p>
              </div>
            )
          )}

          {activeTab === "preferences" && <SystemPreferences />}

          {/* Department/Designation managers are accessible from the permissions section or as standalone tabs */}
          {activeTab === "departments" && (
            <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
              <AdminDepartmentManager />
            </div>
          )}

          {activeTab === "designations" && (
            <div className="hrms-glass rounded-[20px] p-5 sm:p-6 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
              <AdminDesignationManager />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

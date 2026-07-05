"use client";

import EmployeeForm from "@/components/admin/employees/EmployeeForm";

export default function AddEmployeePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="hrms-breadcrumb">Admin / Employees / Add</p>
        <h1 className="hrms-page-title">Add Employee</h1>
        <p className="hrms-page-subtitle">Create a new employee account</p>
      </div>
      <EmployeeForm mode="add" />
    </div>
  );
}

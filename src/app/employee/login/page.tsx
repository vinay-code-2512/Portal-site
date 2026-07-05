"use client";

import { useEffect } from "react";

export default function EmployeeLoginPage() {
  useEffect(() => {
    window.location.replace("/login?role=employee&redirect=/employee");
  }, []);
  return null;
}

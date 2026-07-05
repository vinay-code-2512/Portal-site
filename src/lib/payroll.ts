"use client";

import {
  doc, getDoc, setDoc, addDoc, updateDoc, getDocs,
  collection, query, where, orderBy, limit, startAfter,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type PayrollStatus = "generated" | "paid" | "pending";

export interface PayrollRecord {
  id?: string;
  uid: string;
  employeeId: string;
  employeeName: string;
  department: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  createdAt?: any;
  updatedAt?: any;
}

export interface PayslipDoc {
  id?: string;
  payrollId: string;
  uid: string;
  month: number;
  year: number;
  pdfData: string;
  generatedAt?: any;
}

export interface PaginatedPayroll {
  items: PayrollRecord[];
  lastDoc: any;
  hasMore: boolean;
}

export interface PayrollOverview {
  totalPayroll: number;
  employeesPaid: number;
  pendingCount: number;
  monthlyCost: number;
}

export interface EmployeePayrollOverview {
  currentSalary: number;
  lastPaid: number;
  pendingPayment: number;
  ytdEarnings: number;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function getMonthName(m: number): string {
  return MONTH_NAMES[m - 1] || "Unknown";
}

export function payrollDocId(uid: string, year: number, month: number): string {
  return `${uid}_${year}_${String(month).padStart(2, "0")}`;
}

export async function createPayrollRecord(
  uid: string,
  employeeName: string,
  employeeId: string,
  department: string,
  month: number,
  year: number,
  basicSalary: number,
  allowances: number,
  bonuses: number,
  deductions: number,
): Promise<string> {
  const netSalary = basicSalary + allowances + bonuses - deductions;
  const id = payrollDocId(uid, year, month);

  await setDoc(doc(db, "payroll", id), {
    uid,
    employeeId,
    employeeName,
    department,
    month,
    year,
    basicSalary,
    allowances,
    bonuses,
    deductions,
    netSalary,
    status: "generated",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const logRef = doc(collection(db, "activity_log"));
  await setDoc(logRef, {
    uid,
    type: "other",
    description: `Payroll generated for ${employeeName} - ${getMonthName(month)} ${year}`,
    timestamp: Timestamp.now(),
  });

  return id;
}

export async function updatePayrollStatus(
  id: string,
  status: PayrollStatus
): Promise<void> {
  await updateDoc(doc(db, "payroll", id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function getEmployeePayrollRecords(
  uid: string,
  cursor?: any,
  pageSize = 12
): Promise<PaginatedPayroll> {
  let q = query(
    collection(db, "payroll"),
    where("uid", "==", uid),
    orderBy("year", "desc"),
    orderBy("month", "desc"),
    limit(pageSize + 1)
  );
  if (cursor) q = query(q, startAfter(cursor));

  const snap = await getDocs(q);
  const items: PayrollRecord[] = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() } as PayrollRecord));

  const hasMore = items.length > pageSize;
  if (hasMore) items.pop();

  return {
    items,
    lastDoc: items.length > 0 ? snap.docs[snap.docs.length - (hasMore ? 2 : 1)] : null,
    hasMore,
  };
}

export async function getAllPayrollForMonth(
  year: number,
  month: number
): Promise<PayrollRecord[]> {
  const snap = await getDocs(
    query(
      collection(db, "payroll"),
      where("year", "==", year),
      where("month", "==", month)
    )
  );
  const items: PayrollRecord[] = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() } as PayrollRecord));
  return items;
}

export async function getPayrollOverview(
  year: number,
  month: number
): Promise<PayrollOverview> {
  const records = await getAllPayrollForMonth(year, month);

  let totalPayroll = 0;
  let employeesPaid = 0;
  let pendingCount = 0;

  for (const r of records) {
    totalPayroll += r.netSalary;
    if (r.status === "paid") employeesPaid++;
    if (r.status === "pending") pendingCount++;
  }

  return {
    totalPayroll,
    employeesPaid,
    pendingCount,
    monthlyCost: totalPayroll,
  };
}

export async function getYearToDateEarnings(
  uid: string,
  year: number
): Promise<number> {
  const snap = await getDocs(
    query(
      collection(db, "payroll"),
      where("uid", "==", uid),
      where("year", "==", year)
    )
  );
  let total = 0;
  snap.forEach((d) => {
    const r = d.data() as PayrollRecord;
    if (r.status === "paid" || r.status === "generated") {
      total += r.netSalary;
    }
  });
  return total;
}

export async function getEmployeePayrollOverview(
  uid: string
): Promise<EmployeePayrollOverview> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const snap = await getDocs(
    query(
      collection(db, "payroll"),
      where("uid", "==", uid),
      orderBy("year", "desc"),
      orderBy("month", "desc"),
      limit(10)
    )
  );

  const records: PayrollRecord[] = [];
  snap.forEach((d) => records.push({ id: d.id, ...d.data() } as PayrollRecord));

  let currentSalary = 0;
  let lastPaid = 0;
  let pendingPayment = 0;
  let ytdEarnings = 0;

  for (const r of records) {
    if (r.year === currentYear) {
      if (r.status === "paid" || r.status === "generated") {
        ytdEarnings += r.netSalary;
      }
    }
    if (r.year === currentYear && r.month === currentMonth) {
      currentSalary = r.netSalary;
      if (r.status === "pending") pendingPayment = r.netSalary;
    }
  }

  const paidRecords = records.filter((r) => r.status === "paid");
  if (paidRecords.length > 0) {
    lastPaid = paidRecords[0].netSalary;
  }

  return { currentSalary, lastPaid, pendingPayment, ytdEarnings };
}

export async function savePayslipPdf(
  payrollId: string,
  uid: string,
  month: number,
  year: number,
  pdfData: string
): Promise<string> {
  const docRef = await addDoc(collection(db, "payslips"), {
    payrollId,
    uid,
    month,
    year,
    pdfData,
    generatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPayslipPdf(
  payrollId: string
): Promise<string | null> {
  const snap = await getDocs(
    query(
      collection(db, "payslips"),
      where("payrollId", "==", payrollId),
      limit(1)
    )
  );
  if (snap.empty) return null;
  return snap.docs[0].data().pdfData as string;
}

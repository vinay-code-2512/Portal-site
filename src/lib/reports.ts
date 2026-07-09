import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  orderBy,
} from "firebase/firestore";
import { isSunday } from "./format";

export interface DashboardOverview {
  totalEmployees: number;
  attendancePercent: number;
  activeLeaves: number;
  monthlyPayroll: number;
  payrollChange: number;
}

export interface AttendanceDay {
  date: string;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
}

export interface AttendanceReportData {
  daily: AttendanceDay[];
  weekly: { week: string; present: number; absent: number; late: number; onLeave: number }[];
  monthly: { month: string; present: number; absent: number; late: number; onLeave: number }[];
  summary: { present: number; absent: number; late: number; onLeave: number; total: number };
}

export interface LeaveReportData {
  byStatus: { status: string; count: number }[];
  byDepartment: { department: string; approved: number; rejected: number; pending: number }[];
  summary: { total: number; approved: number; rejected: number; pending: number };
}

export interface PayrollReportData {
  totalCost: number;
  averageSalary: number;
  byDepartment: { department: string; total: number; count: number }[];
  salaryRange: { min: number; max: number; avg: number };
  employeeCount: number;
}

export interface EmployeeAnalyticsRow {
  uid: string;
  name: string;
  department: string;
  attendancePercent: number;
  presentDays: number;
  totalDays: number;
  lateDays: number;
  leaveDays: number;
  activityCount: number;
}

export interface DepartmentAnalyticsRow {
  department: string;
  employeeCount: number;
  attendancePercent: number;
  leaveCount: number;
  totalEmployees: number;
}

function getWeekId(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

function getMonthId(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export async function getTotalEmployees(): Promise<number> {
  try {
    const q = query(collection(db, "users"), where("role", "==", "employee"));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch {
    const q = query(collection(db, "users"), where("role", "==", "employee"));
    const snap = await getDocs(q);
    return snap.size;
  }
}

export async function getDashboardOverview(
  year: number,
  month: number
): Promise<DashboardOverview> {
  const today = new Date().toISOString().slice(0, 10);
  if (isSunday(today)) {
    const totalEmployees = await getTotalEmployees();
    return { totalEmployees, attendancePercent: 0, activeLeaves: 0, monthlyPayroll: 0, payrollChange: 0 };
  }
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;

  const [totalEmployees, attendanceSnap, leaveSnap, currentPayroll, prevPayroll] =
    await Promise.allSettled([
      getTotalEmployees(),
      getDocs(
        query(
          collection(db, "attendance"),
          where("date", "==", today)
        )
      ),
      getDocs(
        query(
          collection(db, "leaves"),
          where("status", "==", "approved"),
          where("startDate", "<=", today),
          orderBy("startDate", "desc")
        )
      ),
      getPayrollTotal(year, month),
      getPayrollTotal(month > 1 ? year : year - 1, month > 1 ? month - 1 : 12),
    ]);

  const employees = totalEmployees.status === "fulfilled" ? totalEmployees.value : 0;
  const attendanceDocs =
    attendanceSnap.status === "fulfilled" ? attendanceSnap.value.docs : [];
  const leaveDocs =
    leaveSnap.status === "fulfilled" ? leaveSnap.value.docs : [];

  let present = 0;
  let total = 0;
  for (const doc of attendanceDocs) {
    const data = doc.data();
    total++;
    if (data.status === "present" || data.status === "late") present++;
  }
  const attendancePercent = total > 0 ? Math.round((present / total) * 100) : 0;

  const activeLeaves = leaveDocs.filter((d) => {
    const data = d.data();
    const endDate = data.endDate || data.startDate;
    return endDate >= today;
  }).length;

  const monthlyPayroll =
    currentPayroll.status === "fulfilled" ? currentPayroll.value : 0;
  const prevPayrollVal =
    prevPayroll.status === "fulfilled" ? prevPayroll.value : 0;
  const payrollChange =
    prevPayrollVal > 0
      ? Math.round(((monthlyPayroll - prevPayrollVal) / prevPayrollVal) * 100)
      : 0;

  return {
    totalEmployees: employees,
    attendancePercent,
    activeLeaves,
    monthlyPayroll,
    payrollChange,
  };
}

async function getPayrollTotal(year: number, month: number): Promise<number> {
  const monthStr = String(month).padStart(2, "0");
  const q = query(
    collection(db, "payroll"),
    where("year", "==", year),
    where("month", "==", month)
  );
  const snap = await getDocs(q);
  let total = 0;
  snap.forEach((d) => {
    total += d.data().netSalary || 0;
  });
  return total;
}

export async function getAttendanceReport(
  startDate: string,
  endDate: string
): Promise<AttendanceReportData> {
  const q = query(
    collection(db, "attendance"),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);

  const byDate = new Map<string, { present: number; absent: number; late: number; onLeave: number }>();

  snap.forEach((doc) => {
    const data = doc.data();
    const date = data.date;
    if (isSunday(date)) return;
    if (!byDate.has(date)) {
      byDate.set(date, { present: 0, absent: 0, late: 0, onLeave: 0 });
    }
    const day = byDate.get(date)!;
    switch (data.status) {
      case "present":
        day.present++;
        break;
      case "late":
        day.late++;
        break;
      case "absent":
        day.absent++;
        break;
      case "on-leave":
      case "half-day":
        day.onLeave++;
        break;
      default:
        day.absent++;
    }
  });

  const daily: AttendanceDay[] = [];
  const byWeek = new Map<string, { present: number; absent: number; late: number; onLeave: number }>();
  const byMonth = new Map<string, { present: number; absent: number; late: number; onLeave: number }>();

  let summary = { present: 0, absent: 0, late: 0, onLeave: 0, total: 0 };

  for (const [date, counts] of byDate) {
    daily.push({ date, ...counts });
    const wk = getWeekId(date);
    if (!byWeek.has(wk)) byWeek.set(wk, { present: 0, absent: 0, late: 0, onLeave: 0 });
    const w = byWeek.get(wk)!;
    w.present += counts.present;
    w.absent += counts.absent;
    w.late += counts.late;
    w.onLeave += counts.onLeave;

    const mo = getMonthId(date);
    if (!byMonth.has(mo)) byMonth.set(mo, { present: 0, absent: 0, late: 0, onLeave: 0 });
    const m = byMonth.get(mo)!;
    m.present += counts.present;
    m.absent += counts.absent;
    m.late += counts.late;
    m.onLeave += counts.onLeave;

    summary.present += counts.present;
    summary.absent += counts.absent;
    summary.late += counts.late;
    summary.onLeave += counts.onLeave;
    summary.total += counts.present + counts.absent + counts.late + counts.onLeave;
  }

  const weekly = Array.from(byWeek.entries()).map(([week, counts]) => ({
    week,
    ...counts,
  }));

  const monthly = Array.from(byMonth.entries()).map(([month, counts]) => ({
    month,
    ...counts,
  }));

  return { daily, weekly, monthly, summary };
}

export async function getLeaveReport(
  startDate: string,
  endDate: string
): Promise<LeaveReportData> {
  const q = query(
    collection(db, "leaves"),
    where("startDate", ">=", startDate),
    where("startDate", "<=", endDate),
    orderBy("startDate", "asc")
  );
  const snap = await getDocs(q);

  const byStatus = new Map<string, number>();
  const byDepartment = new Map<string, { approved: number; rejected: number; pending: number }>();

  snap.forEach((doc) => {
    const data = doc.data();
    const status = data.status || "pending";
    byStatus.set(status, (byStatus.get(status) || 0) + 1);

    const dept = data.department || "Unknown";
    if (!byDepartment.has(dept)) {
      byDepartment.set(dept, { approved: 0, rejected: 0, pending: 0 });
    }
    const d = byDepartment.get(dept)!;
    if (status === "approved") d.approved++;
    else if (status === "rejected") d.rejected++;
    else d.pending++;
  });

  const byStatusArr = Array.from(byStatus.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  const byDepartmentArr = Array.from(byDepartment.entries()).map(
    ([department, counts]) => ({
      department,
      ...counts,
    })
  );

  const summary = {
    total: snap.size,
    approved: byStatus.get("approved") || 0,
    rejected: byStatus.get("rejected") || 0,
    pending: byStatus.get("pending") || 0,
  };

  return { byStatus: byStatusArr, byDepartment: byDepartmentArr, summary };
}

export async function getPayrollReport(
  year: number,
  month: number
): Promise<PayrollReportData> {
  const monthStr = String(month).padStart(2, "0");
  const q = query(
    collection(db, "payroll"),
    where("year", "==", year),
    where("month", "==", month)
  );
  const snap = await getDocs(q);

  const byDepartment = new Map<string, { total: number; count: number }>();
  let totalCost = 0;
  let minSalary = Infinity;
  let maxSalary = -Infinity;
  let employeeCount = 0;

  snap.forEach((doc) => {
    const data = doc.data();
    const net = data.netSalary || 0;
    totalCost += net;
    minSalary = Math.min(minSalary, net);
    maxSalary = Math.max(maxSalary, net);
    employeeCount++;

    const dept = data.department || "Unknown";
    if (!byDepartment.has(dept)) {
      byDepartment.set(dept, { total: 0, count: 0 });
    }
    const d = byDepartment.get(dept)!;
    d.total += net;
    d.count++;
  });

  const byDepartmentArr = Array.from(byDepartment.entries()).map(
    ([department, data]) => ({
      department,
      ...data,
    })
  );

  const averageSalary = employeeCount > 0 ? Math.round(totalCost / employeeCount) : 0;
  const salaryRange = {
    min: minSalary === Infinity ? 0 : minSalary,
    max: maxSalary === -Infinity ? 0 : maxSalary,
    avg: averageSalary,
  };

  return {
    totalCost,
    averageSalary,
    byDepartment: byDepartmentArr,
    salaryRange,
    employeeCount,
  };
}

export async function getEmployeeAnalytics(
  startDate: string,
  endDate: string,
  limitCount = 50
): Promise<EmployeeAnalyticsRow[]> {
  const [attendanceSnap, employeeSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, "attendance"),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      )
    ),
    getDocs(query(collection(db, "users"), where("role", "==", "employee"))),
  ]);

  const employees = new Map<string, { name: string; department: string }>();
  employeeSnap.forEach((doc) => {
    const data = doc.data();
    employees.set(doc.id, {
      name: data.fullName || "Unknown",
      department: data.department || "Unknown",
    });
  });

  const byUid = new Map<
    string,
    { present: number; absent: number; late: number; leave: number; total: number }
  >();

  attendanceSnap.forEach((doc) => {
    const data = doc.data();
    if (isSunday(data.date)) return;
    const uid = data.uid;
    if (!byUid.has(uid)) {
      byUid.set(uid, { present: 0, absent: 0, late: 0, leave: 0, total: 0 });
    }
    const rec = byUid.get(uid)!;
    rec.total++;
    switch (data.status) {
      case "present":
        rec.present++;
        break;
      case "late":
        rec.late++;
        break;
      case "absent":
        rec.absent++;
        break;
      case "on-leave":
      case "half-day":
        rec.leave++;
        break;
      default:
        rec.absent++;
    }
  });

  const rows: EmployeeAnalyticsRow[] = [];

  for (const [uid, stats] of byUid) {
    const emp = employees.get(uid);
    const name = emp?.name || "Unknown";
    const department = emp?.department || "Unknown";
    const presentDays = stats.present;
    const totalDays = stats.total;
    const attendancePercent =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    rows.push({
      uid,
      name,
      department,
      attendancePercent,
      presentDays,
      totalDays,
      lateDays: stats.late,
      leaveDays: stats.leave,
      activityCount: 0,
    });
  }

  rows.sort((a, b) => b.attendancePercent - a.attendancePercent);
  return rows.slice(0, limitCount);
}

export async function getDepartmentAnalytics(): Promise<DepartmentAnalyticsRow[]> {
  const employeeSnap = await getDocs(
    query(collection(db, "users"), where("role", "==", "employee"))
  );

  const deptMap = new Map<
    string,
    { employees: string[]; count: number }
  >();

  employeeSnap.forEach((doc) => {
    const data = doc.data();
    const dept = data.department || "Unknown";
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { employees: [], count: 0 });
    }
    const d = deptMap.get(dept)!;
    d.employees.push(doc.id);
    d.count++;
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);

  const attendanceSnap = await getDocs(
    query(
      collection(db, "attendance"),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    )
  );

  const uidAttendance = new Map<string, { present: number; total: number }>();
  attendanceSnap.forEach((doc) => {
    const data = doc.data();
    if (isSunday(data.date)) return;
    const uid = data.uid;
    if (!uidAttendance.has(uid)) {
      uidAttendance.set(uid, { present: 0, total: 0 });
    }
    const rec = uidAttendance.get(uid)!;
    rec.total++;
    if (data.status === "present" || data.status === "late") rec.present++;
  });

  const leaveSnap = await getDocs(
    query(
      collection(db, "leaves"),
      where("startDate", ">=", startDate),
      where("startDate", "<=", endDate),
      where("status", "==", "approved")
    )
  );

  const uidLeaves = new Map<string, number>();
  leaveSnap.forEach((doc) => {
    const data = doc.data();
    const uid = data.uid;
    uidLeaves.set(uid, (uidLeaves.get(uid) || 0) + 1);
  });

  const rows: DepartmentAnalyticsRow[] = [];

  for (const [department, info] of deptMap) {
    let totalPresent = 0;
    let totalAttendance = 0;
    let totalLeaves = 0;

    for (const uid of info.employees) {
      const att = uidAttendance.get(uid);
      if (att) {
        totalPresent += att.present;
        totalAttendance += att.total;
      }
      totalLeaves += uidLeaves.get(uid) || 0;
    }

    const attendancePercent =
      totalAttendance > 0
        ? Math.round((totalPresent / totalAttendance) * 100)
        : 0;

    rows.push({
      department,
      employeeCount: info.count,
      attendancePercent,
      leaveCount: totalLeaves,
      totalEmployees: info.count,
    });
  }

  rows.sort((a, b) => b.employeeCount - a.employeeCount);
  return rows;
}

export async function getDateRangeAttendancePercent(
  startDate: string,
  endDate: string
): Promise<number> {
  const snap = await getDocs(
    query(
      collection(db, "attendance"),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    )
  );

  let present = 0;
  let total = 0;
  snap.forEach((doc) => {
    const data = doc.data();
    if (isSunday(data.date)) return;
    total++;
    if (data.status === "present" || data.status === "late") present++;
  });

  return total > 0 ? Math.round((present / total) * 100) : 0;
}

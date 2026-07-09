"use client";

import {
  doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs,
  Timestamp, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getLocalDateString, isSunday } from "./format";

export interface EnrichedAttendance {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  checkIn: any | null;
  checkOut: any | null;
  status: "present" | "late" | "absent" | "half-day" | "on-leave" | "checked-out";
  breaks?: any[];
  netHours?: string;
  note?: string | null;
}

export interface AttendanceDateStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  onLeave: number;
  checkedOut: number;
  onBreak: number;
  attendancePercent: number;
}

export async function getAdminAttendanceByDate(date?: string) {
  const targetDate = date || getLocalDateString(new Date());
  if (isSunday(targetDate)) {
    return { records: [], stats: { total: 0, present: 0, late: 0, absent: 0, halfDay: 0, onLeave: 0, checkedOut: 0, onBreak: 0, attendancePercent: 0 } };
  }

  const [usersSnap, attSnap, leavesSnap] = await Promise.all([
    getDocs(query(collection(db, "users"), where("role", "==", "employee"))),
    getDocs(query(collection(db, "attendance"), where("date", "==", targetDate))),
    getDocs(
      query(
        collection(db, "leaves"),
        where("status", "==", "approved"),
        where("startDate", "<=", targetDate)
      )
    ),
  ]);

  const employees: Record<string, any> = {};
  usersSnap.forEach((d) => {
    employees[d.id] = { uid: d.id, ...d.data() };
  });

  const attendanceMap: Record<string, any> = {};
  attSnap.forEach((d) => {
    attendanceMap[d.data().uid] = { id: d.id, ...d.data() };
  });

  const onLeaveUids = new Set<string>();
  leavesSnap.forEach((d) => {
    const data = d.data();
    if (data.endDate >= targetDate) onLeaveUids.add(data.uid);
  });

  const enriched: EnrichedAttendance[] = [];
  let present = 0, late = 0, halfDay = 0, checkedOut = 0, onBreak = 0, onLeave = 0;

  for (const [uid, emp] of Object.entries(employees)) {
    if (onLeaveUids.has(uid)) {
      onLeave++;
      enriched.push({
        uid,
        name: emp.displayName || emp.fullName || emp.email || "Unknown",
        email: emp.email || "",
        photoURL: emp.photoURL,
        department: emp.department,
        designation: emp.designation,
        employeeId: emp.employeeId,
        checkIn: null,
        checkOut: null,
        status: "on-leave",
      });
      continue;
    }

    const rec = attendanceMap[uid];
    if (!rec) {
      enriched.push({
        uid,
        name: emp.displayName || emp.fullName || emp.email || "Unknown",
        email: emp.email || "",
        photoURL: emp.photoURL,
        department: emp.department,
        designation: emp.designation,
        employeeId: emp.employeeId,
        checkIn: null,
        checkOut: null,
        status: "absent",
      });
      continue;
    }

    const hasOpenBreak = rec.breaks?.some((b: any) => b && !b.end);
    let netHours = "-";
    if (rec.checkIn && rec.checkOut) {
      const diffMs = rec.checkOut.toDate().getTime() - rec.checkIn.toDate().getTime();
      const breakMs = rec.totalBreakMs || 0;
      const netMs = Math.max(0, diffMs - breakMs);
      const h = Math.floor(netMs / 3600000);
      const m = Math.round((netMs % 3600000) / 60000);
      netHours = `${h}h ${m}m`;
    }

    let status: EnrichedAttendance["status"] = "present";
    if (rec.checkOut) {
      status = "checked-out";
      checkedOut++;
    } else if (hasOpenBreak) {
      status = rec.status === "late" ? "late" : "present";
      onBreak++;
    } else if (rec.status === "late") {
      status = "late";
      late++;
    } else if (rec.status === "half-day") {
      status = "half-day";
      halfDay++;
    } else {
      present++;
    }

    enriched.push({
      uid,
      name: emp.displayName || emp.fullName || emp.email || "Unknown",
      email: emp.email || "",
      photoURL: emp.photoURL,
      department: emp.department,
      designation: emp.designation,
      employeeId: emp.employeeId,
      checkIn: rec.checkIn || null,
      checkOut: rec.checkOut || null,
      status,
      breaks: rec.breaks,
      netHours,
      note: rec.note || null,
    });
  }

  const absent = enriched.filter((e) => e.status === "absent").length;
  const total = enriched.length;
  const attended = present + late + (onBreak > 0 ? onBreak : 0);
  const adjustedTotal = total > 0 ? total - onLeave : 1;
  const attendancePercent = Math.round((attended / Math.max(adjustedTotal, 1)) * 100);

  const stats: AttendanceDateStats = {
    total,
    present,
    late,
    absent,
    halfDay,
    onLeave,
    checkedOut,
    onBreak,
    attendancePercent,
  };

  return { records: enriched, stats };
}

export async function markAttendance(
  uid: string,
  date: string,
  status: "present" | "late" | "half-day",
  checkInHour: number,
  checkInMinute: number,
  note: string | null,
  adminUid: string
) {
  const ref = doc(db, "attendance", `${uid}_${date}`);
  const now = new Date();
  const checkInTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), checkInHour, checkInMinute);

  await setDoc(ref, {
    uid,
    date,
    checkIn: Timestamp.fromDate(checkInTime),
    checkOut: null,
    status,
    breaks: [],
    totalBreakMs: 0,
    note: note || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const logRef = doc(collection(db, "activity_log"));
  await setDoc(logRef, {
    uid: adminUid,
    type: "attendance",
    description: `Marked ${status} attendance for ${date} (${uid})`,
    timestamp: Timestamp.now(),
  });
}

export async function updateAttendanceStatus(
  uid: string,
  date: string,
  status: "present" | "late" | "absent" | "half-day",
  adminUid: string
) {
  const ref = doc(db, "attendance", `${uid}_${date}`);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  });

  const logRef = doc(collection(db, "activity_log"));
  await setDoc(logRef, {
    uid: adminUid,
    type: "attendance",
    description: `Updated attendance status to ${status} for ${date} (${uid})`,
    timestamp: Timestamp.now(),
  });
}

export async function getAttendanceForDateRange(start: string, end: string) {
  const snap = await getDocs(
    query(
      collection(db, "attendance"),
      where("date", ">=", start),
      where("date", "<=", end)
    )
  );
  const records: any[] = [];
  snap.forEach((d) => {
    const data = { id: d.id, ...d.data() };
    if (!isSunday(data.date)) records.push(data);
  });
  return records;
}

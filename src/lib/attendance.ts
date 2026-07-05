"use client";

import {
  doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs,
  Timestamp, arrayUnion, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { getLocalDateString } from "./format";

export interface BreakEntry {
  start: any;
  end: any | null;
}

export interface AttendanceDoc {
  uid: string;
  date: string;
  checkIn: any | null;
  checkOut: any | null;
  status: "present" | "late" | "absent" | "half-day";
  breaks: BreakEntry[];
  totalBreakMs: number;
  note: string | null;
  selfie: string | null;
  createdAt: any;
  updatedAt: any;
}

const LATE_CUTOFF_HOUR = 10;
const LATE_CUTOFF_MINUTE = 30;

function getPreviousDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isInLateWindow(hour: number, minute: number): boolean {
  return (hour === 10 && minute > 30) || (hour === 11 && minute === 0);
}

async function countConsecutiveLateWindow(uid: string, currentDate: string): Promise<number> {
  let count = 1;
  let prevDate = getPreviousDate(currentDate);

  while (count < 3) {
    const dayOfWeek = new Date(prevDate + "T00:00:00").getDay();
    if (dayOfWeek === 0) { prevDate = getPreviousDate(prevDate); continue; }

    const holidaySnap = await getDoc(doc(db, "holidays", prevDate));
    if (holidaySnap.exists()) { prevDate = getPreviousDate(prevDate); continue; }

    const attSnap = await getDoc(doc(db, "attendance", `${uid}_${prevDate}`));
    if (attSnap.exists()) {
      const attData = attSnap.data() as AttendanceDoc;
      if (attData.checkIn) {
        const ci = attData.checkIn.toDate();
        const h = ci.getHours();
        const m = ci.getMinutes();
        if (isInLateWindow(h, m)) {
          count++;
        } else {
          break;
        }
      }
    }

    prevDate = getPreviousDate(prevDate);
  }

  return count;
}

export async function createAttendanceRecord(uid: string, date: string, checkInTime: Date) {
  const ref = doc(db, "attendance", `${uid}_${date}`);
  const checkInTimestamp = Timestamp.fromDate(checkInTime);
  const hour = checkInTime.getHours();
  const minute = checkInTime.getMinutes();
  const isLate = hour > LATE_CUTOFF_HOUR || (hour === LATE_CUTOFF_HOUR && minute > LATE_CUTOFF_MINUTE);

  let status: "present" | "late" | "half-day" = isLate ? "late" : "present";

  if (isInLateWindow(hour, minute)) {
    const consecutive = await countConsecutiveLateWindow(uid, date);
    if (consecutive >= 3) {
      status = "half-day";
    }
  }

  const data: AttendanceDoc = {
    uid,
    date,
    checkIn: checkInTimestamp,
    checkOut: null,
    status,
    breaks: [],
    totalBreakMs: 0,
    note: null,
    selfie: null,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };
  await setDoc(ref, data);
}

export async function autoCheckoutEmployees(forDate?: string) {
  const today = forDate || getLocalDateString(new Date());

  const snap = await getDocs(
    query(
      collection(db, "attendance"),
      where("date", "==", today),
      where("checkOut", "==", null)
    )
  );

  let count = 0;
  const promises: Promise<any>[] = [];

  snap.forEach((d) => {
    const data = d.data();
    if (data.checkIn) {
      const sevenPm = new Date();
      sevenPm.setHours(19, 0, 0, 0);
      promises.push(
        updateDoc(doc(db, "attendance", d.id), {
          checkOut: Timestamp.fromDate(sevenPm),
          autoCheckedOut: true,
          updatedAt: serverTimestamp(),
        })
      );
      count++;
    }
  });

  await Promise.all(promises);
  return { count };
}

export async function checkoutAttendance(uid: string, date: string, checkOutTime: Date) {
  const ref = doc(db, "attendance", `${uid}_${date}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("No attendance record found");
  const data = snap.data() as AttendanceDoc;
  const checkOutTimestamp = Timestamp.fromDate(checkOutTime);
  const checkInTime = data.checkIn?.toDate();
  let totalBreakMs = 0;
  const breaks = data.breaks.map((b: any) => ({ ...b }));
  for (const b of breaks) {
    if (b.end) {
      totalBreakMs += b.end.toDate().getTime() - b.start.toDate().getTime();
    }
  }
  const grossMs = checkOutTime.getTime() - (checkInTime?.getTime() || checkOutTime.getTime());
  const netMs = Math.max(0, grossMs - totalBreakMs);
  const netHours = netMs / (1000 * 60 * 60);
  let status = data.status;
  if (netHours < 4) {
    status = "half-day";
  } else if (status !== "late") {
    status = "present";
  }
  await updateDoc(ref, {
    checkOut: checkOutTimestamp,
    totalBreakMs,
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function startBreak(uid: string, date: string) {
  const ref = doc(db, "attendance", `${uid}_${date}`);
  const breakEntry = { start: Timestamp.now(), end: null };
  await updateDoc(ref, {
    breaks: arrayUnion(breakEntry),
    updatedAt: serverTimestamp(),
  });
}

export async function endBreak(uid: string, date: string) {
  const ref = doc(db, "attendance", `${uid}_${date}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("No attendance record found");
  const data = snap.data() as AttendanceDoc;
  const breaks = data.breaks.map((b: any) => ({ ...b }));
  const lastBreak = breaks[breaks.length - 1];
  if (!lastBreak || lastBreak.end) throw new Error("No open break found");
  lastBreak.end = Timestamp.now();
  let totalBreakMs = 0;
  for (const b of breaks) {
    if (b.end) {
      totalBreakMs += b.end.toDate().getTime() - b.start.toDate().getTime();
    }
  }
  await updateDoc(ref, {
    breaks,
    totalBreakMs,
    updatedAt: serverTimestamp(),
  });
}

export async function getTodayRecord(uid: string) {
  const today = getLocalDateString(new Date());
  const snap = await getDoc(doc(db, "attendance", `${uid}_${today}`));
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as any;
  }
  return null;
}

export async function getWeeklyRecords(uid: string, monday: string, sunday: string) {
  const snap = await getDocs(
    query(
      collection(db, "attendance"),
      where("uid", "==", uid),
      where("date", ">=", monday),
      where("date", "<=", sunday)
    )
  );
  const records: any[] = [];
  snap.forEach((d) => records.push({ id: d.id, ...d.data() }));
  return records;
}

export async function uploadSelfie(uid: string, date: string, blob: Blob): Promise<string> {
  const storageRef = ref(storage, `attendance_selfies/${uid}/${date}.jpg`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function saveAttendanceSelfie(uid: string, date: string, selfieUrl: string) {
  const ref_ = doc(db, "attendance", `${uid}_${date}`);
  await updateDoc(ref_, {
    selfie: selfieUrl,
    updatedAt: serverTimestamp(),
  });
}

export async function uploadActivityAttachment(uid: string, file: File): Promise<{ url: string; name: string }> {
  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `activity_attachments/${uid}/${fileName}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, name: file.name };
}

export async function saveActivityConfirmation(
  uid: string,
  note: string,
  attachments: { name: string; url: string; type: "image" | "pdf" }[]
) {
  const ref_ = doc(collection(db, "activity_log"));
  await setDoc(ref_, {
    uid,
    type: "activity_confirmation",
    description: note,
    attachments,
    slotHour: new Date().getHours(),
    timestamp: Timestamp.now(),
  });
}

export async function logActivity(uid: string, type: string, description: string) {
  const ref = doc(collection(db, "activity_log"));
  await setDoc(ref, {
    uid,
    type,
    description,
    timestamp: Timestamp.now(),
  });
}

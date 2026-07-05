"use client";

import {
  doc, getDoc, setDoc, updateDoc, addDoc,
  collection, query, where, orderBy, limit, getDocs, startAfter,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

export type LeaveType = "casual" | "sick" | "paid" | "emergency";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id?: string;
  uid: string;
  employeeName: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  adminNote?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt?: any;
  updatedAt?: any;
  approvedAt?: any;
  approvedBy?: string;
}

export interface LeaveBalance {
  available: number;
  used: number;
  remaining: number;
}

export type LeaveBalanceMap = Record<LeaveType, LeaveBalance>;

export interface PaginatedLeaves {
  items: LeaveRequest[];
  lastDoc: any;
  hasMore: boolean;
}

export const LEAVE_TYPES: LeaveType[] = ["casual", "sick", "paid", "emergency"];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  casual: "Casual Leave",
  sick: "Sick Leave",
  paid: "Paid Leave",
  emergency: "Emergency Leave",
};

export const DEFAULT_BALANCES: Record<LeaveType, number> = {
  casual: 12,
  sick: 10,
  paid: 20,
  emergency: 5,
};

export async function uploadLeaveAttachment(uid: string, file: File): Promise<{ url: string; name: string }> {
  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `leave_attachments/${uid}/${fileName}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, name: file.name };
}

export async function submitLeaveRequest(
  uid: string,
  employeeName: string,
  employeeId: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string,
  reason: string,
  attachment?: File | null
): Promise<string> {
  let attachmentUrl = "";
  let attachmentName = "";
  if (attachment) {
    const result = await uploadLeaveAttachment(uid, attachment);
    attachmentUrl = result.url;
    attachmentName = result.name;
  }

  const docRef = await addDoc(collection(db, "leaves"), {
    uid,
    employeeName,
    employeeId,
    leaveType,
    startDate,
    endDate,
    reason,
    status: "pending",
    attachmentUrl: attachmentUrl || null,
    attachmentName: attachmentName || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const logRef = doc(collection(db, "activity_log"));
  await setDoc(logRef, {
    uid,
    type: "leave",
    description: `Applied for ${leaveType} leave (${startDate} → ${endDate})`,
    timestamp: Timestamp.now(),
  });

  return docRef.id;
}

export async function approveLeaveRequest(
  id: string,
  adminUid: string,
  note?: string
): Promise<void> {
  await updateDoc(doc(db, "leaves", id), {
    status: "approved",
    adminNote: note || "",
    approvedAt: serverTimestamp(),
    approvedBy: adminUid,
    updatedAt: serverTimestamp(),
  });

  const logRef = doc(collection(db, "activity_log"));
  await setDoc(logRef, {
    uid: adminUid,
    type: "leave",
    description: `Approved leave request ${id}`,
    timestamp: Timestamp.now(),
  });
}

export async function rejectLeaveRequest(
  id: string,
  adminUid: string,
  note: string
): Promise<void> {
  await updateDoc(doc(db, "leaves", id), {
    status: "rejected",
    adminNote: note,
    approvedAt: serverTimestamp(),
    approvedBy: adminUid,
    updatedAt: serverTimestamp(),
  });

  const logRef = doc(collection(db, "activity_log"));
  await setDoc(logRef, {
    uid: adminUid,
    type: "leave",
    description: `Rejected leave request ${id}: ${note}`,
    timestamp: Timestamp.now(),
  });
}

function mapDoc(d: any): LeaveRequest {
  return { id: d.id, ...d.data() } as LeaveRequest;
}

export async function getEmployeeLeaveRequests(
  uid: string,
  cursor?: any,
  pageSize = 10
): Promise<PaginatedLeaves> {
  let q = query(
    collection(db, "leaves"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(pageSize + 1)
  );
  if (cursor) q = query(q, startAfter(cursor));

  const snap = await getDocs(q);
  const items: LeaveRequest[] = [];
  snap.forEach((d) => items.push(mapDoc(d)));

  const hasMore = items.length > pageSize;
  if (hasMore) items.pop();

  return {
    items,
    lastDoc: items.length > 0 ? snap.docs[snap.docs.length - (hasMore ? 2 : 1)] : null,
    hasMore,
  };
}

export async function getPendingLeaveRequests(
  cursor?: any,
  pageSize = 10
): Promise<PaginatedLeaves> {
  let q = query(
    collection(db, "leaves"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
    limit(pageSize + 1)
  );
  if (cursor) q = query(q, startAfter(cursor));

  const snap = await getDocs(q);
  const items: LeaveRequest[] = [];
  snap.forEach((d) => items.push(mapDoc(d)));

  const hasMore = items.length > pageSize;
  if (hasMore) items.pop();

  return {
    items,
    lastDoc: items.length > 0 ? snap.docs[snap.docs.length - (hasMore ? 2 : 1)] : null,
    hasMore,
  };
}

export async function getApprovedLeavesForDateRange(
  startDate: string,
  endDate: string
): Promise<LeaveRequest[]> {
  const snap = await getDocs(
    query(
      collection(db, "leaves"),
      where("status", "==", "approved"),
      where("startDate", "<=", endDate)
    )
  );
  const items: LeaveRequest[] = [];
  snap.forEach((d) => {
    const item = mapDoc(d);
    if (item.endDate >= startDate) items.push(item);
  });
  return items;
}

export async function getLeaveBalances(uid: string): Promise<LeaveBalanceMap> {
  const snap = await getDocs(
    query(
      collection(db, "leaves"),
      where("uid", "==", uid),
      where("status", "==", "approved")
    )
  );

  const used: Record<string, number> = {};
  snap.forEach((d) => {
    const t = d.data().leaveType as LeaveType;
    if (t) used[t] = (used[t] || 0) + 1;
  });

  const balances = {} as LeaveBalanceMap;
  for (const t of LEAVE_TYPES) {
    const u = used[t] || 0;
    const a = DEFAULT_BALANCES[t];
    balances[t] = { available: a, used: u, remaining: Math.max(0, a - u) };
  }
  return balances;
}

export async function getLeaveOverview(): Promise<{
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
}> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [pendingSnap, approvedSnap, rejectedSnap] = await Promise.all([
    getDocs(query(collection(db, "leaves"), where("status", "==", "pending"), limit(100))),
    getDocs(query(collection(db, "leaves"), where("status", "==", "approved"), limit(100))),
    getDocs(query(collection(db, "leaves"), where("status", "==", "rejected"), limit(100))),
  ]);

  const approvedToday = approvedSnap.docs.filter((d) => {
    const a = d.data().approvedAt;
    if (!a || !a.toDate) return false;
    return a.toDate().toISOString().slice(0, 10) === todayStr;
  }).length;

  const rejectedToday = rejectedSnap.docs.filter((d) => {
    const a = d.data().approvedAt;
    if (!a || !a.toDate) return false;
    return a.toDate().toISOString().slice(0, 10) === todayStr;
  }).length;

  return {
    pendingCount: pendingSnap.size,
    approvedToday,
    rejectedToday,
  };
}

export async function getLeaveAnalytics(year?: number) {
  const y = year || new Date().getFullYear();
  const start = `${y}-01-01`;
  const end = `${y}-12-31`;

  const snap = await getDocs(
    query(
      collection(db, "leaves"),
      where("status", "==", "approved"),
      where("startDate", ">=", start),
      where("startDate", "<=", end)
    )
  );

  const byType: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  const byDepartment: Record<string, number> = {};

  for (const d of snap.docs) {
    const data = d.data();
    const t = data.leaveType as string;
    if (t) byType[t] = (byType[t] || 0) + 1;

    const s = data.startDate as string;
    if (s) {
      const month = s.slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }

    const dept = data.department as string;
    if (dept) byDepartment[dept] = (byDepartment[dept] || 0) + 1;
  }

  return { byType, byMonth, byDepartment };
}

"use client";

import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, getDocs, startAfter,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getLocalDateString, isSunday } from "./format";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const IDENTITY_TOOLKIT_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;

export interface EmployeeData {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: "admin" | "manager" | "employee";
  employeeId: string;
  department: string;
  designation: string;
  status: "active" | "inactive" | "suspended" | "on-leave";
  photoURL?: string;
  basicSalary?: number;
  allowances?: number;
  bonuses?: number;
  deductions?: number;
  googleSheetId?: string;
  googleWorkSheetId?: string;
  canManageClasses?: boolean;
  shiftStartTime?: string;
  shiftEndTime?: string;
  shiftDurationHours?: number;
  createdAt?: any;
  updatedAt?: any;
}

export async function generateEmployeeId(): Promise<string> {
  const snap = await getDocs(
    query(
      collection(db, "users"),
      where("employeeId", ">=", "EMP-"),
      where("employeeId", "<=", "EMP-\uf8ff"),
      orderBy("employeeId", "desc"),
      limit(1)
    )
  );
  if (snap.empty) return "EMP-0001";
  const last = snap.docs[0].data().employeeId as string;
  const num = parseInt(last.replace("EMP-", ""), 10) + 1;
  return `EMP-${String(num).padStart(4, "0")}`;
}

async function reclaimOrphanedAuth(
  email: string,
  idToken: string
): Promise<boolean> {
  try {
    const { lookupUser, deleteUser } = await import("./adminFunctions");
    const { uid } = await lookupUser(email, idToken);
    if (!uid) return false;

    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) return false;

    await deleteUser(uid, idToken);
    return true;
  } catch {
    return false;
  }
}

export async function createEmployee(
  fullName: string,
  email: string,
  phone: string,
  department: string,
  designation: string,
  role: "admin" | "manager" | "employee",
  password: string,
  adminUid: string,
  idToken: string
): Promise<EmployeeData> {
  const doSignUp = async (): Promise<string> => {
    const res = await fetch(IDENTITY_TOOLKIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const authData = await res.json();
    if (!res.ok) {
      const msg = authData.error?.message;
      if (msg === "EMAIL_EXISTS") {
        const reclaimed = await reclaimOrphanedAuth(email, idToken);
        if (reclaimed) {
          const retryRes = await fetch(IDENTITY_TOOLKIT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, returnSecureToken: true }),
          });
          const retryData = await retryRes.json();
          if (retryRes.ok) return retryData.localId;
        }
        throw new Error("An account with this email already exists.");
      }
      throw new Error(msg || "Failed to create authentication account.");
    }
    return authData.localId;
  };

  const uid = await doSignUp();
  const employeeId = await generateEmployeeId();

  const emp: EmployeeData = {
    uid,
    fullName,
    email,
    phone,
    role,
    employeeId,
    department,
    designation,
    status: "active",
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  await setDoc(doc(db, "users", uid), emp);

  const logRef = doc(collection(db, "activity_log"));
  await setDoc(logRef, {
    uid: adminUid,
    type: "employee",
    description: `Created employee ${fullName} (${employeeId})`,
    timestamp: Timestamp.now(),
  });

  return emp;
}

export async function updateEmployee(
  uid: string,
  data: Partial<EmployeeData>,
  adminUid: string
): Promise<void> {
  const updates = { ...data, updatedAt: serverTimestamp() };
  delete (updates as any).uid;
  delete (updates as any).createdAt;

  // Clean undefined values to prevent Firestore from throwing errors
  Object.keys(updates).forEach((key) => {
    if ((updates as any)[key] === undefined) {
      delete (updates as any)[key];
    }
  });

  await updateDoc(doc(db, "users", uid), updates);

  const logRef = doc(collection(db, "activity_log"));
  await setDoc(logRef, {
    uid: adminUid,
    type: "employee",
    description: `Updated employee profile ${data.fullName || uid}`,
    timestamp: Timestamp.now(),
  });
}

export async function getEmployee(uid: string): Promise<EmployeeData | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as EmployeeData;
}

export interface PaginatedEmployees {
  employees: EmployeeData[];
  lastDoc: any;
  hasMore: boolean;
}

export async function getEmployeesPaginated(
  pageSize: number = 10,
  cursor?: any
): Promise<PaginatedEmployees> {
  let q = query(
    collection(db, "users"),
    where("role", "==", "employee"),
    orderBy("createdAt", "desc"),
    limit(pageSize + 1)
  );
  if (cursor) {
    q = query(q, startAfter(cursor));
  }

  const snap = await getDocs(q);
  const employees: EmployeeData[] = [];
  snap.forEach((d) => employees.push({ uid: d.id, ...d.data() } as EmployeeData));

  const hasMore = employees.length > pageSize;
  if (hasMore) employees.pop();

  return {
    employees,
    lastDoc: employees.length > 0 ? snap.docs[snap.docs.length - (hasMore ? 2 : 1)] : null,
    hasMore,
  };
}

export async function getMonthlyAttendance(uid: string, year: number, month: number) {
  const first = getLocalDateString(new Date(year, month - 1, 1));
  const last = getLocalDateString(new Date(year, month, 0));
  const snap = await getDocs(
    query(
      collection(db, "attendance"),
      where("uid", "==", uid),
      where("date", ">=", first),
      where("date", "<=", last)
    )
  );
  const records: any[] = [];
  snap.forEach((d) => {
    const data = { id: d.id, ...d.data() };
    if (!isSunday(data.date)) records.push(data);
  });
  return records;
}

export async function getEmployeeLeaves(uid: string, maxItems = 5) {
  const snap = await getDocs(
    query(
      collection(db, "leaves"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(maxItems)
    )
  );
  const records: any[] = [];
  snap.forEach((d) => records.push({ id: d.id, ...d.data() }));
  return records;
}

export async function getEmployeeActivityLog(uid: string, maxItems = 20) {
  const snap = await getDocs(
    query(
      collection(db, "activity_log"),
      where("uid", "==", uid),
      orderBy("timestamp", "desc"),
      limit(maxItems)
    )
  );
  const items: any[] = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
  return items;
}

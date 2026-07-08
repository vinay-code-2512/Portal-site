import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Enrollment {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseName: string;
  amount: number;
  paymentType?: string;
  totalFee?: number;
  createdAt?: any;
}

const COLLECTION = "enrollments";

export async function createEnrollment(data: {
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseName: string;
  amount: number;
  paymentType?: string;
  totalFee?: number;
}): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateEnrollment(
  id: string,
  data: { amount?: number; paymentType?: string; totalFee?: number }
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getAllEnrollments(): Promise<Enrollment[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTION), orderBy("createdAt", "desc"))
  );
  const list: Enrollment[] = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Enrollment));
  return list;
}

export async function getEnrollmentsByUserId(userId: string): Promise<Enrollment[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId))
  );
  const list: Enrollment[] = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Enrollment));
  return list;
}

export interface StudentSummary {
  userId: string;
  userName: string;
  userEmail: string;
  courseCount: number;
  totalPaid: number;
}

export function getStudentSummaries(enrollments: Enrollment[]): StudentSummary[] {
  const map = new Map<string, StudentSummary>();
  for (const e of enrollments) {
    const existing = map.get(e.userId);
    if (existing) {
      existing.courseCount++;
      existing.totalPaid += e.amount;
    } else {
      map.set(e.userId, {
        userId: e.userId,
        userName: e.userName,
        userEmail: e.userEmail,
        courseCount: 1,
        totalPaid: e.amount,
      });
    }
  }
  return Array.from(map.values());
}

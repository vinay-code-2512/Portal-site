import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Coupon {
  id?: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses?: number;
  usedCount?: number;
  expiresAt?: Timestamp | null;
  active: boolean;
  createdAt?: Timestamp;
}

const COLLECTION = "coupons";

export async function fetchCoupons(): Promise<Coupon[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  const list: Coupon[] = [];
  snap.forEach((d) => {
    const data = d.data();
    list.push({ id: d.id, ...data } as Coupon);
  });
  list.sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
  return list;
}

export async function createCoupon(data: {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses?: number;
  expiresAt?: Date | null;
  active: boolean;
}): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    code: data.code.toUpperCase(),
    type: data.type,
    value: data.value,
    maxUses: data.maxUses ?? null,
    usedCount: 0,
    expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : null,
    active: data.active,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteCoupon(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function toggleCouponActive(id: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { active });
}

export async function validateCoupon(code: string): Promise<Coupon | null> {
  const q = query(collection(db, COLLECTION), where("code", "==", code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const data = snap.docs[0].data();
  const coupon = { id: snap.docs[0].id, ...data } as Coupon;

  if (!coupon.active) return null;

  if (coupon.expiresAt) {
    const now = new Date();
    const expiry = coupon.expiresAt.toDate();
    if (now > expiry) return null;
  }

  if (coupon.maxUses && coupon.usedCount !== undefined && coupon.usedCount >= coupon.maxUses) {
    return null;
  }

  return coupon;
}

export function calcDiscount(coupon: Coupon, price: number): number {
  if (coupon.type === "percentage") {
    return Math.round(price * (coupon.value / 100));
  }
  return coupon.value;
}

export function incrementCouponUsage(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  return updateDoc(ref, { usedCount: increment(1) });
}

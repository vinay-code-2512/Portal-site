import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function fetchAdminEmails(): Promise<string[]> {
  const q = query(collection(db, "users"), where("role", "==", "admin"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().email).filter(Boolean);
}

export async function fetchAllEmployeeSheetIds(): Promise<string[]> {
  const q = query(collection(db, "users"), where("role", "==", "employee"));
  const snap = await getDocs(q);
  const ids: string[] = [];
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.googleSheetId) ids.push(data.googleSheetId);
    if (data.googleWorkSheetId) ids.push(data.googleWorkSheetId);
  });
  return ids;
}

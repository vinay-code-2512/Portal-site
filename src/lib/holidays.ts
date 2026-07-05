import { collection, query, orderBy, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Holiday {
  id?: string;
  date: string;
  name: string;
  type?: string;
  createdAt?: any;
}

const COLLECTION = "holidays";

export async function fetchHolidays(): Promise<Holiday[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy("date", "asc")));
  const items: Holiday[] = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Holiday));
  return items;
}

export async function createHoliday(holiday: Omit<Holiday, "id" | "createdAt">): Promise<void> {
  const id = holiday.date;
  await setDoc(doc(db, COLLECTION, id), {
    ...holiday,
    createdAt: serverTimestamp(),
  });
}

export async function deleteHoliday(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { isSunday } from "./format";

const BREVO_WORKER_URL = process.env.NEXT_PUBLIC_BREVO_WORKER_URL || "https://robot-genie-brevo.wild-sun-0ca5.workers.dev";

export async function trackMissedModal(
  uid: string,
  slotHour?: number,
  slotMinutes?: number
): Promise<{ missedCount: number; halfDayMarked: boolean }> {
  const today = new Date().toISOString().split("T")[0];
  if (isSunday(today)) return { missedCount: 0, halfDayMarked: false };
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  let missedCount = 1;
  let email = "";
  let fullName = "";

  if (userSnap.exists()) {
    const data = userSnap.data();
    const today = new Date().toISOString().split("T")[0];
    const storedDate = data.missedModalDate || "";
    missedCount = data.missedModalCount || 0;
    if (storedDate !== today) {
      missedCount = 0;
    }
    missedCount += 1;
    email = data.email || "";
    fullName = data.fullName || data.displayName || "";
    await updateDoc(userRef, {
      missedModalCount: missedCount,
      missedModalDate: today,
      updatedAt: serverTimestamp(),
    });
  } else {
    const today = new Date().toISOString().split("T")[0];
    await setDoc(userRef, { missedModalCount: 1, missedModalDate: today, updatedAt: serverTimestamp() }, { merge: true });
  }

  const logRef = doc(collection(db, "activity_log"));
  await setDoc(logRef, {
    uid,
    type: "missed_activity",
    slotHour: slotHour ?? null,
    slotMinutes: slotMinutes ?? null,
    description: slotHour
      ? `Missed activity confirmation prompt for ${String(slotHour).padStart(2, "0")}:${slotMinutes === 30 ? "30" : "00"} – ${String(slotHour + 1).padStart(2, "0")}:00`
      : `Missed activity confirmation prompt`,
    timestamp: Timestamp.now(),
  });

  let absentMarked = false;
  if (missedCount >= 3) {
    const today = new Date().toISOString().split("T")[0];
    const attendanceRef = doc(db, "attendance", `${uid}_${today}`);
    await setDoc(attendanceRef, {
      uid,
      date: today,
      status: "half-day",
      note: "Auto-marked half-day after 3 missed activity confirmations",
      updatedAt: serverTimestamp(),
    }, { merge: true });
    absentMarked = true;
    const resetToday = new Date().toISOString().split("T")[0];
    await updateDoc(userRef, { missedModalCount: 0, missedModalDate: resetToday });
  }

  if (email) {
    const date = new Date().toISOString().split("T")[0];
    sendMissedActivityEmail({ email, fullName, date, missedCount, halfDayMarked: absentMarked }).catch(() => {});
  }

  return { missedCount, halfDayMarked: absentMarked };
}

interface MissedActivityPayload {
  email: string;
  fullName: string;
  date: string;
  missedCount: number;
  halfDayMarked: boolean;
}

export async function sendMissedActivityEmail(
  payload: MissedActivityPayload
): Promise<void> {
  if (!BREVO_WORKER_URL) {
    console.warn("Brevo worker URL not configured. Set NEXT_PUBLIC_BREVO_WORKER_URL.");
    return;
  }

  const res = await fetch(`${BREVO_WORKER_URL}/send-missed-activity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Brevo worker returned ${res.status}`);
  }
}

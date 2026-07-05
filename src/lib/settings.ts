import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface CompanySettings {
  organizationName: string;
  timezone: string;
  workHoursStart: string;
  workHoursEnd: string;
  lateCutoffMinutes: number;
  halfDayHours: number;
  logoURL?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface NotificationSettings {
  attendanceReminders: boolean;
  leaveNotifications: boolean;
  payrollNotifications: boolean;
  dailyDigest: boolean;
  updatedAt?: any;
  updatedBy?: string;
}

const COMPANY_DOC = () => doc(db, "settings", "company");
const NOTIFICATIONS_DOC = () => doc(db, "settings", "notifications");

const DEFAULT_COMPANY: CompanySettings = {
  organizationName: "",
  timezone: "Asia/Kolkata",
  workHoursStart: "09:00",
  workHoursEnd: "18:00",
  lateCutoffMinutes: 30,
  halfDayHours: 4,
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  attendanceReminders: true,
  leaveNotifications: true,
  payrollNotifications: true,
  dailyDigest: false,
};

export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const snap = await getDoc(COMPANY_DOC());
    if (snap.exists()) {
      return snap.data() as CompanySettings;
    }
  } catch {
    // settings doc may not exist yet
  }
  return DEFAULT_COMPANY;
}

export async function updateCompanySettings(
  data: Partial<CompanySettings>,
  adminUid: string
): Promise<void> {
  const ref = COMPANY_DOC();
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: adminUid,
    });
  } else {
    await setDoc(ref, {
      ...DEFAULT_COMPANY,
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: adminUid,
    });
  }
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const snap = await getDoc(NOTIFICATIONS_DOC());
    if (snap.exists()) {
      return snap.data() as NotificationSettings;
    }
  } catch {
    // settings doc may not exist yet
  }
  return DEFAULT_NOTIFICATIONS;
}

export async function updateNotificationSettings(
  data: Partial<NotificationSettings>,
  adminUid: string
): Promise<void> {
  const ref = NOTIFICATIONS_DOC();
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: adminUid,
    });
  } else {
    await setDoc(ref, {
      ...DEFAULT_NOTIFICATIONS,
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: adminUid,
    });
  }
}

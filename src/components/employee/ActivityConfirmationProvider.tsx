"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAttendance } from "@/hooks/useAttendance";
import { useTimeTracker } from "@/hooks/useTimeTracker";
import ActivityConfirmationModal from "./ActivityConfirmationModal";
import { uploadActivityAttachment, saveActivityConfirmation } from "@/lib/attendance";
import { appendToGoogleSheet, createEmployeeSheet } from "@/lib/googleSheets";
import { fetchAdminEmails } from "@/lib/adminHelpers";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TRIGGER_WINDOW_MINUTES = 7;

const getLocalDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function markHourTriggered(uid: string, now: Date) {
  const dateKey = getLocalDateKey(now);
  const currentHour = now.getHours();
  const storageKey = `activity_confirmation_triggered_${uid}`;
  let triggeredData = { date: "", hours: [] as number[] };
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) triggeredData = JSON.parse(stored);
  } catch (e) {}
  if (triggeredData.date !== dateKey) {
    triggeredData = { date: dateKey, hours: [] };
  }
  if (!triggeredData.hours.includes(currentHour)) {
    triggeredData.hours.push(currentHour);
  }
  localStorage.setItem(storageKey, JSON.stringify(triggeredData));
  localStorage.setItem(`activity_confirmation_15min_${uid}`, String(now.getTime()));
}

export default function ActivityConfirmationProvider({ children }: { children: ReactNode }) {
  const { profile } = useCurrentUser();
  const { todayRecord } = useAttendance();
  const { sessionStatus } = useTimeTracker();
  const [modalOpen, setModalOpen] = useState(false);
  const [slotHour, setSlotHour] = useState<number | undefined>(undefined);

  const todayRecordRef = useRef(todayRecord);
  todayRecordRef.current = todayRecord;
  const sessionStatusRef = useRef(sessionStatus);
  sessionStatusRef.current = sessionStatus;

  useEffect(() => {
    if (!profile?.uid) return;

    const checkTimeAndTrigger = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const record = todayRecordRef.current;
      const status = sessionStatusRef.current;

      const isSweety =
        profile?.fullName?.toLowerCase().includes("sweety") ||
        profile?.displayName?.toLowerCase().includes("sweety") ||
        profile?.email?.toLowerCase().includes("sweety");

      const isSomya =
        profile?.fullName?.toLowerCase().includes("somya") ||
        profile?.displayName?.toLowerCase().includes("somya") ||
        profile?.email?.toLowerCase().includes("somya");

      // Common attendance/session checks
      const attendanceValid =
        record &&
        record.checkIn &&
        !record.checkOut &&
        !record.breaks?.some((b: any) => !b.end);

      const sessionValid = status === "working";

      if (!attendanceValid || !sessionValid) {
        console.debug("ActivityConfirmation: skip", { currentHour, attendanceValid, sessionValid, status });
        return;
      }

      if (isSweety) {
        // Every 15 minutes while working — no target-hour restriction
        const fifteenKey = `activity_confirmation_15min_${profile.uid}`;
        const lastStr = localStorage.getItem(fifteenKey);
        const lastTime = lastStr ? parseInt(lastStr, 10) : 0;
        if (Date.now() - lastTime < 15 * 60 * 1000) {
          console.debug("ActivityConfirmation: skip (15 min not elapsed)");
          return;
        }
        localStorage.setItem(fifteenKey, String(Date.now()));
        setSlotHour(currentHour);
        setModalOpen(true);
        return;
      }

      if (isSomya) {
        // Clock-aligned: every hour on the hour and half-hour, starting at 11 AM
        const shiftDuration = profile?.shiftDurationHours || 9;
        const targetHours = Array.from({ length: shiftDuration }, (_, i) => 11 + i);
        if (!targetHours.includes(currentHour)) return;

        const mins = now.getMinutes();
        const isTop = mins >= 0 && mins < TRIGGER_WINDOW_MINUTES;
        const isHalf = mins >= 30 && mins < 30 + TRIGGER_WINDOW_MINUTES;

        if (!isTop && !isHalf) return;

        // Don't trigger half-hour on the last hour (e.g. 7:30 PM for a 7 PM end)
        const lastHour = targetHours[targetHours.length - 1];
        if (currentHour === lastHour && isHalf) return;

        let checkInBeforeSlot = true;
        if (attendanceValid && record.checkIn) {
          const checkInDate = record.checkIn.toDate
            ? record.checkIn.toDate()
            : new Date(record.checkIn);
          const slotStartDate = new Date(now);
          slotStartDate.setHours(currentHour, isHalf ? 30 : 0, 0, 0);
          checkInBeforeSlot = checkInDate.getTime() <= slotStartDate.getTime();
        }

        if (!checkInBeforeSlot) {
          console.debug("ActivityConfirmation: skip Somya", { currentHour, isHalf, checkInBeforeSlot });
          return;
        }

        const slotType = isTop ? "top" : "half";
        const dateKey = getLocalDateKey(now);
        const storageKey = `activity_confirmation_somya_clock_${profile.uid}`;
        let triggeredData = { date: "", slots: [] as string[] };
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored) triggeredData = JSON.parse(stored);
        } catch (e) {}

        if (triggeredData.date !== dateKey) {
          triggeredData = { date: dateKey, slots: [] };
        }

        const currentSlotKey = `${currentHour}_${slotType}`;
        if (!triggeredData.slots.includes(currentSlotKey)) {
          triggeredData.slots.push(currentSlotKey);
          localStorage.setItem(storageKey, JSON.stringify(triggeredData));
          setSlotHour(currentHour);
          setModalOpen(true);
        }
        return;
      }

      // Standard hourly logic for everyone else (max up to 6 PM)
      const shiftDuration = profile?.shiftDurationHours || 8;
      const targetHours = Array.from({ length: shiftDuration }, (_, i) => 11 + i).filter(h => h <= 18);
      if (!targetHours.includes(currentHour)) return;
      if (now.getMinutes() >= TRIGGER_WINDOW_MINUTES) return;

      let checkInBeforeSlot = true;
      if (attendanceValid && record.checkIn) {
        const checkInDate = record.checkIn.toDate
          ? record.checkIn.toDate()
          : new Date(record.checkIn);
        const slotStartDate = new Date(now);
        slotStartDate.setHours(currentHour, 0, 0, 0);
        checkInBeforeSlot = checkInDate.getTime() <= slotStartDate.getTime();
      }

      if (!checkInBeforeSlot) {
        console.debug("ActivityConfirmation: skip", { currentHour, checkInBeforeSlot });
        return;
      }

      const dateKey = getLocalDateKey(now);
      const storageKey = `activity_confirmation_triggered_${profile.uid}`;
      let triggeredData = { date: "", hours: [] as number[] };
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) triggeredData = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse triggered hours", e);
      }

      if (triggeredData.date !== dateKey) {
        triggeredData = { date: dateKey, hours: [] };
      }

      if (!triggeredData.hours.includes(currentHour)) {
        triggeredData.hours.push(currentHour);
        localStorage.setItem(storageKey, JSON.stringify(triggeredData));
        setSlotHour(currentHour);
        setModalOpen(true);
      }
    };

    checkTimeAndTrigger();
    const intervalId = setInterval(checkTimeAndTrigger, 10000);
    return () => clearInterval(intervalId);
  }, [profile?.uid]);

  const handleConfirm = useCallback(async (note: string, files: File[]) => {
    if (!profile) return;
    try {
      const attachments = await Promise.all(
        files.map(async (f) => {
          const { url, name } = await uploadActivityAttachment(profile.uid, f);
          return { name, url, type: f.type.startsWith("image/") ? "image" as const : "pdf" as const };
        })
      );
      await saveActivityConfirmation(profile.uid, note, attachments);

      let sheetId = profile.googleSheetId;
      if (!sheetId) {
        try {
          const adminEmails = await fetchAdminEmails();
          const result = await createEmployeeSheet(
            profile.fullName || profile.displayName || "",
            profile.email || "",
            adminEmails
          );
          if (result?.sheetId) {
            sheetId = result.sheetId;
            await updateDoc(doc(db, "users", profile.uid), {
              googleSheetId: sheetId,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.error("Failed to auto-create Google Sheet:", err);
        }
      }

      const now = new Date();
      const photoUrls = attachments.filter((a) => a.type === "image").map((a) => a.url).join("; ");
      const pdfUrls = attachments.filter((a) => a.type === "pdf").map((a) => a.url).join("; ");
      const sheetOk = await appendToGoogleSheet({
        date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        note: note || "(no description)",
        photoUrls,
        pdfUrls,
        employeeName: profile.fullName || profile.displayName || "",
        employeeEmail: profile.email || "",
        employeeSheetId: sheetId || undefined,
      });

      if (!sheetOk) {
        console.warn("Activity confirmation saved but Google Sheet append failed");
      }

      markHourTriggered(profile.uid, now);
    } catch (err) {
      console.error("Failed to save activity confirmation:", err);
    }
    setModalOpen(false);
  }, [profile]);

  const handleClose = useCallback(() => {
    if (profile) {
      markHourTriggered(profile.uid, new Date());
    }
    setModalOpen(false);
  }, [profile]);

  return (
    <>
      {children}
      <ActivityConfirmationModal
        open={modalOpen}
        onConfirm={handleConfirm}
        onClose={handleClose}
        timeout={300}
        slotHour={slotHour}
      />
    </>
  );
}

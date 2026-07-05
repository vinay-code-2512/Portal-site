import emailjs from "@emailjs/browser";
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { generateOtp, hashValue, getOtpDocId } from "./otp";

const OTP_EXPIRY_MS = 15 * 60 * 1000;

const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_hatsz1s";
const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_p5uam8j";
const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "brdstEaOrNXwU4RoX";

if (typeof window !== "undefined") {
  emailjs.init(publicKey);
}

export async function sendOtp(email: string): Promise<void> {
  const otp = generateOtp();
  const [otpHash, docId] = await Promise.all([
    hashValue(otp),
    getOtpDocId(email),
  ]);

  await setDoc(doc(db, "otps", docId), {
    email: email.toLowerCase(),
    otpHash,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + OTP_EXPIRY_MS)),
  });

  await emailjs.send(serviceId, templateId, {
    email,
    passcode: otp,
    time: new Date(Date.now() + OTP_EXPIRY_MS).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });
}

export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const [docId, inputHash] = await Promise.all([
    getOtpDocId(email),
    hashValue(otp),
  ]);

  const snap = await getDoc(doc(db, "otps", docId));
  if (!snap.exists()) return false;

  const data = snap.data();
  if (data.otpHash !== inputHash) return false;
  if (data.expiresAt.toMillis() < Date.now()) return false;

  await deleteDoc(doc(db, "otps", docId));
  return true;
}

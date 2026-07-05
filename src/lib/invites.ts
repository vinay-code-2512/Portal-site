import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export interface Invite {
  id: string;
  code: string;
  email?: string; // Optional: if specified, only this email can use the invite
  role: "employee" | "admin";
  used: boolean;
  claimedBy?: string; // uid of who claimed it
  claimedAt?: Timestamp;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

/**
 * Validate and retrieve an invite code
 */
export async function getInvite(code: string): Promise<Invite | null> {
  try {
    const invitesRef = collection(db, "invites");
    const q = query(invitesRef, where("code", "==", code.trim().toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Invite;
  } catch (err) {
    console.error("Error fetching invite:", err);
    return null;
  }
}

/**
 * Validate if invite can be used
 */
export function validateInvite(
  invite: Invite,
  email: string
): { valid: boolean; error: string } {
  if (!invite) {
    return { valid: false, error: "Invalid invite code" };
  }

  if (invite.used) {
    return { valid: false, error: "This invite has already been used" };
  }

  if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
    return {
      valid: false,
      error: "This invite is only valid for a specific email address",
    };
  }

  if (invite.expiresAt) {
    const now = new Date();
    const expiry = new Date(invite.expiresAt.seconds * 1000);
    if (now > expiry) {
      return { valid: false, error: "This invite has expired" };
    }
  }

  return { valid: true, error: "" };
}

/**
 * Claim an invite (mark as used by a specific user)
 */
export async function claimInvite(
  inviteId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const inviteRef = doc(db, "invites", inviteId);
    await updateDoc(inviteRef, {
      used: true,
      claimedBy: userId,
      claimedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    console.error("Error claiming invite:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to claim invite",
    };
  }
}

/**
 * Generate a new invite code (for admin use)
 */
export async function createInvite(
  role: "employee" | "admin",
  email?: string,
  expiresInDays?: number
): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const code = generateInviteCode();
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const invitesRef = collection(db, "invites");
    const docRef = await addDoc(invitesRef, {
      code,
      email: email?.toLowerCase() || null,
      role,
      used: false,
      createdAt: serverTimestamp(),
      ...(expiresAt && { expiresAt: Timestamp.fromDate(expiresAt) }),
    });

    return { success: true, code };
  } catch (err) {
    console.error("Error creating invite:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create invite",
    };
  }
}

/**
 * Generate a random invite code (8 characters, uppercase alphanumeric)
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

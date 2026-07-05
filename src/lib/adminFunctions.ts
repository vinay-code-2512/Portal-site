"use client";

import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

export async function deleteUser(uid: string, idToken: string) {
  const fn = httpsCallable(functions, "deleteUser");
  const result = await fn({ uid, idToken });
  return result.data as { success: boolean; note?: string };
}

export async function updatePassword(uid: string, password: string, idToken: string) {
  const fn = httpsCallable(functions, "updatePassword");
  const result = await fn({ uid, password, idToken });
  return result.data as { success: boolean };
}

export async function lookupUser(email: string, idToken: string) {
  const fn = httpsCallable(functions, "lookupUser");
  const result = await fn({ email, idToken });
  return result.data as { uid: string | null };
}

export async function exchangeToken(idToken: string) {
  const fn = httpsCallable(functions, "exchangeToken");
  const result = await fn({ idToken });
  return result.data as { customToken: string; uid: string };
}

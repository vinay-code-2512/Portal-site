const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

export type CreatePaidUserResult =
  | { success: true; uid: string; email: string; password: string }
  | { success: false; error: string };

async function reclaimOrphanedAuth(email: string, idToken: string): Promise<boolean> {
  try {
    const { lookupUser, deleteUser } = await import("@/lib/adminFunctions");
    const { uid } = await lookupUser(email, idToken);
    if (!uid) return false;

    const { doc, getDoc, db } = await import("@/lib/firebase");
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) return false;

    await deleteUser(uid, idToken);
    return true;
  } catch {
    return false;
  }
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email.trim().toLowerCase(), continueUri: "http://localhost" }),
    });
    const data = await res.json();
    return data.registered === true;
  } catch {
    return false;
  }
}

export async function createPaidUser(
  fullName: string,
  email: string,
  phone: string,
  password: string,
  classType?: "live" | "recorded",
  batchName?: string,
  adminIdToken?: string,
  allottedEmployeeUid?: string,
  allottedEmployeeName?: string
): Promise<CreatePaidUserResult> {
  try {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
      const signUpRes = await fetch(signUpUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });

      const authData = await signUpRes.json();

      if (!signUpRes.ok) {
        const msg = authData.error?.message;
        if (msg === "EMAIL_EXISTS" && attempt === 1 && adminIdToken) {
          const reclaimed = await reclaimOrphanedAuth(email, adminIdToken);
          if (reclaimed) continue;
        }
        if (msg === "EMAIL_EXISTS") {
          return {
            success: false,
            error: "This email already has an account. Please use a different email to create the paid-user login.",
          };
        }
        return { success: false, error: msg || "Failed to create authentication account." };
      }

      const { localId, idToken } = authData;

      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${localId}?key=${API_KEY}`;
      const fields: Record<string, any> = {
        uid: { stringValue: localId },
        fullName: { stringValue: fullName.trim() },
        email: { stringValue: email.trim().toLowerCase() },
        phone: { stringValue: phone.replace(/\D/g, "") },
        role: { stringValue: "paid-user" },
        classType: { stringValue: classType || "live" },
        createdAt: { timestampValue: new Date().toISOString() },
      };
      if (batchName) fields.batchName = { stringValue: batchName };
      if (allottedEmployeeUid) fields.allottedEmployeeUid = { stringValue: allottedEmployeeUid };
      if (allottedEmployeeName) fields.allottedEmployeeName = { stringValue: allottedEmployeeName };
      const docPayload = { fields };

      const firestoreRes = await fetch(firestoreUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(docPayload),
      });

      if (!firestoreRes.ok) {
        const errData = await firestoreRes.json();
        return { success: false, error: errData.error?.message || "Failed to create user profile." };
      }

      return { success: true, uid: localId, email: email.trim().toLowerCase(), password };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Something went wrong";
    return { success: false, error: msg };
  }
}

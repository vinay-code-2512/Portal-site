import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// ── Admin Auth Helper ──────────────────────────────────────────
async function verifyAdmin(idToken: string): Promise<string> {
  const decoded = await auth.verifyIdToken(idToken);
  const callerDoc = await db.doc(`users/${decoded.uid}`).get();
  const callerRole = callerDoc.data()?.role;
  if (callerRole !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Not authorized. Admin role required."
    );
  }
  return decoded.uid;
}

// ── 1. Delete User ─────────────────────────────────────────────
export const deleteUser = onCall(async (request: CallableRequest) => {
  const idToken = request.data.idToken;
  const uid = request.data.uid;

  if (!idToken) {
    throw new HttpsError("unauthenticated", "Missing authentication token.");
  }
  if (!uid) {
    throw new HttpsError("invalid-argument", "Missing uid.");
  }

  await verifyAdmin(idToken);

  try {
    await auth.deleteUser(uid);
    return { success: true };
  } catch (err: any) {
    if (err?.code === "auth/user-not-found") {
      return { success: true, note: "User did not exist" };
    }
    throw new HttpsError("internal", err?.message || "Failed to delete user");
  }
});

// ── 2. Update Password ─────────────────────────────────────────
export const updatePassword = onCall(async (request: CallableRequest) => {
  const idToken = request.data.idToken;
  const uid = request.data.uid;
  const password = request.data.password;

  if (!idToken) {
    throw new HttpsError("unauthenticated", "Missing authentication token.");
  }
  if (!uid) {
    throw new HttpsError("invalid-argument", "Missing uid.");
  }
  if (!password || password.length < 6) {
    throw new HttpsError(
      "invalid-argument",
      "Password must be at least 6 characters."
    );
  }

  await verifyAdmin(idToken);

  try {
    await auth.updateUser(uid, { password });
    return { success: true };
  } catch (err: any) {
    throw new HttpsError(
      "internal",
      err?.message || "Failed to update password"
    );
  }
});

// ── 3. Lookup User by Email ────────────────────────────────────
export const lookupUser = onCall(async (request: CallableRequest) => {
  const idToken = request.data.idToken;
  const email = request.data.email;

  if (!idToken) {
    throw new HttpsError("unauthenticated", "Missing authentication token.");
  }
  if (!email) {
    throw new HttpsError("invalid-argument", "Missing email.");
  }

  await verifyAdmin(idToken);

  try {
    const userRecord = await auth.getUserByEmail(email);
    return { uid: userRecord.uid };
  } catch (err: any) {
    if (err?.code === "auth/user-not-found") {
      return { uid: null };
    }
    throw new HttpsError("internal", err?.message || "Failed to lookup user");
  }
});

// ── 4. Auto-Checkout (Scheduled) ───────────────────────────────
export const autoCheckout = onSchedule(
  {
    schedule: "0 19 * * 1-5",
    timeZone: "Asia/Kolkata",
  },
  async () => {
    const today = new Date().toISOString().split("T")[0];

    const snap = await db
      .collection("attendance")
      .where("date", "==", today)
      .where("checkOut", "==", null)
      .get();

    const sevenPm = new Date();
    sevenPm.setHours(19, 0, 0, 0);
    const sevenPmTimestamp = admin.firestore.Timestamp.fromDate(sevenPm);

    let count = 0;
    const batch = db.batch();

    snap.forEach((d: admin.firestore.QueryDocumentSnapshot) => {
      const data = d.data();
      if (data.checkIn) {
        batch.update(d.ref, {
          checkOut: sevenPmTimestamp,
          autoCheckedOut: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }

    logger.info(`Auto-checked out ${count} employees`);
  }
);

// ── 5. Exchange Token (SSO) ────────────────────────────────────
export const exchangeToken = onCall(async (request: CallableRequest) => {
  const idToken = request.data.idToken;

  if (!idToken) {
    throw new HttpsError("unauthenticated", "Missing ID token.");
  }

  try {
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const customToken = await auth.createCustomToken(uid);
    return { customToken, uid };
  } catch (err: any) {
    throw new HttpsError("unauthenticated", "Invalid or expired ID token.");
  }
});

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

export type CreateEmployeeResult =
  | { success: true; uid: string; email: string; password: string }
  | { success: false; error: string };

export async function createEmployee(
  fullName: string,
  email: string,
  phone: string,
  password: string
): Promise<CreateEmployeeResult> {
  try {
    const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
    const signUpRes = await fetch(signUpUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const authData = await signUpRes.json();

    if (!signUpRes.ok) {
      const msg = authData.error?.message;
      if (msg === "EMAIL_EXISTS") {
        return { success: false, error: "An account with this email already exists." };
      }
      return { success: false, error: msg || "Failed to create authentication account." };
    }

    const { localId, idToken } = authData;

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${localId}?key=${API_KEY}`;
    const docPayload = {
      fields: {
        uid: { stringValue: localId },
        fullName: { stringValue: fullName.trim() },
        email: { stringValue: email.trim() },
        phone: { stringValue: phone.replace(/\D/g, "") },
        role: { stringValue: "employee" },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    };

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

    return { success: true, uid: localId, email, password };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Something went wrong";
    return { success: false, error: msg };
  }
}

export function generatePassword(length = 10): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;

  let pw = "";
  pw += upper[Math.floor(Math.random() * upper.length)];
  pw += lower[Math.floor(Math.random() * lower.length)];
  pw += digits[Math.floor(Math.random() * digits.length)];
  pw += special[Math.floor(Math.random() * special.length)];

  for (let i = pw.length; i < length; i++) {
    pw += all[Math.floor(Math.random() * all.length)];
  }

  return pw
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

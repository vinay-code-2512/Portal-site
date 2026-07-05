const WEB_APP_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEB_APP_URL || "https://script.google.com/macros/s/AKfycbxcb9cJ4TqV4JmT5nS1Wdk1lLiaJUjA_3cN-EFgYSSuE1rZlRWza9ZW3HLVGGf1LciN/exec";
const WORKER_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WORKER_URL || "https://google-sheets.wild-sun-0ca5.workers.dev";

export async function createEmployeeSheet(
  employeeName: string,
  employeeEmail: string,
  adminEmails?: string[]
): Promise<{ sheetId: string; sheetUrl: string } | null> {
  if (!WORKER_URL) {
    console.error("GOOGLE_SHEETS_WORKER_URL not configured");
    return null;
  }

  try {
    const res = await fetch(`${WORKER_URL}/create-sheet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeName, employeeEmail, adminEmails }),
    });
    const result = await res.json();
    if (result?.success && result.sheetId) {
      return { sheetId: result.sheetId, sheetUrl: result.sheetUrl };
    }
    throw new Error(result?.error || "Failed to create sheet");
  } catch (err) {
    console.error("Failed to create employee sheet:", err);
    throw err;
  }
}

export async function createWorkSheet(
  employeeName: string,
  employeeEmail: string,
  adminEmails?: string[]
): Promise<{ sheetId: string; sheetUrl: string } | null> {
  if (!WORKER_URL) {
    console.error("GOOGLE_SHEETS_WORKER_URL not configured");
    return null;
  }

  try {
    const res = await fetch(`${WORKER_URL}/create-sheet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeName, employeeEmail, adminEmails }),
    });
    const result = await res.json();
    if (result?.success && result.sheetId) {
      return { sheetId: result.sheetId, sheetUrl: result.sheetUrl };
    }
    throw new Error(result?.error || "Failed to create work sheet");
  } catch (err) {
    console.error("Failed to create work sheet:", err);
    throw err;
  }
}

export async function grantAdminSheetAccess(
  adminEmail: string,
  sheetIds: string[]
): Promise<{ granted: number; failed: number } | null> {
  if (!WORKER_URL || sheetIds.length === 0) return null;

  try {
    const res = await fetch(`${WORKER_URL}/grant-admin-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminEmail, sheetIds }),
    });
    const result = await res.json();
    if (result?.success) {
      return { granted: result.granted || 0, failed: result.failed || 0 };
    }
    throw new Error(result?.error || "Failed to grant admin access");
  } catch (err) {
    console.error("Failed to grant admin sheet access:", err);
    throw err;
  }
}

export async function appendToWorkSheet(data: {
  date: string;
  time: string;
  note: string;
  employeeName: string;
  employeeEmail: string;
  workSheetId: string;
}) {
  if (!WEB_APP_URL) return;

  try {
    await fetch(WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ type: "activity", ...data, employeeSheetId: data.workSheetId }),
    });
  } catch (err) {
    console.error("Failed to append to work sheet:", err);
  }
}

export async function appendToGoogleSheet(data: {
  date: string;
  time: string;
  note: string;
  photoUrls: string;
  pdfUrls: string;
  employeeName: string;
  employeeEmail: string;
  employeeSheetId?: string;
}): Promise<boolean> {
  if (!WEB_APP_URL) return false;

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ type: "activity", ...data }),
    });
    if (!res.ok) {
      console.error("Failed to append to Google Sheet:", res.status, res.statusText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to append to Google Sheet:", err);
    return false;
  }
}

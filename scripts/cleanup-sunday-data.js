const https = require("https");
const os = require("os");
const path = require("path");
const fs = require("fs");

const PROJECT_ID = "robot-genie";

const configPath = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const ACCESS_TOKEN = config.tokens?.access_token;

if (!ACCESS_TOKEN) {
  console.error("No access token found. Run: npx firebase login");
  process.exit(1);
}

const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function fetchFirestore(method, resourcePath) {
  return new Promise((resolve, reject) => {
    const url = `${BASE}/${resourcePath}`;
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function isSunday(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr + "T00:00:00").getDay() === 0;
}

async function listAllDocs(collection) {
  const base = `${BASE}/${collection}`;
  let allDocs = [];
  let pageToken = null;
  do {
    let url = base + "?pageSize=300";
    if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
    const u = new URL(url);
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "GET",
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      };
      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); }
          catch { resolve(data); }
        });
      });
      req.on("error", reject);
      req.end();
    });
    if (result.documents) allDocs = allDocs.concat(result.documents);
    pageToken = result.nextPageToken || null;
  } while (pageToken);
  return allDocs;
}

async function deleteDocs(docNames) {
  for (let i = 0; i < docNames.length; i++) {
    const name = docNames[i]; // e.g., "attendance/abc123_2026-07-05"
    await fetchFirestore("DELETE", name);
    if ((i + 1) % 50 === 0 || i === docNames.length - 1) {
      console.log(`  Deleted ${i + 1}/${docNames.length}`);
    }
  }
}

async function deleteSundayAttendance() {
  console.log("Scanning attendance collection for Sunday records...");
  const docs = await listAllDocs("attendance");
  console.log(`  Total docs: ${docs.length}`);
  const toDelete = docs.filter((d) => {
    const dateVal = d.fields?.date?.stringValue;
    return dateVal && isSunday(dateVal);
  });
  if (toDelete.length === 0) { console.log("  No Sunday attendance records found."); return 0; }
  const names = toDelete.map((d) => d.name.split("/documents/")[1]);
  console.log(`  Found ${names.length} Sunday records. Deleting...`);
  await deleteDocs(names);
  return names.length;
}

async function deleteSundayActivityLog() {
  console.log("Scanning activity_log collection for Sunday entries...");
  const docs = await listAllDocs("activity_log");
  console.log(`  Total docs: ${docs.length}`);
  const toDelete = docs.filter((d) => {
    const ts = d.fields?.timestamp;
    let dateStr = null;
    if (ts?.timestampValue) dateStr = ts.timestampValue.split("T")[0];
    else if (ts?.stringValue) dateStr = ts.stringValue.split("T")[0];
    return dateStr && isSunday(dateStr);
  });
  if (toDelete.length === 0) { console.log("  No Sunday activity_log entries found."); return 0; }
  const names = toDelete.map((d) => d.name.split("/documents/")[1]);
  console.log(`  Found ${names.length} Sunday entries. Deleting...`);
  await deleteDocs(names);
  return names.length;
}

async function main() {
  console.log("=== Sunday Data Cleanup ===\n");
  const attDeleted = await deleteSundayAttendance();
  const logDeleted = await deleteSundayActivityLog();
  console.log(`\nCleanup complete. Total deleted: ${attDeleted + logDeleted}`);
  process.exit(0);
}
main().catch((err) => {
  console.error("Cleanup failed:", err?.message || err);
  process.exit(1);
});

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

async function updateDoc(name, fields) {
  const u = new URL(`${BASE}/${name}`);
  return new Promise((resolve, reject) => {
    const options = {
      hostname: u.hostname,
      path: u.pathname,
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
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
    req.write(JSON.stringify({ fields }));
    req.end();
  });
}

function isSomya(doc) {
  const name =
    doc.fields?.fullName?.stringValue?.toLowerCase() ||
    doc.fields?.displayName?.stringValue?.toLowerCase() ||
    doc.fields?.email?.stringValue?.toLowerCase() ||
    "";
  return name.includes("somya");
}

async function main() {
  console.log("=== Update Shift Timings ===\n");

  console.log("Fetching all users...");
  const users = await listAllDocs("users");
  console.log(`  Total users: ${users.length}\n`);

  let updatedCount = 0;
  let somyaCount = 0;

  for (const user of users) {
    const docPath = user.name.split("/documents/")[1];
    const fields = {};

    fields.shiftStartTime = { stringValue: "10:00" };

    if (isSomya(user)) {
      fields.shiftEndTime = { stringValue: "19:00" };
      fields.shiftDurationHours = { integerValue: "9" };
      somyaCount++;
    }

    await updateDoc(docPath, fields);
    updatedCount++;
    console.log(`  Updated ${docPath} (Somya: ${isSomya(user)})`);
  }

  console.log(`\nDone. Updated ${updatedCount} users. Somya-specific: ${somyaCount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err?.message || err);
  process.exit(1);
});

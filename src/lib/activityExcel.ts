"use client";

import ExcelJS from "exceljs";

const DB_NAME = "ActivityExcelDB";
const STORE_NAME = "handles";
const HANDLE_KEY = "fileHandle";
const SHEET_PASSWORD = "rg_protect_2024";
const SHEET_NAME = "Activities";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFileHandle(handle: FileSystemFileHandle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getFileHandle(): Promise<FileSystemFileHandle | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function removeFileHandle(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

const PROTECTION_OPTIONS: Partial<ExcelJS.WorksheetProtection> = {
  selectLockedCells: true,
  selectUnlockedCells: true,
  formatCells: false,
  formatColumns: false,
  formatRows: false,
  insertColumns: false,
  insertRows: false,
  insertHyperlinks: false,
  deleteColumns: false,
  deleteRows: false,
  sort: false,
  autoFilter: false,
  pivotTables: false,
  objects: false,
  scenarios: false,
};

export async function initExcelFile(handle: FileSystemFileHandle): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(SHEET_NAME);

  ws.columns = [
    { header: "Date", key: "date", width: 16 },
    { header: "Time", key: "time", width: 12 },
    { header: "Note", key: "note", width: 40 },
    { header: "Photo URLs", key: "photoUrls", width: 50 },
    { header: "PDF URLs", key: "pdfUrls", width: 50 },
    { header: "Employee Name", key: "employeeName", width: 22 },
    { header: "Employee Email", key: "employeeEmail", width: 30 },
  ];

  ws.protect(SHEET_PASSWORD, PROTECTION_OPTIONS);

  const buffer = await workbook.xlsx.writeBuffer();
  const writable = await handle.createWritable();
  await writable.write(new Blob([buffer]));
  await writable.close();
}

interface ActivityRow {
  date: string;
  time: string;
  note: string;
  photoUrls: string;
  pdfUrls: string;
  employeeName: string;
  employeeEmail: string;
}

interface FileHandleWithPermission extends FileSystemFileHandle {
  queryPermission(descriptor: { mode: "read" | "readwrite" }): Promise<"granted" | "denied" | "prompt">;
  requestPermission(descriptor: { mode: "read" | "readwrite" }): Promise<"granted" | "denied" | "prompt">;
}

export async function appendActivityRow(handle: FileSystemFileHandle, row: ActivityRow): Promise<void> {
  const h = handle as unknown as FileHandleWithPermission;
  const permission = await h.queryPermission({ mode: "readwrite" });
  if (permission !== "granted") {
    const result = await h.requestPermission({ mode: "readwrite" });
    if (result !== "granted") throw new Error("Permission denied");
  }

  const file = await handle.getFile();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const ws = workbook.getWorksheet(SHEET_NAME);
  if (!ws) throw new Error("Sheet 'Activities' not found");

  ws.unprotect();
  ws.addRow([row.date, row.time, row.note, row.photoUrls, row.pdfUrls, row.employeeName, row.employeeEmail], "i");
  ws.protect(SHEET_PASSWORD, PROTECTION_OPTIONS);

  const buffer = await workbook.xlsx.writeBuffer();
  const writable = await handle.createWritable();
  await writable.write(new Blob([buffer]));
  await writable.close();
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

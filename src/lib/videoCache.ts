"use client";

import { ref, getBlob } from "firebase/storage";
import { storage } from "@/lib/firebase";

const DB_NAME = "VideoCacheDB";
const STORE_NAME = "videos";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function keyFromUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return "v_" + Math.abs(hash).toString(36);
}

export async function getCachedVideo(url: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(keyFromUrl(url));
      req.onsuccess = () => { db.close(); resolve(req.result || null); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    return null;
  }
}

export async function cacheVideo(url: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(blob, keyFromUrl(url));
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function isVideoCached(url: string): Promise<boolean> {
  const blob = await getCachedVideo(url);
  return blob !== null;
}

function firebaseUrlToStoragePath(url: string): string | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/o\/(.+)/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export async function downloadFirebaseBlob(url: string): Promise<Blob> {
  const path = firebaseUrlToStoragePath(url);
  if (!path) throw new Error("Not a Firebase Storage URL");
  return await getBlob(ref(storage, path));
}

export async function removeCachedVideo(url: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(keyFromUrl(url));
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

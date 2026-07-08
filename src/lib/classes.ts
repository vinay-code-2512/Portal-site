import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export interface ClassEntry {
  id?: string;
  userId: string;
  type: "live" | "recorded";
  title: string;
  link: string;
  videoName?: string;
  order?: number;
  completed?: boolean;
  completedAt?: any;
  thumbnailUrl?: string;
  isLiveNow?: boolean;
  questions?: string[];
  liveVideoUrl?: string;
  liveVideoName?: string;
  liveThumbnailUrl?: string;
  fileUrl?: string;
  fileName?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION = "classes";

export async function getClassesByUserId(userId: string): Promise<ClassEntry[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId))
  );
  const list: ClassEntry[] = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ClassEntry));
  return list;
}

export async function getClassesByUserIdOrdered(userId: string): Promise<ClassEntry[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId), orderBy("order", "asc"))
  );
  const list: ClassEntry[] = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ClassEntry));
  return list;
}

export async function addClass(data: {
  userId: string;
  type: "live" | "recorded";
  title: string;
  link: string;
  videoName?: string;
  order?: number;
  questions?: string[];
  thumbnailUrl?: string;
  isLiveNow?: boolean;
  liveVideoUrl?: string;
  liveVideoName?: string;
  liveThumbnailUrl?: string;
  fileUrl?: string;
  fileName?: string;
}): Promise<string> {
  const validTypes = ["live", "recorded"];
  const clean: Record<string, any> = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  if (clean.type && !validTypes.includes(clean.type)) clean.type = "live";
  if (clean.order === undefined) {
    const existing = await getClassesByUserIdOrdered(clean.userId as string);
    clean.order = existing.length > 0 ? (existing[existing.length - 1].order ?? 0) + 1 : 1;
  }
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...clean,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateClass(id: string, data: {
  title?: string;
  link?: string;
  videoName?: string;
  order?: number;
  questions?: string[];
  thumbnailUrl?: string;
  isLiveNow?: boolean;
  liveVideoUrl?: string;
  liveVideoName?: string;
  liveThumbnailUrl?: string;
  fileUrl?: string;
  fileName?: string;
}): Promise<void> {
  const clean = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  await updateDoc(doc(db, COLLECTION, id), {
    ...clean,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteClass(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function markClassCompleted(classId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, classId), {
    completed: true,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function uploadClassVideo(userId: string, file: File): Promise<{ url: string; name: string }> {
  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `class_videos/${userId}/${fileName}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, name: file.name };
}

export async function generateVideoThumbnail(videoUrl: string): Promise<Blob> {
  const response = await fetch(videoUrl);
  const videoBlob = await response.blob();
  const blobUrl = URL.createObjectURL(videoBlob);

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = blobUrl;
    video.muted = true;
    video.preload = "auto";

    video.onloadeddata = () => {
      video.currentTime = 1;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(blobUrl); reject(new Error("No canvas context")); return; }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(blobUrl);
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to generate thumbnail"));
      }, "image/jpeg", 0.8);
    };

    video.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error("Failed to load video")); };
  });
}

export async function uploadClassThumbnail(userId: string, file: Blob | File): Promise<string> {
  const fileName = `thumb_${Date.now()}.jpg`;
  const storageRef = ref(storage, `class_thumbnails/${userId}/${fileName}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function uploadClassFile(userId: string, file: File): Promise<{ url: string; name: string }> {
  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `class_videos/${userId}/${fileName}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, name: file.name };
}

export function isStorageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes("firebasestorage.googleapis.com") || u.hostname.includes("storage.googleapis.com");
  } catch {
    return false;
  }
}

export async function createBulkClasses(
  userIds: string[],
  data: {
    type: "live" | "recorded";
    title: string;
    link: string;
    videoName?: string;
    questions?: string[];
    thumbnailUrl?: string;
    isLiveNow?: boolean;
    liveVideoUrl?: string;
    liveVideoName?: string;
    liveThumbnailUrl?: string;
    fileUrl?: string;
    fileName?: string;
  }
): Promise<{ success: number; failed: { userId: string; error: string }[] }> {
  const existingMap = new Map<string, number>();
  const batches: string[][] = [];
  for (let i = 0; i < userIds.length; i += 10) batches.push(userIds.slice(i, i + 10));

  for (const batch of batches) {
    const snap = await getDocs(
      query(collection(db, COLLECTION), where("userId", "in", batch))
    );
    for (const d of snap.docs) {
      const uid = d.data().userId as string;
      const order = (d.data().order as number) ?? 0;
      const prev = existingMap.get(uid) ?? 0;
      if (order > prev) existingMap.set(uid, order);
    }
  }

  const results = await Promise.allSettled(
    userIds.map((userId) => {
      const nextOrder = (existingMap.get(userId) ?? 0) + 1;
      existingMap.set(userId, nextOrder);
      return addClass({
        userId,
        order: nextOrder,
        type: data.type,
        title: data.title,
        link: data.link,
        videoName: data.videoName,
        questions: data.questions,
        thumbnailUrl: data.thumbnailUrl,
        isLiveNow: data.isLiveNow,
        liveVideoUrl: data.liveVideoUrl,
        liveVideoName: data.liveVideoName,
        liveThumbnailUrl: data.liveThumbnailUrl,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
      });
    })
  );

  const failed: { userId: string; error: string }[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      failed.push({ userId: userIds[i], error: r.reason?.message || "Unknown error" });
    }
  });

  return { success: results.length - failed.length, failed };
}

export async function submitClassAnswers(
  classId: string,
  userId: string,
  answers: { questionIndex: number; answer: string }[]
): Promise<void> {
  await markClassCompleted(classId);
  try {
    await addDoc(collection(db, "class_answers"), {
      classId,
      userId,
      answers,
      createdAt: serverTimestamp(),
    });
  } catch {
    console.warn("Failed to save class answers, but class is marked completed.");
  }
}

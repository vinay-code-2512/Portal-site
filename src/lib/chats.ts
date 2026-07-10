import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Timestamp;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  paidUserId: string;
  employeeId: string;
  paidUserName: string;
  employeeName: string;
  lastMessage: string;
  lastMessageAt: Timestamp;
  unreadCount: number;
}

function generateConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

export async function getOrCreateConversation(
  paidUserId: string,
  employeeId: string,
  paidUserName: string,
  employeeName: string
): Promise<string> {
  const convId = generateConversationId(paidUserId, employeeId);
  const convRef = doc(db, "conversations", convId);
  const snap = await getDoc(convRef);

  if (!snap.exists()) {
    await setDoc(convRef, {
      participantIds: [paidUserId, employeeId],
      paidUserId,
      employeeId,
      paidUserName,
      employeeName,
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return convId;
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> {
  const messagesRef = collection(db, "conversations", conversationId, "messages");
  await addDoc(messagesRef, {
    senderId,
    senderName,
    text,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void {
  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100));

  return onSnapshot(q, (snap) => {
    const msgs: Message[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        senderId: data.senderId,
        senderName: data.senderName,
        text: data.text,
        createdAt: data.createdAt,
      } as Message;
    });
    callback(msgs);
  }, (err) => {
    console.error("subscribeMessages error:", err);
    callback([]);
  });
}

export function subscribeEmployeeConversations(
  employeeId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const q = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", employeeId)
  );

  return onSnapshot(q, (snap) => {
    const convs: Conversation[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        participantIds: data.participantIds,
        paidUserId: data.paidUserId,
        employeeId: data.employeeId,
        paidUserName: data.paidUserName,
        employeeName: data.employeeName,
        lastMessage: data.lastMessage,
        lastMessageAt: data.lastMessageAt,
        unreadCount: 0,
      } as Conversation;
    });
    convs.sort((a, b) => {
      const aTime = a.lastMessageAt?.toDate()?.getTime() || 0;
      const bTime = b.lastMessageAt?.toDate()?.getTime() || 0;
      return bTime - aTime;
    });
    callback(convs);
  }, (err) => {
    console.error("subscribeEmployeeConversations error:", err);
    callback([]);
  });
}

export function subscribePaidUserConversation(
  paidUserId: string,
  callback: (conversation: Conversation | null) => void
): () => void {
  const q = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", paidUserId)
  );

  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
      return;
    }
    const data = snap.docs[0].data();
    callback({
      id: snap.docs[0].id,
      participantIds: data.participantIds,
      paidUserId: data.paidUserId,
      employeeId: data.employeeId,
      paidUserName: data.paidUserName,
      employeeName: data.employeeName,
      lastMessage: data.lastMessage,
      lastMessageAt: data.lastMessageAt,
      unreadCount: 0,
    } as Conversation);
  }, (err) => {
    console.error("subscribePaidUserConversation error:", err);
    callback(null);
  });
}

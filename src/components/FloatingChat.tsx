"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  MessageCircle,
  X,
  Send,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import {
  getOrCreateConversation,
  sendMessage,
  subscribeMessages,
  subscribeEmployeeConversations,
  subscribePaidUserConversation,
  type Message,
  type Conversation,
} from "@/lib/chats";

export default function FloatingChat() {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const { role } = usePermissions();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConv, setCurrentConv] = useState<Conversation | null>(null);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState("");
  const [badgeCount, setBadgeCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSelected = useRef(false);
  const prevMessageLen = useRef(0);
  const openRef = useRef(open);
  openRef.current = open;

  const isEmployee = role === "employee" || role === "admin" || role === "manager";
  const isPaidUser = role === "paid-user";

  const prevUid = useRef(currentUser?.uid);
  useEffect(() => {
    if (prevUid.current !== currentUser?.uid) {
      prevUid.current = currentUser?.uid;
      setOpen(false);
      setConversations([]);
      setCurrentConv(null);
      setConvId(null);
      setMessages([]);
      setText("");
      setSending(false);
      setSendError("");
      setLoading(true);
      setEmployeeName("");
      setBadgeCount(0);
      hasAutoSelected.current = false;
      prevMessageLen.current = 0;
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser || !userData || authLoading) {
      setLoading(false);
      return;
    }

    setLoading(true);

    if (isPaidUser) {
      const uid = currentUser.uid;
      const assignedEmpUid = (userData as any)?.assignedEmployeeUid;
      const assignedEmpName = (userData as any)?.assignedEmployeeName || (userData as any)?.allottedEmployeeName || "";

      setEmployeeName(assignedEmpName);

      if (assignedEmpUid) {
        getOrCreateConversation(
          uid,
          assignedEmpUid,
          (userData as any)?.fullName || currentUser.displayName || "User",
          assignedEmpName || "Employee"
        ).then((id) => {
          setConvId(id);
        });
      }

      const unsub = subscribePaidUserConversation(uid, (conv) => {
        setCurrentConv(conv);
        setLoading(false);
      });

      return () => unsub();
    }

    if (isEmployee) {
      const uid = currentUser.uid;
      setEmployeeName((userData as any)?.fullName || "Employee");

      const unsub = subscribeEmployeeConversations(uid, (convs) => {
        setConversations(convs);
        setLoading(false);

        if (convs.length > 0 && !hasAutoSelected.current) {
          hasAutoSelected.current = true;
          setCurrentConv(convs[0]);
          setConvId(convs[0].id);
        }
      });

      return () => unsub();
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userData, authLoading, isPaidUser, isEmployee]);

  useEffect(() => {
    if (!currentConv && !convId) {
      setMessages([]);
      return;
    }

    const id = currentConv?.id || convId;
    if (!id) return;

    if (isPaidUser && currentConv) {
      setEmployeeName(currentConv.employeeName);
    }

    const unsub = subscribeMessages(id, (msgs) => {
      if (!openRef.current) {
        const diff = msgs.length - prevMessageLen.current;
        if (diff > 0) {
          setBadgeCount((prev) => prev + diff);
        }
      }
      prevMessageLen.current = msgs.length;
      setMessages(msgs);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConv, convId]);

  useEffect(() => {
    if (open) {
      setBadgeCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  function handleSend() {
    if (!text.trim() || !currentUser || sending) return;

    setSendError("");
    let id = currentConv?.id || convId;

    if (!id && isPaidUser) {
      const assignedEmpUid = (userData as any)?.assignedEmployeeUid;
      const assignedEmpName = (userData as any)?.assignedEmployeeName || (userData as any)?.allottedEmployeeName || "";
      const name = (userData as any)?.fullName || currentUser.displayName || "User";

      if (!assignedEmpUid) {
        setSendError("No employee assigned yet. Contact admin.");
        return;
      }

      getOrCreateConversation(
        currentUser.uid,
        assignedEmpUid,
        name,
        assignedEmpName || "Employee"
      ).then((newId) => {
        setConvId(newId);
        sendWithId(newId);
      }).catch(() => {
        setSendError("Failed to create conversation.");
      });
      return;
    }

    if (!id) {
      setSendError("Conversation not ready. Try again.");
      return;
    }

    sendWithId(id);
  }

  function sendWithId(id: string) {
    if (!currentUser) return;
    setSending(true);
    const name = (userData as any)?.fullName || currentUser.displayName || "User";
    sendMessage(id, currentUser.uid, name, text.trim()).then(() => {
      setText("");
      setSending(false);
    }).catch((e) => {
      setSendError("Failed to send message.");
      console.error("Send failed:", e);
      setSending(false);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleBack() {
    setCurrentConv(null);
    setConvId(null);
    setMessages([]);
  }

  function selectConversation(conv: Conversation) {
    hasAutoSelected.current = true;
    setCurrentConv(conv);
    setConvId(conv.id);
  }

  if (authLoading || !currentUser || !isPaidUser && !isEmployee) return null;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all cursor-pointer flex items-center justify-center"
        title="Chat"
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <MessageCircle className="w-5 h-5" />
        )}
        {!open && badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[360px] h-[500px] rounded-2xl bg-white border border-zinc-200 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {isEmployee && !currentConv && (
            <>
              <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-bold text-zinc-800">My Students ({conversations.length})</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-zinc-400 px-4 text-center">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors border-b border-zinc-100 text-left cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-sm font-bold text-purple-600 shrink-0">
                        {conv.paidUserName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-zinc-800 truncate">{conv.paidUserName}</p>
                        <p className="text-xs text-zinc-500 truncate">{conv.lastMessage || "No messages yet"}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {(isPaidUser || currentConv) && (
            <>
              <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50 flex items-center gap-2">
                {isEmployee && (
                  <button
                    onClick={handleBack}
                    className="p-1 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-zinc-600" />
                  </button>
                )}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-sm font-bold text-purple-600 shrink-0">
                  {isEmployee
                    ? currentConv?.paidUserName.charAt(0).toUpperCase() || "?"
                    : employeeName.charAt(0).toUpperCase() || "?"}
                </div>
                <span className="text-sm font-bold text-zinc-800 truncate">
                  {isEmployee ? currentConv?.paidUserName || "Chat" : employeeName || "Chat"}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-zinc-50/50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-zinc-400">
                    Start a conversation
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === currentUser?.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md"
                              : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-md"
                          }`}
                        >
                          <p>{msg.text}</p>
                          <p
                            className={`text-[9px] mt-0.5 ${
                              isMine ? "text-purple-200" : "text-zinc-400"
                            }`}
                          >
                            {msg.createdAt?.toDate
                              ? msg.createdAt.toDate().toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {sendError && (
                <p className="px-4 pt-2 text-xs text-red-500">{sendError}</p>
              )}
              <div className="px-4 py-3 border-t border-zinc-200 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => { setText(e.target.value); setSendError(""); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-purple-300"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, ChevronDown } from "lucide-react";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface FAQ {
  keywords: string[];
  answer: string;
}

const faqs: FAQ[] = [
  {
    keywords: ["fee", "fees", "price", "cost", "charge", " charges"],
    answer: "Course fees vary by program. Book free counseling to get detailed pricing information tailored to your needs.",
  },
  {
    keywords: ["placement", "job", "jobs", "package", "salary"],
    answer: "We provide 100% placement assistance. Our highest package is 7 LPA with 5000+ students placed across 300+ companies.",
  },
  {
    keywords: ["duration", "time", "long", "months"],
    answer: "Course duration ranges from 3-12 months depending on the program you choose. Contact us for specific course timelines.",
  },
  {
    keywords: ["online", "offline", "class", "classes", "hybrid"],
    answer: "We offer both online and offline classes with live training sessions. Choose what works best for you!",
  },
  {
    keywords: ["eligibility", "eligible", "qualification", "12th", "graduate"],
    answer: "Eligibility varies by course. Generally, 10th pass for diploma courses, graduates for professional programs. Get free counseling for details.",
  },
  {
    keywords: ["contact", "enquiry", "talk", "reach", "call"],
    answer: "You can reach us at +91 98917 07129 or chat on WhatsApp at +91 85068 50459 for quick response!",
  },
  {
    keywords: ["demo", "trial", "sample"],
    answer: "We offer free demo classes! Click 'Join Live Demo' in the hero section to experience our teaching style.",
  },
  {
    keywords: ["batch", "batches", "seats", "admission", "enroll"],
    answer: "New batches start every month. Currently, limited seats are available for the upcoming batch. Book early to secure your spot!",
  },
  {
    keywords: ["certificate", "certification", "degree", "diploma"],
    answer: "All our courses provide industry-recognized certificates upon completion. Our diplomas are valued by 300+ hiring partners.",
  },
  {
    keywords: ["trainer", "teacher", "mentor", "faculty", "experience"],
    answer: "Our trainers are industry experts with 8-15+ years of experience from companies like Google, Microsoft, Amazon, and top MNCs.",
  },
  {
    keywords: ["support", "help", "doubt", "query", "assistance"],
    answer: "We provide 24/7 doubt resolution, live Q&A sessions, and dedicated mentorship throughout your course journey.",
  },
  {
    keywords: ["company", "robot", "genie", "about", "who"],
    answer: "Robot Genie is India's most advanced AI-powered career institute. We specialize in job-oriented training with 5000+ successful placements.",
  },
  {
    keywords: ["mode", "study", "learning", "recorded", "live"],
    answer: "We provide live interactive online classes with recorded sessions available for revision. Offline workshops are also conducted for enrolled students.",
  },
];

const quickReplies = [
  "Fees",
  "Placement",
  "Duration",
  "Contact",
  "Batch",
  "Certificate",
];

function findAnswer(userInput: string): string {
  const input = userInput.toLowerCase();
  
  for (const faq of faqs) {
    for (const keyword of faq.keywords) {
      if (input.includes(keyword)) {
        return faq.answer;
      }
    }
  }
  
  return "Thanks for your question! For detailed information, chat with us on WhatsApp. We'll be happy to help!";
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hi! How can I help you today?", isUser: false },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
    };

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: findAnswer(inputValue),
      isUser: false,
    };

    setMessages((prev) => [...prev, userMessage, botResponse]);
    setInputValue("");
  };

  const handleQuickReply = (keyword: string) => {
    setInputValue(keyword);
    handleSend();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      className="fixed bottom-20 sm:bottom-22 right-4 sm:right-6 z-50"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0 }}
    >
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="chat-toggle"
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] shadow-[0_4px_20px_rgba(181,0,255,0.4),0_0_40px_rgba(0,240,255,0.2)] hover:shadow-[0_8px_32px_rgba(181,0,255,0.5),0_0_60px_rgba(0,240,255,0.3)] transition-all duration-200 active:scale-95"
            aria-label="Open chat"
          >
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </motion.button>
        ) : (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
              className="w-[320px] sm:w-[360px] h-[420px] glass-panel-hover rounded-2xl overflow-hidden border border-[var(--neon-purple)]/40 shadow-[0_8px_40px_rgba(0,0,0,0.7),0_0_60px_rgba(181,0,255,0.15)] bg-[#0a0b1a]/95"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--neon-purple)]/20 to-[var(--neon-blue)]/20 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[var(--neon-blue)]" />
                <span className="text-sm font-semibold text-white">Robot Genie Bot</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex flex-col h-[340px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.isUser
                          ? "bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-purple)] text-black font-medium rounded-br-md"
                          : "bg-white/[0.12] text-gray-100 rounded-bl-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-3 py-2 border-t border-white/[0.06]">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      className="px-2.5 py-1 text-xs rounded-full bg-[var(--neon-blue)]/10 border border-[var(--neon-blue)]/30 text-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/20 transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 text-sm rounded-xl bg-white/[0.10] border border-white/[0.12] text-white placeholder:text-gray-500 focus:outline-none focus:border-[var(--neon-purple)]/50 transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="p-2 rounded-full bg-[var(--neon-purple)]/20 border border-[var(--neon-purple)]/40 text-[var(--neon-purple)] hover:bg-[var(--neon-purple)]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
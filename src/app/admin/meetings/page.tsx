"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { sendMeetingInvitation } from "@/lib/meetingEmailService";
import { 
  Search, 
  Video, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  ArrowLeft, 
  Calendar, 
  User, 
  Users,
  Check,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Meeting {
  id: string;
  topic: string;
  link: string;
  date: string;
  time: string;
  duration: number;
  status: "upcoming" | "completed" | "cancelled" | "active" | "draft" | "sent";
  participants?: Employee[];
}

interface Employee {
  uid: string;
  fullName: string;
  email: string;
}

const mockMeetings: Meeting[] = [
  {
    id: "1",
    topic: "Weekly Standup Sync",
    link: "https://meet.google.com/abc-defg-hij",
    date: "2026-06-15",
    time: "10:00 AM",
    duration: 60,
    status: "upcoming",
  },
  {
    id: "2",
    topic: "Sprint Planning",
    link: "https://meet.google.com/xyz-uvwx-yza",
    date: "2026-06-12",
    time: "02:30 PM",
    duration: 60,
    status: "active",
  },
  {
    id: "3",
    topic: "Client Demo: Robot Genie Dashboard",
    link: "https://meet.google.com/qrs-tuvw-xyz",
    date: "2026-06-11",
    time: "04:00 PM",
    duration: 60,
    status: "completed",
  },
  {
    id: "4",
    topic: "Design Feedback Review",
    link: "https://meet.google.com/jkl-mnop-qrs",
    date: "2026-06-08",
    time: "11:30 AM",
    duration: 60,
    status: "completed",
  },
  {
    id: "5",
    topic: "HR Policy Discussion",
    link: "https://meet.google.com/fgh-ijkl-mno",
    date: "2026-06-05",
    time: "03:00 PM",
    duration: 60,
    status: "cancelled",
  },
];

const fallbackEmployees: Employee[] = [
  { uid: "emp1", fullName: "Somya Kutiyal", email: "somya.kutiyal1425@gmail.com" },
  { uid: "emp2", fullName: "Vikrant", email: "vik@gmail.com" },
  { uid: "emp3", fullName: "Vinay Thakur", email: "vinaythakur0912@gmail.com" },
  { uid: "emp4", fullName: "Ananya Sharma", email: "ananya@example.com" },
];

export default function AdminMeetings() {
  const { currentUser, userData } = useAuth();
  const [view, setView] = useState<"list" | "create">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);

  // Form states
  const [topic, setTopic] = useState("");
  const [link, setLink] = useState("");
  const [datetime, setDatetime] = useState("");
  const [duration, setDuration] = useState(60);
  const [selectedParticipants, setSelectedParticipants] = useState<Employee[]>([]);
  const [formStatus, setFormStatus] = useState<"draft" | "sent">("sent");

  // Employees data
  const [employeeList, setEmployeeList] = useState<Employee[]>(fallbackEmployees);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load actual employees and meetings from Firestore
  useEffect(() => {
    async function loadEmployees() {
      try {
        const snap = await getDocs(query(collection(db, "users"), where("role", "==", "employee")));
        const emps: Employee[] = [];
        snap.forEach((d) => {
          const data = d.data();
          emps.push({
            uid: d.id,
            fullName: data.fullName || data.displayName || "Unknown Employee",
            email: data.email || "",
          });
        });
        if (emps.length > 0) {
          setEmployeeList(emps);
        }
      } catch (err) {
        console.error("Failed to load employees for dropdown", err);
      }
    }

    async function loadMeetings() {
      try {
        const snap = await getDocs(collection(db, "meetings"));
        const list: Meeting[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            topic: data.topic || "",
            link: data.link || "",
            date: data.date || "",
            time: data.time || "",
            duration: data.duration || 60,
            status: data.status || "upcoming",
            participants: data.participants || [],
          });
        });
        if (list.length > 0) {
          list.sort((a, b) => b.id.localeCompare(a.id));
          setMeetings(list);
        }
      } catch (err) {
        console.error("Failed to load meetings from Firestore", err);
      }
    }

    loadEmployees();
    loadMeetings();
  }, []);

  const filteredMeetings = meetings.filter((meeting) =>
    meeting.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmployees = employeeList.filter((emp) =>
    emp.fullName.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.email.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const handleToggleParticipant = (emp: Employee) => {
    if (selectedParticipants.some((p) => p.uid === emp.uid)) {
      setSelectedParticipants(selectedParticipants.filter((p) => p.uid !== emp.uid));
    } else {
      setSelectedParticipants([...selectedParticipants, emp]);
    }
  };

  const getStatusBadge = (status: Meeting["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Active
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500">
            <Clock className="w-3 h-3" />
            Upcoming
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-500/10 text-zinc-400 line-through">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-500/10 text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Draft
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600">
            <CheckCircle className="w-3 h-3" />
            Sent
          </span>
        );
    }
  };

  const parseDateTime = (dtStr: string) => {
    if (!dtStr) return { date: "", time: "" };
    const dateObj = new Date(dtStr);
    const date = dtStr.split("T")[0];
    const time = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return { date, time };
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !link || !datetime) return;

    const { date, time } = parseDateTime(datetime);
    
    // Save to Firestore first
    try {
      await addDoc(collection(db, "meetings"), {
        topic,
        link,
        date,
        time,
        duration,
        status: formStatus,
        participants: selectedParticipants.map(p => ({
          uid: p.uid,
          fullName: p.fullName,
          email: p.email
        })),
        createdAt: Date.now()
      });

      // Send email invitations if status is "sent"
      if (formStatus === "sent" && selectedParticipants.length > 0) {
        const adminName = userData?.fullName || currentUser?.displayName || "Admin";
        const results = await Promise.allSettled(
          selectedParticipants.map(p =>
            sendMeetingInvitation(p, { topic, date, time, link }, adminName)
          )
        );
        for (const result of results) {
          if (result.status === "rejected") {
            console.error("Meeting email failed:", result.reason);
          }
        }
      }

      // Reload meetings from firestore to keep state in sync
      const snap = await getDocs(collection(db, "meetings"));
      const list: Meeting[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          topic: data.topic || "",
          link: data.link || "",
          date: data.date || "",
          time: data.time || "",
          duration: data.duration || 60,
          status: data.status || "upcoming",
          participants: data.participants || [],
        });
      });
      if (list.length > 0) {
        list.sort((a, b) => b.id.localeCompare(a.id));
        setMeetings(list);
      }
    } catch (err) {
      console.error("Error saving meeting to Firestore:", err);
      // Fallback
      const newMeeting: Meeting = {
        id: Date.now().toString(),
        topic,
        link,
        date,
        time,
        duration,
        status: formStatus,
        participants: selectedParticipants,
      };
      setMeetings([newMeeting, ...meetings]);
    }
    
    // Clear form states
    setTopic("");
    setLink("");
    setDatetime("");
    setDuration(60);
    setSelectedParticipants([]);
    setFormStatus("sent");
    
    setView("list");
  };

  return (
    <div className="space-y-6 pb-12 pt-6 sm:pt-8">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-black tracking-tight">
                  Meeting
                </h1>
                <p className="text-xs text-zinc-500 mt-1">
                  Schedule, join, and track organizational video conferences.
                </p>
              </div>
            </div>

            {/* Search Bar & Create Meeting Button Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search meetings by topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/10 text-sm text-zinc-800 bg-white transition-all duration-200 placeholder:text-zinc-400"
                />
              </div>
              <button
                onClick={() => setView("create")}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold hover:brightness-110 shadow-md hover:shadow-lg transition-all cursor-pointer min-h-[44px] shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Meeting</span>
              </button>
            </div>

            {/* Table Container */}
            <div className="hrms-glass rounded-[20px] overflow-hidden border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-light)]/60 bg-zinc-50/50">
                      <th className="px-6 py-4.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Meeting Topic
                      </th>
                      <th className="px-6 py-4.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Meeting Links
                      </th>
                      <th className="px-6 py-4.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredMeetings.length > 0 ? (
                      filteredMeetings.map((meeting) => (
                        <tr key={meeting.id} className="hover:bg-zinc-50/40 transition-colors duration-150">
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                <Video className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-zinc-800 block truncate max-w-[240px]">
                                  {meeting.topic}
                                </span>
                                {meeting.participants && meeting.participants.length > 0 && (
                                  <span className="text-[10px] text-zinc-400 font-semibold mt-0.5 block">
                                    {meeting.participants.length} participant{meeting.participants.length > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4.5">
                            <a
                              href={meeting.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors"
                            >
                              Join Meeting
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="px-6 py-4.5">
                            <div className="text-sm font-medium text-zinc-600">
                              {meeting.date}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                              {meeting.time}
                            </div>
                          </td>
                          <td className="px-6 py-4.5">
                            {getStatusBadge(meeting.status)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 text-sm font-medium">
                          No meetings match your search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="create-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Back to List Arrow */}
            <div>
              <button 
                onClick={() => setView("list")}
                className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Meetings
              </button>
            </div>

            {/* Header */}
            <div>
              <h1 className="text-2xl font-black text-black tracking-tight">
                Create Meeting
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Configure a new meeting session and add participants.
              </p>
            </div>

            {/* Creation Form */}
            <form onSubmit={handleCreateMeeting} className="hrms-glass rounded-[24px] p-6 sm:p-8 border border-[var(--border-light)] bg-white/55 backdrop-blur-md shadow-sm space-y-6 max-w-2xl">
              
              {/* Meeting Topic */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Meeting Topic
                </label>
                <input
                  type="text"
                  placeholder="Enter meeting topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  className="w-full h-11 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/10 text-sm text-zinc-800 bg-white/60 focus:bg-white transition-all duration-200"
                />
              </div>

              {/* Meeting Link */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Meeting Link
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  required
                  className="w-full h-11 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/10 text-sm text-zinc-800 bg-white/60 focus:bg-white transition-all duration-200"
                />
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Date
                </label>
                <input
                  type="datetime-local"
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  required
                  className="w-full h-11 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/10 text-sm text-zinc-800 bg-white/60 focus:bg-white transition-all duration-200"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/10 text-sm text-zinc-800 bg-white/60 focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1 hour 30 minutes</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                </select>
              </div>

              {/* Select Participants */}
              <div ref={dropdownRef} className="space-y-2 relative">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Select Participants/employee
                </label>
                
                {/* Selected Participant Chips */}
                {selectedParticipants.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 mb-2">
                    {selectedParticipants.map((p) => (
                      <span key={p.uid} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                        {p.fullName}
                        <button
                          type="button"
                          onClick={() => setSelectedParticipants(selectedParticipants.filter((sp) => sp.uid !== p.uid))}
                          className="w-3.5 h-3.5 ml-1 rounded-full hover:bg-purple-200 flex items-center justify-center text-[10px]"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Dropdown Selector trigger */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full h-11 px-4 rounded-xl border border-zinc-200 flex items-center justify-between text-sm text-zinc-800 bg-white/60 hover:bg-white transition-all duration-200"
                >
                  <span className="text-zinc-500">
                    {selectedParticipants.length > 0 
                      ? `${selectedParticipants.length} employee(s) selected` 
                      : "Choose employees to invite..."
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Panel */}
                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-xl z-20 max-h-56 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-zinc-100 flex items-center gap-2">
                      <Search className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
                      <input
                        type="text"
                        placeholder="Search employees..."
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        className="w-full h-8 text-xs bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 divide-y divide-zinc-50">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => {
                          const isSelected = selectedParticipants.some((p) => p.uid === emp.uid);
                          return (
                            <button
                              key={emp.uid}
                              type="button"
                              onClick={() => handleToggleParticipant(emp)}
                              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-50 text-left text-xs font-semibold"
                            >
                              <div>
                                <p className="text-zinc-800">{emp.fullName}</p>
                                <p className="text-[10px] text-zinc-400 font-medium">{emp.email}</p>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-purple-600" />}
                            </button>
                          );
                        })
                      ) : (
                        <p className="p-4 text-center text-xs text-zinc-400">No employees found.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status (draft or sent) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Status
                </label>
                <div className="flex items-center gap-6">
                  {/* Draft radio option */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={formStatus === "draft"}
                      onChange={() => setFormStatus("draft")}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formStatus === "draft" ? "border-purple-600 ring-2 ring-purple-500/10" : "border-zinc-300"}`}>
                      {formStatus === "draft" && <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                    </div>
                    <span className="text-sm font-semibold text-zinc-700">Draft</span>
                  </label>
                  
                  {/* Sent radio option */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="status"
                      value="sent"
                      checked={formStatus === "sent"}
                      onChange={() => setFormStatus("sent")}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formStatus === "sent" ? "border-purple-600 ring-2 ring-purple-500/10" : "border-zinc-300"}`}>
                      {formStatus === "sent" && <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                    </div>
                    <span className="text-sm font-semibold text-zinc-700">Sent</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:brightness-110 shadow-md hover:shadow-lg transition-all"
                >
                  Save Meeting
                </button>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

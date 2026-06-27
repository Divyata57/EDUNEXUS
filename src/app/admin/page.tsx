"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/providers/theme-provider";
import {
  LogOut,
  Sun,
  Moon,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Megaphone,
  Vault,
  CheckCircle,
  XCircle,
  PlusCircle,
  Trash2,
  Users,
  Info,
  Clock,
  BookOpen,
  MapPin,
  ExternalLink,
  ChevronRight,
  FileCheck,
  Menu,
  X
} from "lucide-react";
import {
  STORAGE_KEYS,
  StudentRecord,
  TimetableRecord,
  AssignmentRecord,
  NoticeRecord,
  NoteRecord,
  defaultStudents,
  defaultTimetable,
  defaultAssignments,
  defaultNotices,
  defaultNotes
} from "@/lib/edunexus-demo-data";

type AdminTab = "attendance" | "timetable" | "assignment" | "notice" | "vault";

export default function FacultyDesk() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("attendance");

  // Selection inputs
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedCourse, setSelectedCourse] = useState("B.Tech Robotics & AI");
  const [subject, setSubject] = useState("");

  // Roster lists
  const [roster, setRoster] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);

  // Action status toasts
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 1. Timetable Form States
  const [newDay, setNewDay] = useState<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday">("Monday");
  const [newTime, setNewTime] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [newFaculty, setNewFaculty] = useState("Prof. Faculty");
  const [timetableEntries, setTimetableEntries] = useState<TimetableRecord[]>([]);

  // 2. Assignment Form States
  const [newAssignTitle, setNewAssignTitle] = useState("");
  const [newAssignDueDate, setNewAssignDueDate] = useState("");
  const [newAssignDetails, setNewAssignDetails] = useState("");
  const [assignmentsList, setAssignmentsList] = useState<AssignmentRecord[]>([]);
  const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState<string | null>(null);

  // 3. Notice Form States
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeBody, setNewNoticeBody] = useState("");
  const [noticesList, setNoticesList] = useState<NoticeRecord[]>([]);

  // 4. Notes/Vault Form States
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteLink, setNewNoteLink] = useState("");
  const [notesList, setNotesList] = useState<NoteRecord[]>([]);

  // Read storage utility
  const readStore = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };

  // Write storage utility
  const writeStore = (key: string, value: unknown) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  // Initial load
  useEffect(() => {
    setMounted(true);
    // Seed roster if not present
    const storedRoster = readStore<StudentRecord[]>(STORAGE_KEYS.roster, defaultStudents);
    setRoster(storedRoster);
  }, []);

  // Filter roster and load initial listings based on section and active tab
  const syncAdminData = React.useCallback(() => {
    if (!mounted) return;

    // Filter students by course and section
    const currentRoster = readStore<StudentRecord[]>(STORAGE_KEYS.roster, defaultStudents);
    const filtered = currentRoster.filter(
      (s) =>
        s.section?.toUpperCase() === selectedSection.toUpperCase() &&
        s.course?.toLowerCase() === selectedCourse.toLowerCase()
    );
    setFilteredStudents(filtered);

    // Sync elements
    setTimetableEntries(readStore<TimetableRecord[]>(STORAGE_KEYS.timetable, defaultTimetable));
    setAssignmentsList(readStore<AssignmentRecord[]>(STORAGE_KEYS.assignments, defaultAssignments));
    setNoticesList(readStore<NoticeRecord[]>(STORAGE_KEYS.notices, defaultNotices));
    setNotesList(readStore<NoteRecord[]>(STORAGE_KEYS.notes, defaultNotes));
  }, [selectedSection, selectedCourse, mounted]);

  useEffect(() => {
    syncAdminData();
  }, [selectedSection, selectedCourse, activeTab, syncAdminData]);

  // Periodic polling for Admin Console syncing
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      syncAdminData();
    }, 3000);

    return () => clearInterval(interval);
  }, [syncAdminData, mounted]);

  const showToast = (message: string, isError = false) => {
    if (isError) {
      setStatusError(message);
      setTimeout(() => setStatusError(""), 3000);
    } else {
      setStatusMessage(message);
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  // Attendance Logger Logic
  const markAttendance = (student: StudentRecord, status: "P" | "A") => {
    if (!subject.trim()) {
      showToast("Please enter an Active Subject Module name first!", true);
      return;
    }

    const attendanceKey = `attendance_${student.rollNo}`;
    const previousAttendanceRaw = localStorage.getItem(attendanceKey);

    let attendanceData: any = {
      summary: { attended: 0, total: 0, percentage: "0.0%" },
      subjects: []
    };

    if (previousAttendanceRaw) {
      try {
        const parsed = JSON.parse(previousAttendanceRaw);
        if (parsed.summary && parsed.subjects) {
          attendanceData = parsed;
        } else if (parsed.subject) {
          // Backward compatibility conversion
          attendanceData = {
            summary: {
              attended: parsed.attended || 0,
              total: parsed.total || 0,
              percentage: parsed.percentage || "0.0%"
            },
            subjects: [
              {
                subject: parsed.subject,
                attended: parsed.attended || 0,
                total: parsed.total || 0,
                percentage: parsed.percentage || "0.0%",
                lastMarkedStatus: parsed.lastMarkedStatus || "P"
              }
            ]
          };
        }
      } catch {
        // Fallback initialized
      }
    }

    // Check if subject exists in subjects list
    const subjects: any[] = attendanceData.subjects || [];
    const subIndex = subjects.findIndex(
      (s) => s.subject.toLowerCase() === subject.trim().toLowerCase()
    );

    let subAttended = 0;
    let subTotal = 0;

    if (subIndex > -1) {
      subAttended = subjects[subIndex].attended;
      subTotal = subjects[subIndex].total;
    }

    if (status === "P") {
      subAttended += 1;
    }
    subTotal += 1;

    const subPercentage = ((subAttended / subTotal) * 100).toFixed(1) + "%";

    const updatedSubjectRecord = {
      subject: subject.trim(),
      attended: subAttended,
      total: subTotal,
      percentage: subPercentage,
      lastMarkedStatus: status
    };

    if (subIndex > -1) {
      subjects[subIndex] = updatedSubjectRecord;
    } else {
      subjects.push(updatedSubjectRecord);
    }

    // Recalculate summary metrics
    const overallAttended = subjects.reduce((sum, item) => sum + item.attended, 0);
    const overallTotal = subjects.reduce((sum, item) => sum + item.total, 0);
    const overallPercentage = ((overallAttended / overallTotal) * 100).toFixed(1) + "%";

    const payload = {
      summary: {
        attended: overallAttended,
        total: overallTotal,
        percentage: overallPercentage
      },
      subjects: subjects,
      notificationTrigger: {
        message: `Attendance update: Marked ${status === "P" ? "PRESENT (P)" : "ABSENT (A)"} in "${subject.trim()}".`,
        timestamp: Date.now()
      }
    };

    localStorage.setItem(attendanceKey, JSON.stringify(payload));
    showToast(`Marked ${status === "P" ? "Present" : "Absent"} for ${student.name}!`);
  };

  // Timetable Add & Remove
  const handleAddTimetable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !newTime.trim() || !newRoom.trim()) {
      showToast("Please fill in the Subject, Time slot, and Room values.", true);
      return;
    }

    const newEntry: TimetableRecord = {
      id: `tt-${Date.now()}`,
      day: newDay,
      time: newTime.trim(),
      subject: subject.trim(),
      room: newRoom.trim(),
      faculty: newFaculty.trim(),
      course: selectedCourse,
      section: selectedSection
    };

    const nextTimetable = [...timetableEntries, newEntry];
    setTimetableEntries(nextTimetable);
    writeStore(STORAGE_KEYS.timetable, nextTimetable);
    setNewTime("");
    setNewRoom("");
    showToast("Timetable class slot scheduled!");
  };

  const handleDeleteTimetable = (id: string) => {
    const nextTimetable = timetableEntries.filter((item) => item.id !== id);
    setTimetableEntries(nextTimetable);
    writeStore(STORAGE_KEYS.timetable, nextTimetable);
    showToast("Class slot cancelled and removed.");
  };

  // Assignment Add & Remove
  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignTitle.trim() || !newAssignDueDate.trim() || !newAssignDetails.trim() || !subject.trim()) {
      showToast("Please verify Subject, Assignment Title, Due Date and description.", true);
      return;
    }

    const newAssign: AssignmentRecord = {
      id: `task-${Date.now()}`,
      title: newAssignTitle.trim(),
      subject: subject.trim(),
      dueDate: newAssignDueDate,
      details: newAssignDetails.trim(),
      course: selectedCourse,
      section: selectedSection,
      createdAt: new Date().toISOString()
    };

    const nextAssigns = [...assignmentsList, newAssign];
    setAssignmentsList(nextAssigns);
    writeStore(STORAGE_KEYS.assignments, nextAssigns);
    setNewAssignTitle("");
    setNewAssignDueDate("");
    setNewAssignDetails("");
    showToast("Assignment issued and broadcasted to students!");
  };

  const handleDeleteAssignment = (id: string) => {
    const nextAssigns = assignmentsList.filter((item) => item.id !== id);
    setAssignmentsList(nextAssigns);
    writeStore(STORAGE_KEYS.assignments, nextAssigns);
    showToast("Assignment deleted.");
    if (viewingSubmissionsFor === id) setViewingSubmissionsFor(null);
  };

  // Notice Add & Remove
  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeBody.trim()) {
      showToast("Please supply a notice title and announcement content.", true);
      return;
    }

    const newNotice: NoticeRecord = {
      id: `notice-${Date.now()}`,
      title: newNoticeTitle.trim(),
      body: newNoticeBody.trim(),
      course: selectedCourse,
      section: selectedSection,
      createdAt: new Date().toISOString()
    };

    const nextNotices = [...noticesList, newNotice];
    setNoticesList(nextNotices);
    writeStore(STORAGE_KEYS.notices, nextNotices);
    setNewNoticeTitle("");
    setNewNoticeBody("");
    showToast("Announcement broadcasted live to Student Notice Board!");
  };

  const handleDeleteNotice = (id: string) => {
    const nextNotices = noticesList.filter((item) => item.id !== id);
    setNoticesList(nextNotices);
    writeStore(STORAGE_KEYS.notices, nextNotices);
    showToast("Announcement notice deleted.");
  };

  // Notes Add & Remove
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteLink.trim() || !subject.trim()) {
      showToast("Please supply the Subject, Resource Title and Reference URL.", true);
      return;
    }

    const newNote: NoteRecord = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      subject: subject.trim(),
      link: newNoteLink.trim(),
      course: selectedCourse,
      section: selectedSection,
      createdAt: new Date().toISOString()
    };

    const nextNotes = [...notesList, newNote];
    setNotesList(nextNotes);
    writeStore(STORAGE_KEYS.notes, nextNotes);
    setNewNoteTitle("");
    setNewNoteLink("");
    showToast("Study material reference uploaded!");
  };

  const handleDeleteNote = (id: string) => {
    const nextNotes = notesList.filter((item) => item.id !== id);
    setNotesList(nextNotes);
    writeStore(STORAGE_KEYS.notes, nextNotes);
    showToast("Study material resource removed.");
  };

  // Submission view helper
  const getSubmissionsForAssignment = (assignId: string) => {
    // Read submissions for all students in this section
    const results: Array<{ name: string; rollNo: string; submitted: boolean; fileName?: string; date?: string; text?: string }> = [];
    
    filteredStudents.forEach((student) => {
      const studentSubmissions = readStore<Record<string, any>>(`edunexus_submissions_${student.rollNo}`, {});
      const sub = studentSubmissions[assignId];
      
      results.push({
        name: student.name,
        rollNo: student.rollNo,
        submitted: !!sub?.submitted,
        fileName: sub?.fileName,
        date: sub?.date,
        text: sub?.text
      });
    });

    return results;
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex transition-colors duration-300 bg-slate-50 text-slate-800 dark:bg-[#05060f] dark:text-slate-350 select-none">
      
      {/* Toast popup */}
      {(statusMessage || statusError) && (
        <div className="fixed bottom-6 right-6 z-[9999] p-4 rounded-xl border shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce bg-white dark:bg-[#0d1121] text-slate-800 dark:text-white border-purple-500">
          <Info size={16} className={statusError ? "text-rose-500" : "text-emerald-500"} />
          <span>{statusMessage || statusError}</span>
        </div>
      )}

      {/* Mobile Sidebar Backplate Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity" 
        />
      )}

      {/* SIDEBAR NAVIGATION CONTROLS */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#0a0d1a] z-50 p-6 flex flex-col justify-between shrink-0 text-left border-r border-slate-200 dark:border-purple-950/30 transform transition-transform duration-300 md:translate-x-0 md:static md:flex ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="space-y-8">
          <div className="flex justify-between items-center md:block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                EX
              </div>
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">EduNexus Desk</span>
            </div>

            {/* Mobile close button */}
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1.5" onClick={() => setSidebarOpen(false)}>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "attendance"
                  ? "bg-purple-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
                  : "text-slate-500 dark:text-purple-300/40 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12162a]"
              }`}
            >
              <LayoutDashboard size={18} /> Log Attendance
            </button>
            <button
              onClick={() => setActiveTab("timetable")}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "timetable"
                  ? "bg-purple-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
                  : "text-slate-500 dark:text-purple-300/40 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12162a]"
              }`}
            >
              <Calendar size={18} /> Update Timetable
            </button>
            <button
              onClick={() => setActiveTab("assignment")}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "assignment"
                  ? "bg-purple-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
                  : "text-slate-500 dark:text-purple-300/40 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12162a]"
              }`}
            >
              <ClipboardList size={18} /> Issue Tasks
            </button>
            <button
              onClick={() => setActiveTab("notice")}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "notice"
                  ? "bg-purple-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
                  : "text-slate-500 dark:text-purple-300/40 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12162a]"
              }`}
            >
              <Megaphone size={18} /> Post Notice
            </button>
            <button
              onClick={() => setActiveTab("vault")}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "vault"
                  ? "bg-purple-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
                  : "text-slate-500 dark:text-purple-300/40 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12162a]"
              }`}
            >
              <Vault size={18} /> Share Notes
            </button>
          </nav>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push("/")}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-slate-700 dark:text-purple-300/40 dark:hover:text-white font-black text-xs uppercase tracking-widest transition-colors text-left cursor-pointer"
          >
            <LogOut size={18} /> Exit Console
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER PANEL */}
        <header className="p-8 flex justify-between items-center border-b border-slate-200 dark:border-purple-950/20 bg-white/40 dark:bg-[#0a0d1a]/20 backdrop-blur-md">
          <div className="flex items-center">
            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-3 rounded-xl bg-white border border-slate-200 dark:bg-[#0d1121] dark:border-purple-950/50 text-purple-600 dark:text-purple-400 mr-4 active:scale-95 cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <div className="text-left space-y-1">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Hello, Faculty Desk 👋
              </h2>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[#a855f7]">
                Section Log Control Console
              </p>
            </div>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-3 rounded-xl bg-white border border-slate-200 dark:bg-[#121624] dark:border-purple-950/50 text-purple-600 dark:text-purple-400 cursor-pointer hover:bg-slate-100"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 p-8 overflow-y-auto space-y-6">
          
          {/* Target Filter Selectors & Common State Fields */}
          <div className="w-full bg-white border border-slate-200 dark:bg-[#0a0d1a]/50 dark:border-purple-950/40 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-purple-600 dark:text-purple-400">
                1. Subject Module
              </label>
              <input
                type="text"
                placeholder="e.g. Python Programming"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-purple-500 dark:bg-[#05060f] dark:border-purple-950 dark:text-white font-medium"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-purple-600 dark:text-purple-400">
                2. Target Section Group
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none dark:bg-[#05060f] dark:border-purple-950 dark:text-white"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
                <option value="E">Section E</option>
                <option value="F">Section F</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-purple-600 dark:text-purple-400">
                3. Course Program
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none dark:bg-[#05060f] dark:border-purple-950 dark:text-white"
              >
                <option value="B.Tech Robotics & AI">B.Tech Robotics & AI</option>
                <option value="BTECH RAI">BTECH RAI</option>
              </select>
            </div>
          </div>

          {/* TAB CONTENT GRID */}
          
          {/* TAB 1: LOG ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="w-full bg-white border border-slate-200 dark:bg-[#0a0d1a]/50 dark:border-purple-500/10 rounded-[32px] p-6 shadow-xl text-left">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-slate-900 dark:text-white font-black text-lg uppercase tracking-tight">
                    Roster attendance logs: Section {selectedSection}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">
                    Select a student below to update their attendance logs in real time
                  </p>
                </div>
              </div>

              {filteredStudents.length > 0 ? (
                <div className="space-y-3">
                  {filteredStudents.map((student, i) => {
                    const studentAttendanceKey = `attendance_${student.rollNo}`;
                    const rawAtt = localStorage.getItem(studentAttendanceKey);
                    let percentage = "N/A";
                    if (rawAtt) {
                      try {
                        const parsed = JSON.parse(rawAtt);
                        if (parsed.summary) percentage = parsed.summary.percentage;
                        else if (parsed.percentage) percentage = parsed.percentage;
                      } catch {
                        // ignore
                      }
                    }

                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/70 dark:bg-[#05060f]/80 border border-slate-200 dark:border-purple-950 rounded-2xl transition-all"
                      >
                        <div className="text-left">
                          <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase">
                            {student.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-mono mt-1">
                            Roll No: {student.rollNo} | Course: {student.course}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          {/* Display overall attendance percent */}
                          <div className="text-right">
                            <div className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Overall Percent</div>
                            <div className="text-sm font-black font-mono text-purple-600 dark:text-purple-400 mt-0.5">
                              {percentage}
                            </div>
                          </div>

                          {/* P & A buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => markAttendance(student, "P")}
                              className="w-11 h-11 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white font-black rounded-xl transition-all flex items-center justify-center cursor-pointer text-xs"
                              title="Mark Present"
                            >
                              P
                            </button>
                            <button
                              type="button"
                              onClick={() => markAttendance(student, "A")}
                              className="w-11 h-11 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white font-black rounded-xl transition-all flex items-center justify-center cursor-pointer text-xs"
                              title="Mark Absent"
                            >
                              A
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 font-bold uppercase text-xs tracking-widest border border-dashed border-slate-200 dark:border-purple-950/20 rounded-2xl">
                  No registered student profiles found inside Section {selectedSection}.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPDATE TIMETABLE */}
          {activeTab === "timetable" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* Form Input panel */}
              <div className="lg:col-span-1 p-6 bg-white border border-slate-200 dark:bg-[#0a0d1a]/50 dark:border-purple-500/10 rounded-[24px] space-y-4">
                <h3 className="text-slate-900 dark:text-white font-black text-base uppercase tracking-tight flex items-center gap-1.5">
                  <PlusCircle size={16} className="text-[#a855f7]" /> Add Timetable Slot
                </h3>
                
                <form onSubmit={handleAddTimetable} className="space-y-3.5 text-xs font-bold text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-purple-600 dark:text-purple-400">Target Day</span>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-[#05060f] dark:border-purple-950 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                    >
                      <option>Monday</option>
                      <option>Tuesday</option>
                      <option>Wednesday</option>
                      <option>Thursday</option>
                      <option>Friday</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-purple-600 dark:text-purple-400">Class Hours / Time Slot</span>
                    <input
                      type="text"
                      placeholder="e.g. 09:00 - 10:00"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-[#05060f] dark:border-purple-950 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-purple-600 dark:text-purple-400">Room / Lab Location</span>
                    <input
                      type="text"
                      placeholder="e.g. Room 112 or Lab 204"
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-[#05060f] dark:border-purple-950 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-purple-600 dark:text-purple-400">Assigned Faculty Name</span>
                    <input
                      type="text"
                      placeholder="Faculty Name"
                      value={newFaculty}
                      onChange={(e) => setNewFaculty(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-[#05060f] dark:border-purple-950 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Schedule Class Slot
                  </button>
                </form>
              </div>

              {/* Existing schedule entries list */}
              <div className="lg:col-span-2 p-6 bg-white border border-slate-200 dark:bg-[#0a0d1a]/50 dark:border-purple-500/10 rounded-[24px] space-y-4">
                <h3 className="text-slate-900 dark:text-white font-black text-base uppercase tracking-tight">
                  Timetable Registry List: Section {selectedSection}
                </h3>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {timetableEntries.filter(
                    (t) =>
                      t.section.toUpperCase() === selectedSection.toUpperCase() &&
                      t.course.toLowerCase() === selectedCourse.toLowerCase()
                  ).length > 0 ? (
                    timetableEntries
                      .filter(
                        (t) =>
                          t.section.toUpperCase() === selectedSection.toUpperCase() &&
                          t.course.toLowerCase() === selectedCourse.toLowerCase()
                      )
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="p-4 bg-slate-50 dark:bg-[#05060f]/80 border border-slate-200 dark:border-purple-950 rounded-xl flex items-center justify-between gap-4"
                        >
                          <div className="text-left space-y-1">
                            <span className="text-[9px] px-2 py-0.5 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-full font-black uppercase">
                              {entry.day}
                            </span>
                            <h4 className="font-bold text-slate-800 dark:text-white text-xs mt-1 uppercase">
                              {entry.subject}
                            </h4>
                            <div className="text-[9px] text-slate-400 flex items-center gap-4">
                              <span className="flex items-center gap-1"><Clock size={10} /> {entry.time}</span>
                              <span className="flex items-center gap-1"><MapPin size={10} /> {entry.room}</span>
                            </div>
                            <div className="text-[9px] text-[#a855f7] font-bold italic">
                              {entry.faculty}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteTimetable(entry.id)}
                            className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl cursor-pointer transition-colors"
                            title="Delete Schedule"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12 text-slate-500 font-bold uppercase text-[10px] tracking-wider border border-dashed border-slate-200 dark:border-purple-950/20 rounded-xl">
                      No scheduled sessions for this section group.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ISSUE TASKS (ASSIGNMENTS) */}
          {activeTab === "assignment" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* Form Input panel */}
              <div className="lg:col-span-1 p-6 bg-white border border-slate-200 dark:bg-[#0a0d1a]/50 dark:border-purple-500/10 rounded-[24px] space-y-4">
                <h3 className="text-slate-900 dark:text-white font-black text-base uppercase tracking-tight flex items-center gap-1.5">
                  <PlusCircle size={16} className="text-[#a855f7]" /> Issue Assignment Task
                </h3>
                
                <form onSubmit={handleAddAssignment} className="space-y-3.5 text-xs font-bold text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-purple-600 dark:text-purple-400">Assignment Title</span>
                    <input
                      type="text"
                      placeholder="e.g. Kinematic Arm Model"
                      value={newAssignTitle}
                      onChange={(e) => setNewAssignTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-[#05060f] dark:border-purple-950 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-purple-600 dark:text-purple-400">Submission Due Date</span>
                    <input
                      type="date"
                      value={newAssignDueDate}
                      onChange={(e) => setNewAssignDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-[#05060f] dark:border-purple-950 rounded-xl text-slate-850 dark:text-white focus:outline-none font-sans font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-purple-600 dark:text-purple-400">Task Descriptions & Rules</span>
                    <textarea
                      placeholder="Enter detailed instruction specifications..."
                      rows={4}
                      value={newAssignDetails}
                      onChange={(e) => setNewAssignDetails(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-[#05060f] dark:border-purple-950 rounded-xl text-slate-800 dark:text-white focus:outline-none font-sans font-medium"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Issue Task Broadcast
                  </button>
                </form>
              </div>

              {/* Assignment registry listings and submission tracking */}
              <div className="lg:col-span-2 p-6 bg-white border border-slate-200 dark:bg-[#0a0d1a]/50 dark:border-purple-500/10 rounded-[24px] space-y-6">
                
                {/* 1. Assignment registry */}
                <div className="space-y-4">
                  <h3 className="text-slate-900 dark:text-white font-black text-base uppercase tracking-tight">
                    Issued Tasks registry: Section {selectedSection}
                  </h3>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {assignmentsList.filter(
                      (a) =>
                        a.section?.toUpperCase() === selectedSection.toUpperCase() &&
                        a.course?.toLowerCase() === selectedCourse.toLowerCase()
                    ).length > 0 ? (
                      assignmentsList
                        .filter(
                          (a) =>
                            a.section?.toUpperCase() === selectedSection.toUpperCase() &&
                            a.course?.toLowerCase() === selectedCourse.toLowerCase()
                        )
                        .map((assign) => (
                          <div
                            key={assign.id}
                            className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                              viewingSubmissionsFor === assign.id
                                ? "bg-purple-600/5 border-purple-500/40"
                                : "bg-slate-50 dark:bg-[#05060f]/80 border-slate-200 dark:border-purple-950"
                            }`}
                            onClick={() => setViewingSubmissionsFor(assign.id)}
                          >
                            <div className="text-left space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-full font-black uppercase">
                                  {assign.subject}
                                </span>
                                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">
                                  Due: {assign.dueDate}
                                </span>
                              </div>
                              <h4 className="font-black text-slate-800 dark:text-white text-xs truncate uppercase mt-1">
                                {assign.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate font-medium">
                                {assign.details}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setViewingSubmissionsFor(assign.id)}
                                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                title="Check Submissions"
                              >
                                <ChevronRight size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(assign.id)}
                                className="p-2 bg-rose-500/10 hover:bg-rose-505 text-rose-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-12 text-slate-500 font-bold uppercase text-[10px] tracking-wider border border-dashed border-slate-200 dark:border-purple-950/20 rounded-xl">
                        No issued tasks recorded for this group.
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Submissions tracker detail panel */}
                {viewingSubmissionsFor && (
                  <div className="pt-4 border-t border-slate-200 dark:border-purple-950/30 text-left space-y-3.5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-1.5">
                        <FileCheck size={14} className="text-purple-600 dark:text-[#a855f7]" /> Solutions Submissions Stream
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-[#05060f] px-2 py-0.5 rounded">
                        Task ID: {viewingSubmissionsFor}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto">
                      {getSubmissionsForAssignment(viewingSubmissionsFor).map((sub, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 dark:bg-[#05060f] border border-slate-100 dark:border-purple-950/40 rounded-xl space-y-1.5 text-left"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-800 dark:text-white uppercase truncate">
                              {sub.name}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-md ${
                              sub.submitted
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-500"
                            }`}>
                              {sub.submitted ? "Submitted" : "Pending"}
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            Roll No: {sub.rollNo}
                          </div>
                          
                          {sub.submitted && (
                            <div className="pt-1.5 border-t border-slate-100 dark:border-purple-950/10 space-y-1">
                              <div className="text-[10px] text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 truncate">
                                <ExternalLink size={10} className="text-[#a855f7]" /> {sub.fileName}
                              </div>
                              {sub.text && (
                                <p className="text-[9px] italic text-slate-400 truncate">
                                  "{sub.text}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>

            </div>
          )}

          {/* TAB 4: POST NOTICE */}
          {activeTab === "notice" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* Form Input panel */}
              <div className="lg:col-span-1 p-6 bg-white border border-slate-200 dark:bg-[#0a0d1a]/50 dark:border-purple-500/10 rounded-[24px] space-y-4">
                <h3 className="text-slate-900 dark:text-white font-black text-base uppercase tracking-tight flex items-center gap-1.5">
                  <PlusCircle size={16} className="text-[#a855f7]" /> Post Notice Announcement
                </h3>
                
                <form onSubmit={handleAddNotice} className="space-y-3.5 text-xs font-bold text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-purple-600 dark:text-purple-400">Notice Title / Advisory</span>
                    <input
                      type="text"
                      placeholder="e.g. Lab Orientation Released"
                      value={newNoticeTitle}
                      onChange={(e) => setNewNoticeTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-[#05060f] dark:border-purple-950 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-purple-600 dark:text-purple-400">Announcement body stream</span>
                    <textarea
                      placeholder="Type details that will display on student notice board..."
                      rows={5}
                      value={newNoticeBody}
                      onChange={(e) => setNewNoticeBody(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-[#05060f] dark:border-purple-950 rounded-xl text-slate-800 dark:text-white focus:outline-none font-sans font-medium"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Broadcast Announcement notice
                  </button>
                </form>
              </div>

              {/* Notice registry list */}
              <div className="lg:col-span-2 p-6 bg-white border border-slate-200 dark:bg-[#0a0d1a]/50 dark:border-purple-500/10 rounded-[24px] space-y-4">
                <h3 className="text-slate-900 dark:text-white font-black text-base uppercase tracking-tight">
                  Broadcast logs history: Section {selectedSection}
                </h3>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {noticesList.filter(
                    (n) =>
                      n.section?.toUpperCase() === selectedSection.toUpperCase() &&
                      n.course?.toLowerCase() === selectedCourse.toLowerCase()
                  ).length > 0 ? (
                    noticesList
                      .filter(
                        (n) =>
                          n.section?.toUpperCase() === selectedSection.toUpperCase() &&
                          n.course?.toLowerCase() === selectedCourse.toLowerCase()
                      )
                      .map((notice) => (
                        <div
                          key={notice.id}
                          className="p-4 bg-slate-50 dark:bg-[#05060f]/80 border border-slate-200 dark:border-purple-950 rounded-xl flex items-start justify-between gap-4 text-left"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <span className="text-[9px] px-2 py-0.5 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-full font-black uppercase">
                              Notice Board Stream
                            </span>
                            <h4 className="font-black text-slate-800 dark:text-white text-xs mt-1 uppercase truncate">
                              {notice.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                              {notice.body}
                            </p>
                            <div className="text-[9px] text-slate-400 font-mono pt-1">
                              Posted: {new Date(notice.createdAt).toLocaleString()}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteNotice(notice.id)}
                            className="p-2.5 bg-rose-500/10 hover:bg-rose-505 text-rose-500 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
                            title="Delete Notice"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12 text-slate-500 font-bold uppercase text-[10px] tracking-wider border border-dashed border-slate-200 dark:border-purple-950/20 rounded-xl">
                      No broadcast entries recorded for this section.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: SHARE NOTES (VAULT) */}
          {activeTab === "vault" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* Form Input panel */}
              <div className="lg:col-span-1 p-6 bg-white border border-slate-200 dark:bg-[#0a0d1a]/50 dark:border-purple-500/10 rounded-[24px] space-y-4">
                <h3 className="text-slate-900 dark:text-white font-black text-base uppercase tracking-tight flex items-center gap-1.5">
                  <PlusCircle size={16} className="text-[#a855f7]" /> Share Study Material Note
                </h3>
                
                <form onSubmit={handleAddNote} className="space-y-3.5 text-xs font-bold text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-purple-600 dark:text-purple-400">Resource Title</span>
                    <input
                      type="text"
                      placeholder="e.g. Kinematics Notes (PDF)"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-[#05060f] dark:border-purple-950 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-purple-600 dark:text-purple-400">Download Link / URL</span>
                    <input
                      type="text"
                      placeholder="e.g. https://drive.google.com/file/..."
                      value={newNoteLink}
                      onChange={(e) => setNewNoteLink(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-[#05060f] dark:border-purple-950 rounded-xl text-slate-800 dark:text-white focus:outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Upload Resource Reference
                  </button>
                </form>
              </div>

              {/* Resource list */}
              <div className="lg:col-span-2 p-6 bg-white border border-slate-200 dark:bg-[#0a0d1a]/50 dark:border-purple-500/10 rounded-[24px] space-y-4">
                <h3 className="text-slate-900 dark:text-white font-black text-base uppercase tracking-tight">
                  Resource Vault Inventory: Section {selectedSection}
                </h3>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {notesList.filter(
                    (n) =>
                      n.section?.toUpperCase() === selectedSection.toUpperCase() &&
                      n.course?.toLowerCase() === selectedCourse.toLowerCase()
                  ).length > 0 ? (
                    notesList
                      .filter(
                        (n) =>
                          n.section?.toUpperCase() === selectedSection.toUpperCase() &&
                          n.course?.toLowerCase() === selectedCourse.toLowerCase()
                      )
                      .map((note) => (
                        <div
                          key={note.id}
                          className="p-4 bg-slate-50 dark:bg-[#05060f]/80 border border-slate-200 dark:border-purple-950 rounded-xl flex items-center justify-between gap-4 text-left"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-full font-black uppercase">
                              {note.subject}
                            </span>
                            <h4 className="font-bold text-slate-800 dark:text-white text-xs mt-1 uppercase truncate">
                              {note.title}
                            </h4>
                            <a
                              href={note.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-purple-600 dark:text-purple-400 font-mono flex items-center gap-1 hover:underline truncate"
                            >
                              <ExternalLink size={10} /> {note.link}
                            </a>
                            <div className="text-[9px] text-slate-400 pt-0.5">
                              Uploaded: {new Date(note.createdAt).toLocaleString()}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-2.5 bg-rose-500/10 hover:bg-rose-505 text-rose-500 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
                            title="Delete Resource"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12 text-slate-500 font-bold uppercase text-[10px] tracking-wider border border-dashed border-slate-200 dark:border-purple-950/20 rounded-xl">
                      No resource downloads recorded for this group.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
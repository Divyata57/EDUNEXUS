"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/providers/theme-provider";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Vault,
  Megaphone,
  UserCircle2,
  LogOut,
  Inbox,
  Sun,
  Moon,
  CheckCircle,
  Plus,
  Trash,
  Download,
  Edit2,
  Bell,
  X,
  PlusCircle,
  FolderLock,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  User,
  ShieldAlert,
  Menu
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
  defaultNotes,
  matchesAudience
} from "@/lib/edunexus-demo-data";

// Type definitions
type ActiveTab = "attendance" | "timetable" | "assignment" | "vault" | "notice" | "profile";

interface PersonalNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface WebNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: "attendance" | "notice" | "assignment";
}

export default function StudentDashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("attendance");
  const [studentProfile, setStudentProfile] = useState<StudentRecord | null>(null);

  // States for each section
  const [liveAttendance, setLiveAttendance] = useState<any>(null);
  const [timetable, setTimetable] = useState<TimetableRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [notesList, setNotesList] = useState<NoteRecord[]>([]);
  
  // Personal Notes Pad states
  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");

  // Assignment submissions states
  const [submissions, setSubmissions] = useState<Record<string, { submitted: boolean; fileName?: string; text?: string; date?: string }>>({});
  const [attachingFileTo, setAttachingFileTo] = useState<string | null>(null);
  const [mockFileName, setMockFileName] = useState("");
  const [submissionText, setSubmissionText] = useState("");

  // Profile management states
  const [profileName, setProfileName] = useState("");
  const [profileCourse, setProfileCourse] = useState("");
  const [profileSection, setProfileSection] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState({ text: "", isError: false });

  // Notifications states
  const [notifications, setNotifications] = useState<WebNotification[]>([]);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [toast, setToast] = useState<WebNotification | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Utility to read from storage
  const readStore = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };

  // Utility to write to storage
  const writeStore = (key: string, value: unknown) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  // 1. Initial mounting & authentication verification
  useEffect(() => {
    setMounted(true);
    
    const activeSessionRaw = localStorage.getItem(STORAGE_KEYS.activeStudent);
    if (!activeSessionRaw) {
      router.push("/");
      return;
    }
    
    const student: StudentRecord = JSON.parse(activeSessionRaw);
    setStudentProfile(student);

    // Set initial profile form values
    setProfileName(student.name);
    setProfileCourse(student.course);
    setProfileSection(student.section);

    // Initialize personal notes
    const storedPersonalNotes = readStore<PersonalNote[]>(`edunexus_personal_notes_${student.rollNo}`, []);
    setPersonalNotes(storedPersonalNotes);

    // Load initial submissions
    const storedSubmissions = readStore<Record<string, any>>(`edunexus_submissions_${student.rollNo}`, {});
    setSubmissions(storedSubmissions);

    // Load notifications
    const storedNotifs = readStore<WebNotification[]>(`edunexus_notifications_${student.rollNo}`, []);
    setNotifications(storedNotifs);
  }, [router]);

  // 2. Fetch/sync data
  const syncDashboardData = React.useCallback(() => {
    if (!studentProfile) return;

    // A. Sync Attendance
    const attendanceRaw = localStorage.getItem(`attendance_${studentProfile.rollNo.trim()}`);
    if (attendanceRaw) {
      try {
        setLiveAttendance(JSON.parse(attendanceRaw));
      } catch {
        // ignore
      }
    } else {
      setLiveAttendance(null);
    }

    // B. Sync Timetable
    const timetableData = readStore<TimetableRecord[]>(STORAGE_KEYS.timetable, defaultTimetable);
    const filteredTimetable = timetableData.filter(item => matchesAudience(item, studentProfile));
    setTimetable(filteredTimetable);

    // C. Sync Assignments
    const assignmentData = readStore<AssignmentRecord[]>(STORAGE_KEYS.assignments, defaultAssignments);
    const filteredAssignments = assignmentData.filter(item => matchesAudience(item, studentProfile));
    setAssignments(filteredAssignments);

    // D. Sync Notices
    const noticeData = readStore<NoticeRecord[]>(STORAGE_KEYS.notices, defaultNotices);
    const filteredNotices = noticeData.filter(item => matchesAudience(item, studentProfile));
    setNotices(filteredNotices);

    // E. Sync Notes
    const notesData = readStore<NoteRecord[]>(STORAGE_KEYS.notes, defaultNotes);
    const filteredNotes = notesData.filter(item => matchesAudience(item, studentProfile));
    setNotesList(filteredNotes);
  }, [studentProfile]);

  useEffect(() => {
    syncDashboardData();
  }, [activeTab, syncDashboardData]);

  // 3. Periodic Polling Simulation to trigger real-time notifications
  useEffect(() => {
    if (!studentProfile) return;

    const interval = setInterval(() => {
      // Sync dashboard states in real-time
      syncDashboardData();

      let updated = false;
      const roll = studentProfile.rollNo;
      
      // Check for attendance updates in storage
      const attendanceRaw = localStorage.getItem(`attendance_${roll.trim()}`);
      if (attendanceRaw) {
        try {
          const parsed = JSON.parse(attendanceRaw);
          const lastReadNotif = localStorage.getItem(`notif_read_attendance_${roll}`);
          
          if (parsed.notificationTrigger && parsed.notificationTrigger.timestamp.toString() !== lastReadNotif) {
            // Trigger a new real-time notification
            const newNotif: WebNotification = {
              id: `notif-att-${Date.now()}`,
              title: "New Attendance Marked",
              message: parsed.notificationTrigger.message,
              timestamp: parsed.notificationTrigger.timestamp,
              read: false,
              type: "attendance"
            };

            const currentNotifs = readStore<WebNotification[]>(`edunexus_notifications_${roll}`, []);
            const nextNotifs = [newNotif, ...currentNotifs];
            setNotifications(nextNotifs);
            writeStore(`edunexus_notifications_${roll}`, nextNotifs);
            setToast(newNotif);

            // Update latest read timestamp
            localStorage.setItem(`notif_read_attendance_${roll}`, parsed.notificationTrigger.timestamp.toString());
            updated = true;
          }
        } catch {
          // ignore
        }
      }

      // Check for notice updates in storage
      const noticeData = readStore<NoticeRecord[]>(STORAGE_KEYS.notices, defaultNotices);
      const filteredNotices = noticeData.filter(item => matchesAudience(item, studentProfile));
      const lastCheckNoticeCount = Number(localStorage.getItem(`last_notice_count_${roll}`) || "0");
      
      if (filteredNotices.length > lastCheckNoticeCount) {
        // Find newly added notices
        const diffCount = filteredNotices.length - lastCheckNoticeCount;
        const newNotices = filteredNotices.slice(-diffCount);
        
        newNotices.forEach((notice, index) => {
          const newNotif: WebNotification = {
            id: `notif-not-${Date.now()}-${index}`,
            title: "New Announcement",
            message: `Notice posted: "${notice.title}"`,
            timestamp: Date.now(),
            read: false,
            type: "notice"
          };

          const currentNotifs = readStore<WebNotification[]>(`edunexus_notifications_${roll}`, []);
          const nextNotifs = [newNotif, ...currentNotifs];
          setNotifications(nextNotifs);
          writeStore(`edunexus_notifications_${roll}`, nextNotifs);
          setToast(newNotif);
        });

        localStorage.setItem(`last_notice_count_${roll}`, filteredNotices.length.toString());
        updated = true;
      }

      // Check for assignment updates in storage
      const assignmentData = readStore<AssignmentRecord[]>(STORAGE_KEYS.assignments, defaultAssignments);
      const filteredAssignments = assignmentData.filter(item => matchesAudience(item, studentProfile));
      const lastCheckAssignCount = Number(localStorage.getItem(`last_assign_count_${roll}`) || "0");

      if (filteredAssignments.length > lastCheckAssignCount) {
        const diffCount = filteredAssignments.length - lastCheckAssignCount;
        const newAssigns = filteredAssignments.slice(-diffCount);

        newAssigns.forEach((assign, index) => {
          const newNotif: WebNotification = {
            id: `notif-ass-${Date.now()}-${index}`,
            title: "New Assignment Assigned",
            message: `Task issued: "${assign.title}" (Due: ${assign.dueDate})`,
            timestamp: Date.now(),
            read: false,
            type: "assignment"
          };

          const currentNotifs = readStore<WebNotification[]>(`edunexus_notifications_${roll}`, []);
          const nextNotifs = [newNotif, ...currentNotifs];
          setNotifications(nextNotifs);
          writeStore(`edunexus_notifications_${roll}`, nextNotifs);
          setToast(newNotif);
        });

        localStorage.setItem(`last_assign_count_${roll}`, filteredAssignments.length.toString());
        updated = true;
      }

    }, 3000); // Poll local storage changes every 3 seconds

    return () => clearInterval(interval);
  }, [studentProfile, syncDashboardData]);

  // Clean toast alert auto-dismissal
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!mounted || !studentProfile) return null;

  // Compute stats for attendance
  let summary = { attended: 0, total: 0, percentage: "0%" };
  let subjectsList: any[] = [];
  if (liveAttendance) {
    if (liveAttendance.summary) {
      summary = liveAttendance.summary;
      subjectsList = liveAttendance.subjects || [];
    } else if (liveAttendance.subject) {
      summary = {
        attended: liveAttendance.attended,
        total: liveAttendance.total,
        percentage: liveAttendance.percentage
      };
      subjectsList = [
        {
          subject: liveAttendance.subject,
          attended: liveAttendance.attended,
          total: liveAttendance.total,
          percentage: liveAttendance.percentage,
          lastMarkedStatus: liveAttendance.lastMarkedStatus || "P"
        }
      ];
    }
  }

  // Personal notes management functions
  const handleAddNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    const newNote: PersonalNote = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    };
    const updatedNotes = [newNote, ...personalNotes];
    setPersonalNotes(updatedNotes);
    writeStore(`edunexus_personal_notes_${studentProfile.rollNo}`, updatedNotes);
    setNewNoteTitle("");
    setNewNoteContent("");
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = personalNotes.filter(n => n.id !== id);
    setPersonalNotes(updatedNotes);
    writeStore(`edunexus_personal_notes_${studentProfile.rollNo}`, updatedNotes);
  };

  const handleStartEditNote = (note: PersonalNote) => {
    setEditingNoteId(note.id);
    setEditNoteTitle(note.title);
    setEditNoteContent(note.content);
  };

  const handleSaveEditNote = () => {
    if (!editNoteTitle.trim() || !editNoteContent.trim() || !editingNoteId) return;
    const updatedNotes = personalNotes.map(n => 
      n.id === editingNoteId
        ? { ...n, title: editNoteTitle.trim(), content: editNoteContent.trim() }
        : n
    );
    setPersonalNotes(updatedNotes);
    writeStore(`edunexus_personal_notes_${studentProfile.rollNo}`, updatedNotes);
    setEditingNoteId(null);
  };

  // Assignment submissions functions
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, assignId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextSub = {
      ...submissions,
      [assignId]: {
        submitted: true,
        fileName: file.name,
        text: `Uploaded via native file dialog (${(file.size / 1024).toFixed(1)} KB)`,
        date: new Date().toLocaleDateString("en-US")
      }
    };
    setSubmissions(nextSub);
    writeStore(`edunexus_submissions_${studentProfile.rollNo}`, nextSub);

    alert(`🚀 File "${file.name}" attached & assignment submitted successfully!`);
  };

  const handleMarkAsCompleteToggle = (assignId: string) => {
    const isCompleted = submissions[assignId]?.submitted;
    const nextSub = {
      ...submissions,
      [assignId]: {
        submitted: !isCompleted,
        fileName: isCompleted ? undefined : "marked_complete.txt",
        text: isCompleted ? "" : "Manually toggled complete by student",
        date: new Date().toLocaleDateString("en-US")
      }
    };
    setSubmissions(nextSub);
    writeStore(`edunexus_submissions_${studentProfile.rollNo}`, nextSub);
  };

  // Profile update and password change
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ text: "", isError: false });

    // In a real database, this updates the records. Here, we update the active session and roster.
    const roster = readStore<StudentRecord[]>(STORAGE_KEYS.roster, defaultStudents);
    const updatedStudent: StudentRecord = {
      name: profileName.trim(),
      rollNo: studentProfile.rollNo,
      course: profileCourse.trim(),
      section: profileSection
    };

    const updatedRoster = roster.map(s => s.rollNo === studentProfile.rollNo ? updatedStudent : s);
    writeStore(STORAGE_KEYS.roster, updatedRoster);
    writeStore(STORAGE_KEYS.activeStudent, updatedStudent);
    setStudentProfile(updatedStudent);

    setProfileMsg({ text: "Profile details updated successfully!", isError: false });
    setTimeout(() => setProfileMsg({ text: "", isError: false }), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ text: "", isError: false });

    const accounts = readStore<any[]>("edunexus_student_accounts", []);
    const accIdx = accounts.findIndex(a => a.rollNo === studentProfile.rollNo);
    
    if (accIdx === -1) {
      setProfileMsg({ text: "Error: Student account mapping not found.", isError: true });
      return;
    }

    const account = accounts[accIdx];
    if (account.password && account.password !== oldPassword) {
      setProfileMsg({ text: "Incorrect current password validation.", isError: true });
      return;
    }

    accounts[accIdx].password = newPassword;
    writeStore("edunexus_student_accounts", accounts);
    setOldPassword("");
    setNewPassword("");
    setProfileMsg({ text: "Account password changed successfully!", isError: false });
    setTimeout(() => setProfileMsg({ text: "", isError: false }), 3000);
  };

  // Notifications management
  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    writeStore(`edunexus_notifications_${studentProfile.rollNo}`, updated);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    writeStore(`edunexus_notifications_${studentProfile.rollNo}`, []);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex transition-colors duration-300 bg-slate-50 text-slate-800 dark:bg-[#05060f] dark:text-slate-300">
      
      {/* Real-time Toast Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-[#0d1121] border-2 border-purple-500/50 shadow-2xl animate-bounce max-w-sm">
          <div className="p-2.5 bg-purple-600 rounded-xl text-white">
            <Bell size={18} className="animate-pulse" />
          </div>
          <div className="text-left">
            <h4 className="text-[10px] font-black tracking-widest text-[#a855f7] uppercase">{toast.title}</h4>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-2">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="p-1 hover:text-rose-500 transition-colors ml-auto cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Mobile Sidebar Backplate Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity" 
        />
      )}

      {/* SIDEBAR NAVIGATION GRID */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#0a0d1a] z-50 p-6 flex flex-col justify-between shrink-0 text-left border-r border-slate-200 dark:border-purple-950/30 transform transition-transform duration-300 md:translate-x-0 md:static md:flex ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="space-y-8">
          <div className="flex justify-between items-center md:block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                EX
              </div>
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">EduNexus</span>
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
              <BarChart3 size={18} /> Attendance Tracker
            </button>
            <button
              onClick={() => setActiveTab("timetable")}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "timetable"
                  ? "bg-purple-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
                  : "text-slate-500 dark:text-purple-300/40 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12162a]"
              }`}
            >
              <CalendarDays size={18} /> Class Timetable
            </button>
            <button
              onClick={() => setActiveTab("assignment")}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "assignment"
                  ? "bg-purple-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
                  : "text-slate-500 dark:text-purple-300/40 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12162a]"
              }`}
            >
              <ClipboardList size={18} /> Assignment Tracker
            </button>
            <button
              onClick={() => setActiveTab("vault")}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "vault"
                  ? "bg-purple-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
                  : "text-slate-500 dark:text-purple-300/40 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12162a]"
              }`}
            >
              <Vault size={18} /> Study Vault & Notes
            </button>
            <button
              onClick={() => setActiveTab("notice")}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer relative ${
                activeTab === "notice"
                  ? "bg-purple-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
                  : "text-slate-500 dark:text-purple-300/40 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12162a]"
              }`}
            >
              <Megaphone size={18} /> Notice Board
              {notices.length > 0 && (
                <span className="absolute right-4 top-3.5 px-1.5 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded-full">
                  {notices.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-purple-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
                  : "text-slate-500 dark:text-purple-300/40 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12162a]"
              }`}
            >
              <UserCircle2 size={18} /> My Profile
            </button>
          </nav>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEYS.activeStudent);
              router.push("/");
            }}
            className="w-full flex items-center gap-4 px-4 py-3 text-rose-500 hover:text-rose-600 font-black text-xs uppercase tracking-widest transition-colors text-left cursor-pointer"
          >
            <LogOut size={18} /> Exit Session
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        
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
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                Hello, {studentProfile.name} 👋
              </h2>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">
                Roll No: {studentProfile.rollNo} | Course: {studentProfile.course} | Section: {studentProfile.section}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notification Center Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowNotifCenter(!showNotifCenter)}
                className="p-3 rounded-xl bg-white border border-slate-200 dark:bg-[#0d1121] dark:border-purple-950/50 text-purple-600 dark:text-purple-400 relative active:scale-95 cursor-pointer transition-all hover:bg-slate-100"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded-full animate-pulse shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drops Overlay */}
              {showNotifCenter && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#0d1121] border border-slate-200 dark:border-purple-950/60 rounded-2xl shadow-xl p-4 z-[99] text-left space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-purple-950/40 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Bell size={12} className="text-[#a855f7]" /> Notifications
                    </span>
                    <div className="flex gap-2 text-[9px] font-black uppercase">
                      <button onClick={handleMarkAllRead} className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer">Read All</button>
                      <span className="text-slate-400">|</span>
                      <button onClick={handleClearNotifications} className="text-rose-500 hover:underline cursor-pointer">Clear</button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl text-xs transition-colors border ${
                            n.read
                              ? "bg-slate-50/50 dark:bg-[#070914]/40 border-slate-100 dark:border-purple-950/20 opacity-70"
                              : "bg-purple-500/5 dark:bg-purple-600/10 border-purple-500/20 dark:border-purple-500/30 font-bold"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black uppercase ${
                              n.type === "attendance"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : n.type === "assignment"
                                ? "bg-indigo-500/10 text-indigo-500"
                                : "bg-purple-500/10 text-[#a855f7]"
                            }`}>
                              {n.type}
                            </span>
                            <span className="text-[9px] font-normal text-slate-400">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-800 dark:text-slate-200 text-left text-[11px] leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        No notifications logged
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-3 rounded-xl bg-white border border-slate-200 dark:bg-[#0d1121] dark:border-purple-950/50 text-purple-600 dark:text-purple-400 cursor-pointer hover:bg-slate-100"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* MAIN PANEL CONTENT SPACE */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="w-full h-full min-h-[500px] border border-slate-200 bg-white/70 dark:bg-[#0a0d1a]/40 rounded-[32px] p-6 shadow-sm dark:border-purple-500/10">
            
            {/* VIEW COMPONENT 1: ATTENDANCE TRACKER */}
            {activeTab === "attendance" && (
              <div className="space-y-6 text-left">
                <div className="border-b border-slate-200 dark:border-purple-950/40 pb-4">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Attendance Analytics Dashboard</h3>
                  <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mt-1">Real-time attendance logs & analytics graphs</p>
                </div>

                {liveAttendance ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Overall Summary Card */}
                    <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-200 dark:bg-[#0d1121] dark:border-purple-950/60 flex flex-col justify-between shadow-sm relative overflow-hidden">
                      <div className="absolute top-[-20%] right-[-20%] w-[100px] h-[100px] bg-purple-600/10 rounded-full blur-xl dark:bg-purple-600/5"></div>
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-slate-500 dark:text-purple-400 uppercase tracking-widest">Aggregate Percentage</h4>
                        <div className="text-5xl font-black text-purple-600 dark:text-[#a855f7] font-mono mt-2">
                          {summary.percentage}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-purple-950/30">
                        <div className="p-3 bg-slate-50 dark:bg-[#070914] rounded-xl text-center">
                          <div className="text-lg font-black text-emerald-500 font-mono">{summary.attended}</div>
                          <span className="text-[9px] uppercase font-black text-slate-400">Attended</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-[#070914] rounded-xl text-center">
                          <div className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono">{summary.total}</div>
                          <span className="text-[9px] uppercase font-black text-slate-400">Total Lectures</span>
                        </div>
                      </div>
                      
                      {/* Attendance Health Metric */}
                      <div className="mt-4">
                        {parseFloat(summary.percentage) >= 75 ? (
                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-2 uppercase tracking-wider">
                            <CheckCircle size={14} /> Attendance Health: Stable
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center gap-2 uppercase tracking-wider">
                            <ShieldAlert size={14} className="animate-pulse" /> Warning: Below 75% Criteria
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detailed Subject List */}
                    <div className="lg:col-span-2 space-y-3">
                      <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Course Modules Summary</h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {subjectsList.map((subj, idx) => {
                          const percentageNum = parseFloat(subj.percentage);
                          return (
                            <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 dark:bg-[#0d1121] dark:border-purple-950/40 flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate uppercase">{subj.subject}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="w-full bg-slate-100 dark:bg-[#070914] h-2 rounded-full overflow-hidden max-w-[150px]">
                                    <div
                                      className={`h-full rounded-full ${percentageNum >= 75 ? "bg-emerald-500" : "bg-rose-500"}`}
                                      style={{ width: `${percentageNum}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-mono font-bold">{subj.attended}/{subj.total} Logs</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase ${
                                  subj.lastMarkedStatus === "P"
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                                    : "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                                }`}>
                                  Last: {subj.lastMarkedStatus === "P" ? "Present" : "Absent"}
                                </span>
                                <span className="text-base font-black font-mono text-purple-600 dark:text-purple-400">
                                  {subj.percentage}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-4">
                    <div className="p-6 bg-purple-500/5 rounded-full inline-block">
                      <Inbox size={48} className="text-[#a855f7] opacity-60 animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-slate-700 dark:text-white">No Attendance Data Found</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider max-w-sm mx-auto">
                        Waiting for Faculty desk to push active logs for Roll {studentProfile.rollNo}...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW COMPONENT 2: TIMETABLE PLANNER */}
            {activeTab === "timetable" && (
              <div className="space-y-6 text-left">
                <div className="border-b border-slate-200 dark:border-purple-950/40 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Class Timetable Scheduler</h3>
                    <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mt-1">Weekly curriculum stream scheduler</p>
                  </div>
                  <span className="text-[10px] font-black bg-purple-600/10 text-[#a855f7] px-3 py-1.5 rounded-xl border border-purple-500/20 uppercase tracking-widest">
                    Section {studentProfile.section} Roster
                  </span>
                </div>

                {timetable.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                      const classesForDay = timetable.filter((item) => item.day === day);
                      return (
                        <div
                          key={day}
                          className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-[#0d1121] dark:border-purple-950/40 space-y-3 shadow-sm min-h-[220px]"
                        >
                          <h4 className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 border-b border-slate-100 dark:border-purple-950/20 pb-2 tracking-widest">
                            {day}
                          </h4>

                          <div className="space-y-2">
                            {classesForDay.length > 0 ? (
                              classesForDay.map((cl, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-[#070914] dark:border-purple-950/10 hover:scale-[1.02] transition-transform text-left"
                                >
                                  <div className="text-[9px] font-mono text-slate-500 font-bold flex items-center gap-1">
                                    <Clock size={10} /> {cl.time}
                                  </div>
                                  <h5 className="font-bold text-slate-800 dark:text-white text-xs mt-1 leading-snug truncate uppercase">
                                    {cl.subject}
                                  </h5>
                                  <div className="text-[9px] font-medium text-slate-400 mt-1">
                                    Room: <span className="text-slate-500 dark:text-slate-300 font-bold">{cl.room}</span>
                                  </div>
                                  <div className="text-[9px] text-[#a855f7] font-bold mt-0.5 italic">
                                    {cl.faculty}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-10 text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                                No Classes
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-4">
                    <div className="p-6 bg-purple-500/5 rounded-full inline-block">
                      <Calendar size={48} className="text-[#a855f7] opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-slate-700 dark:text-white">Timetable Empty</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        No schedule entries mapped for Section {studentProfile.section}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW COMPONENT 3: ASSIGNMENT TRACKER */}
            {activeTab === "assignment" && (
              <div className="space-y-6 text-left">
                <div className="border-b border-slate-200 dark:border-purple-950/40 pb-4 flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Assignment Tracker Terminal</h3>
                    <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mt-1">Task registry compliance status and file uploads</p>
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="text-right">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Tasks Completed</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 bg-slate-100 dark:bg-[#070914] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-600"
                          style={{
                            width: `${
                              assignments.length > 0
                                ? (assignments.filter(a => submissions[a.id]?.submitted).length / assignments.length) * 100
                                : 0
                            }%`
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-black font-mono text-purple-600 dark:text-purple-400">
                        {assignments.filter((a) => submissions[a.id]?.submitted).length}/{assignments.length}
                      </span>
                    </div>
                  </div>
                </div>

                {assignments.length > 0 ? (
                  <div className="space-y-4">
                    {assignments.map((assign) => {
                      const sub = submissions[assign.id];
                      const isSubmitted = sub?.submitted;
                      return (
                        <div
                          key={assign.id}
                          className="p-5 rounded-2xl bg-white border border-slate-200 dark:bg-[#0d1121] dark:border-purple-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                        >
                          <div className="space-y-2 max-w-xl text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] px-2 py-0.5 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-full font-black uppercase tracking-wider">
                                {assign.subject}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-rose-500 flex items-center gap-1">
                                <AlertTriangle size={11} /> Due: {assign.dueDate}
                              </span>
                            </div>
                            <h4 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                              {assign.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                              {assign.details}
                            </p>

                            {isSubmitted && (
                              <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-bold">
                                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider">
                                  <CheckCircle size={10} /> Submitted: {sub.fileName}
                                </span>
                                {sub.text && (
                                  <span className="bg-slate-100 dark:bg-[#070914] text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md">
                                    Note: "{sub.text}"
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex md:flex-col items-stretch gap-2 shrink-0">
                            <button
                              onClick={() => handleMarkAsCompleteToggle(assign.id)}
                              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${
                                isSubmitted
                                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-[#070914] dark:hover:bg-[#12162a] dark:text-slate-300 border border-slate-200 dark:border-purple-950/40"
                              }`}
                            >
                              {isSubmitted ? "Marked Completed" : "Mark Completed"}
                            </button>
                            <input
                              type="file"
                              id={`file-input-${assign.id}`}
                              className="hidden"
                              onChange={(e) => handleFileChange(e, assign.id)}
                            />
                            <button
                              onClick={() => document.getElementById(`file-input-${assign.id}`)?.click()}
                              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-center"
                            >
                              {isSubmitted ? "Change File" : "Attach Files"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-4">
                    <div className="p-6 bg-purple-500/5 rounded-full inline-block">
                      <ClipboardList size={48} className="text-[#a855f7] opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-slate-700 dark:text-white">No Assignments Issued</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        All compliance assignments up to date for Section {studentProfile.section}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW COMPONENT 4: STUDY VAULT & PERSONAL NOTES */}
            {activeTab === "vault" && (
              <div className="space-y-8 text-left">
                
                {/* 1. Official Study Materials from Faculty */}
                <div className="space-y-4">
                  <div className="border-b border-slate-200 dark:border-purple-950/40 pb-4">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Academic Resources Vault</h3>
                    <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mt-1">Shared reference downloads & documentation links</p>
                  </div>

                  {notesList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {notesList.map((resource) => (
                        <div
                          key={resource.id}
                          className="p-5 rounded-2xl bg-white border border-slate-200 dark:bg-[#0d1121] dark:border-purple-950/40 flex justify-between items-center gap-4 shadow-sm"
                        >
                          <div className="space-y-1.5 text-left">
                            <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-full font-black uppercase tracking-wider">
                              {resource.subject}
                            </span>
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm uppercase">
                              {resource.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Uploaded: {new Date(resource.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={resource.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl cursor-pointer hover:scale-105 transition-all text-xs"
                            title="Download Link"
                          >
                            <Download size={16} />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      No Shared Study Documents Available
                    </div>
                  )}
                </div>

                {/* 2. Personal Notes Notepad Creator */}
                <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-purple-950/20">
                  <div className="border-b border-slate-200 dark:border-purple-950/40 pb-4">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      <Edit2 size={16} className="text-[#a855f7]" /> Personal Study Note Pad
                    </h3>
                    <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mt-1">Create, edit, and compile personal study notes</p>
                  </div>

                  {/* Create Form */}
                  <div className="p-5 rounded-2xl bg-slate-100 dark:bg-[#070914] border border-slate-200 dark:border-purple-950/20 space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white">
                      {editingNoteId ? "Update Selected Note" : "Write a New Study Note"}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1 space-y-1">
                        <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">Note Title</span>
                        <input
                          type="text"
                          placeholder="e.g. Robot kinematics formulas"
                          value={editingNoteId ? editNoteTitle : newNoteTitle}
                          onChange={(e) => editingNoteId ? setEditNoteTitle(e.target.value) : setNewNoteTitle(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl focus:outline-none dark:bg-[#0d1121] dark:border-purple-950/60 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">Note Content</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Yaw, Pitch, and Roll are rotations about Z, Y, and X axes respectively..."
                            value={editingNoteId ? editNoteContent : newNoteContent}
                            onChange={(e) => editingNoteId ? setEditNoteContent(e.target.value) : setNewNoteContent(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl focus:outline-none dark:bg-[#0d1121] dark:border-purple-950/60 dark:text-white"
                          />
                          {editingNoteId ? (
                            <div className="flex gap-1 shrink-0">
                              <button onClick={handleSaveEditNote} className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase cursor-pointer">Save</button>
                              <button onClick={() => setEditingNoteId(null)} className="px-3 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-xl text-xs font-black uppercase cursor-pointer">Cancel</button>
                            </div>
                          ) : (
                            <button
                              onClick={handleAddNote}
                              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <PlusCircle size={14} /> Add Note
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Grid */}
                  {personalNotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {personalNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-5 rounded-2xl bg-white border border-slate-200 dark:bg-[#0d1121] dark:border-purple-950/40 space-y-3 flex flex-col justify-between shadow-sm relative overflow-hidden"
                        >
                          <div className="space-y-2 text-left">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-slate-800 dark:text-white text-sm uppercase truncate pr-4">
                                {note.title}
                              </h4>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleStartEditNote(note)}
                                  className="p-1 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer"
                                  title="Edit Note"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-1 hover:text-rose-500 cursor-pointer"
                                  title="Delete Note"
                                >
                                  <Trash size={12} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words font-medium">
                              {note.content}
                            </p>
                          </div>
                          
                          <div className="text-[9px] font-mono text-slate-400 pt-2 border-t border-slate-50 dark:border-purple-950/20 text-left">
                            {note.createdAt}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white/40 dark:bg-purple-950/5 rounded-2xl border border-dashed border-slate-200 dark:border-purple-950/20 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      Notepad is currently empty. Write your first study note above!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW COMPONENT 5: NOTICE BOARD */}
            {activeTab === "notice" && (
              <div className="space-y-6 text-left">
                <div className="border-b border-slate-200 dark:border-purple-950/40 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Institutional Notice Board</h3>
                    <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mt-1">Official streams, holiday calendar and academic broadcasts</p>
                  </div>
                  <span className="text-[10px] font-black bg-rose-500/10 text-rose-500 px-3 py-1.5 rounded-xl border border-rose-500/20 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <Info size={12} /> Live Broadcast Feed
                  </span>
                </div>

                {notices.length > 0 ? (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {notices.map((notice) => {
                      // Mock category flags
                      const isUrgent = notice.title.toLowerCase().includes("urgent") || notice.title.toLowerCase().includes("exam") || notice.title.toLowerCase().includes("ceremony") || notice.body.toLowerCase().includes("mandatory");
                      return (
                        <div
                          key={notice.id}
                          className={`p-5 rounded-2xl text-left space-y-3 border transition-colors shadow-sm ${
                            isUrgent
                              ? "bg-rose-500/5 border-rose-500/20 dark:bg-rose-600/5 dark:border-rose-500/20"
                              : "bg-white border-slate-200 dark:bg-[#0d1121] dark:border-purple-950/40"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                              isUrgent
                                ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                                : "bg-purple-600/10 text-purple-600 dark:text-purple-400"
                            }`}>
                              {isUrgent ? "Urgent Update" : "General Notice"}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {new Date(notice.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                            </span>
                          </div>

                          <h4 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            {notice.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                            {notice.body}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-4">
                    <div className="p-6 bg-purple-500/5 rounded-full inline-block">
                      <Megaphone size={48} className="text-[#a855f7] opacity-60 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-slate-700 dark:text-white">Notice Board Empty</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        No announcements broadcasted for Section {studentProfile.section}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW COMPONENT 6: MY PROFILE MANAGEMENT */}
            {activeTab === "profile" && (
              <div className="space-y-8 text-left">
                <div className="border-b border-slate-200 dark:border-purple-950/40 pb-4">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Student Profile Console</h3>
                  <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mt-1">Manage details and change passwords</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Avatar card info */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-[#0d1121] dark:border-purple-950/60 text-center space-y-4 shadow-sm">
                    <div className="w-24 h-24 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-black text-4xl mx-auto shadow-md">
                      {studentProfile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase">{studentProfile.name}</h4>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-mono font-bold">University Student</p>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 dark:border-purple-950/30 text-left space-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <div>Section: <span className="font-bold text-slate-800 dark:text-white">{studentProfile.section}</span></div>
                      <div>Roll No: <span className="font-mono font-bold text-slate-800 dark:text-white">{studentProfile.rollNo}</span></div>
                      <div>Course: <span className="font-bold text-slate-800 dark:text-white">{studentProfile.course}</span></div>
                    </div>
                  </div>

                  {/* Actions & forms */}
                  <div className="lg:col-span-2 space-y-6">
                    {profileMsg.text && (
                      <div className={`p-3.5 rounded-xl text-xs font-bold border ${profileMsg.isError ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400" : "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400"}`}>
                        {profileMsg.text}
                      </div>
                    )}

                    {/* Edit Profile details */}
                    <form onSubmit={handleUpdateProfile} className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-[#0d1121] dark:border-purple-950/40 space-y-4 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                        <User size={14} className="text-[#a855f7]" /> Edit Profile Credentials
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">Full Name</span>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl focus:outline-none dark:bg-[#070914] dark:border-purple-950/60 dark:text-white"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">Course Program</span>
                          <input
                            type="text"
                            value={profileCourse}
                            onChange={(e) => setProfileCourse(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl focus:outline-none dark:bg-[#070914] dark:border-purple-950/60 dark:text-white"
                            required
                          />
                        </div>
                      </div>
                      
                      <button type="submit" className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all">
                        Update Registry Details
                      </button>
                    </form>

                    {/* Change password */}
                    <form onSubmit={handleChangePassword} className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-[#0d1121] dark:border-purple-950/40 space-y-4 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-[#a855f7]" /> Update Account Password
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">Old Secure Password</span>
                          <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="Current Password"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:outline-none dark:bg-[#070914] dark:border-purple-950/60 dark:text-white"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">New Secure Password</span>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New Password"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:outline-none dark:bg-[#070914] dark:border-purple-950/60 dark:text-white"
                            required
                          />
                        </div>
                      </div>

                      <button type="submit" className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all">
                        Execute Password Update
                      </button>
                    </form>

                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
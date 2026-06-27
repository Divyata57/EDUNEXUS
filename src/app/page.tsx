"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/providers/theme-provider";
import { ArrowRight, BookOpen, Loader2, Lock, Mail, Moon, Sun, User, Users2 } from "lucide-react";
import { STORAGE_KEYS, StudentRecord, defaultStudents, normalizeStudent, defaultTimetable, defaultAssignments, defaultNotices, defaultNotes } from "@/lib/edunexus-demo-data";

type PortalMode = "student" | "admin";
type LocalAccount = StudentRecord & { password?: string };

const accountKey = "edunexus_student_accounts";

export default function AppLoginGate() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [portalMode, setPortalMode] = useState<PortalMode>("student");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Inputs
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [section, setSection] = useState("A");
  const [course, setCourse] = useState("B.Tech Robotics & AI");
  const [password, setPassword] = useState("");
  
  const [message, setMessage] = useState({ text: "", isError: false });

  useEffect(() => {
    setMounted(true);

    // Initialize Local Roster if empty
    const existingRoster = localStorage.getItem(STORAGE_KEYS.roster);
    if (!existingRoster) {
      localStorage.setItem(STORAGE_KEYS.roster, JSON.stringify(defaultStudents));
    }

    // Initialize Local Accounts if empty
    const existingAccounts = localStorage.getItem(accountKey);
    if (!existingAccounts) {
      const initialAccounts: LocalAccount[] = defaultStudents.map(s => ({
        ...s,
        password: "student@123"
      }));
      localStorage.setItem(accountKey, JSON.stringify(initialAccounts));
    }

    // Seed other resources if empty
    if (!localStorage.getItem(STORAGE_KEYS.timetable)) {
      localStorage.setItem(STORAGE_KEYS.timetable, JSON.stringify(defaultTimetable));
    }
    if (!localStorage.getItem(STORAGE_KEYS.assignments)) {
      localStorage.setItem(STORAGE_KEYS.assignments, JSON.stringify(defaultAssignments));
    }
    if (!localStorage.getItem(STORAGE_KEYS.notices)) {
      localStorage.setItem(STORAGE_KEYS.notices, JSON.stringify(defaultNotices));
    }
    if (!localStorage.getItem(STORAGE_KEYS.notes)) {
      localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(defaultNotes));
    }

    // Seed default attendance for Sarin (23458) and Ritika (23450) if empty
    const sarinAttendanceKey = "attendance_23458";
    if (!localStorage.getItem(sarinAttendanceKey)) {
      const sarinAttendance = {
        summary: { attended: 28, total: 35, percentage: "80.0%" },
        subjects: [
          { subject: "Robotics Fundamentals", attended: 10, total: 12, percentage: "83.3%", lastMarkedStatus: "P" },
          { subject: "Python Programming", attended: 11, total: 13, percentage: "84.6%", lastMarkedStatus: "P" },
          { subject: "AI Lab", attended: 7, total: 10, percentage: "70.0%", lastMarkedStatus: "A" }
        ]
      };
      localStorage.setItem(sarinAttendanceKey, JSON.stringify(sarinAttendance));
    }

    const ritikaAttendanceKey = "attendance_23450";
    if (!localStorage.getItem(ritikaAttendanceKey)) {
      const ritikaAttendance = {
        summary: { attended: 31, total: 35, percentage: "88.6%" },
        subjects: [
          { subject: "Robotics Fundamentals", attended: 11, total: 12, percentage: "91.7%", lastMarkedStatus: "P" },
          { subject: "Python Programming", attended: 12, total: 13, percentage: "92.3%", lastMarkedStatus: "P" },
          { subject: "AI Lab", attended: 8, total: 10, percentage: "80.0%", lastMarkedStatus: "P" }
        ]
      };
      localStorage.setItem(ritikaAttendanceKey, JSON.stringify(ritikaAttendance));
    }
  }, []);

  const readStore = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeStore = (key: string, value: unknown) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const saveActiveStudent = (student: StudentRecord) => {
    const normalized = normalizeStudent(student);
    const roster = readStore<StudentRecord[]>(STORAGE_KEYS.roster, defaultStudents);
    const updatedRoster = roster.some((item) => item.rollNo === normalized.rollNo)
      ? roster.map((item) => (item.rollNo === normalized.rollNo ? normalized : item))
      : [normalized, ...roster];

    writeStore(STORAGE_KEYS.activeStudent, normalized);
    writeStore(STORAGE_KEYS.legacyStudent, normalized);
    writeStore(STORAGE_KEYS.roster, updatedRoster);
  };

  const handleStudentSignup = async () => {
    const student = normalizeStudent({ name, rollNo, section, course });
    const accounts = readStore<LocalAccount[]>(accountKey, []);
    const updatedAccounts = accounts.some((account) => account.rollNo === student.rollNo)
      ? accounts.map((account) => (account.rollNo === student.rollNo ? { ...student, password } : account))
      : [{ ...student, password }, ...accounts];

    writeStore(accountKey, updatedAccounts);
    saveActiveStudent(student);

    try {
      await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...student, password }),
      });
    } catch {
      // Local registration fallback
    }

    setMessage({ text: "Student registered successfully. Logging in...", isError: false });
    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  };

  const handleStudentLogin = () => {
    const accounts = readStore<LocalAccount[]>(accountKey, []);
    const roster = readStore<StudentRecord[]>(STORAGE_KEYS.roster, defaultStudents);
    
    const account = accounts.find((item) => item.rollNo === rollNo.trim());

    if (account && account.password !== password) {
      setMessage({ text: "Incorrect password for this student roll number.", isError: true });
      return;
    }

    // Default student check if no explicit account password matches, allow 'student@123'
    const student = account || roster.find((item) => item.rollNo === rollNo.trim());
    if (!student) {
      setMessage({ text: "Roll number not found. Register as new student below.", isError: true });
      return;
    }

    // If it's a default student and they logged in without registering first, allow student@123 password
    if (!account && password !== "student@123") {
      setMessage({ text: "Use default student password 'student@123' to log in.", isError: true });
      return;
    }

    saveActiveStudent(student);
    setMessage({ text: "Authentication successful! Redirecting to student panel...", isError: false });
    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ text: "", isError: false });

    if (portalMode === "admin") {
      if (facultyId.trim() === "FAC@234" && password === "Teacher@123") {
        setMessage({ text: "Faculty access verified. Directing to control console...", isError: false });
        setTimeout(() => {
          router.push("/admin");
        }, 800);
      } else {
        setMessage({ text: "Invalid Official Faculty ID or Password.", isError: true });
        setLoading(false);
      }
      return;
    }

    if (isSignUp) {
      await handleStudentSignup();
    } else {
      handleStudentLogin();
    }
    setLoading(false);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-500 bg-slate-50 text-slate-800 dark:bg-[#05060f] dark:text-slate-100">
      
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none dark:bg-purple-500/5"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none dark:bg-indigo-500/5"></div>

      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-6 right-6 p-3 rounded-2xl bg-white dark:bg-[#0d1121] border border-slate-200 dark:border-purple-950/40 text-purple-600 dark:text-purple-400 shadow-sm active:scale-95 transition-all z-50 cursor-pointer"
        title="Toggle Theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Glowing Box Wrapper */}
      <div className="relative w-full max-w-md mt-4">
        {/* Neon Glow Backdrop */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[34px] blur-2xl opacity-35 dark:opacity-55 animate-pulse pointer-events-none"></div>

        {/* Login Card */}
        <div className="relative w-full bg-white/85 dark:bg-[#0a0d1a]/90 backdrop-blur-2xl p-8 rounded-[32px] border border-slate-200/80 dark:border-purple-500/20 shadow-2xl transition-all">
          
          {/* Logo and Titles */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto shadow-[0_8px_25px_rgba(168,85,247,0.3)]">
              EX
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">EduNexus Terminal</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Secure institutional dashboard access</p>
          </div>

          {/* Action Alert Banner */}
          <div className="min-h-[44px] mb-3">
            {message.text && (
              <div
                className={`w-full p-3 rounded-xl text-xs font-bold border transition-all ${
                  message.isError
                    ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400"
                    : "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>

          {/* Tab switchers */}
          <div className="flex bg-slate-100 dark:bg-[#12162a] p-1.5 rounded-2xl mb-6 border border-slate-200 dark:border-purple-950/40">
            <button
              type="button"
              onClick={() => {
                setPortalMode("student");
                setIsSignUp(false);
                setMessage({ text: "", isError: false });
              }}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                portalMode === "student"
                  ? "bg-purple-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.2)]"
                  : "text-slate-500 dark:text-purple-300/40 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setPortalMode("admin");
                setMessage({ text: "", isError: false });
              }}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                portalMode === "admin"
                  ? "bg-purple-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.2)]"
                  : "text-slate-500 dark:text-purple-300/40 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Admin / Faculty
            </button>
          </div>

          {/* Form elements */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {portalMode === "student" && isSignUp && (
              <Input
                icon={<User size={16} />}
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="e.g. Ritika Gupta"
              />
            )}

            {portalMode === "student" && (
              <Input
                icon={<Mail size={16} />}
                label="University Roll Number"
                value={rollNo}
                onChange={setRollNo}
                placeholder="e.g. 23450 or 23458"
                mono
              />
            )}

            {portalMode === "student" && isSignUp && (
              <>
                <Input
                  icon={<BookOpen size={16} />}
                  label="Course Program"
                  value={course}
                  onChange={setCourse}
                  placeholder="e.g. B.Tech Robotics & AI"
                />
                <label className="space-y-1 block">
                  <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                    Assigned Section
                  </span>
                  <div className="relative">
                    <Users2 size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#070914] dark:border-purple-950/60 dark:text-purple-200"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                    <option value="E">Section E</option>
                    <option value="F">Section F</option>
                  </select>
                  </div>
                </label>
              </>
            )}

            {portalMode === "admin" && (
              <Input
                icon={<User size={16} />}
                label="Official Faculty ID"
                value={facultyId}
                onChange={setFacultyId}
                placeholder="e.g. FAC@234"
                mono
              />
            )}

            <Input
              icon={<Lock size={16} />}
              label="Secure Access Password"
              value={password}
              onChange={setPassword}
              placeholder="Password"
              type="password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer hover:shadow-purple-500/20 hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  Initialize Authentication <ArrowRight size={12} />
                </>
              )}
            </button>
          </form>

          {/* Footer info & switcher */}
          <div className="mt-5 text-center h-4 flex items-center justify-center">
            {portalMode === "student" ? (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage({ text: "", isError: false });
                }}
                className="text-[11px] font-black text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:underline tracking-wide cursor-pointer"
              >
                {isSignUp ? "Already registered? Sign in here" : "New student? Create an account"}
              </button>
            ) : (
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Faculty Login Bypass Portal
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
  mono?: boolean;
}) {
  return (
    <label className="space-y-1 block">
      <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
        {label}
      </span>
      <div className="relative">
        <span className="absolute left-3.5 top-3.5 text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-3 text-xs ${
            mono ? "font-mono font-bold" : "font-semibold"
          } bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:bg-[#070914] dark:border-purple-950/60 dark:text-white text-slate-900`}
          required
        />
      </div>
    </label>
  );
}
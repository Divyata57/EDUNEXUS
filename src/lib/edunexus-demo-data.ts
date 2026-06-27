export type StudentRecord = {
  name: string;
  rollNo: string;
  section: string;
  course: string;
};

export type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  type: "notice" | "assignment" | "attendance" | "timetable" | "notes";
  audienceCourse: string;
  audienceSection: string;
  createdAt: string;
  readBy: string[];
};

export type AssignmentRecord = {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  details: string;
  course: string;
  section: string;
  createdAt: string;
};

export type NoticeRecord = {
  id: string;
  title: string;
  body: string;
  course: string;
  section: string;
  createdAt: string;
};

export type NoteRecord = {
  id: string;
  title: string;
  subject: string;
  link: string;
  course: string;
  section: string;
  createdAt: string;
};

export type TimetableRecord = {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  time: string;
  subject: string;
  room: string;
  faculty: string;
  course: string;
  section: string;
};

export type AttendanceEntry = {
  rollNo: string;
  name: string;
  status: "P" | "A";
};

export type AttendanceSession = {
  id: string;
  course: string;
  section: string;
  subject: string;
  date: string;
  entries: AttendanceEntry[];
};

export const STORAGE_KEYS = {
  activeStudent: "edunexus_active_student_session",
  legacyStudent: "edunexus_logged_in_student",
  roster: "edunexus_registered_students",
  notifications: "edunexus_notifications",
  assignments: "edunexus_assignments",
  notices: "edunexus_notices",
  notes: "edunexus_notes",
  timetable: "edunexus_timetable",
  attendanceSessions: "edunexus_attendance_sessions",
};

export const defaultStudents: StudentRecord[] = [
  { name: "Sarin", rollNo: "23458", section: "A", course: "B.Tech Robotics & AI" },
  { name: "ritika", rollNo: "23450", section: "B", course: "B.Tech Robotics & AI" },
  { name: "Divyata", rollNo: "2315901", section: "A", course: "B.Tech Robotics & AI" },
  { name: "Aarav Sharma", rollNo: "2315902", section: "A", course: "B.Tech Robotics & AI" },
  { name: "Meera Singh", rollNo: "2315903", section: "A", course: "B.Tech Robotics & AI" },
  { name: "Kabir Verma", rollNo: "2315904", section: "B", course: "B.Tech Robotics & AI" },
];

export const weekdays: TimetableRecord["day"][] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export const defaultTimetable: TimetableRecord[] = [
  {
    id: "tt-1",
    day: "Monday",
    time: "09:00 - 10:00",
    subject: "Robotics Fundamentals",
    room: "Lab 204",
    faculty: "Prof. Rajat Gupta",
    course: "B.Tech Robotics & AI",
    section: "A",
  },
  {
    id: "tt-2",
    day: "Tuesday",
    time: "11:00 - 12:00",
    subject: "Python Programming",
    room: "Room 112",
    faculty: "Dr. Ananya Rao",
    course: "B.Tech Robotics & AI",
    section: "A",
  },
  {
    id: "tt-3",
    day: "Thursday",
    time: "02:00 - 03:00",
    subject: "AI Lab",
    room: "Lab 305",
    faculty: "Prof. Rajat Gupta",
    course: "B.Tech Robotics & AI",
    section: "A",
  },
  {
    id: "tt-4",
    day: "Monday",
    time: "10:30 - 11:30",
    subject: "Python Programming",
    room: "Room 112",
    faculty: "Dr. Ananya Rao",
    course: "B.Tech Robotics & AI",
    section: "B",
  },
  {
    id: "tt-5",
    day: "Wednesday",
    time: "09:00 - 10:00",
    subject: "Robotics Fundamentals",
    room: "Lab 204",
    faculty: "Prof. Rajat Gupta",
    course: "B.Tech Robotics & AI",
    section: "B",
  },
  {
    id: "tt-6",
    day: "Friday",
    time: "01:30 - 02:30",
    subject: "AI Lab",
    room: "Lab 305",
    faculty: "Prof. Rajat Gupta",
    course: "B.Tech Robotics & AI",
    section: "B",
  },
];

export const defaultAssignments: AssignmentRecord[] = [
  {
    id: "task-1",
    title: "Python Dictionary Record System",
    subject: "Python Programming",
    dueDate: "2026-07-05",
    details: "Build a small record manager with add, update, search, and delete actions.",
    course: "B.Tech Robotics & AI",
    section: "A",
    createdAt: "2026-06-27T06:30:00.000Z",
  },
  {
    id: "task-2",
    title: "Kinematic Arm Modeling",
    subject: "Robotics Fundamentals",
    dueDate: "2026-07-10",
    details: "Write a short analysis on 2-DOF planar robotic arm forward kinematics.",
    course: "B.Tech Robotics & AI",
    section: "B",
    createdAt: "2026-06-27T07:15:00.000Z",
  },
  {
    id: "task-3",
    title: "Decision Trees vs SVM Study",
    subject: "AI Lab",
    dueDate: "2026-07-12",
    details: "Complete comparative study on classification models for image sets.",
    course: "B.Tech Robotics & AI",
    section: "A",
    createdAt: "2026-06-27T08:00:00.000Z",
  },
];

export const defaultNotices: NoticeRecord[] = [
  {
    id: "notice-1",
    title: "Lab Orientation Released",
    body: "Robotics lab orientation will be held this week for Section A. Attendance is mandatory.",
    course: "B.Tech Robotics & AI",
    section: "A",
    createdAt: "2026-06-27T06:30:00.000Z",
  },
  {
    id: "notice-2",
    title: "Campus Coding Hackathon 2026",
    body: "Register for the upcoming EduNexus DevHack. Win up to $10,000 cash prizes and internships.",
    course: "B.Tech Robotics & AI",
    section: "B",
    createdAt: "2026-06-27T08:15:00.000Z",
  },
  {
    id: "notice-3",
    title: "Mid-Term Examination Schedule",
    body: "The mid-term exams for all courses start on July 20. Make sure your dues are cleared by July 15.",
    course: "B.Tech Robotics & AI",
    section: "A",
    createdAt: "2026-06-27T09:00:00.000Z",
  },
  {
    id: "notice-4",
    title: "Mid-Term Examination Schedule",
    body: "The mid-term exams for all courses start on July 20. Make sure your dues are cleared by July 15.",
    course: "B.Tech Robotics & AI",
    section: "B",
    createdAt: "2026-06-27T09:00:00.000Z",
  },
];

export const defaultNotes: NoteRecord[] = [
  {
    id: "note-1",
    title: "Introduction to Robotics (PDF)",
    subject: "Robotics Fundamentals",
    link: "https://drive.google.com/file/d/rob-fundamentals-intro",
    course: "B.Tech Robotics & AI",
    section: "A",
    createdAt: "2026-06-27T06:30:00.000Z",
  },
  {
    id: "note-2",
    title: "Python Cheat Sheet for AI/ML",
    subject: "Python Programming",
    link: "https://drive.google.com/file/d/python-cheat-sheet",
    course: "B.Tech Robotics & AI",
    section: "A",
    createdAt: "2026-06-27T06:45:00.000Z",
  },
  {
    id: "note-3",
    title: "Forward & Inverse Kinematics Notes",
    subject: "Robotics Fundamentals",
    link: "https://drive.google.com/file/d/kinematics-notes",
    course: "B.Tech Robotics & AI",
    section: "B",
    createdAt: "2026-06-27T07:20:00.000Z",
  },
  {
    id: "note-4",
    title: "Numpy & Pandas Quickstart Guide",
    subject: "Python Programming",
    link: "https://drive.google.com/file/d/numpy-pandas-quickstart",
    course: "B.Tech Robotics & AI",
    section: "B",
    createdAt: "2026-06-27T07:30:00.000Z",
  },
];

export const normalizeStudent = (student: Partial<StudentRecord>): StudentRecord => ({
  name: student.name?.trim() || "Test Student",
  rollNo: student.rollNo?.trim() || "23458",
  section: student.section?.trim() || "A",
  course: student.course?.trim() || "B.Tech Robotics & AI",
});

export const matchesAudience = (
  item: { course: string; section: string },
  student: StudentRecord
) =>
  item.course.toLowerCase() === student.course.toLowerCase() &&
  item.section.toLowerCase() === student.section.toLowerCase();

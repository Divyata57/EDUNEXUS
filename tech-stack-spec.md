# Technical Stack & Workflows Specification

## 1. Tech Stack Selected
* **Frontend/Backend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn UI
* **Database:** MySQL 
* **ORM:** Prisma ORM (Highly recommended for MySQL with Next.js)
* **Validation & Tools:** Zod, JWT (Auth), Cloudinary (Storage)

## 2. Database Entities (MySQL Structure)
* **User Table:** id, email, password, name, role (STUDENT/ADMIN)
* **Attendance Table:** id, userId, subjectCode, date, status (PRESENT/ABSENT/LATE)
* **Task Table:** id, userId, title, dueDate, status (Boolean)
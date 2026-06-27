import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, rollNo, section, course, password } = body;

    if (!name || !rollNo || !section || !password) {
      return NextResponse.json({ error: "Name, roll number, section, and password are required." }, { status: 400 });
    }

    const existingStudent = await prisma.student.findUnique({
      where: { rollNo: String(rollNo) },
    });

    if (existingStudent) {
      return NextResponse.json({ error: "This roll number is already registered." }, { status: 400 });
    }

    const newStudent = await prisma.student.create({
      data: {
        name: String(name),
        rollNo: String(rollNo),
        section: String(section),
        course: String(course || "B.Tech Robotics & AI"),
        password: String(password),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account created.",
      user: {
        name: newStudent.name,
        rollNo: newStudent.rollNo,
        section: newStudent.section,
        course: newStudent.course,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

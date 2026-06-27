import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const course = searchParams.get("course") || "";
    const section = searchParams.get("section") || "";

    if (!course || !section) {
      return NextResponse.json({ error: "Course and section are required." }, { status: 400 });
    }

    const activeStudents = await prisma.student.findMany({
      where: {
        course: { equals: course, mode: "insensitive" },
        section: { equals: section, mode: "insensitive" },
      },
      select: {
        rollNo: true,
        name: true,
        section: true,
        course: true,
      },
      orderBy: {
        rollNo: "asc",
      },
    });

    return NextResponse.json(activeStudents, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Student lookup failed." }, { status: 500 });
  }
}

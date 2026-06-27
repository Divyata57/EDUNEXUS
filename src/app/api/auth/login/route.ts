import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { facultyId, password } = body;

    if (!facultyId || !password) {
      return NextResponse.json(
        { error: 'Faculty ID and Password are required credentials' },
        { status: 400 }
      );
    }

    // ðŸ”’ FIXED PARTICUALR TEACHER DATA STORED HERE
    const VALID_FACULTY_ID = "FAC2026"; // Aap isey badal bhi sakte ho
    const VALID_PASSWORD = "Faculty@CGC";     // Aap apna manpasand password rakh sakte ho

    // Checking if the entered credentials match our stored teacher data
    if (facultyId === VALID_FACULTY_ID && password === VALID_PASSWORD) {
      return NextResponse.json(
        { 
          message: 'Faculty Verification Successful!', 
          success: true,
          user: { 
            id: "FAC_01", 
            name: "Official Instructor", 
            role: "FACULTY", 
            facultyId: VALID_FACULTY_ID 
          } 
        },
        { status: 200 }
      );
    } else {
      // Agar detail galat hai toh login nahi hoga
      return NextResponse.json(
        { error: 'Invalid Faculty ID or Password. Access Denied.' },
        { status: 401 }
      );
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

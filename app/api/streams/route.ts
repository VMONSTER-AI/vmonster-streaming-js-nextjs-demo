import { NextRequest, NextResponse } from "next/server";

const VMONSTER_API_URL = process.env.NEXT_PUBLIC_VMONSTER_API_URL || "";
const VMONSTER_API_KEY = process.env.VMONSTER_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    // 실제 API 호출
    const response = await fetch(`${VMONSTER_API_URL}/v1/streams`, {
      method: "POST",
      headers: {
        "x-api-key": VMONSTER_API_KEY,
      },
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Error while creating stream" },
      { status: 500 }
    );
  }
}

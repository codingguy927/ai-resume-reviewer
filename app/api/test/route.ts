import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    keyLoaded: !!process.env.OPENAI_API_KEY,
    firstChars: process.env.OPENAI_API_KEY
      ? process.env.OPENAI_API_KEY.slice(0, 10) + "..."
      : null,
  });
}

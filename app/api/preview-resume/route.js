import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // ✅ dynamically import so it only runs server-side
    const pdf = (await import("pdf-parse")).default;

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert PDF to text
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const resumeText = data.text || "";

    // Limit preview to ~20 lines
    const preview = resumeText
      .split("\n")
      .slice(0, 20)
      .join("\n")
      .trim();

    return NextResponse.json({ preview });
  } catch (err) {
    console.error("Preview API error:", err);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}

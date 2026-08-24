// app/api/analyze/route.js  (or src/app/api/analyze/route.js)
export const dynamic = 'force-dynamic';   // never pre-render
export const runtime = 'nodejs';          // need full Node APIs

import { NextResponse } from "next/server";
import OpenAI from "openai";

// Robust JSON extractor in case the model adds extra text/code fences
function safeParseJSON(text) {
  try { return JSON.parse(text); } catch {}
  const match = text && text.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return null;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const jobDescription = (formData.get("jobDescription") || "").toString();

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 🔑 lazy-create the OpenAI client at request time (not at module load)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const client = new OpenAI({ apiKey });

    // 🧩 lazy-import pdf-parse at runtime
    const { default: pdfParse } = await import("pdf-parse");

    // Convert PDF to text
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedPdf = await pdfParse(buffer);
    const resumeText = parsedPdf?.text || "";

    const prompt = `
Compare this resume with the following job description.
Respond ONLY with valid JSON in this exact shape:

{
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "suggestions": ["string", "string"],
  "matchScore": 0,
  "skills": [
    { "name": "React", "resumeScore": 80, "jobScore": 100 },
    { "name": "JavaScript", "resumeScore": 70, "jobScore": 90 }
  ]
}

Job Description:
${jobDescription}

Resume:
${resumeText}
    `.trim();

    const ai = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const raw = ai?.choices?.[0]?.message?.content ?? "";
    const json = safeParseJSON(raw);
    if (!json) {
      return NextResponse.json(
        { error: "AI response was not valid JSON", raw },
        { status: 500 }
      );
    }

    return NextResponse.json(json);
  } catch (err) {
    console.error("Analyze route error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

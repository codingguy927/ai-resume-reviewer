// app/api/analyze/route.js  (or src/app/api/analyze/route.js)
export const dynamic = 'force-dynamic'; // prevent build-time evaluation
export const runtime = 'nodejs';        // ensure proper Node runtime (not Edge)

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeParseJSON(maybeJSON) {
  try { return JSON.parse(maybeJSON); } catch {}
  // If the model returns fenced code or extra text, try to extract the first JSON block.
  const match = maybeJSON.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const jobDescription = formData.get("jobDescription") || "";

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 🟢 Lazy-import pdf-parse at runtime (not at module load)
    const { default: pdfParse } = await import("pdf-parse");

    // Convert PDF to text
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);
    const resumeText = data?.text || "";

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

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const raw = response?.choices?.[0]?.message?.content ?? "";
    const parsed = safeParseJSON(raw);

    if (!parsed) {
      return NextResponse.json(
        { error: "AI response was not valid JSON", raw },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

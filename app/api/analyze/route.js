import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdf from "pdf-parse";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const jobDescription = formData.get("jobDescription");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // ✅ Convert PDF to text
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const resumeText = data.text;

    // ✅ Force JSON with skills
    const prompt = `
    Compare this resume with the following job description.
    Respond ONLY with valid JSON in this format:
    {
      "strengths": ["string", "string"],
      "weaknesses": ["string", "string"],
      "suggestions": ["string", "string"],
      "matchScore": 0-100,
      "skills": [
        { "name": "React", "resumeScore": 80, "jobScore": 100 },
        { "name": "JavaScript", "resumeScore": 70, "jobScore": 90 }
      ]
    }

    Job Description:
    ${jobDescription || "N/A"}

    Resume:
    ${resumeText}
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    let feedback;
    try {
      feedback = JSON.parse(response.choices[0].message.content);
    } catch (err) {
      console.error("JSON parse error:", err);
      return NextResponse.json({ error: "AI response not valid JSON" }, { status: 500 });
    }

    return NextResponse.json(feedback);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

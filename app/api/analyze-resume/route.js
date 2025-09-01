// app/api/analyze-resume/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

// ---- helpers ----
function json(data, status = 200) {
  return NextResponse.json(data, { status });
}
function isPDF(file) {
  const t = (file?.type || "").toLowerCase();
  return t.includes("pdf");
}

// Parse a PDF buffer to text using pdfjs, loaded dynamically to avoid import-time crashes.
// Kept for the upload path; the new JSON text path bypasses this entirely.
async function parsePdfToText(buffer) {
  const mod = await import("pdfjs-dist").catch((e) => {
    throw new Error("Failed to import pdfjs-dist: " + (e?.message || e));
  });
  const pdfjs = mod?.default?.getDocument ? mod.default : mod;
  if (pdfjs?.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = undefined; // disable workers in Node
  }
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({
    data: uint8Array,
    disableWorker: true,
    useSystemFonts: true,
    stopAtErrors: false,
    verbosity: 0,
  });
  const pdf = await loadingTask.promise;

  let textContent = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent({ disableCombineTextItems: false });
    textContent += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return textContent.trim();
}

// ---- optional GPT analysis ----
async function analyzeWithGPT({ resumeText, jobDescription, apiKey }) {
  if (!apiKey) return { _warning: "OPENAI_API_KEY not set. Skipping GPT." };

  const openai = new OpenAI({ apiKey });
  const system = [
    "You are a precise resume screener.",
    "Compare the resume to the job description.",
    "Return strictly valid JSON with keys:",
    "score (0-100), strengths (array of short bullets), gaps (array of short bullets),",
    "topKeywordsToAdd (array of 5-10 concise skill keywords), summary (2-3 sentences).",
  ].join(" ");

  const user = `JOB DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${resumeText}`;

  const resp = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
  });

  const txt = resp.output_text ?? "";
  try {
    const start = txt.indexOf("{");
    const end = txt.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      return { _warning: "GPT responded without valid JSON." };
    }
    const json = JSON.parse(txt.slice(start, end + 1));
    if (
      typeof json.score !== "number" ||
      !Array.isArray(json.strengths) ||
      !Array.isArray(json.gaps) ||
      !Array.isArray(json.topKeywordsToAdd) ||
      typeof json.summary !== "string"
    ) {
      return { _warning: "GPT JSON missing expected keys." };
    }
    return json;
  } catch (e) {
    return { _warning: "Failed to parse GPT JSON.", _raw: txt.slice(0, 400) };
  }
}

// ---- GET: quick health check ----
export async function GET() {
  return json({ ok: true, message: "API alive. POST a PDF or JSON to /api/analyze-resume" });
}

// ---- POST: main upload endpoint ----
export async function POST(req) {
  try {
    const ctype = req.headers.get("content-type") || "";

    let resumeText = "";
    let jobDescription = "";
    let useGPT = false;

    if (ctype.includes("application/json")) {
      // JSON mode: { resumeText, jobDescription, useGPT }
      const body = await req.json();
      resumeText = (body.resumeText || "").toString();
      jobDescription = (body.jobDescription || "").toString();
      useGPT = Boolean(body.useGPT);
      if (!resumeText.trim()) {
        return json({ ok: false, error: "No resumeText provided in JSON body" }, 400);
      }
    } else if (ctype.includes("multipart/form-data")) {
      // Upload mode: form-data with file + jobDescription + useGPT
      const form = await req.formData();
      const file = form.get("file");
      jobDescription = (form.get("jobDescription") || "").toString();
      useGPT = (form.get("useGPT") || "").toString() === "true";

      if (!file || typeof file === "string") {
        return json({ ok: false, error: "No file provided" }, 400);
      }
      if (!isPDF(file)) {
        return json({ ok: false, error: "File must be a PDF" }, 415);
      }
      if (file.size && file.size > 15 * 1024 * 1024) {
        return json({ ok: false, error: "PDF too large (max 15MB)" }, 413);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      if (!buffer || buffer.length === 0) {
        return json({ ok: false, error: "Empty file uploaded" }, 422);
      }

      try {
        resumeText = await parsePdfToText(buffer);
        if (!resumeText) {
          return json(
            { ok: false, error: "Could not extract text. Is this a scanned/image-only PDF?" },
            422
          );
        }
      } catch (e) {
        console.error("PDF parse error:", e);
        return json({ ok: false, error: "PDF_PARSE_FAILED", details: String(e?.message || e) }, 422);
      }
    } else {
      return json({ ok: false, error: "Unsupported Content-Type" }, 415);
    }

    // Baseline keyword match
    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9+ ]/g, " ");
    const jd = normalize(jobDescription);
    const resume = normalize(resumeText);
    const jdKeywords = Array.from(new Set(jd.split(/\s+/).filter((w) => w.length > 2)));
    const topKeywords = jdKeywords.slice(0, 60);

    let hits = 0;
    for (const kw of topKeywords) if (resume.includes(kw)) hits++;
    const matchScore = topKeywords.length ? Math.round((hits / topKeywords.length) * 100) : 0;

    // GPT enrichment (optional)
    let gptAnalysis = null;
    if (useGPT) {
      try {
        gptAnalysis = await analyzeWithGPT({
          resumeText,
          jobDescription,
          apiKey: process.env.OPENAI_API_KEY,
        });
      } catch (e) {
        gptAnalysis = { _warning: `GPT call failed: ${String(e?.message || e)}` };
      }
    }

    return json({
      ok: true,
      matchScore,
      wordsInResume: resume.split(/\s+/).length,
      wordsInJD: jdKeywords.length,
      sample: resumeText.split(/\n/).filter(Boolean).slice(0, 8),
      gptAnalysis,
    });
  } catch (err) {
    console.error("/api/analyze-resume fatal error:", err);
    return json({ ok: false, error: "SERVER_ERROR", details: String(err?.message || err) }, 500);
  }
}

// app/api/export-report/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const safe = (v) => (v ?? "").toString();

function addHeaderFooter(doc) {
  const draw = () => {
    const { page } = doc;
    const w = page.width, h = page.height, m = 48;

    doc.save().strokeColor("#E5E7EB").lineWidth(1).moveTo(m, 72).lineTo(w - m, 72).stroke().restore();
    doc.font("Times-Bold").fontSize(10).fillColor("#111827").text("Resume Fit Report", m, 54, { width: w - 2 * m, align: "left" });
    doc.font("Times-Roman").fontSize(10).fillColor("#6B7280").text(new Date().toLocaleString(), m, 54, { width: w - 2 * m, align: "right" });

    doc.save().strokeColor("#E5E7EB").lineWidth(1).moveTo(m, h - 54).lineTo(w - m, h - 54).stroke().restore();
    const pageNum = doc.page.number || 1;
    doc.font("Times-Roman").fontSize(10).fillColor("#6B7280").text(`Page ${pageNum}`, m, h - 48, { width: w - 2 * m, align: "center" });
  };
  draw();
  doc.on("pageAdded", draw);
}

function H1(doc, t) { doc.moveDown(0.3); doc.font("Times-Bold").fontSize(20).fillColor("#111827").text(t).moveDown(0.5); }
function H2(doc, t) { doc.font("Times-Bold").fontSize(16).fillColor("#111827").text(t).moveDown(0.3); }
function P (doc, t, opts = {}) { doc.font("Times-Roman").fontSize(11).fillColor("#111827").text(t, opts); }
function S (doc, t) { doc.font("Times-Roman").fontSize(11).fillColor("#374151").text(t); }
function bullets(doc, arr = []) { arr.forEach((item) => { const y = doc.y + 2; doc.circle(doc.x + 3, y, 1.8).fill("#111827").fillColor("#111827"); doc.text("   " + String(item), doc.x + 10, y - 4).moveDown(0.1); }); doc.moveDown(0.3); }

function drawTwoColumns(doc, text, { margin = 48, gutter = 18, top = 84, bottom = 60 } = {}) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const colW = (pageW - margin * 2 - gutter) / 2;

  let cursorX = margin;
  let cursorY = Math.max(doc.y, top);

  const parts = safe(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const para of parts) {
    if (cursorY > pageH - bottom - 40) {
      if (cursorX === margin) { cursorX = margin + colW + gutter; cursorY = top; }
      else { doc.addPage(); cursorX = margin; cursorY = top; }
    }
    doc.text(para, cursorX, cursorY, { width: colW, align: "left" });
    cursorY = doc.y + 6;
  }
}

async function makePdfBuffer({ candidateName, jobTitle, resumeVersion, analysis, jobDescription, resumeText }) {
  const { default: PDFDocument } = await import("pdfkit");

  return await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, autoFirstPage: true });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    addHeaderFooter(doc);

    // Cover / Summary
    H1(doc, "Resume Fit Report");
    S(doc, `Candidate: ${safe(candidateName)}`);
    S(doc, `Job: ${safe(jobTitle)}`);
    if (resumeVersion) S(doc, `Resume Version: ${safe(resumeVersion)}`);
    S(doc, `Generated: ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    H2(doc, "Scores");
    P(doc, `Keyword Match Score: ${analysis?.matchScore ?? "—"}%`);
    if (analysis?.gptAnalysis?.score !== undefined) {
      P(doc, `GPT Score: ${analysis.gptAnalysis.score}`);
    }
    doc.moveDown(0.6);

    if (analysis?.gptAnalysis?.summary) {
      H2(doc, "GPT Summary");
      P(doc, safe(analysis.gptAnalysis.summary));
      doc.moveDown(0.6);
    }

    if (Array.isArray(analysis?.gptAnalysis?.strengths) && analysis.gptAnalysis.strengths.length) {
      H2(doc, "Strengths");
      bullets(doc, analysis.gptAnalysis.strengths);
    }
    if (Array.isArray(analysis?.gptAnalysis?.gaps) && analysis.gptAnalysis.gaps.length) {
      H2(doc, "Gaps");
      bullets(doc, analysis.gptAnalysis.gaps);
    }
    if (Array.isArray(analysis?.gptAnalysis?.topKeywordsToAdd) && analysis.gptAnalysis.topKeywordsToAdd.length) {
      H2(doc, "Top Keywords to Add");
      bullets(doc, analysis.gptAnalysis.topKeywordsToAdd);
    }

    H2(doc, "Details");
    S(doc, `Resume words: ${analysis?.wordsInResume ?? "—"} · JD words: ${analysis?.wordsInJD ?? "—"}`);
    if (analysis?.sample?.length) {
      S(doc, "Resume sample (first lines):");
      P(doc, analysis.sample.join("\n"));
    }

    if (jobDescription && jobDescription.trim()) {
      doc.addPage();
      H1(doc, "Full Job Description");
      drawTwoColumns(doc, jobDescription);
    }

    if (resumeText && resumeText.trim()) {
      doc.addPage();
      H1(doc, "Full Resume Text");
      drawTwoColumns(doc, resumeText);
    }

    doc.end();
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { candidateName, jobTitle, resumeVersion, analysis, jobDescription, resumeText } = body || {};
    if (!analysis) {
      return NextResponse.json({ ok: false, error: "Missing analysis payload" }, { status: 400 });
    }

    const pdf = await makePdfBuffer({
      candidateName,
      jobTitle,
      resumeVersion: safe(resumeVersion),
      analysis,
      jobDescription: safe(jobDescription),
      resumeText: safe(resumeText),
    });

    const filename = `resume-fit-report-${Date.now()}.pdf`;
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("/api/export-report error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

import PDFDocument from "pdfkit";
import { Readable } from "stream";

let lastFeedback = null;
export function saveFeedback(fb) {
  lastFeedback = fb;
}

export async function GET() {
  if (!lastFeedback) {
    return new Response(JSON.stringify({ error: "No feedback to download" }), {
      status: 400,
    });
  }

  const doc = new PDFDocument({ autoFirstPage: false });
  const stream = new Readable({ read() {} });
  doc.pipe(stream);

  const today = new Date().toLocaleDateString();

  // ✅ Cover Page
  doc.addPage();
  doc
    .image("public/publicprofile.png", 250, 120, { width: 100 })
    .fontSize(26)
    .fillColor("#06b6d4")
    .text("Confidential Resume Report", { align: "center", underline: true })
    .moveDown(2);

  doc.fontSize(20).fillColor("black").text("Prepared for:", { align: "center" });
  doc.fontSize(24).fillColor("#06b6d4").text("Lee Mitchell", { align: "center" });
  doc.fontSize(14).fillColor("gray").text("Frontend Developer", { align: "center" });

  doc.moveDown(4);
  doc.fontSize(12).fillColor("black").text(`Date: ${today}`, { align: "center" });

  // ✅ Feedback Page
  doc.addPage();

  doc.fontSize(18).fillColor("#06b6d4").text("AI Resume Feedback", { underline: true });
  doc.moveDown();

  // --- Match Score + Progress Bar ---
  const score = parseInt(lastFeedback.matchScore) || 0;
  doc.fontSize(14).fillColor("black").text(`Match Score: ${score}%`);

  const barX = 50;
  const barY = doc.y + 10;
  const barWidth = 500;
  const barHeight = 20;

  doc.rect(barX, barY, barWidth, barHeight).fill("#e5e7eb"); // background

  const fillWidth = (barWidth * score) / 100;
  let barColor = "#22c55e"; // green
  if (score < 40) barColor = "#ef4444";
  else if (score < 70) barColor = "#facc15";

  doc.rect(barX, barY, fillWidth, barHeight).fill(barColor);
  doc.moveDown(3);

  // Strengths
  doc.fontSize(14).fillColor("#22c55e").text("✅ Strengths");
  lastFeedback.strengths.forEach((s, i) =>
    doc.fontSize(12).fillColor("black").text(`${i + 1}. ${s}`)
  );
  doc.moveDown();

  // Weaknesses
  doc.fontSize(14).fillColor("#ef4444").text("⚠ Weaknesses");
  lastFeedback.weaknesses.forEach((w, i) =>
    doc.fontSize(12).fillColor("black").text(`${i + 1}. ${w}`)
  );
  doc.moveDown();

  // Suggestions
  doc.fontSize(14).fillColor("#3b82f6").text("💡 Suggestions");
  lastFeedback.suggestions.forEach((s, i) =>
    doc.fontSize(12).fillColor("black").text(`${i + 1}. ${s}`)
  );
  doc.moveDown(3);

  // --- Pie Chart Visualization ---
  doc.fontSize(16).fillColor("black").text("📊 Feedback Distribution", { align: "left" });
  doc.moveDown(1);

  const total =
    lastFeedback.strengths.length +
    lastFeedback.weaknesses.length +
    lastFeedback.suggestions.length;

  if (total > 0) {
    const pieX = 150;
    const pieY = doc.y + 100;
    const radius = 80;

    let startAngle = 0;

    function drawSlice(count, color) {
      const angle = (count / total) * Math.PI * 2;
      doc.moveTo(pieX, pieY)
        .fillColor(color)
        .arc(
          pieX,
          pieY,
          radius,
          (startAngle * 180) / Math.PI,
          ((startAngle + angle) * 180) / Math.PI
        )
        .lineTo(pieX, pieY)
        .fill();
      startAngle += angle;
    }

    drawSlice(lastFeedback.strengths.length, "#22c55e"); // green
    drawSlice(lastFeedback.weaknesses.length, "#ef4444"); // red
    drawSlice(lastFeedback.suggestions.length, "#3b82f6"); // blue

    // Legend
    doc.fontSize(12).fillColor("black").text("Legend:", 300, pieY - 50);
    doc.fillColor("#22c55e").rect(300, pieY - 30, 10, 10).fill();
    doc.fillColor("black").text("Strengths", 320, pieY - 32);

    doc.fillColor("#ef4444").rect(300, pieY - 10, 10, 10).fill();
    doc.fillColor("black").text("Weaknesses", 320, pieY - 12);

    doc.fillColor("#3b82f6").rect(300, pieY + 10, 10, 10).fill();
    doc.fillColor("black").text("Suggestions", 320, pieY + 8);
  } else {
    doc.fontSize(12).fillColor("gray").text("No feedback items to visualize.");
  }

  // ✅ Final Recommendation Page
  doc.addPage();

  doc.fontSize(20).fillColor("#06b6d4").text("Final Recommendation", { underline: true });
  doc.moveDown(3);

  if (score >= 80) {
    doc.fontSize(26).fillColor("#22c55e").text("✅ Hire", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(14).fillColor("black").text(
      "This candidate demonstrates strong alignment with the job description, showcasing highly relevant skills and experience."
    );
  } else if (score >= 50) {
    doc.fontSize(26).fillColor("#facc15").text("🟨 Consider", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(14).fillColor("black").text(
      "This candidate shows partial alignment with the role. Consider interviewing to further assess potential and fit."
    );
  } else {
    doc.fontSize(26).fillColor("#ef4444").text("❌ Needs Improvement", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(14).fillColor("black").text(
      "This candidate does not currently align well with the job description. Major improvements are recommended before moving forward."
    );
  }

  doc.end();

  return new Response(stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=resume-feedback.pdf",
    },
  });
}

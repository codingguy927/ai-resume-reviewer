// app/report/[id]/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
} from "recharts";

export default function ReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [all, setAll] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("aiResumeSaved") || "[]");
      setAll(saved);
      const found = saved.find((a) => a.id === id);
      setItem(found || null);
    } catch {
      setItem(null);
    }
  }, [id]);

  const chartData = useMemo(() => {
    // Build a small trend from *all* saved analyses (same user context)
    // newest first in storage; reverse for chronological
    const grouped = {};
    [...all].reverse().forEach((a) => {
      const d = new Date(a.createdAt || Date.now()).toLocaleDateString();
      grouped[d] = a.score;
    });
    return Object.entries(grouped).map(([date, score]) => ({ date, score }));
  }, [all]);

  if (item === null) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full rounded-2xl border p-6 text-center">
          <h1 className="text-xl font-semibold">Report not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            This link doesn’t match any saved analysis in your browser.
          </p>
          <div className="mt-4 flex gap-2 justify-center">
            <button
              onClick={() => router.push("/")}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-black/5"
            >
              Back to app
            </button>
            <button
              onClick={() => router.push("/reports")}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-black/5"
            >
              View all saved
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 text-slate-900 print:bg-white">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Resume Report</h1>
            <p className="text-sm text-slate-600">
              Generated {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="no-print flex gap-2">
            <button
              onClick={() => window.print()}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-black/5"
            >
              Print / Save PDF
            </button>
            <button
              onClick={() => router.push("/")}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-black/5"
            >
              Open App
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Summary card */}
        <section className="rounded-2xl border bg-white p-6 print-card">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold">Candidate</h2>
              <dl className="mt-2 text-sm">
                <div className="flex justify-between py-1 border-b last:border-none">
                  <dt className="text-slate-600">Name</dt>
                  <dd className="font-medium">{item.candidateName}</dd>
                </div>
                <div className="flex justify-between py-1 border-b last:border-none">
                  <dt className="text-slate-600">Target Role</dt>
                  <dd className="font-medium">{item.jobTitle}</dd>
                </div>
                <div className="flex justify-between py-1 border-b last:border-none">
                  <dt className="text-slate-600">Version</dt>
                  <dd className="font-medium">{item.resumeVersion}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-slate-600">Match Score</dt>
                  <dd className="font-semibold">{item.score}%</dd>
                </div>
              </dl>
            </div>

            {/* Trend chart */}
            <div>
              <h2 className="text-lg font-semibold">Trend</h2>
              <div className="h-44 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.95}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                    <XAxis dataKey="date" stroke="rgba(0,0,0,0.6)" />
                    <YAxis stroke="rgba(0,0,0,0.6)" />
                    <ReTooltip />
                    <Line type="monotone" dataKey="score" stroke="url(#colorScore)" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Keywords */}
        <section className="rounded-2xl border bg-white p-6 print-card">
          <h2 className="text-lg font-semibold">Keywords</h2>
          <div className="grid md:grid-cols-2 gap-6 mt-3">
            <div>
              <h3 className="text-sm font-semibold text-emerald-700">Present</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.present?.length ? item.present.map((w) => (
                  <span key={`p-${w}`} className="rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 px-3 py-1 text-xs">
                    {w}
                  </span>
                )) : <p className="text-sm text-slate-500">—</p>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-700">Missing</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.missing?.length ? item.missing.map((w) => (
                  <span key={`m-${w}`} className="rounded-full border border-rose-300 bg-rose-50 text-rose-800 px-3 py-1 text-xs">
                    {w}
                  </span>
                )) : <p className="text-sm text-slate-500">—</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Job Description */}
        <section className="rounded-2xl border bg-white p-6 print-card">
          <h2 className="text-lg font-semibold">Job Description</h2>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{item.jd}</pre>
        </section>

        {/* Resume */}
        <section className="rounded-2xl border bg-white p-6 print-card print-break">
          <h2 className="text-lg font-semibold">Resume Text</h2>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{item.resumeText}</pre>
        </section>
      </div>
    </main>
  );
}

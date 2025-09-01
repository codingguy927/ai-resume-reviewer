// app/reports/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ReportsIndex() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("aiResumeSaved") || "[]");
      setItems(saved);
    } catch {}
  }, []);

  const remove = (id) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    localStorage.setItem("aiResumeSaved", JSON.stringify(next));
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 text-slate-900">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Saved Analyses</h1>
          <Link href="/" className="rounded-lg border px-4 py-2 text-sm hover:bg-black/5">
            Open App
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {!items.length ? (
          <p className="text-slate-600">No saved analyses yet. Run one in the app and click <b>Save & Share</b>.</p>
        ) : (
          <ul className="grid md:grid-cols-2 gap-4">
            {items.map((x) => (
              <li key={x.id} className="rounded-2xl border bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{x.candidateName}</h2>
                    <p className="text-sm text-slate-600">{x.jobTitle}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(x.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm">
                      Match Score: <span className="font-semibold">{x.score}%</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/report/${x.id}`}
                      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => remove(x.id)}
                      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-black/5"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

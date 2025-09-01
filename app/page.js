// app/page.js
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  // Radar bits
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";

/* ---------------- Icons (inline SVG – no deps) ---------------- */
const IconTarget = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);
const IconFile = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M7 3h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M13 3v4h4" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconHash = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M10 3L6 21M18 3l-4 18M4 8h17M3 16h17" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const IconSun = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l-1.4-1.4M20.4 20.4 19 19M5 19l-1.4 1.4M20.4 3.6 19 5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconMoon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);
const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconX = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

/* ---------------- Keyword helpers (cleaner extraction) ---------------- */
const STOP_WORDS = new Set([
  "the","and","for","with","that","this","from","your","you","are","but","his","her","she","him",
  "have","has","had","any","all","our","their","who","will","can","may","into","over","per","via",
  "using","use","uses","ability","able","work","works","worked","team","teams","role","roles",
  "about","qualifications","requirements","preferred","responsibilities","we","us","as","to","in",
  "on","of","by","at","be","is","it","a","an","within","other","description","position","come",
  "knowledge","currently","degree","field","related","understand","industry","best","practices"
]);

const LEMMA_EXCEPT = {
  "ai-powered": "ai",
  "problem-solving": "problem-solving",
  "part-time": "part-time",
  "full-time": "full-time",
  "javascript": "javascript",
  "typescript": "typescript",
  "js": "javascript",
  "ts": "typescript",
  "programming": "programming",
  "programmer": "programmer",
  "program": "program",
  "internship": "intern",
  "internships": "intern",
  "computerscience": "computer-science",
  "computer-science": "computer-science",
  "webdev": "web-development",
  "frontend": "frontend",
  "back-end": "backend",
  "hands-on": "hands-on",
};

const normalizeWord = (w) => {
  let x = w.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9-]+$/g, "");
  if (!x) return "";
  if (LEMMA_EXCEPT[x]) return LEMMA_EXCEPT[x];

  if (!x.includes("-")) {
    if (x.endsWith("ing") && x.length > 5) x = x.slice(0, -3);
    else if (x.endsWith("ed") && x.length > 4) x = x.slice(0, -2);
    else if (x.endsWith("es") && x.length > 4) x = x.slice(0, -2);
    else if (x.endsWith("s") && x.length > 3) x = x.slice(0, -1);
  }

  if (x === "thi") x = "this";
  if (x === "variou") x = "various";
  if (x === "programm") x = "program";
  if (x === "experienc") x = "experience";
  return x;
};

const extractKeywords = (text) => {
  const raw = (text || "").match(/[a-zA-Z0-9][a-zA-Z0-9-+#.]*/g) || [];
  const normed = raw.map(normalizeWord).filter(Boolean);
  const filtered = normed.filter((w) => (w.includes("-") ? w.length > 2 : w.length > 2) && !STOP_WORDS.has(w));
  const seen = new Set();
  const uniq = [];
  for (const w of filtered) if (!seen.has(w)) { seen.add(w); uniq.push(w); }
  return uniq;
};

/* ---------------- Small count-up hook (no deps) ---------------- */
function useCountUp(target, durationMs = 600) {
  const [value, setValue] = useState(target ?? 0);
  const fromRef = useRef(target ?? 0);

  useEffect(() => {
    if (target == null) return setValue(target);
    const from = value ?? 0;
    fromRef.current = from;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (target - from) * eased);
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

/* ---------------- Heuristic suggestions ---------------- */
const suggestEdits = ({ missing, present }) => {
  const tips = [];
  const hasTesting = present.some((w) => /jest|playwright|testing|unit|e2e/.test(w));
  const needsTesting = missing.some((w) => /jest|playwright|testing|unit|e2e/.test(w));
  if (needsTesting && !hasTesting) {
    tips.push("Add a testing bullet (e.g., 'Wrote unit tests with Jest; added Playwright E2E in CI').");
  }

  const hasCI = present.some((w) => /ci|cd|vercel|pipeline|github-actions|deploy/.test(w));
  const needsCI = missing.some((w) => /ci|cd|pipeline|github-actions/.test(w));
  if (needsCI && !hasCI) {
    tips.push("Mention CI/CD (GitHub Actions, Vercel) and an outcome (faster deploys, fewer regressions).");
  }

  const hasCollab = present.some((w) => /collaborat|team|peer|review/.test(w));
  const needsCollab = missing.some((w) => /collaborat|team/.test(w));
  if (needsCollab && !hasCollab) {
    tips.push("Show collaboration: code reviews, pair programming, cross-functional work with design/PM.");
  }

  const hasCS = present.some((w) => /computer-science|data structure|algorithm/.test(w));
  const needsCS = missing.some((w) => /computer-science|fundamental|algorithm|data structure/.test(w));
  if (needsCS && !hasCS) {
    tips.push("Demonstrate CS fundamentals (Big-O, data structures) with a practical example.");
  }

  if (!tips.length) tips.push("Tighten impact: add numbers (load time ↓, users ↑, errors ↓) and shipped outcomes.");
  return tips.slice(0, 5);
};

/* ---------------- Radar helpers (define BEFORE use) ---------------- */
// Buckets used to group JD terms for radar
const BUCKETS = {
  "Frameworks/Lang": [/react|next|javascript|typescript|node|ts|js/],
  "Testing": [/jest|playwright|test|testing|unit|e2e/],
  "CI/CD & Deploy": [/ci|cd|pipeline|github-actions|vercel|deploy/],
  "Data Viz": [/chart|rechart|d3|viz/],
  "Collaboration": [/collaborat|team|peer|review|pair/],
  "Internship/Education": [/intern|computer-science|degree|university|gcu/],
};

const bucketize = (words) => {
  const out = {};
  for (const label of Object.keys(BUCKETS)) out[label] = [];
  for (const w of words) {
    let placed = false;
    for (const [label, arr] of Object.entries(BUCKETS)) {
      if (arr.some((re) => re.test(w))) { out[label].push(w); placed = true; break; }
    }
    if (!placed) { (out.Other ||= []).push(w); }
  }
  return out;
};

// Custom hook: Coverage = (present-in-bucket / jd-terms-in-bucket) * 100
const useBucketCoverage = (keywordList, presentWords) => {
  return useMemo(() => {
    if (!keywordList?.length) return [];
    const jdBuckets = bucketize(keywordList);       // required by JD
    const presentSet = new Set(presentWords || []); // what's in resume
    const rows = [];

    for (const [label, reqTerms] of Object.entries(jdBuckets)) {
      const total = reqTerms.length;
      if (!total) continue;
      const hit = reqTerms.filter((w) => presentSet.has(w)).length;
      const score = Math.round((hit / total) * 100);
      rows.push({ bucket: label, coverage: score, required: total, hit });
    }
    // keep radar compact: cap to top 6 by required size, then alpha sort
    return rows
      .sort((a, b) => b.required - a.required)
      .slice(0, 6)
      .sort((a, b) => a.bucket.localeCompare(b.bucket));
  }, [keywordList, presentWords]);
};

export default function Home() {
  // ─── Primary form state ───
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [useTextMode, setUseTextMode] = useState(true);
  const [useGPT, setUseGPT] = useState(true);
  const [candidateName, setCandidateName] = useState("Lee Mitchell");
  const [jobTitle, setJobTitle] = useState("Frontend Developer – React/Next.js");
  const [resumeVersion, setResumeVersion] = useState("v1");

  // ─── UX state ───
  const [loading, setLoading] = useState(false);
  const [httpStatus, setHttpStatus] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [presentWords, setPresentWords] = useState([]);
  const [missingWords, setMissingWords] = useState([]);
  const [keywordList, setKeywordList] = useState([]);
  const [history, setHistory] = useState([]); // chart
  const [darkUI, setDarkUI] = useState(true);

  // New UI/feature state
  const [suggestions, setSuggestions] = useState([]);
  const [showBuckets, setShowBuckets] = useState(true);
  const [savedItems, setSavedItems] = useState([]);

  // ─── Derived ───
  const resumeWordCount = useMemo(
    () => (resumeText ? resumeText.trim().split(/\s+/).length : 0),
    [resumeText]
  );
  const jdWordCount = useMemo(
    () => (jd ? jd.trim().split(/\s+/).length : 0),
    [jd]
  );
  const displayScore = useCountUp(matchScore ?? 0, 700);

  // Resume highlight preview
  const highlightedResume = useMemo(() => {
    if (!resumeText || !presentWords.length) return null;
    const tokens = presentWords
      .slice()
      .sort((a,b)=>b.length-a.length)
      .map((w) => w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
    if (!tokens.length) return null;
    const re = new RegExp(`\\b(${tokens.join("|")})\\b`, "gi");
    return resumeText.replace(re, (m) => `[[H]]${m}[[/H]]`);
  }, [resumeText, presentWords]);

  // ─── Local storage hydrate ───
  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem("aiResumeHistory") || "[]");
      if (Array.isArray(savedHistory)) setHistory(savedHistory);
    } catch {}
    try {
      const saved = JSON.parse(localStorage.getItem("aiResumeSaved") || "[]");
      setSavedItems(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("aiResumeHistory", JSON.stringify(history.slice(-20)));
    } catch {}
  }, [history]);

  // ─── Handlers ───
  const handleFile = (f) => {
    setFile(f);
    // If you implement PDF parsing, populate resumeText here.
  };

  const analyze = async () => {
    setLoading(true);
    setHttpStatus(null);
    try {
      await new Promise((r) => setTimeout(r, 700));

      const uniq = extractKeywords(jd);
      const resumeNorm = (resumeText || "").toLowerCase();

      const present = uniq.filter((w) => resumeNorm.includes(w));
      const missing = uniq.filter((w) => !present.includes(w));
      const score = uniq.length ? Math.round((present.length / uniq.length) * 100) : 0;

      setKeywordList(uniq.slice(0, 60));
      setPresentWords(present.slice(0, 60));
      setMissingWords(missing.slice(0, 60));
      setMatchScore(score);
      setHttpStatus(200);
      setSuggestions(suggestEdits({ missing, present }));

      const stamp = new Date().toLocaleDateString();
      setHistory((h) => [...h, { date: stamp, score }].slice(-20));
    } catch (e) {
      setHttpStatus(500);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Candidate", candidateName],
      ["Job Title", jobTitle],
      ["Resume Version", resumeVersion],
      ["Match Score (%)", matchScore ?? ""],
      [],
      ["Auto-extracted JD Keywords"],
      ...keywordList.map((k) => [k]),
      [],
      ["Present"],
      ...presentWords.map((p) => [p]),
      [],
      ["Missing"],
      ...missingWords.map((m) => [m]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-resume-analysis-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    window.print();
  };

  const copyMissing = async () => {
    try {
      await navigator.clipboard.writeText(missingWords.join(", "));
      alert("Missing keywords copied!");
    } catch {
      alert("Could not copy to clipboard.");
    }
  };

  // Save current analysis and copy shareable link
  const saveAndShare = async () => {
    if (matchScore == null) return alert("Run an analysis first.");
    const analysis = {
      id: crypto.randomUUID(),
      candidateName,
      jobTitle,
      resumeVersion,
      resumeText,
      jd,
      score: matchScore,
      present: presentWords,
      missing: missingWords,
      createdAt: Date.now(),
    };
    try {
      const all = JSON.parse(localStorage.getItem("aiResumeSaved") || "[]");
      const next = [analysis, ...all];
      localStorage.setItem("aiResumeSaved", JSON.stringify(next));
      setSavedItems(next);
      const shareUrl = `${location.origin}/report/${analysis.id}`;
      await navigator.clipboard.writeText(shareUrl);
      alert("Saved! Link copied to clipboard:\n" + shareUrl);
    } catch (e) {
      console.error(e);
      alert("Couldn't save to your browser storage.");
    }
  };

  // ─── Derived data (charts) ───
  const chartData = useMemo(() => {
    const grouped = history.reduce((acc, cur) => {
      acc[cur.date] = cur.score;
      return acc;
    }, {});
    return Object.entries(grouped).map(([date, score]) => ({ date, score }));
  }, [history]);

  const radarData = useBucketCoverage(keywordList, presentWords);

  /* ---------------- UI ---------------- */
  return (
    <main
      className={[
        "min-h-screen text-slate-100 transition-colors",
        darkUI
          ? "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950"
          : "bg-gradient-to-b from-slate-100 via-white to-slate-100 text-slate-900",
      ].join(" ")}
    >
      {/* Top bar */}
      <header className={`sticky top-0 z-20 backdrop-blur border-b ${darkUI ? "supports-[backdrop-filter]:bg-slate-900/70 bg-slate-900/90 border-white/10" : "supports-[backdrop-filter]:bg-white/70 bg-white/90 border-black/10"}`}>
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              AI Resume Reviewer
            </h1>
            <p className={`text-sm ${darkUI ? "text-slate-300/90" : "text-slate-600"}`}>
              Compare your resume to any job description and get a clean, shareable analysis.
            </p>
          </div>

          {/* Right controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setDarkUI((v) => !v)}
              className={`rounded-xl px-3 py-2 border text-sm inline-flex items-center gap-2 ${darkUI ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-black/5 border-black/10 hover:bg-black/10"}`}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {darkUI ? (
                <>
                  <IconSun className="w-4 h-4" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <IconMoon className="w-4 h-4" />
                  <span>Dark</span>
                </>
              )}
            </button>

            {/* Identity chips */}
            <div className={`rounded-xl px-3 py-2 border ${darkUI ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
              <label className={`block text-[10px] uppercase tracking-wider ${darkUI ? "text-slate-400" : "text-slate-500"}`}>
                Name
              </label>
              <input
                className="bg-transparent outline-none text-sm"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
              />
            </div>
            <div className={`rounded-xl px-3 py-2 border min-w-[220px] ${darkUI ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
              <label className={`block text-[10px] uppercase tracking-wider ${darkUI ? "text-slate-400" : "text-slate-500"}`}>
                Target Role
              </label>
              <input
                className="bg-transparent outline-none text-sm w-full"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className={`rounded-xl px-3 py-2 border ${darkUI ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
              <label className={`block text-[10px] uppercase tracking-wider ${darkUI ? "text-slate-400" : "text-slate-500"}`}>
                Version
              </label>
              <input
                className="bg-transparent outline-none text-sm w-20"
                value={resumeVersion}
                onChange={(e) => setResumeVersion(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <section className="space-y-6">
          {/* Mode & Actions card */}
          <div className={`rounded-2xl border p-4 md:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${darkUI ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs ${darkUI ? "text-slate-300" : "text-slate-600"}`}>Mode:</span>
                <div className={`inline-flex rounded-xl overflow-hidden border ${darkUI ? "border-white/10" : "border-black/10"}`}>
                  <button
                    onClick={() => setUseTextMode(true)}
                    className={`px-3 py-1.5 text-sm ${useTextMode ? (darkUI ? "bg-white/10" : "bg-black/5") : "bg-transparent"}`}
                  >
                    Paste Resume Text
                  </button>
                  <button
                    onClick={() => setUseTextMode(false)}
                    className={`px-3 py-1.5 text-sm ${!useTextMode ? (darkUI ? "bg-white/10" : "bg-black/5") : "bg-transparent"}`}
                  >
                    Upload PDF
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useGPT}
                    onChange={(e) => setUseGPT(e.target.checked)}
                    className="h-4 w-4 accent-indigo-400"
                  />
                  Use GPT analysis (strengths, gaps, keywords, summary)
                </label>

                <button
                  onClick={analyze}
                  disabled={loading || (!resumeText && useTextMode) || (!file && !useTextMode) || !jd}
                  className="rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 px-4 py-2 text-sm font-medium transition"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full animate-pulse bg-white/70" />
                      <span className="h-3 w-16 rounded animate-pulse bg-white/60" />
                    </span>
                  ) : (
                    "Upload & Analyze"
                  )}
                </button>
              </div>
            </div>

            {/* Status line */}
            <div className={`mt-3 text-xs ${darkUI ? "text-slate-400" : "text-slate-500"}`}>
              {typeof httpStatus === "number" && <span>HTTP status: {httpStatus}</span>}
            </div>
          </div>

          {/* Resume input card */}
          <div className={`rounded-2xl border p-4 md:p-5 ${darkUI ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Your Resume</h2>
              <div className={`text-xs ${darkUI ? "text-slate-400" : "text-slate-500"}`}>
                {useTextMode ? `Words: ${resumeWordCount}` : file ? file.name : "No file selected"}
              </div>
            </div>

            {useTextMode ? (
              <>
                <textarea
                  className={`mt-3 w-full h-48 rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 ${darkUI ? "bg-slate-900/50 border-white/10" : "bg-white border-black/10"}`}
                  placeholder="Paste resume text instead of PDF"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
                {highlightedResume && (
                  <div className={`mt-4 rounded-xl border p-3 text-sm ${darkUI ? "border-white/10 bg-slate-900/40" : "border-black/10 bg-slate-50"}`}>
                    <div className="text-xs mb-2 opacity-75">Highlight preview</div>
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: highlightedResume
                            .replaceAll("[[H]]", '<mark class="bg-emerald-400/30 rounded px-0.5">')
                            .replaceAll("[[/H]]", "</mark>")
                            .replace(/\n/g, "<br/>"),
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-3">
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <div className={`w-full rounded-xl border border-dashed p-6 text-center hover:opacity-90 ${darkUI ? "border-white/15 bg-white/5" : "border-black/15 bg-black/5"}`}>
                    <p className="text-sm">
                      {file ? <span className={darkUI ? "text-slate-200" : "text-slate-800"}>{file.name}</span> : "Click to choose a PDF resume"}
                    </p>
                    <p className={`text-xs mt-1 ${darkUI ? "text-slate-400" : "text-slate-500"}`}>Max 10 MB</p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* JD input card */}
          <div className={`rounded-2xl border p-4 md:p-5 ${darkUI ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Job Description</h2>
              <div className={`text-xs ${darkUI ? "text-slate-400" : "text-slate-500"}`}>Words: {jdWordCount}</div>
            </div>
            <textarea
              className={`mt-3 w-full h-40 rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 ${darkUI ? "bg-slate-900/50 border-white/10" : "bg-white border-black/10"}`}
              placeholder="Paste the job description here…"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </div>
        </section>

        {/* Right: Results */}
        <section className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`rounded-2xl border p-4 shadow-lg bg-gradient-to-br ${darkUI ? "from-indigo-600/20 to-indigo-900/30 border-indigo-500/20" : "from-indigo-300/30 to-indigo-500/10 border-indigo-500/30"}`}>
              <div className="flex items-center gap-3">
                <IconTarget className="w-6 h-6 text-indigo-400" />
                <div>
                  <p className={`text-xs uppercase ${darkUI ? "text-slate-400" : "text-slate-600"}`}>Match Score</p>
                  <p className="mt-1 text-3xl font-semibold">{matchScore !== null ? `${displayScore}%` : "—"}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 shadow-lg bg-gradient-to-br ${darkUI ? "from-emerald-600/20 to-emerald-900/30 border-emerald-500/20" : "from-emerald-300/30 to-emerald-500/10 border-emerald-500/30"}`}>
              <div className="flex items-center gap-3">
                <IconFile className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className={`text-xs uppercase ${darkUI ? "text-slate-400" : "text-slate-600"}`}>Resume Words</p>
                  <p className="mt-1 text-3xl font-semibold">{resumeWordCount}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 shadow-lg bg-gradient-to-br ${darkUI ? "from-amber-600/20 to-amber-900/30 border-amber-500/20" : "from-amber-300/30 to-amber-500/10 border-amber-500/30"}`}>
              <div className="flex items-center gap-3">
                <IconHash className="w-6 h-6 text-amber-400" />
                <div>
                  <p className={`text-xs uppercase ${darkUI ? "text-slate-400" : "text-slate-600"}`}>JD Words</p>
                  <p className="mt-1 text-3xl font-semibold">{jdWordCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions row */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={saveAndShare}
              disabled={matchScore === null}
              className={`rounded-xl border px-4 py-2 text-sm disabled:opacity-40 ${darkUI ? "bg-white/10 hover:bg-white/15 border-white/10" : "bg-black/5 hover:bg-black/10 border-black/10"}`}
            >
              Save & Share
            </button>
            <button
              onClick={exportCSV}
              disabled={matchScore === null}
              className={`rounded-xl border px-4 py-2 text-sm disabled:opacity-40 ${darkUI ? "bg-white/10 hover:bg-white/15 border-white/10" : "bg-black/5 hover:bg-black/10 border-black/10"}`}
            >
              Export CSV
            </button>
            <button
              onClick={exportPDF}
              disabled={matchScore === null}
              className={`rounded-xl border px-4 py-2 text-sm disabled:opacity-40 ${darkUI ? "bg-white/10 hover:bg-white/15 border-white/10" : "bg-black/5 hover:bg-black/10 border-black/10"}`}
            >
              Export PDF
            </button>
            <button
              onClick={copyMissing}
              disabled={!missingWords.length}
              className={`rounded-xl border px-4 py-2 text-sm disabled:opacity-40 ${darkUI ? "bg-white/10 hover:bg-white/15 border-white/10" : "bg-black/5 hover:bg-black/10 border-black/10"}`}
            >
              Copy Missing Keywords
            </button>
          </div>

          {/* Radar */}
          <div className={`rounded-2xl border p-4 md:p-5 ${darkUI ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Skill Coverage (by category)</h3>
              <span className={`text-xs ${darkUI ? "text-slate-400" : "text-slate-500"}`}>
                Based on JD vs your resume
              </span>
            </div>

            {!radarData.length ? (
              <p className={`mt-2 text-sm ${darkUI ? "text-slate-300/80" : "text-slate-600"}`}>
                Run an analysis to generate coverage.
              </p>
            ) : (
              <div className="h-72 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="bucket" tick={{ fill: darkUI ? "#cbd5e1" : "#334155", fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: darkUI ? "#cbd5e1" : "#334155", fontSize: 11 }} />
                    <Radar
                      name="Coverage"
                      dataKey="coverage"
                      stroke={darkUI ? "#818cf8" : "#4f46e5"}
                      fill={darkUI ? "#818cf8" : "#4f46e5"}
                      fillOpacity={0.35}
                    />
                    <Legend wrapperStyle={{ color: darkUI ? "#e2e8f0" : "#0f172a", fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>

                {/* Tiny caption with details */}
                <div className={`mt-3 grid sm:grid-cols-2 gap-2 text-xs ${darkUI ? "text-slate-300/80" : "text-slate-600"}`}>
                  {radarData.map((r) => (
                    <div key={r.bucket} className="flex justify-between">
                      <span>{r.bucket}</span>
                      <span>{r.hit}/{r.required} matched · {r.coverage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Line Chart */}
          <div className={`rounded-2xl border p-4 md:p-5 ${darkUI ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
            <h3 className="text-base font-semibold">Match Score Trend</h3>
            <div className={`h-48 mt-3 ${loading ? "animate-pulse" : ""}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.95}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkUI ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"} />
                  <XAxis dataKey="date" stroke={darkUI ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"} />
                  <YAxis stroke={darkUI ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"} />
                  <ReTooltip
                    contentStyle={{
                      background: darkUI ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
                      border: darkUI ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                      borderRadius: "0.75rem",
                      color: darkUI ? "#e2e8f0" : "#0f172a",
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="url(#colorScore)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Keywords (with bucket toggle) */}
          <div className={`rounded-2xl border p-4 md:p-5 space-y-5 ${darkUI ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Auto-extracted JD Keywords</h3>
              <label className="text-sm inline-flex items-center gap-2">
                <input type="checkbox" checked={showBuckets} onChange={(e)=>setShowBuckets(e.target.checked)} />
                Group by category
              </label>
            </div>

            {!keywordList.length ? (
              <p className={`text-sm ${darkUI ? "text-slate-300/80" : "text-slate-600"}`}>Run an analysis to see keywords.</p>
            ) : showBuckets ? (
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(bucketize(keywordList)).map(([label, arr]) => (
                  <div key={label}>
                    <div className="text-xs uppercase opacity-70 mb-2">{label}</div>
                    <div className="flex flex-wrap gap-2">
                      {arr.map((k) => (
                        <span key={`kw-${label}-${k}`} className={`rounded-full border px-3 py-1 text-xs ${darkUI ? "border-white/10 bg-slate-900/40" : "border-black/10 bg-black/5"}`}>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {keywordList.map((k) => (
                  <span key={`kw-${k}`} className={`rounded-full border px-3 py-1 text-xs ${darkUI ? "border-white/10 bg-slate-900/40" : "border-black/10 bg-black/5"}`}>
                    {k}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <IconCheck className="w-4 h-4" /> Present
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {presentWords.length ? (
                    presentWords.map((w) => (
                      <span
                        key={`p-${w}`}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200"
                      >
                        <IconCheck className="w-3 h-3" /> {w}
                      </span>
                    ))
                  ) : (
                    <p className={`text-xs ${darkUI ? "text-slate-400" : "text-slate-500"}`}>—</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
                  <IconX className="w-4 h-4" /> Missing
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {missingWords.length ? (
                    missingWords.map((w) => (
                      <span
                        key={`m-${w}`}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs text-rose-200"
                      >
                        <IconX className="w-3 h-3" /> {w}
                      </span>
                    ))
                  ) : (
                    <p className={`text-xs ${darkUI ? "text-slate-400" : "text-slate-500"}`}>—</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI-style Suggestions */}
          <div className={`rounded-2xl border p-4 md:p-5 ${darkUI ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Suggested Edits</h3>
              <button
                onClick={() => navigator.clipboard.writeText(suggestions.join("\n"))}
                disabled={!suggestions.length}
                className={`text-sm rounded-xl border px-3 py-1.5 disabled:opacity-40 ${darkUI ? "bg-white/10 hover:bg-white/15 border-white/10" : "bg-black/5 hover:bg-black/10 border-black/10"}`}
              >
                Copy all
              </button>
            </div>
            {!suggestions.length ? (
              <p className={`mt-2 text-sm ${darkUI ? "text-slate-300/80" : "text-slate-600"}`}>
                Run an analysis to see targeted edit suggestions.
              </p>
            ) : (
              <ul className={`mt-3 space-y-2 text-sm ${darkUI ? "text-slate-200" : "text-slate-700"} list-disc list-inside`}>
                {suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          </div>

          {/* Recent Reports Sidebar */}
          <div className={`rounded-2xl border p-4 md:p-5 ${darkUI ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Recent Reports</h3>
              <a href="/reports" className="text-sm underline">View all</a>
            </div>
            {!savedItems.length ? (
              <p className={`mt-2 text-sm ${darkUI ? "text-slate-300/80" : "text-slate-600"}`}>No saved items yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {savedItems.slice(0,5).map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-2">
                    <div className="truncate">
                      <div className="font-medium truncate">{x.jobTitle}</div>
                      <div className="text-xs opacity-70">{new Date(x.createdAt).toLocaleDateString()} · {x.score}%</div>
                    </div>
                    <a href={`/report/${x.id}`} className={`rounded-lg border px-2 py-1 text-xs ${darkUI ? "hover:bg-white/10 border-white/10" : "hover:bg-black/5 border-black/10"}`}>View</a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tips */}
          <div className={`rounded-2xl border p-4 md:p-5 ${darkUI ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
            <h3 className="text-base font-semibold">Tips</h3>
            <ul className={`mt-3 space-y-2 text-sm ${darkUI ? "text-slate-300/90" : "text-slate-700"} list-disc list-inside`}>
              <li>Add 2–3 truly missing, relevant keywords naturally into your resume bullets.</li>
              <li>Keep bullets outcome-focused (numbers, impact, shipped features).</li>
              <li>Save/compare multiple roles to watch the trend line improve Turn on.</li>
            </ul>
          </div>
        </section>
      </div>

      <footer className={`mx-auto max-w-7xl px-4 pb-10 pt-4 text-center text-xs ${darkUI ? "text-slate-400" : "text-slate-600"}`}>
        Built with Next.js, Tailwind, and Recharts.
      </footer>
    </main>
  );
}

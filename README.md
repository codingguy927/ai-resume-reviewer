# 📝 AI Resume Reviewer

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI%20API-GPT--4o--mini-blue?logo=openai)](https://platform.openai.com/)

📍 **Live Demo**: [ai-resume-reviewer.vercel.app](https://ai-resume-reviewer.vercel.app)

---

## 🚀 Overview

**AI Resume Reviewer** is a web app that analyzes resumes against job descriptions using AI.  
It extracts text from uploaded PDFs, compares it with a given job description, and generates structured feedback including:

- ✅ Strengths  
- ⚠️ Weaknesses  
- 💡 Suggestions for improvement  
- 📊 Skills with match scores  
- 🔢 Overall match score (0–100)

This project demonstrates **full-stack skills** with Next.js (App Router), API routes, Tailwind CSS v4, Vercel deployment, and OpenAI integration.

---

## ✨ Features

- 📂 **Upload Resume (PDF)** — extract text using `pdf-parse`  
- 📝 **Paste Job Description** — directly compare to JD text  
- 🤖 **AI Feedback** — strengths, weaknesses, suggestions, JSON-structured  
- 📊 **Skill Match Chart** — visualize resume vs. JD skills with Recharts  
- 💾 **Export Report** — download results as CSV or PDF  
- 🌙 **Dark Mode** — built-in theme switching  
- ⚡ **Deployed on Vercel** — fast, serverless deployment

---

## 🖼️ Screenshots

> _(Replace these with real screenshots of your app UI)_

![Upload & Analysis UI](./public/screenshot-upload.png)  
*Upload your resume and paste a job description.*

![AI Feedback](./public/screenshot-feedback.png)  
*AI-powered JSON feedback displayed clearly in the dashboard.*

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15 (App Router)](https://nextjs.org/), [React 19](https://react.dev/), [TailwindCSS 4](https://tailwindcss.com/)  
- **Backend**: Next.js API Routes (Node runtime)  
- **AI**: [OpenAI GPT-4o-mini](https://platform.openai.com/docs/models)  
- **PDF Parsing**: [pdf-parse](https://www.npmjs.com/package/pdf-parse)  
- **Data Viz**: [Recharts](https://recharts.org/en-US/)  
- **Deployment**: [Vercel](https://vercel.com/)

---

## ⚙️ Getting Started

Clone and run locally:

```bash
git clone https://github.com/codingguy927/ai-resume-reviewer.git
cd ai-resume-reviewer
npm install

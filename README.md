<div align="center">
  <img src="./assets/banner.jpg" alt="LMS PDF Downloader Banner" width="100%" max-width="800px"/>

  <h1>LMS PDF Downloader</h1>
  
  <p><strong>A beautifully automated, privacy-first tool to extract and organise course PDFs from your LMS.</strong></p>

  <p>
    <a href="https://github.com/Adeolu05/lms-pdf-downloader"><img src="https://img.shields.io/badge/Status-Active-success.svg?style=flat-square" alt="Status" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18%2B-green.svg?style=flat-square" alt="Node Version" /></a>
    <a href="https://playwright.dev/"><img src="https://img.shields.io/badge/Powered%20By-Playwright-2EAD33.svg?style=flat-square" alt="Playwright" /></a>
    <a href="/docs/design-system.md"><img src="https://img.shields.io/badge/UI-Next.js%20%7C%20Tailwind-black.svg?style=flat-square" alt="Modern Stack" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License" /></a>
  </p>
</div>

---

## 🎯 The Problem
As a student, you log into your Learning Management System (Canvas, Blackboard, Moodle), click into a course, navigate to a module, open a resource page, view the embedded PDF, and finally click "Download". Repeat this 40 times for all your lectures.

**LMS PDF Downloader automates the entire process.** Connect your session, paste a link, and watch as it recursively scans your courses, extracts the literal PDF files (bypassing the LMS wrappers), and downloads everything into perfectly structured folders local to your machine. 

## 🎬 See it in Action

![Demo GIF](./assets/demo.gif)

### ✨ Stunning Web Interface

<p align="center">
  <img src="./assets/screenshots/home-page.png" alt="Home Page" width="80%"/>
</p>
<p align="center">
  <img src="./assets/screenshots/course-page.png" alt="Courses Page" width="80%"/>
</p>
<p align="center">
  <img src="./assets/screenshots/progress-page.png" alt="Progress Page" width="80%"/>
</p>

## ✨ Signature Feature: Smart Organisation Preview

Before a single file is pulled, you get a clean, visual representation of what your hard drive is going to look like. No more dumping 50 loosely-named files like `lec_1_final_v2(1).pdf` into your Downloads folder.

<p align="center">
  <img src="./assets/smart-organisation.png" alt="Smart Organisation Preview" width="90%"/>
</p>

Everything is cleaned, sanitised, and sorted the exact moment it touches your disk.

## 🚀 Key Features

* **Premium Next.js Web Dashboard:** A delightful, interactive, dark-terminal-themed UI built with strict design principles. 
* **Privacy-First Operations:** Zero-knowledge architecture. You login on your own machine. We do not store your passwords. Your cookies stay local.
* **Direct PDF Extraction:** Intelligently bypasses embedded PDF iframes and middleman "click here to open" resource pages.
* **Resumable Batch Downloads:** Queue up 5 courses at once. If it crashes or you stop it, it perfectly resumes where it left off by skipping existing files.
* **Stringent Filename Sanitisation:** Prevents OS path length errors and removes hidden LMS accessibility garbage tags automatically.

---

## 🏃 Quick Start (Web Interface)

> **Note:** The recommended way to run this tool is via the built-in Next.js web application.

### 1. Prerequisites
Ensure you have [Node.js 18+](https://nodejs.org/) installed.

### 2. Install & Run
Clone the repository and install dependencies, including the Playwright browser engine:

```bash
git clone https://github.com/Adeolu05/lms-pdf-downloader.git
cd lms-pdf-downloader
npm install
npx playwright install chromium
npm run dev
```

### 3. Usage
- Open **http://localhost:3000** in your browser.
- Click **"Login to LMS"**. A Chromium window will appear. Log in to your university portal normally. 
- Return to the terminal and press `ENTER` to snapshot your secure, local session.
- Paste your course URLs into the dashboard and hit **Download Materials**.
- Watch the live terminal logs stream as your folders populate!

---

## 💻 CLI Usage (Headless Mode)

If you prefer operating strictly from the terminal or want to set up CRON jobs, the core engine supports direct headless execution.

**Step 1:** Establish a local session (opens browser for manual login):
```bash
npm run core:login -- "https://lms.university.edu/course/123"
```
**Step 2:** Trigger the headless downloader:
```bash
npm run core:start -- "https://lms.university.edu/course/123"
```

---

## 🛠 Tech Stack

* **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons.
* **Automation Automation:** Node.js, Playwright.
* **Architecture:** Tightly decoupled `/core` (Node) and `/app` (React) allowing the UI to interact purely through Next.js API routes.

## 📁 Repository Structure

```text
lms-pdf-downloader/
├── app/                # Next.js App Router (Frontend Pages & API)
├── components/         # Reusable React UI (features/, layout/, ui/)
├── core/               # Automation Engine (Playwright scripts)
├── lib/                # Shared utilities, React Context, Design Tokens
├── docs/               # Project documentation & Architecture
├── assets/             # Media assets for marketing/README
├── downloads/          # Local output directory for PDFs (gitignored)
└── sessions/           # Local Auth State storage (gitignored)
```

## 🎨 Design System

We take our aesthetics seriously. This project implements a formal `docs/design-system.md` adhering to a strict 2px-border, hard-shadow Neo-brutalist (yet warm) interaction language. See `lib/design-tokens.ts` for the exact metrics.

## 🛣 Roadmap

- [x] Persistent login session state
- [x] Intelligent direct PDF extraction
- [x] Resumable queue architecture
- [x] Beautiful Next.js User Interface
- [x] Smart Organisation / Batch Course Support
- [ ] Export to Notion / Google Drive integration
- [ ] Desktop App binary generation (Electron / Tauri)

## 🤝 Contributing

We welcome contributions! The separation of concerns makes this codebase highly approachable. 
* To tweak the frontend, stick to `/app` and `/components`. 
* To fix an LMS scraping bug when Canvas updates their DOM, stick to `/core/downloader.js`.

Please read our `docs/architecture.md` before submitting major Pull Requests.

## 📜 License

[MIT License](LICENSE)

## 👤 Author

Built by **David Peluola**


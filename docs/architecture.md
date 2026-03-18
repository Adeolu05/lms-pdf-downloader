# Architecture Overview

LMS PDF Downloader is architected as a hybrid application connecting a modern Next.js React frontend to a powerful Node.js/Playwright automation backend.

## 📁 Repository Structure

```text
lms-pdf-downloader/
├── app/                # Next.js App Router (Frontend Pages & API)
├── components/         # Reusable React UI & Feature components
├── core/               # Automation Engine (Playwright scripts)
├── lib/                # Shared utilities, constants, React Context
├── docs/               # Project documentation (Architecture, Design System)
├── assets/             # Media assets for marketing/README
├── downloads/          # Local output directory for PDFs (gitignored)
└── sessions/           # Local Auth State storage (gitignored)
```

## 🏗️ Core Segments

### 1. The Frontend (`/app`, `/components`)
Built with **Next.js 14 (App Router)** and **Tailwind CSS**.
- Leverages React Context (`lib/context.tsx`) to manage global state (courses, session status, logs, progress).
- Uses a tightly controlled design system defined in `tailwind.config.js` and `docs/design-system.md`.
- Components are broadly split into `/ui` (dumb, reusable base elements) and `/features` (domain-specific, state-aware components like `CourseCard` or `LogPanel`).

### 2. The Automation Engine (`/core`)
Built with **Node.js** and **Playwright**.
- **`session-manager.js`**: Handles the initial login flow. Spawns a visible Chromium instance, waits for the user to reach the target domain, and dumps the authentication cookies into `sessions/storageState.json`.
- **`downloader.js`**: Re-uses the saved `storageState.json` to navigate LMS course pages headlessly. It isolates PDF links, handles nested iframe/resource pages, cleans filenames to avoid OS pathing errors, and saves chunks iteratively.

### 3. The Bridge (Integration)
Currently, the frontend and automation engine run via Next.js API routes (or local dev scripts), allowing the React UI to trigger the Node.js Playwright processes and stream `stdout`/`stderr` logs back to the user interface in real-time.

## 🔒 Security & Privacy Model
- **Zero-knowledge**: The application has no database. It does not store passwords or user data.
- **Local-only**: The `sessions/storageState.json` file remains locally on the user's machine. It is strongly `.gitignore`d.
- **Ephemeral**: The user logs in securely using their own browser context. The script simply borrows the active session token to perform authorised, user-initiated actions.

## 🚀 Scalability / Next Steps
The strict separation of `/core` logic from `/app` UI ensures that if the LMS scraping logic needs to be updated (e.g. Moodle changes their DOM), the frontend remains completely untouched. 

*If converting this to an Electron or Tauri desktop app in the future, the `/core` scripts can be ported directly into the native backend layer, while the Next.js static export acts as the window UI.*

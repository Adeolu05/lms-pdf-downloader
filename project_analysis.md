# LMS PDF Downloader — Full Project Analysis

> **Purpose of this document**: A comprehensive handoff guide for an external AI assistant to continue building this project. Every file, every flow, every connection is documented.

---

## 1. What the App Does (End-to-End)

The **LMS PDF Downloader** is a **desktop-first student productivity tool** that automates downloading PDF course materials from the **Miva University LMS** (a Moodle-based platform). The complete flow:

1. **Login** — The user clicks "Login to LMS" in the app. This launches a real Chromium browser (via Playwright) pointed at `https://lms.miva.university/`. The user manually logs in using their credentials in that browser window.
2. **Session Capture** — Once logged in, the user returns to the app and clicks "Confirm Login Ready". The app validates the session (checks cookies, confirms user is past the login page) and saves the browser's storage state (cookies, localStorage) to [sessions/storageState.json](file:///c:/Users/USER/Projects/lms-pdf-downloader/sessions/storageState.json).
3. **Course Input** — The user pastes one or more LMS course page URLs into the app. Each URL is added to a local list and displayed as a card.
4. **Download Trigger** — The user clicks "Download Materials". This POSTs all course URLs to a backend API endpoint which launches the Playwright-based downloader engine.
5. **PDF Scanning** — For each course, the engine navigates to the course page using the saved session, scans the DOM for all elements matching the [(PDF)](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/ui/index.tsx#5-8) pattern in link text, and builds a list of PDF items.
6. **PDF Extraction** — For each PDF item, the engine navigates to the item's page and attempts to extract the actual PDF source URL by checking (in order): direct URL redirects, iframes, embeds, objects, and anchor elements.
7. **File Download** — The extracted PDF is downloaded via Playwright's HTTP client and saved to `downloads/<CourseName>/<WeekFolder>/<CleanTitle>.pdf`. Files that already exist are skipped.
8. **Real-Time Streaming** — Throughout the entire process, the engine emits structured events (via a Node.js `EventEmitter` singleton). These events are streamed to the frontend via **Server-Sent Events (SSE)**, updating progress bars, status chips, stat counters, and a live log panel in real time.

### Target LMS
- **Miva University LMS** at `https://lms.miva.university/` (Moodle-based)
- CSS selectors in [core/config.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/config.ts) are specifically tuned for Moodle's DOM structure

---

## 2. Full Project Structure

```
lms-pdf-downloader/
├── app/                          # Next.js App Router (pages + API)
│   ├── layout.tsx                # Root layout (fonts, providers, metadata)
│   ├── globals.css               # Global styles, Tailwind directives, utilities
│   ├── page.tsx                  # Welcome / Login screen
│   ├── courses/
│   │   └── page.tsx              # Course Input screen
│   ├── progress/
│   │   └── page.tsx              # Download Progress screen
│   └── api/
│       ├── auth/
│       │   ├── check/route.ts    # GET — check if session file exists
│       │   └── login/route.ts    # POST — launch browser, PUT — verify & save session, DELETE — cancel
│       └── download/
│           ├── start/route.ts    # POST — trigger the downloader engine for queued courses
│           └── stream/route.ts   # GET — SSE endpoint streaming real-time download events
│
├── components/
│   ├── ui/
│   │   ├── index.tsx             # Shared primitives: Button, Card, Badge, cn() utility
│   │   └── SectionHeader.tsx     # Page-level heading + description component
│   ├── layout/
│   │   ├── AppShell.tsx          # Root page wrapper (header, main content, decorative bg)
│   │   └── Header.tsx            # Sticky top header with logo, nav actions, version badge
│   └── features/
│       ├── course/
│       │   └── CourseCard.tsx     # Individual course URL card (with remove button)
│       └── progress/
│           ├── ProgressCard.tsx   # Per-course download progress card (stats, bar, status, logs)
│           └── LogPanel.tsx       # Scrollable live log terminal panel
│
├── core/                         # Backend engine (runs server-side only)
│   ├── config.ts                 # All configuration: base URL, CSS selectors, timeouts, regex
│   ├── downloader.ts             # Main download engine: scan → extract → download loop
│   └── session-manager.ts        # Browser session: launch, validate cookies, save storage state
│
├── lib/                          # Shared utilities (used by both frontend + backend)
│   ├── constants.ts              # THEME object, STATUS_CONFIG map, CourseStatus type, MOCK_LOGS
│   ├── context.tsx               # React Context provider: all app state, SSE listener, API callers
│   └── events.ts                 # Singleton EventEmitter bridge (downloader → SSE stream)
│
├── sessions/                     # [gitignored] Saved browser session state (storageState.json)
├── downloads/                    # [gitignored] Downloaded PDFs organized by course/week
├── assets/
│   └── banner.jpg                # Project banner image
├── stitch/                       # Design prototypes (not part of the runtime app)
│   ├── welcome_login/
│   ├── course_input/
│   └── download_progress/
│
├── tailwind.config.js            # Tailwind theme: colour tokens, fonts, border radii, accents
├── postcss.config.js             # PostCSS plugins (tailwindcss, autoprefixer)
├── tsconfig.json                 # TypeScript config (strict mode, @/* path alias)
├── package.json                  # Dependencies, scripts
├── next-env.d.ts                 # Next.js TypeScript declarations
└── .gitignore                    # Ignores: node_modules, downloads, sessions, .env
```

### Per-File Responsibilities

| File | Role |
|---|---|
| [app/layout.tsx](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/layout.tsx) | Root layout. Loads Inter + JetBrains Mono via `next/font/google`. Wraps all pages in `<AppProvider>`. Sets `lang`, body classes, metadata. |
| [app/globals.css](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/globals.css) | Tailwind directives, `:root` CSS variables, body defaults, scrollbar styling, `.card-effect` utility class, pastel accent utilities. |
| [app/page.tsx](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/page.tsx) | **Welcome/Login** page. Displays session status (none/loading/ready), a login button, privacy info, and footer links. Calls [initiateLogin()](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/context.tsx#120-130) and [verifyLogin()](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/context.tsx#131-146) from context. |
| [app/courses/page.tsx](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/courses/page.tsx) | **Course Input** page. URL input field, "Add Course" button, list of [CourseCard](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/features/course/CourseCard.tsx#11-31)s, "Download Materials" CTA, info highlight cards. |
| [app/progress/page.tsx](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/progress/page.tsx) | **Download Progress** page. Maps over `progress[]` state to render [ProgressCard](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/features/progress/ProgressCard.tsx#21-109) components. Shows footer with speed/disk stats. Falls back to mock data when no real downloads are active. |
| [app/api/auth/check/route.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/auth/check/route.ts) | [GET](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/auth/check/route.ts#4-15) handler. Calls [checkSessionSync()](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/session-manager.ts#10-13) — returns `{status: 'ready'}` if [sessions/storageState.json](file:///c:/Users/USER/Projects/lms-pdf-downloader/sessions/storageState.json) exists, else `{status: 'none'}`. |
| [app/api/auth/login/route.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/auth/login/route.ts) | [POST](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/download/start/route.ts#4-25): launches a visible Chromium browser for the user to log in manually. [PUT](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/auth/login/route.ts#28-48): validates the session (checks cookies, confirms not on login page) and saves storage state. [DELETE](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/auth/login/route.ts#49-58): closes any active browser. Uses module-level globals (`activeBrowser`, `activeContext`, `activePage`) to track the browser instance across requests. |
| [app/api/download/start/route.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/download/start/route.ts) | [POST](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/download/start/route.ts#4-25) handler. Receives `{courses: [{id, url}]}`. Calls [runDownloader(id, url)](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/downloader.ts#18-128) for each course in a fire-and-forget loop (no `await`). Returns immediately with `{status: 'started'}`. |
| [app/api/download/stream/route.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/download/stream/route.ts) | [GET](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/auth/check/route.ts#4-15) handler. Opens an SSE (`text/event-stream`) connection. Subscribes to the `downloaderEvents` singleton. Forwards every `'event'` emission as an SSE `data:` message. Cleans up listener on connection abort. |
| [components/ui/index.tsx](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/ui/index.tsx) | Exports [Button](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/ui/index.tsx#15-19) (6 variants, 4 sizes, tactile shadow effects), [Card](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/ui/index.tsx#54-60) (white, border-2, rounded-card), [Badge](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/ui/index.tsx#61-77) (5 variants with solid pastel fills), and [cn()](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/ui/index.tsx#5-8) utility (clsx + tailwind-merge). |
| [components/ui/SectionHeader.tsx](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/ui/SectionHeader.tsx) | Reusable page heading: `<h1>` title + optional `<p>` description. Supports left/center alignment. |
| [components/layout/AppShell.tsx](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/layout/AppShell.tsx) | Root layout wrapper. Renders `<Header>`, `<main>` with configurable max-width, and pastel decorative background blobs. |
| [components/layout/Header.tsx](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/layout/Header.tsx) | Sticky top header. Logo icon (mint badge), app title, optional action slot, version badge. |
| [components/features/course/CourseCard.tsx](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/features/course/CourseCard.tsx) | Displays a single added course URL with a lilac icon, truncated URL text, course name, and a remove (trash) button. |
| [components/features/progress/ProgressCard.tsx](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/features/progress/ProgressCard.tsx) | Rich progress display per course: name, colour-coded status chip, 4-stat grid (found/downloaded/skipped/failed), mint progress bar, expandable log panel, "View folder" button when complete. |
| [components/features/progress/LogPanel.tsx](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/features/progress/LogPanel.tsx) | Terminal-style scrollable log display. Colour-codes log entries by type (info/success/warning/error/pulse). Uses JetBrains Mono. |
| [core/config.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/config.ts) | Central configuration object: base URL, CSS selectors for course pages/PDF viewers/auth detection, regex patterns, timeouts. |
| [core/downloader.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/downloader.ts) | The main engine. [runDownloader(courseId, courseUrl)](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/downloader.ts#18-128) orchestrates: browser launch → session validation → PDF scanning → per-item extraction + download → event emission throughout. |
| [core/session-manager.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/session-manager.ts) | [checkSessionSync()](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/session-manager.ts#10-13) checks if session file exists. [startLoginSession()](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/session-manager.ts#14-27) launches Playwright browser (optionally headless). [validateAndSaveSession()](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/session-manager.ts#28-54) inspects cookies/page state and persists storage state. |
| [lib/constants.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/constants.ts) | `THEME` object (all colour hex values), [CourseStatus](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/constants.ts#27-28) type, `STATUS_CONFIG` (label/variant per status), `MOCK_LOGS` (sample log entries for demo). |
| [lib/context.tsx](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/context.tsx) | React Context + Provider. Manages: `sessionStatus`, `courses[]`, `progress[]`. Contains API callers ([initiateLogin](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/context.tsx#120-130), [verifyLogin](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/context.tsx#131-146), [refreshSession](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/context.tsx#110-119), [startDownloads](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/context.tsx#161-189)). Runs an `EventSource` listener on mount that connects to `/api/download/stream` and updates `progress[]` in real time. |
| [lib/events.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/events.ts) | [DownloaderEvents](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/events.ts#7-35) — singleton class extending `EventEmitter`. The bridge between the backend download engine and the SSE API route. [emitEvent(courseId, type, data)](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/events.ts#23-34) standardizes event structure. |

---

## 3. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 14.1.0 |
| **Language** | TypeScript | ^5 |
| **UI Library** | React | ^18 |
| **Styling** | Tailwind CSS | ^3.4.1 |
| **CSS Processing** | PostCSS + Autoprefixer | ^8 / ^10 |
| **Icons** | Lucide React | ^0.344.0 |
| **CSS Utilities** | clsx + tailwind-merge | ^2.1.0 / ^2.2.1 |
| **Browser Automation** | Playwright (Chromium) | ^1.42.0 |
| **Fonts** | Inter (UI) + JetBrains Mono (logs) | via `next/font/google` |

### Key Architectural Note
This is a **full-stack Next.js app** where both the frontend and the heavy backend logic (Playwright browser automation) run within the same Next.js process. The `core/` directory contains pure server-side Node.js code that gets called from API routes. There is no separate backend server.

---

## 4. Frontend ↔ Backend Communication

### 4.1 REST API Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|---|---|---|---|---|
| [GET](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/auth/check/route.ts#4-15) | `/api/auth/check` | Check if saved session exists | — | `{status: 'ready'\|'none'}` |
| [POST](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/download/start/route.ts#4-25) | `/api/auth/login` | Launch Chromium for manual login | — | `{status: 'loading'}` |
| [PUT](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/auth/login/route.ts#28-48) | `/api/auth/login` | Validate & save login session | — | `{status: 'ready'}` or `{error}` |
| [DELETE](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/auth/login/route.ts#49-58) | `/api/auth/login` | Cancel/close active login browser | — | `{status: 'none'}` |
| [POST](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/download/start/route.ts#4-25) | `/api/download/start` | Start downloading queued courses | `{courses: [{id, url}]}` | `{status: 'started'}` |
| [GET](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/auth/check/route.ts#4-15) | `/api/download/stream` | SSE stream of real-time events | — | `text/event-stream` |

### 4.2 Real-Time Streaming Architecture

```
┌─────────────────────┐   emitEvent()   ┌──────────────────┐   SSE    ┌──────────────────┐
│  core/downloader.ts │ ──────────────→ │  lib/events.ts   │ ──────→ │ api/stream/route  │
│  (Playwright engine) │                │  (EventEmitter)  │         │ (text/event-stream)│
└─────────────────────┘                 └──────────────────┘         └────────┬─────────┘
                                                                              │
                                                                     EventSource()
                                                                              │
                                                                    ┌─────────▼─────────┐
                                                                    │  lib/context.tsx   │
                                                                    │  (React state)     │
                                                                    │  → setProgress()   │
                                                                    └───────────────────┘
```

**Event types emitted by the downloader:**

| Event Type | Data Fields | Purpose |
|---|---|---|
| `status` | `{status, total?}` | Course status change (scanning/downloading/completed/failed) |
| `progress` | `{downloaded, skipped, failed, percent}` | Numeric progress update |
| `meta` | `{name}` | Course name resolution (after page navigation) |
| `log` | `{message, type}` | Log line for the live terminal panel |
| [error](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/context.tsx#95-99) | `{message}` | Fatal error |

### 4.3 Login Flow (Detailed)

1. Frontend calls `POST /api/auth/login`
2. API route calls [startLoginSession({headless: false})](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/session-manager.ts#14-27) → launches a visible Chromium browser, navigates to `https://lms.miva.university/`
3. API route stores the `browser`, `context`, `page` in **module-level globals** (needed because the login spans multiple HTTP requests)
4. User manually logs in to the LMS in the launched browser
5. Frontend calls `PUT /api/auth/login`
6. API route calls [validateAndSaveSession(context, page)](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/session-manager.ts#28-54) — checks URL & page content aren't login forms, verifies `lms.miva.university` cookies exist, saves `storageState` to disk
7. Browser is closed, globals are reset
8. Future downloads use the saved [sessions/storageState.json](file:///c:/Users/USER/Projects/lms-pdf-downloader/sessions/storageState.json) to bypass login

---

## 5. Current UI State

### Design System
The UI uses a **warm, playful, student-friendly** aesthetic:
- Cream/off-white background (`#F4F1EB`)
- White cards with thick 2px black borders
- Pastel accents: mint green (`#A7F48B`), soft lilac (`#D8B9FF`), sky blue (`#8EC9FF`), warm yellow (`#FFE28A`)
- Bold/black-weight typography (Inter)
- Tactile buttons with offset shadow press effects
- JetBrains Mono for log panels

### Screen 1: Welcome / Login (`/`)
- Hero section with app title and description
- Connection card with a mint key icon
- Session status indicator (none → loading → ready)
- Primary CTA that adapts: "Login to LMS" → "Confirm Login Ready" → "Continue to Courses"
- Privacy notice with lilac icon badge
- Footer links (Documentation, Privacy Policy, Support — placeholder `#` hrefs)

### Screen 2: Course Input (`/courses`)
- Section header with description
- URL input field with thick black border + "Add Course" button
- "Added Courses" list header with lilac badge counter
- List of [CourseCard](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/features/course/CourseCard.tsx#11-31) components (or dashed empty-state placeholder)
- "Clear All Courses" text button + "Download Materials" primary CTA
- Two info highlight cards (Secure Scan with mint accent, Bulk Export with lilac accent)

### Screen 3: Download Progress (`/progress`)
- Section header
- Stack of [ProgressCard](file:///c:/Users/USER/Projects/lms-pdf-downloader/components/features/progress/ProgressCard.tsx#21-109) components per course:
  - Course name + coloured status chip (lilac=scanning, sky=downloading, mint=completed, pink=failed)
  - 4 stat tiles with pastel tints (Found, Downloaded, Skipped, Failed)
  - Mint green progress bar with bordered track
  - Expandable log panel (when not completed)
  - "View folder" button (when completed)
- Fixed footer with speed indicator (mint pill) and disk space (lilac pill)

---

## 6. What is Complete vs. In Progress

### ✅ Complete

| Area | Status |
|---|---|
| **Core download engine** ([core/downloader.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/downloader.ts)) | Fully functional. Scans Moodle course pages, extracts PDF URLs (multi-strategy: iframe, embed, object, anchor, direct redirect), downloads to disk with folder organization by week, skips existing files. |
| **Session management** ([core/session-manager.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/session-manager.ts)) | Fully functional. Launches browser, validates cookies/domain, saves and restores storage state. |
| **Configuration** ([core/config.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/config.ts)) | Complete. All Moodle-specific selectors, timeouts, regex patterns defined. |
| **API routes** (all 4) | Fully implemented. Auth check, login flow (POST/PUT/DELETE), download trigger, SSE streaming. |
| **Event streaming** ([lib/events.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/events.ts) + `api/download/stream`) | Fully functional. Singleton EventEmitter → SSE → React state pipeline. |
| **React Context** ([lib/context.tsx](file:///c:/Users/USER/Projects/lms-pdf-downloader/lib/context.tsx)) | Complete. Manages session, courses, progress. SSE listener on mount. All API integrations wired. |
| **All 3 UI screens** | Complete and styled with the warm/playful design system. |
| **All UI components** (8 total) | Complete: Button, Card, Badge, SectionHeader, AppShell, Header, CourseCard, ProgressCard, LogPanel. |
| **Design system** (Tailwind tokens) | Complete. Cream theme with pastel accents, thick borders, bold typography. |
| **Build** (`npm run build`) | Passes cleanly with exit code 0. |

### 🚧 In Progress / Missing

| Area | Notes |
|---|---|
| **Error handling edge cases** | The login API uses module-level globals to track the browser instance. If the Next.js server restarts mid-login, the reference is lost. No cleanup mechanism exists. |
| **Sequential download limitation** | [download/start/route.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/app/api/download/start/route.ts) calls [runDownloader()](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/downloader.ts#18-128) in a loop without `await`, meaning multiple courses start downloading simultaneously. This could overwhelm the system or cause Playwright conflicts since each call creates its own browser instance. |
| **No tests** | Zero test files exist in the project. No unit, integration, or e2e tests. |
| **Footer links are placeholders** | The Welcome page footer links (Documentation, Privacy Policy, Support) all point to `#`. |
| **"Open Downloads" button** | The button in the Progress page header logs to console but has no real file-system-open implementation. |
| **"View folder" button** | Same — it logs to console but doesn't actually open the download folder. |
| **Speed / disk display is static** | The footer in the Progress page shows hardcoded "2.4 MB/s" and "1.2 GB free" — these are not connected to real system metrics. |
| **No input validation for URLs** | The Course Input page accepts any string as a course URL. There's no validation that it's a valid URL or belongs to `lms.miva.university`. |
| **No persistence** | Added courses are only in React state. If the page is refreshed, the course list is lost. No localStorage or database. |
| **`main` field in package.json is stale** | Points to `"src/downloader.js"` which doesn't exist. This is a leftover from before the project was restructured to Next.js. |
| **`core:start` / `core:login` scripts are stale** | These npm scripts reference `core/downloader.js` and `core/session-manager.js` — the JS versions that don't exist (the actual files are [.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/next-env.d.ts) and are imported via Next.js). |
| **No `.next/` in [.gitignore](file:///c:/Users/USER/Projects/lms-pdf-downloader/.gitignore)** | The build output directory is not explicitly gitignored (though it may be handled by Next.js defaults). |
| **`stitch/` directory** | Contains empty subdirectories for design prototypes — not part of the runtime app and could be cleaned up. |
| **Gateway page handling** | The downloader has basic gateway page detection (`gatewayLink` selector in config), but the [extractPdfSource](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/downloader.ts#152-170) function in [downloader.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/downloader.ts) doesn't actively follow gateway links. This feature was explored in a previous conversation but may not be fully integrated. |
| **No loading states on buttons** | Buttons don't show spinners or disabled states during API calls (e.g., while the login browser is launching). |
| **Responsive design** | The app is desktop-first. Mobile responsiveness exists at a basic level (flex-col stacking) but hasn't been thoroughly tested or polished. |

---

## 7. Quick Reference: How to Run

```bash
# Install dependencies
npm install

# Install Playwright browsers (required for the download engine)
npx playwright install chromium

# Start the development server
npm run dev
# → http://localhost:3000

# Build for production
npm run build

# Start production server
npm start
```

### Important: Playwright Requirement
This app requires Playwright's Chromium browser to be installed on the system. The [core/downloader.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/downloader.ts) and [core/session-manager.ts](file:///c:/Users/USER/Projects/lms-pdf-downloader/core/session-manager.ts) files import from `playwright` directly and launch Chromium browser instances. Without `npx playwright install chromium`, the login and download features will fail.

# Miva LMS PDF Downloader

A local Playwright automation tool to download all PDF resources from a Miva Open University LMS course page.

## Features
- **Resumable Downloads**: Automatically skips files that already exist.
- **Direct PDF Extraction**: Bypasses the non-DOM-accessible viewer toolbar by extracting the PDF source directly from the iframe.
- **Week-based Organization**: Sorts PDFs into folders based on their week (e.g., `Week 1`, `Week 2`).
- **Filename Sanitization**: Cleans illegal Windows characters and hidden LMS accessibility text.
- **Robust Login**: Persistent manual login flow with domain-specific cookie verification.

## Prerequisites
- Node.js installed.
- Playwright installed: `npm install playwright && npx playwright install chromium`

## The TWO-STEP Process

### STEP 1: Login & Save Session
This step "locks" your browser keys to your computer so you don't have to keep logging in.
```bash
# General login (to dashboard)
npm run login

# OR: Direct-to-course login (Recommended)
node src/session-manager.js "https://lms.miva.university/course/view.php?id=336"
```
1.  Browser opens. Log in manually.
2.  Go back to the terminal and **press [ENTER]**.
3.  **Ensure success**: It must say `Success: Captured lms.miva.university cookies`.

### STEP 2: The Downloader
Once Step 1 is done, run the actual downloader script:
```bash
node src/downloader.js "https://lms.miva.university/course/view.php?id=336"
```
- This script uses the saved keys to download all PDFs.
- It will skip files you already have.

## Configuration
All selectors, timeouts, and delays are managed in `src/config.js`. If the LMS layout changes, you can update the CSS selectors there.

## Project Structure
- `src/downloader.js`: The main script to scan and download PDFs.
- `src/session-manager.js`: The script to handle manual login and capture cookies.
- `src/config.js`: Centralized configuration and selectors.
- `sessions/storageState.json`: Where your "keys" (auth state) are stored.
- `downloads/`: Where your PDFs will be saved.

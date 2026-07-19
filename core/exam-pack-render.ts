/**
 * Exam Pack HTML + PDF rendering (KaTeX math, embedded images).
 */
import fs from 'fs';
import path from 'path';
import type { QuizExtractResult } from './exam-pack';

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Allow a safe subset of Moodle/math HTML through to the booklet. */
export function sanitizeFragment(html: string): string {
    if (!html) return '';
    let h = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/javascript:/gi, '');

    // Drop Moodle UI chrome inside fragments
    h = h
        .replace(/<input[^>]*>/gi, '')
        .replace(/<button[\s\S]*?<\/button>/gi, '')
        .replace(/<i class="icon[^"]*"[^>]*>[\s\S]*?<\/i>/gi, '')
        .replace(/<span class="ms-1">\s*<\/span>/gi, '');

    return h.trim();
}

function optionClass(opt: { selected: boolean; correct: boolean }): string {
    const parts = ['opt'];
    if (opt.correct) parts.push('opt-correct');
    if (opt.selected) parts.push('opt-yours');
    return parts.join(' ');
}

export type ExamPackVariant = 'full' | 'study';

function renderQuestion(
    q: {
        number: string;
        type: string;
        state: string;
        grade: string;
        stemHtml: string;
        stem: string;
        options: Array<{
            label: string;
            text: string;
            textHtml: string;
            selected: boolean;
            correct: boolean;
        }>;
        yourAnswer: string;
        rightAnswer: string;
        rightAnswerHtml: string;
        feedback: string;
        feedbackHtml: string;
    },
    globalIndex: number,
    sourceLabel: string,
    variant: ExamPackVariant
): string {
    const study = variant === 'study';
    const stateClass = /incorrect/i.test(q.state)
        ? 'state-wrong'
        : /correct/i.test(q.state)
          ? 'state-right'
          : 'state-neutral';

    const stem = sanitizeFragment(q.stemHtml) || `<p>${escapeHtml(q.stem)}</p>`;
    const opts = q.options
        .map((opt) => {
            const body = sanitizeFragment(opt.textHtml) || escapeHtml(opt.text);
            const badges: string[] = [];
            if (!study) {
                if (opt.selected) badges.push('<span class="badge badge-yours">Your answer</span>');
                if (opt.correct) badges.push('<span class="badge badge-correct">Correct</span>');
            }
            const cls = study ? 'opt' : optionClass(opt);
            return `<div class="${cls}">
  <span class="opt-label">${escapeHtml(opt.label)}.</span>
  <div class="opt-body">${body}${badges.join(' ')}</div>
</div>`;
        })
        .join('\n');

    const right =
        sanitizeFragment(q.rightAnswerHtml) ||
        (q.rightAnswer ? escapeHtml(q.rightAnswer) : '');
    const feedback =
        sanitizeFragment(q.feedbackHtml) ||
        (q.feedback ? escapeHtml(q.feedback) : '');

    const answerBlock = study
        ? ''
        : right
          ? `<div class="q-answer"><strong>Correct answer:</strong> <span class="answer-body">${right}</span></div>`
          : q.yourAnswer
            ? `<div class="q-answer"><strong>Your answer:</strong> ${escapeHtml(q.yourAnswer)}</div>`
            : '';

    const feedbackBlock =
        study || !feedback
            ? ''
            : `<div class="q-feedback"><strong>Feedback:</strong> <div class="feedback-body">${feedback}</div></div>`;

    return `<article class="question" id="q-${globalIndex}">
  <header class="q-head">
    <span class="q-num">Q${globalIndex}</span>
    <span class="q-meta">${escapeHtml(sourceLabel)} · LMS Q${escapeHtml(q.number)}${
        q.type ? ` · ${escapeHtml(q.type)}` : ''
    }</span>
    ${!study && q.state ? `<span class="q-state ${stateClass}">${escapeHtml(q.state)}</span>` : ''}
    ${!study && q.grade ? `<span class="q-grade">${escapeHtml(q.grade)}</span>` : ''}
  </header>
  <div class="q-stem">${stem}</div>
  ${opts ? `<div class="q-options">${opts}</div>` : ''}
  ${answerBlock}
  ${feedbackBlock}
</article>`;
}

function buildAnswerKey(results: QuizExtractResult[]): string {
    const withQ = results.filter((r) => r.questions.length > 0);
    let n = 1;
    const rows: string[] = [];
    for (const r of withQ) {
        for (const q of r.questions) {
            const right =
                sanitizeFragment(q.rightAnswerHtml) ||
                (q.rightAnswer ? escapeHtml(q.rightAnswer) : '') ||
                (q.options.find((o) => o.correct)
                    ? escapeHtml(
                          `${q.options.find((o) => o.correct)!.label}. ${q.options.find((o) => o.correct)!.text}`
                      )
                    : '<em>Not shown on LMS review</em>');
            rows.push(
                `<div class="key-row"><span class="key-num">Q${n}</span> <span class="key-src">${escapeHtml(r.quiz.weekFolder)} · ${escapeHtml(r.quiz.name)}</span><div class="key-ans">${right}</div></div>`
            );
            n++;
        }
    }
    if (!rows.length) return '';
    return `<section class="section answer-key" id="answer-key">
  <h2>Answer key</h2>
  <p class="muted">Check yourself after attempting the questions above. Correct answers appear only when Moodle showed them on review.</p>
  ${rows.join('\n')}
</section>`;
}

export function buildExamPackHtml(opts: {
    courseName: string;
    courseUrl: string;
    generatedAt: string;
    results: QuizExtractResult[];
    /** absolute path to assets folder (for file:// PDF); unused if images are already relative in HTML */
    assetsDirName?: string;
    /** full = answers inline; study = questions only + answer key at end */
    variant?: ExamPackVariant;
}): string {
    const { courseName, courseUrl, generatedAt, results } = opts;
    const variant: ExamPackVariant = opts.variant || 'full';
    const study = variant === 'study';
    const totalQ = results.reduce((s, r) => s + r.questions.length, 0);
    const withQ = results.filter((r) => r.questions.length > 0);
    const titlePrefix = study ? 'Exam Pack (Study)' : 'Exam Pack';

    const tocItems = withQ
        .map((r, i) => {
            const anchor = `sec-${i}`;
            return `<li><a href="#${anchor}">${escapeHtml(r.quiz.weekFolder)} — ${escapeHtml(
                r.quiz.name
            )}</a> <span class="toc-count">${r.questions.length} Q</span></li>`;
        })
        .join('\n');

    let globalIndex = 1;
    const sections = withQ
        .map((r, i) => {
            const anchor = `sec-${i}`;
            const grade =
                !study && r.gradeSummary
                    ? `<p class="sec-grade">Attempt grade: <strong>${escapeHtml(r.gradeSummary)}</strong></p>`
                    : '';
            const qs = r.questions
                .map((q) => {
                    const html = renderQuestion(q as any, globalIndex, `${r.quiz.weekFolder}`, variant);
                    globalIndex++;
                    return html;
                })
                .join('\n');
            return `<section class="section" id="${anchor}">
  <h2>${escapeHtml(r.quiz.weekFolder)}</h2>
  <h3>${escapeHtml(r.quiz.name)}</h3>
  ${grade}
  ${qs}
</section>`;
        })
        .join('\n');

    const answerKey = study ? buildAnswerKey(results) : '';

    const skipped = results.filter((r) => r.skippedReason || !r.questions.length);
    const skippedBlock =
        skipped.length > 0
            ? `<section class="section skipped">
  <h2>Not included</h2>
  <p class="muted">No finished review attempt was available (review-only mode — no new attempts started).</p>
  <ul>
    ${skipped
        .map(
            (r) =>
                `<li>${escapeHtml(r.quiz.name)}${
                    r.skippedReason ? ` — <em>${escapeHtml(r.skippedReason)}</em>` : ''
                }</li>`
        )
        .join('\n')}
  </ul>
</section>`
            : '';

    const coverNote = study
        ? 'Study mode: answers are hidden until the Answer key at the end. Attempt questions first, then check.'
        : 'Built from your finished LMS attempts only (review mode). Math is rendered with KaTeX; diagrams and equation images are embedded when available. Correct answers appear only when Moodle showed them on review.';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(titlePrefix)} — ${escapeHtml(courseName)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous" />
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
<style>
  :root {
    --ink: #111;
    --muted: #555;
    --line: #ddd;
    --mint: #c8f0b8;
    --yellow: #ffe9a8;
    --red-soft: #ffd6d6;
    --green-soft: #d4f5d4;
    --paper: #fffef9;
  }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: var(--ink);
    background: var(--paper);
    line-height: 1.45;
    font-size: 11pt;
    margin: 0;
    padding: 0;
  }
  .page {
    max-width: 800px;
    margin: 0 auto;
    padding: 28px 32px 48px;
  }
  .cover {
    border: 3px solid #111;
    border-radius: 12px;
    padding: 28px 32px;
    margin-bottom: 28px;
    background: linear-gradient(135deg, #e8fce0 0%, #fffef9 45%, #efe6ff 100%);
  }
  .cover h1 {
    font-size: 1.75rem;
    margin: 0 0 8px;
    letter-spacing: -0.02em;
  }
  .cover .subtitle {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0 0 16px;
  }
  .cover .meta {
    font-size: 0.9rem;
    color: var(--muted);
    margin: 4px 0;
  }
  .cover .note {
    margin-top: 14px;
    padding: 10px 12px;
    background: #fff;
    border: 2px solid #111;
    border-radius: 8px;
    font-size: 0.85rem;
  }
  h2 {
    font-size: 1.25rem;
    margin: 0 0 4px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 1.05rem;
    margin: 0 0 12px;
    font-weight: 600;
    color: #222;
    page-break-after: avoid;
  }
  .toc {
    border: 2px solid #111;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 28px;
    background: #fff;
  }
  .toc h2 { margin-bottom: 10px; }
  .toc ol { margin: 0; padding-left: 1.25rem; }
  .toc li { margin: 6px 0; }
  .toc a { color: #111; text-decoration: none; font-weight: 600; }
  .toc-count {
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 500;
  }
  .section {
    margin-bottom: 28px;
    /* Prefer continuous flow; forced section breaks caused truncated/blank PDFs
       on some Chromium builds when combined with large question lists. */
    page-break-before: auto;
    break-before: auto;
  }
  .section + .section {
    margin-top: 20px;
    border-top: 2px dashed #ddd;
    padding-top: 16px;
  }
  .sec-grade { color: var(--muted); font-size: 0.9rem; margin: 0 0 14px; }
  .muted { color: var(--muted); }
  .question {
    border: 2px solid #111;
    border-radius: 10px;
    padding: 14px 16px;
    margin: 0 0 16px;
    background: #fff;
    /* Do NOT use page-break-inside:avoid here — Chromium drops overflow when a
       block is taller than one page, which produced nearly blank PDFs. */
    page-break-inside: auto;
    break-inside: auto;
  }
  .q-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--line);
  }
  .q-num {
    font-weight: 800;
    font-size: 1.05rem;
    background: #111;
    color: #fff;
    padding: 2px 10px;
    border-radius: 999px;
  }
  .q-meta { font-size: 0.8rem; color: var(--muted); }
  .q-state {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid #111;
  }
  .state-right { background: var(--green-soft); }
  .state-wrong { background: var(--red-soft); }
  .state-neutral { background: #eee; }
  .q-grade { font-size: 0.8rem; color: var(--muted); margin-left: auto; }
  .q-stem { margin: 8px 0 12px; }
  .q-stem p { margin: 0.4em 0; }
  .q-stem img, .opt-body img, .answer-body img, .feedback-body img {
    max-width: 100%;
    height: auto;
    display: inline-block;
    vertical-align: middle;
    margin: 4px 0;
  }
  .q-options { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
  .opt {
    display: flex;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #fafafa;
  }
  .opt-correct { background: var(--green-soft); border-color: #3a9a3a; }
  .opt-yours:not(.opt-correct) { background: var(--yellow); border-color: #c9a227; }
  .opt-label { font-weight: 800; min-width: 1.4em; }
  .opt-body { flex: 1; }
  .badge {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 1px 6px;
    border-radius: 4px;
    margin-left: 6px;
    border: 1px solid #111;
    vertical-align: middle;
  }
  .badge-correct { background: var(--mint); }
  .badge-yours { background: var(--yellow); }
  .q-answer, .q-feedback {
    font-size: 0.92rem;
    margin-top: 8px;
    padding: 8px 10px;
    background: #f6f6f6;
    border-radius: 8px;
    border-left: 4px solid #111;
  }
  .q-feedback { border-left-color: #6b6bff; }
  .skipped ul { padding-left: 1.2rem; }
  .answer-key .key-row {
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 8px 10px;
    margin: 0 0 8px;
    background: #fff;
    page-break-inside: avoid;
  }
  .key-num { font-weight: 800; margin-right: 8px; }
  .key-src { font-size: 0.8rem; color: var(--muted); }
  .key-ans { margin-top: 4px; }
  @media print {
    body { background: #fff; }
    .page { max-width: none; padding: 0; }
    .cover { break-inside: avoid; page-break-inside: avoid; }
    /* Allow questions to split across pages so none are clipped */
    .question { break-inside: auto; page-break-inside: auto; }
    .q-head { break-after: avoid; }
    a { color: inherit; text-decoration: none; }
  }
</style>
</head>
<body>
  <div class="page">
    <header class="cover">
      <h1>${escapeHtml(titlePrefix)}</h1>
      <p class="subtitle">${escapeHtml(courseName)}</p>
      <p class="meta"><strong>Questions:</strong> ${totalQ} from ${withQ.length} quizzes</p>
      <p class="meta"><strong>Mode:</strong> ${study ? 'Study (answers at end)' : 'Full (answers inline)'}</p>
      <p class="meta"><strong>Generated:</strong> ${escapeHtml(generatedAt)}</p>
      <p class="meta"><strong>Course:</strong> ${escapeHtml(courseUrl)}</p>
      <p class="note">${coverNote}</p>
    </header>

    <nav class="toc">
      <h2>Contents</h2>
      <ol>
        ${tocItems || '<li><em>No questions extracted</em></li>'}
        ${study && totalQ > 0 ? '<li><a href="#answer-key">Answer key</a></li>' : ''}
      </ol>
    </nav>

    ${sections}
    ${answerKey}
    ${skippedBlock}
  </div>
  <script>
    document.addEventListener("DOMContentLoaded", function () {
      if (typeof renderMathInElement === "function") {
        renderMathInElement(document.body, {
          delimiters: [
            { left: "\\\\(", right: "\\\\)", display: false },
            { left: "\\\\[", right: "\\\\]", display: true },
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false,
          strict: "ignore"
        });
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Render HTML file to PDF via Playwright Chromium.
 * Returns absolute path to the PDF, or null if browser unavailable.
 */
function ensureLinuxChromeLibs() {
    try {
        const home = process.env.HOME || '';
        const libDir = path.join(home, '.local/chrome-deps/root/usr/lib/x86_64-linux-gnu');
        if (!fs.existsSync(libDir)) return;
        const extra = [
            libDir,
            path.join(home, '.local/chrome-deps/root/lib/x86_64-linux-gnu'),
        ].join(path.delimiter);
        process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
            ? `${extra}${path.delimiter}${process.env.LD_LIBRARY_PATH}`
            : extra;
    } catch {
        /* ignore */
    }
}

export async function htmlFileToPdf(
    htmlPath: string,
    pdfPath: string,
    log?: (msg: string) => void
): Promise<string | null> {
    ensureLinuxChromeLibs();

    let chromium: typeof import('playwright').chromium;
    try {
        ({ chromium } = await import('playwright'));
    } catch {
        log?.('Playwright not installed — skipped PDF.');
        return null;
    }

    const chromeArgs = ['--no-sandbox', '--disable-dev-shm-usage'];
    const launchAttempts: Array<Parameters<typeof chromium.launch>[0]> = [
        { headless: true, args: chromeArgs },
    ];

    // Prefer explicit full Chrome binary if present (Linux cache layout)
    const candidates = [
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        path.join(
            process.env.HOME || '',
            '.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'
        ),
        path.join(
            process.env.HOME || '',
            '.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell'
        ),
    ].filter(Boolean) as string[];

    for (const exe of candidates) {
        if (fs.existsSync(exe)) {
            launchAttempts.unshift({ headless: true, executablePath: exe, args: chromeArgs });
        }
    }

    let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
    let lastErr: Error | null = null;
    for (const opts of launchAttempts) {
        try {
            browser = await chromium.launch(opts);
            break;
        } catch (e: any) {
            lastErr = e;
        }
    }
    if (!browser) {
        log?.(
            `Chromium launch failed (${lastErr?.message || 'unknown'}) — HTML pack saved; open it in a browser to Print → Save as PDF.`
        );
        return null;
    }

    try {
        const page = await browser.newPage();
        const fileUrl = pathToFileUrl(htmlPath);
        await page
            .goto(fileUrl, { waitUntil: 'networkidle', timeout: 180_000 })
            .catch(async () => {
                await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
            });

        // Ensure question cards exist before printing (avoids near-blank PDFs)
        await page.waitForSelector('.question, .cover', { timeout: 45_000 }).catch(() => {});

        await page
            .waitForFunction(() => typeof (window as any).renderMathInElement === 'function', {
                timeout: 60_000,
            })
            .catch(() => {});
        await page
            .evaluate(() => {
                const fn = (window as any).renderMathInElement;
                if (typeof fn === 'function') {
                    fn(document.body, {
                        delimiters: [
                            { left: '\\(', right: '\\)', display: false },
                            { left: '\\[', right: '\\]', display: true },
                            { left: '$$', right: '$$', display: true },
                        ],
                        throwOnError: false,
                        strict: 'ignore',
                    });
                }
            })
            .catch(() => {});
        await page.waitForTimeout(2500);
        await page
            .evaluate(async () => {
                const imgs = Array.from(document.images);
                await Promise.all(
                    imgs.map(
                        (img) =>
                            img.complete ||
                            new Promise((res) => {
                                img.onload = img.onerror = () => res(null);
                                setTimeout(res, 8000);
                            })
                    )
                );
            })
            .catch(() => {});

        const metrics = await page.evaluate(() => ({
            questions: document.querySelectorAll('.question').length,
            textLen: (document.body.innerText || '').length,
        }));
        if (metrics.questions === 0 || metrics.textLen < 200) {
            log?.(
                `PDF render warning: thin page content (questions=${metrics.questions}, textLen=${metrics.textLen})`
            );
        }

        await page.emulateMedia({ media: 'print' });

        // CDP printToPDF is more reliable than page.pdf() for multi-page booklets
        // (page.pdf can truncate content and produce near-blank packs on some builds).
        try {
            const client = await page.context().newCDPSession(page);
            const { data } = await client.send('Page.printToPDF', {
                landscape: false,
                displayHeaderFooter: true,
                headerTemplate: '<div></div>',
                footerTemplate:
                    '<div style="font-size:9px;width:100%;text-align:center;color:#666;font-family:sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
                printBackground: true,
                preferCSSPageSize: false,
                paperWidth: 8.27,
                paperHeight: 11.69,
                marginTop: 0.45,
                marginBottom: 0.55,
                marginLeft: 0.45,
                marginRight: 0.45,
                scale: 0.95,
            });
            fs.writeFileSync(pdfPath, Buffer.from(data, 'base64'));
        } catch (cdpErr: any) {
            log?.(`CDP print failed (${cdpErr?.message || cdpErr}); falling back to page.pdf()`);
            await page.pdf({
                path: pdfPath,
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: false,
                margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' },
                displayHeaderFooter: true,
                headerTemplate: '<div></div>',
                footerTemplate: `
        <div style="font-size:9px;width:100%;padding:0 14mm;color:#666;display:flex;justify-content:space-between;font-family:sans-serif;">
          <span>Exam Pack</span>
          <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
            });
        }

        // Reject tiny/broken PDFs so callers can surface a clear failure
        try {
            const st = fs.statSync(pdfPath);
            if (st.size < 20_000 && metrics.questions > 5) {
                log?.(
                    `PDF looks too small (${st.size} bytes) for ${metrics.questions} questions — open Exam Pack.html as fallback`
                );
            }
        } catch {
            /* ignore */
        }

        return pdfPath;
    } finally {
        await browser.close().catch(() => {});
    }
}

function pathToFileUrl(absPath: string): string {
    const resolved = path.resolve(absPath);
    // Windows + POSIX file URLs
    if (process.platform === 'win32') {
        return 'file:///' + resolved.replace(/\\/g, '/');
    }
    return 'file://' + resolved;
}

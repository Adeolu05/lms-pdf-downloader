/**
 * Repair Exam Packs:
 * 1. Re-merge Mid/End semester questions from preserved Markdown (when LMS review closed)
 * 2. Rebuild HTML (full + study)
 * 3. Re-render PDFs with longer waits (fixes near-blank PDFs)
 *
 *   node scripts/repair-exam-packs.mjs
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath, pathToFileURL } from 'url';
import { chromium } from 'playwright';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const downloads = path.join(root, 'downloads');

// Linux Chrome shared libs (optional)
const localChromeLibs = path.join(os.homedir(), '.local/chrome-deps/root/usr/lib/x86_64-linux-gnu');
if (fs.existsSync(localChromeLibs)) {
    const extra = [
        localChromeLibs,
        path.join(os.homedir(), '.local/chrome-deps/root/lib/x86_64-linux-gnu'),
    ].join(path.delimiter);
    process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
        ? `${extra}${path.delimiter}${process.env.LD_LIBRARY_PATH}`
        : extra;
}

// Load TS render via esbuild-bundled side entry — fall back to dynamic rebuild inline
const require = createRequire(import.meta.url);

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Parse per-quiz markdown written by earlier harvests into questions[] */
function parseQuizMarkdown(md) {
    const questions = [];
    const blocks = md.split(/^### Question\s+/m).slice(1);
    for (const block of blocks) {
        const headerMatch = block.match(/^(\d+)\s*(?:—\s*([^\n]+))?/);
        const number = headerMatch?.[1] || String(questions.length + 1);
        const state = (headerMatch?.[2] || '').trim();
        const typeMatch = block.match(/`([a-z0-9_]+)`/i);
        const type = typeMatch?.[1] || 'multichoice';
        const gradeMatch = block.match(/\*([^*]+)\*/);
        const grade = gradeMatch?.[1]?.trim() || '';

        // stem: after header/grade line until first option or blank before options
        let body = block.replace(/^[^\n]*\n/, '');
        body = body.replace(/^\*[^*]+\*\s*·\s*`[^`]+`\s*\n*/, '');
        const optStart = body.search(/^- \*\*/m);
        let stem = optStart >= 0 ? body.slice(0, optStart).trim() : body.split(/\n\*\*/)[0].trim();
        stem = stem.replace(/^---\s*$/gm, '').trim();

        const options = [];
        const optRe = /^- \*\*([^*]+)\.\*\*\s*(.+?)(?:\s*_\(([^)]*)\)_)?\s*$/gm;
        let om;
        while ((om = optRe.exec(body)) !== null) {
            const marks = (om[3] || '').toLowerCase();
            options.push({
                label: om[1].trim(),
                text: om[2].trim(),
                textHtml: `<p>${escapeHtml(om[2].trim())}</p>`,
                selected: marks.includes('your answer') || marks.includes('yours'),
                correct: marks.includes('correct'),
            });
        }

        const yourMatch = body.match(/\*\*Your answer:\*\*\s*(.+)/i);
        const rightMatch = body.match(/\*\*Correct answer:\*\*\s*(.+)/i);
        const feedbackMatch = body.match(/\*\*Feedback:\*\*\s*([\s\S]*?)(?=\n---|\n### |\n*$)/i);

        const rightAnswer = rightMatch?.[1]?.trim() || '';
        // if no explicit correct but option marked correct
        const correctOpt = options.find((o) => o.correct);

        questions.push({
            number,
            type,
            state,
            grade,
            stem,
            stemHtml: `<p>${escapeHtml(stem).replace(/\\\(/g, '\\(').replace(/\\\)/g, '\\)')}</p>`.replace(
                /&lt;/g,
                '<'
            ).replace(/&gt;/g, '>').replace(/&amp;/g, '&') 
            // keep latex: re-escape carefully
            ,
            options,
            yourAnswer: yourMatch?.[1]?.trim() || '',
            rightAnswer: rightAnswer || (correctOpt ? `${correctOpt.label}. ${correctOpt.text}` : ''),
            rightAnswerHtml: rightAnswer
                ? `<span>${escapeHtml(rightAnswer)}</span>`
                : correctOpt
                  ? `<span>${escapeHtml(correctOpt.label)}. ${escapeHtml(correctOpt.text)}</span>`
                  : '',
            feedback: feedbackMatch?.[1]?.trim() || '',
            feedbackHtml: feedbackMatch?.[1]
                ? `<p>${escapeHtml(feedbackMatch[1].trim())}</p>`
                : '',
        });
    }

    // Build safe HTML fragments; keep \( ... \) for KaTeX
    const esc = (s) =>
        String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    for (const q of questions) {
        q.stemHtml = `<div class="clearfix"><p>${esc(q.stem).replace(/\n/g, '<br/>')}</p></div>`;
        for (const opt of q.options) {
            opt.textHtml = `<p>${esc(opt.text)}</p>`;
        }
        if (q.rightAnswer) q.rightAnswerHtml = esc(q.rightAnswer);
        if (q.feedback) q.feedbackHtml = `<p>${esc(q.feedback)}</p>`;
    }

    return questions;
}

function loadMidEndFromMarkdown(packDir) {
    const semesterDir = path.join(packDir, 'Semester');
    if (!fs.existsSync(semesterDir)) return [];
    const recovered = [];
    for (const name of fs.readdirSync(semesterDir)) {
        if (!/\.md$/i.test(name)) continue;
        if (!/mid|end\s*of\s*semester|end-of-semester|end semester/i.test(name)) continue;
        const md = fs.readFileSync(path.join(semesterDir, name), 'utf8');
        const qcount = (md.match(/^### Question/gm) || []).length;
        if (qcount === 0) continue;

        const title = (md.match(/^#\s+(.+)/m) || [])[1]?.trim() || name.replace(/\.md$/, '');
        const source = (md.match(/\*\*Source:\*\*\s*(\S+)/) || [])[1] || '';
        const review = (md.match(/\*\*Review:\*\*\s*(\S+)/) || [])[1] || null;
        const cmid = (source.match(/[?&]id=(\d+)/) || [])[1] || `recovered-${name}`;
        const bucket = /mid/i.test(title) ? 'mid' : 'end';
        const questions = parseQuizMarkdown(md);
        if (!questions.length) continue;

        recovered.push({
            quiz: {
                cmid,
                name: title,
                url: source,
                bucket,
                weekFolder: 'Semester',
            },
            reviewUrl: review,
            questions,
            gradeSummary: undefined,
            skippedReason: undefined,
            _recoveredFrom: name,
        });
        console.log(`    recovered ${questions.length} Q from Semester/${name}`);
    }
    return recovered;
}

function resultsFromManifest(manifest) {
    return (manifest.quizzes || []).map((q) => ({
        quiz: {
            cmid: q.cmid || q.name,
            name: q.name,
            url: q.url || '',
            bucket: q.bucket || 'general',
            weekFolder: q.weekFolder || 'General',
        },
        reviewUrl: q.reviewUrl || null,
        questions: q.questions || [],
        gradeSummary: q.gradeSummary,
        skippedReason: q.skippedReason,
    }));
}

function mergeRecovered(results, recovered) {
    const out = [...results];
    for (const rec of recovered) {
        const idx = out.findIndex(
            (r) =>
                r.quiz.name === rec.quiz.name ||
                (r.quiz.bucket === rec.quiz.bucket &&
                    /mid|end/i.test(r.quiz.name) &&
                    r.quiz.bucket === rec.quiz.bucket)
        );
        if (idx >= 0) {
            const existing = out[idx].questions?.length || 0;
            if (existing === 0 && rec.questions.length > 0) {
                out[idx] = {
                    ...out[idx],
                    questions: rec.questions,
                    reviewUrl: rec.reviewUrl || out[idx].reviewUrl,
                    skippedReason: undefined,
                    quiz: { ...out[idx].quiz, ...rec.quiz, weekFolder: 'Semester' },
                };
                console.log(`    merged into existing slot: ${rec.quiz.name}`);
            }
        } else {
            out.push(rec);
            console.log(`    appended: ${rec.quiz.name}`);
        }
    }
    // sort: pre, weeks, mid, end, post, general
    const order = (r) => {
        const b = r.quiz.bucket;
        if (b === 'pre') return 0;
        if (b === 'week') {
            const w = parseInt(String(r.quiz.weekFolder).replace(/\D/g, '') || '0', 10);
            return 100 + w;
        }
        if (b === 'mid') return 200;
        if (b === 'end') return 300;
        if (b === 'post') return 400;
        // name-based mid/end
        if (/mid/i.test(r.quiz.name)) return 200;
        if (/end\s*of\s*semester|end-of-semester/i.test(r.quiz.name)) return 300;
        return 500;
    };
    out.sort((a, b) => order(a) - order(b) || a.quiz.name.localeCompare(b.quiz.name));
    return out;
}

async function launchBrowser() {
    const candidates = [
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        path.join(process.env.HOME || '', '.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'),
        path.join(
            process.env.HOME || '',
            '.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell'
        ),
    ].filter(Boolean);

    for (const exe of candidates) {
        if (!fs.existsSync(exe)) continue;
        try {
            return await chromium.launch({
                headless: true,
                executablePath: exe,
                args: ['--no-sandbox', '--disable-dev-shm-usage'],
            });
        } catch {
            /* try next */
        }
    }
    return chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
}

async function htmlToPdf(htmlPath, pdfPath) {
    const browser = await launchBrowser();
    try {
        const page = await browser.newPage();
        const fileUrl = pathToFileURL(path.resolve(htmlPath)).href;
        await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 180_000 }).catch(async () => {
            await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
        });

        await page.waitForSelector('.question, .cover', { timeout: 45_000 }).catch(() => {});

        await page
            .waitForFunction(() => typeof window.renderMathInElement === 'function', {
                timeout: 60_000,
            })
            .catch(() => {});

        await page
            .evaluate(() => {
                if (typeof window.renderMathInElement === 'function') {
                    window.renderMathInElement(document.body, {
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

        await page.waitForTimeout(2000);
        await page.emulateMedia({ media: 'print' });

        const metrics = await page.evaluate(() => ({
            questions: document.querySelectorAll('.question').length,
            height: document.body.scrollHeight,
            textLen: (document.body.innerText || '').length,
        }));
        console.log(`      render metrics:`, metrics);
        if (metrics.questions === 0 || metrics.textLen < 200) {
            console.warn(`      WARNING: thin content — PDF may look empty`);
        }

        // CDP printToPDF is more reliable for multi-page content than page.pdf()
        // in some headless_shell builds (avoids truncated 6–8 page "blank" packs).
        const client = await page.context().newCDPSession(page);
        const { data } = await client.send('Page.printToPDF', {
            landscape: false,
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate:
                '<div style="font-size:9px;width:100%;text-align:center;color:#666;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
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
        const st = fs.statSync(pdfPath);
        const approxPages = (Buffer.from(data, 'base64').toString('latin1').match(/\/Type\s*\/Page[^s]/g) || [])
            .length;
        console.log(
            `      wrote ${path.basename(pdfPath)} (${(st.size / 1024).toFixed(1)} KB, ~${approxPages} pages)`
        );
        return st.size;
    } finally {
        await browser.close().catch(() => {});
    }
}

function makeSafeFilename(text) {
    return text
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180);
}

async function main() {
    // Bundle render helpers
    const { build } = await import('esbuild');
    const outfile = path.join(root, 'scripts/.exam-pack-render.cjs');
    await build({
        entryPoints: [path.join(root, 'core/exam-pack-render.ts')],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        outfile,
        external: ['playwright'],
    });
    const { buildExamPackHtml } = require(outfile);

    const courses = fs
        .readdirSync(downloads, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

    for (const courseName of courses) {
        const packDir = path.join(downloads, courseName, 'Exam Pack');
        if (!fs.existsSync(packDir)) continue;
        const jsonPath = path.join(packDir, 'exam-pack.json');
        if (!fs.existsSync(jsonPath)) {
            console.log(`\n• skip ${courseName} (no exam-pack.json)`);
            continue;
        }

        console.log(`\n• ${courseName}`);
        const manifest = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        let results = resultsFromManifest(manifest);

        // Recover mid/end from markdown if JSON has empty slots
        const recovered = loadMidEndFromMarkdown(packDir);
        if (recovered.length) {
            results = mergeRecovered(results, recovered);
        }

        const totalQ = results.reduce((s, r) => s + (r.questions?.length || 0), 0);
        const withQ = results.filter((r) => r.questions?.length > 0).length;
        console.log(`    total questions after merge: ${totalQ} across ${withQ} quizzes`);

        if (totalQ === 0) {
            console.log('    nothing to render — skip');
            continue;
        }

        const courseUrl = manifest.courseUrl || '';
        const generatedAt = new Date().toISOString();

        // Update manifest
        const newManifest = {
            ...manifest,
            courseName,
            courseUrl,
            generatedAt,
            repairedAt: generatedAt,
            recoveredMidEnd: recovered.map((r) => r.quiz.name),
            quizzes: results.map((r) => ({
                name: r.quiz.name,
                cmid: r.quiz.cmid,
                bucket: r.quiz.bucket,
                weekFolder: r.quiz.weekFolder,
                url: r.quiz.url,
                reviewUrl: r.reviewUrl,
                gradeSummary: r.gradeSummary,
                questionCount: r.questions.length,
                skippedReason: r.questions.length ? undefined : r.skippedReason,
                questions: r.questions,
            })),
            totals: {
                quizzes: results.length,
                withQuestions: withQ,
                skipped: results.filter((r) => !r.questions?.length).length,
                failed: 0,
                questions: totalQ,
            },
        };
        fs.writeFileSync(jsonPath, JSON.stringify(newManifest, null, 2), 'utf8');

        // HTML
        const htmlFull = buildExamPackHtml({
            courseName,
            courseUrl,
            generatedAt,
            results,
            variant: 'full',
        });
        const htmlStudy = buildExamPackHtml({
            courseName,
            courseUrl,
            generatedAt,
            results,
            variant: 'study',
        });
        const htmlPath = path.join(packDir, 'Exam Pack.html');
        const htmlStudyPath = path.join(packDir, 'Exam Pack Study.html');
        fs.writeFileSync(htmlPath, htmlFull, 'utf8');
        fs.writeFileSync(htmlStudyPath, htmlStudy, 'utf8');
        console.log(`    wrote HTML full (${htmlFull.length} chars) + study (${htmlStudy.length} chars)`);

        // PDFs
        const pdfName = makeSafeFilename(`${courseName} - Exam Pack`) + '.pdf';
        const pdfStudyName = makeSafeFilename(`${courseName} - Exam Pack Study`) + '.pdf';
        const pdfPath = path.join(packDir, pdfName);
        const pdfStudyPath = path.join(packDir, pdfStudyName);

        console.log('    rendering full PDF…');
        await htmlToPdf(htmlPath, pdfPath);
        console.log('    rendering study PDF…');
        await htmlToPdf(htmlStudyPath, pdfStudyPath);

        // README
        fs.writeFileSync(
            path.join(packDir, 'README.txt'),
            [
                `# ${courseName} — Exam Pack`,
                '',
                `Repaired: ${generatedAt}`,
                recovered.length
                    ? `Recovered mid/end from earlier harvests: ${recovered.map((r) => r.quiz.name).join('; ')}`
                    : '',
                '',
                '## Open these',
                `1. **${pdfName}** — full (answers + feedback under each question)`,
                `2. **${pdfStudyName}** — study (questions first, answer key at end)`,
                '',
                `Total questions: ${totalQ}`,
                '',
            ]
                .filter(Boolean)
                .join('\n'),
            'utf8'
        );
    }

    console.log('\nAll packs repaired.');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

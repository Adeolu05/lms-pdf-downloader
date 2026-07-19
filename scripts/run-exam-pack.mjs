/**
 * Pure ESM CLI runner (no tsx) — same behaviour as core/exam-pack.ts
 *
 *   node scripts/run-exam-pack.mjs 383 386
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sessionPath = path.join(root, 'sessions', 'storageState.json');
const downloadDir = path.join(root, 'downloads');
const baseUrl = 'https://lms.miva.university/';
const examPackFolder = 'Exam Pack';
const examPackDelay = 800;
const weekRegex = /Week\s*(\d+)/i;

class DownloaderEvents extends EventEmitter {
    emitEvent(courseId, type, data) {
        this.emit('event', { courseId, type, data, timestamp: new Date().toISOString() });
    }
}
const events = new DownloaderEvents();

function makeSafeFilename(text) {
    return text
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180);
}

function decodeEntities(html) {
    return html
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripTags(html) {
    return decodeEntities(
        html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]+>/g, ' ')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/[ \t]{2,}/g, ' ')
            .trim()
    );
}

function loadCookieHeader() {
    if (!fs.existsSync(sessionPath)) throw new Error('No session — log in first');
    const state = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    const cookies = state.cookies || [];
    const now = Date.now() / 1000;
    return cookies
        .filter((c) => (c.domain || '').includes('miva.university'))
        .filter((c) => !(typeof c.expires === 'number' && c.expires > 0 && c.expires < now))
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');
}

async function fetchHtml(url, cookieHeader) {
    const res = await fetch(url, {
        redirect: 'follow',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
            Cookie: cookieHeader,
        },
    });
    return { url: res.url, body: await res.text(), status: res.status };
}

function isLoginPage(url, body) {
    return (
        /cas\/login|login\/index\.php/i.test(url) ||
        /name="password"|type="password"|id="loginbtn"/i.test(body)
    );
}

function classifyQuiz(name) {
    const n = name.replace(/\s+/g, ' ').trim();
    if (/pre[-\s]?semester|pre[-\s]?test|beginning\s+of\s+semester/i.test(n))
        return { bucket: 'pre', weekFolder: 'Semester' };
    if (/post[-\s]?semester|post[-\s]?test/i.test(n))
        return { bucket: 'post', weekFolder: 'Semester' };
    if (/mid[-\s]?semester|mid[-\s]?term/i.test(n))
        return { bucket: 'mid', weekFolder: 'Semester' };
    if (/end\s+of\s+semester|end[-\s]?semester|final\s+exam|final\s+assessment/i.test(n))
        return { bucket: 'end', weekFolder: 'Semester' };
    const weekMatch = n.match(weekRegex);
    if (weekMatch) return { bucket: 'week', weekFolder: `Week ${weekMatch[1]}` };
    return { bucket: 'general', weekFolder: 'General' };
}

function extractCourseName(body) {
    const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) {
        const t = stripTags(h1[1]);
        if (t && !/^my courses$/i.test(t)) return makeSafeFilename(t);
    }
    const title = body.match(/<title[^>]*>\s*Course:\s*([^|<]+)/i);
    if (title) return makeSafeFilename(title[1].trim());
    return 'Unknown_Course';
}

function scanQuizzes(body) {
    const byId = new Map();
    const re =
        /href="([^"]*mod\/quiz\/view\.php\?id=(\d+)[^"]*)"[\s\S]{0,500}?class="instancename"[^>]*>([\s\S]*?)<\//gi;
    let m;
    while ((m = re.exec(body)) !== null) {
        const cmid = m[2];
        if (byId.has(cmid)) continue;
        const href = decodeEntities(m[1]);
        const rawName = stripTags(m[3]).replace(/\s*Quiz\s*$/i, '').trim() || `Quiz ${cmid}`;
        const { bucket, weekFolder } = classifyQuiz(rawName);
        byId.set(cmid, {
            cmid,
            name: rawName,
            url: href.startsWith('http') ? href : new URL(href, baseUrl).toString(),
            bucket,
            weekFolder,
        });
    }
    return [...byId.values()].sort((a, b) => {
        const order = (q) => {
            if (q.bucket === 'pre') return 0;
            if (q.bucket === 'week') return 100 + parseInt(q.weekFolder.replace(/\D/g, '') || '0', 10);
            if (q.bucket === 'mid') return 200;
            if (q.bucket === 'end') return 300;
            if (q.bucket === 'post') return 400;
            return 500;
        };
        return order(a) - order(b) || a.name.localeCompare(b.name);
    });
}

function findReviewUrl(html) {
    const links = [];
    const re = /href="([^"]*\/mod\/quiz\/review\.php\?[^"]+)"/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const raw = decodeEntities(m[1]);
        const abs = raw.startsWith('http') ? raw : new URL(raw, baseUrl).toString();
        const attemptMatch = abs.match(/[?&]attempt=(\d+)/i);
        links.push({ attempt: attemptMatch ? parseInt(attemptMatch[1], 10) : 0, url: abs });
    }
    if (!links.length) return null;
    links.sort((a, b) => b.attempt - a.attempt);
    return links[0].url;
}

function parseReviewQuestions(html) {
    const questions = [];
    const blocks = html.split(/(?=<div id="question-\d+-\d+")/);
    for (const block of blocks) {
        if (!/\bclass="[^"]*\bque\b/.test(block)) continue;
        const type = (block.match(/class="que\s+([a-z0-9_]+)/i) || [])[1] || 'unknown';
        const number = (block.match(/class="qno"[^>]*>([^<]+)/i) || [])[1]?.trim() || String(questions.length + 1);
        const state = (block.match(/class="state"[^>]*>([^<]+)/i) || [])[1]?.trim() || '';
        const gradeRaw = (block.match(/class="grade"[^>]*>([\s\S]*?)<\/div>/i) || [])[1];
        const grade = gradeRaw ? stripTags(gradeRaw) : '';
        let stem = '';
        const qtext = block.match(/class="qtext"[^>]*>([\s\S]*?)<\/div>/i);
        if (qtext) stem = stripTags(qtext[1]);

        const options = [];
        const answerSection =
            block.match(/class="answer"[^>]*>([\s\S]*?)<\/div>\s*<\/fieldset>/i) ||
            block.match(/class="answer"[^>]*>([\s\S]*?)(?:class="outcome"|class="rightanswer")/i);
        const ansHtml = answerSection?.[1] || '';
        const optionChunks = ansHtml.split(/(?=<div class="r[01])/i).filter((c) => /class="r[01]/i.test(c));
        for (const chunk of optionChunks) {
            const selected = /\bchecked(=|"checked")/i.test(chunk);
            const correct =
                /\bcorrect\b/i.test(chunk.match(/<div class="r[01][^"]*"/i)?.[0] || '') ||
                /fa-circle-check|title="Correct"/i.test(chunk);
            const num = (chunk.match(/class="answernumber"[^>]*>([\s\S]*?)<\/span>/i) || [])[1];
            const label = num ? stripTags(num).replace(/\.\s*$/, '') : String.fromCharCode(97 + options.length);
            let text = '';
            const flex = chunk.match(/class="flex-fill[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
            if (flex) text = stripTags(flex[1]);
            if (!text && !num) continue;
            options.push({ label: label.replace(/\.$/, ''), text: text || '(option)', selected, correct });
        }

        const rightRaw = (block.match(/class="rightanswer"[^>]*>([\s\S]*?)<\/div>/i) || [])[1];
        const rightAnswer = rightRaw ? stripTags(rightRaw).replace(/^The correct answer is:\s*/i, '') : '';

        let feedback = '';
        const correctComment = block.match(
            /question_correct_comment[\s\S]*?class="question_comment_html[^"]*"[^>]*>([\s\S]*?)<\/div>/i
        );
        const incorrectComment = block.match(
            /question_incorrect_comment[\s\S]*?class="question_comment_html[^"]*"[^>]*>([\s\S]*?)<\/div>/i
        );
        if (/incorrect/i.test(state) && incorrectComment) feedback = stripTags(incorrectComment[1]);
        else if (correctComment) feedback = stripTags(correctComment[1]);
        else if (incorrectComment) feedback = stripTags(incorrectComment[1]);

        const selectedOpt = options.find((o) => o.selected);
        const yourAnswer = selectedOpt ? `${selectedOpt.label}. ${selectedOpt.text}` : '';
        if (!stem && !options.length) continue;
        questions.push({
            number,
            type,
            state,
            grade,
            stem: stem || '(no stem text)',
            options,
            yourAnswer,
            rightAnswer,
            feedback,
        });
    }
    questions.sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));
    return questions;
}

function gradeSummaryFromQuizView(html) {
    const table = html.match(/Attempt\s+\d+\s+summary[\s\S]{0,2500}/i);
    if (!table) return undefined;
    const grade = table[0].match(
        /Grade[\s\S]{0,200}?([\d.]+)\s*out of\s*([\d.]+)[\s\S]{0,40}?\(([\d.]+)\s*%\)/i
    );
    if (grade) return `${grade[1]} / ${grade[2]} (${grade[3]}%)`;
    return undefined;
}

function formatQuizMarkdown(result, courseName) {
    const lines = [];
    lines.push(`# ${result.quiz.name}`, '');
    lines.push(`- **Course:** ${courseName}`);
    lines.push(`- **Bucket:** ${result.quiz.bucket}`);
    lines.push(`- **Source:** ${result.quiz.url}`);
    if (result.reviewUrl) lines.push(`- **Review:** ${result.reviewUrl}`);
    if (result.gradeSummary) lines.push(`- **Attempt grade:** ${result.gradeSummary}`);
    lines.push(`- **Questions extracted:** ${result.questions.length}`);
    lines.push(`- **Generated:** ${new Date().toISOString()}`, '');
    lines.push(
        '> Review-only export from your finished LMS attempts. Correct answers appear only when Moodle shows them.',
        '',
        '---',
        ''
    );
    for (const q of result.questions) {
        lines.push(`### Question ${q.number}${q.state ? ` — ${q.state}` : ''}`);
        if (q.grade) lines.push(`*${q.grade}* · \`${q.type}\``, '');
        else lines.push('');
        lines.push(q.stem, '');
        if (q.options.length) {
            for (const opt of q.options) {
                const marks = [];
                if (opt.selected) marks.push('your answer');
                if (opt.correct) marks.push('correct');
                const suffix = marks.length ? ` _(${marks.join(', ')})_` : '';
                lines.push(`- **${opt.label}.** ${opt.text}${suffix}`);
            }
            lines.push('');
        }
        if (q.yourAnswer) lines.push(`**Your answer:** ${q.yourAnswer}`);
        if (q.rightAnswer) lines.push(`**Correct answer:** ${q.rightAnswer}`);
        if (q.feedback) lines.push('', `**Feedback:** ${q.feedback}`);
        lines.push('', '---', '');
    }
    return lines.join('\n');
}

function formatAllQuestionsMarkdown(courseName, courseUrl, results) {
    const totalQ = results.reduce((s, r) => s + r.questions.length, 0);
    const lines = [];
    lines.push(`# Exam Pack — ${courseName}`, '');
    lines.push(`- **Course URL:** ${courseUrl}`);
    lines.push(`- **Quizzes processed:** ${results.length}`);
    lines.push(`- **Total questions:** ${totalQ}`);
    lines.push(`- **Generated:** ${new Date().toISOString()}`, '', '## Contents', '');
    for (const r of results) {
        const status = r.skippedReason
            ? `skipped (${r.skippedReason})`
            : `${r.questions.length} questions`;
        lines.push(`- **${r.quiz.weekFolder}** / ${r.quiz.name} — ${status}`);
    }
    lines.push('', '---', '');
    let globalN = 1;
    for (const r of results) {
        if (!r.questions.length) continue;
        lines.push(`## ${r.quiz.weekFolder}: ${r.quiz.name}`, '');
        if (r.gradeSummary) lines.push(`Attempt grade: **${r.gradeSummary}**`, '');
        for (const q of r.questions) {
            lines.push(`### Q${globalN}`);
            lines.push('');
            lines.push(q.stem, '');
            if (q.options.length) {
                for (const opt of q.options) {
                    const marks = [];
                    if (opt.selected) marks.push('yours');
                    if (opt.correct) marks.push('correct');
                    const suffix = marks.length ? ` _(${marks.join(', ')})_` : '';
                    lines.push(`- **${opt.label}.** ${opt.text}${suffix}`);
                }
                lines.push('');
            }
            if (q.rightAnswer) lines.push(`**Correct:** ${q.rightAnswer}`);
            else if (q.yourAnswer) lines.push(`**Your answer:** ${q.yourAnswer}`);
            if (q.feedback) lines.push(`**Feedback:** ${q.feedback}`);
            lines.push('', `*Source: ${r.quiz.name} · Q${q.number}*`, '', '---', '');
            globalN++;
        }
    }
    return lines.join('\n');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runExamPack(courseId, courseUrl) {
    const cookieHeader = loadCookieHeader();
    events.emitEvent(courseId, 'log', { message: 'Building Exam Pack…', type: 'info' });
    events.emitEvent(courseId, 'status', { status: 'scanning' });

    const coursePage = await fetchHtml(courseUrl, cookieHeader);
    if (isLoginPage(coursePage.url, coursePage.body)) {
        events.emitEvent(courseId, 'error', { message: 'Session invalid' });
        events.emitEvent(courseId, 'status', { status: 'failed' });
        return;
    }

    const courseName = extractCourseName(coursePage.body);
    events.emitEvent(courseId, 'meta', { name: courseName });
    const quizzes = scanQuizzes(coursePage.body);
    if (!quizzes.length) {
        events.emitEvent(courseId, 'log', { message: 'No quizzes found', type: 'error' });
        events.emitEvent(courseId, 'status', { status: 'failed' });
        return;
    }

    events.emitEvent(courseId, 'log', {
        message: `Found ${quizzes.length} quizzes`,
        type: 'success',
    });
    events.emitEvent(courseId, 'status', { status: 'downloading', total: quizzes.length });

    const packRoot = path.join(downloadDir, courseName, examPackFolder);
    fs.mkdirSync(packRoot, { recursive: true });

    const results = [];
    let downloaded = 0,
        skipped = 0,
        failed = 0,
        totalQuestions = 0;

    for (let i = 0; i < quizzes.length; i++) {
        const quiz = quizzes[i];
        events.emitEvent(courseId, 'log', {
            message: `[${i + 1}/${quizzes.length}] ${quiz.name}`,
            type: 'info',
        });
        try {
            const view = await fetchHtml(quiz.url, cookieHeader);
            if (isLoginPage(view.url, view.body)) throw new Error('Session lost');
            const reviewUrl = findReviewUrl(view.body);
            const gradeSummary = gradeSummaryFromQuizView(view.body);
            if (!reviewUrl) {
                events.emitEvent(courseId, 'log', {
                    message: `No review — skipped: ${quiz.name}`,
                    type: 'warning',
                });
                results.push({
                    quiz,
                    reviewUrl: null,
                    questions: [],
                    skippedReason: 'no reviewable attempt',
                    gradeSummary,
                });
                skipped++;
            } else {
                const review = await fetchHtml(reviewUrl, cookieHeader);
                const questions = parseReviewQuestions(review.body);
                const result = { quiz, reviewUrl, questions, gradeSummary };
                results.push(result);
                if (!questions.length) {
                    events.emitEvent(courseId, 'log', {
                        message: `0 questions parsed: ${quiz.name}`,
                        type: 'warning',
                    });
                    skipped++;
                } else {
                    const weekDir = path.join(packRoot, makeSafeFilename(quiz.weekFolder));
                    fs.mkdirSync(weekDir, { recursive: true });
                    fs.writeFileSync(
                        path.join(weekDir, makeSafeFilename(quiz.name) + '.md'),
                        formatQuizMarkdown(result, courseName),
                        'utf8'
                    );
                    totalQuestions += questions.length;
                    downloaded++;
                    events.emitEvent(courseId, 'log', {
                        message: `Saved ${questions.length} Q — ${quiz.name}`,
                        type: 'success',
                    });
                }
            }
        } catch (err) {
            failed++;
            results.push({
                quiz,
                reviewUrl: null,
                questions: [],
                skippedReason: err.message,
            });
            events.emitEvent(courseId, 'log', {
                message: `Failed: ${quiz.name} — ${err.message}`,
                type: 'error',
            });
        }
        const percent = Math.round(((downloaded + skipped + failed) / quizzes.length) * 100);
        events.emitEvent(courseId, 'progress', { downloaded, skipped, failed, percent });
        await sleep(examPackDelay);
    }

    fs.writeFileSync(
        path.join(packRoot, 'ALL_QUESTIONS.md'),
        formatAllQuestionsMarkdown(courseName, courseUrl, results),
        'utf8'
    );
    fs.writeFileSync(
        path.join(packRoot, 'exam-pack.json'),
        JSON.stringify(
            {
                courseName,
                courseUrl,
                generatedAt: new Date().toISOString(),
                totals: { quizzes: results.length, withQuestions: downloaded, skipped, failed, questions: totalQuestions },
                quizzes: results.map((r) => ({
                    name: r.quiz.name,
                    cmid: r.quiz.cmid,
                    bucket: r.quiz.bucket,
                    weekFolder: r.quiz.weekFolder,
                    questionCount: r.questions.length,
                    skippedReason: r.skippedReason,
                    gradeSummary: r.gradeSummary,
                    questions: r.questions,
                })),
            },
            null,
            2
        ),
        'utf8'
    );

    events.emitEvent(courseId, 'log', {
        message: `Done: ${totalQuestions} questions → ${packRoot}`,
        type: 'success',
    });
    events.emitEvent(courseId, 'status', { status: 'completed' });
}

function resolveUrl(arg) {
    if (/^https?:\/\//i.test(arg)) return arg;
    if (/^\d+$/.test(arg)) return `https://lms.miva.university/course/view.php?id=${arg}`;
    throw new Error(`Bad arg: ${arg}`);
}

events.on('event', (ev) => {
    const { courseId, type, data } = ev;
    if (type === 'log') console.log(`[${courseId}] ${data.type}: ${data.message}`);
    else if (type === 'status') console.log(`[${courseId}] status → ${data.status}`);
    else if (type === 'progress')
        console.log(`[${courseId}] ${data.percent}% saved=${data.downloaded} skip=${data.skipped} fail=${data.failed}`);
    else if (type === 'meta') console.log(`[${courseId}] course: ${data.name}`);
    else if (type === 'error') console.error(`[${courseId}] ERROR: ${data.message}`);
});

const args = process.argv.slice(2);
if (!args.length) {
    console.error('Usage: node scripts/run-exam-pack.mjs <id|url> [...]');
    process.exit(1);
}

for (let i = 0; i < args.length; i++) {
    const url = resolveUrl(args[i]);
    const id = `cli-${i + 1}`;
    console.log(`\n======== ${id}: ${url} ========\n`);
    await runExamPack(id, url);
}
console.log('\nAll courses done.');

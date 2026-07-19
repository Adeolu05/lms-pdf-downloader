/**
 * Exam Pack engine — harvest quiz questions from Miva (Moodle) courses.
 *
 * Review-only: never starts a new graded attempt.
 * Outputs Markdown, JSON, rich HTML (KaTeX), and PDF when Chromium is available.
 */
import fs from 'fs';
import path from 'path';
import { config } from './config';
import { downloaderEvents } from '../lib/events';
import { buildExamPackHtml, htmlFileToPdf } from './exam-pack-render';
import { beginJob, isAborted } from './job-control';

export type QuizBucket = 'pre' | 'post' | 'mid' | 'end' | 'week' | 'general';

export interface QuizActivity {
    cmid: string;
    name: string;
    url: string;
    bucket: QuizBucket;
    weekFolder: string;
}

export interface QuizOption {
    label: string;
    text: string;
    textHtml: string;
    selected: boolean;
    correct: boolean;
}

export interface ExtractedQuestion {
    number: string;
    type: string;
    state: string;
    grade: string;
    stem: string;
    stemHtml: string;
    options: QuizOption[];
    yourAnswer: string;
    rightAnswer: string;
    rightAnswerHtml: string;
    feedback: string;
    feedbackHtml: string;
}

export interface QuizExtractResult {
    quiz: QuizActivity;
    reviewUrl: string | null;
    questions: ExtractedQuestion[];
    skippedReason?: string;
    gradeSummary?: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeSafeFilename(text: string) {
    return text
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180);
}

function decodeEntities(html: string): string {
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

function stripTags(html: string): string {
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

function loadCookieHeader(): string {
    if (!fs.existsSync(config.sessionPath)) {
        throw new Error('Session expired. Please log in again.');
    }
    const state = JSON.parse(fs.readFileSync(config.sessionPath, 'utf8'));
    const cookies: Array<{
        name: string;
        value: string;
        domain?: string;
        expires?: number;
    }> = state.cookies || [];
    const now = Date.now() / 1000;
    return cookies
        .filter((c) => (c.domain || '').includes('miva.university'))
        .filter((c) => !(typeof c.expires === 'number' && c.expires > 0 && c.expires < now))
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');
}

async function fetchHtml(url: string, cookieHeader: string): Promise<{ url: string; body: string; status: number }> {
    const res = await fetch(url, {
        redirect: 'follow',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
            Cookie: cookieHeader,
        },
    });
    const body = await res.text();
    return { url: res.url, body, status: res.status };
}

function isLoginPage(url: string, body: string): boolean {
    return (
        /cas\/login|login\/index\.php/i.test(url) ||
        /name="password"|type="password"|id="loginbtn"/i.test(body)
    );
}

function classifyQuiz(name: string): { bucket: QuizBucket; weekFolder: string } {
    const n = name.replace(/\s+/g, ' ').trim();
    if (/pre[-\s]?semester|pre[-\s]?test|beginning\s+of\s+semester/i.test(n)) {
        return { bucket: 'pre', weekFolder: 'Semester' };
    }
    if (/post[-\s]?semester|post[-\s]?test/i.test(n)) {
        return { bucket: 'post', weekFolder: 'Semester' };
    }
    if (/mid[-\s]?semester|mid[-\s]?term/i.test(n)) {
        return { bucket: 'mid', weekFolder: 'Semester' };
    }
    if (/end\s+of\s+semester|end[-\s]?semester|final\s+exam|final\s+assessment/i.test(n)) {
        return { bucket: 'end', weekFolder: 'Semester' };
    }
    const weekMatch = n.match(config.weekRegex);
    if (weekMatch) {
        return { bucket: 'week', weekFolder: `Week ${weekMatch[1]}` };
    }
    return { bucket: 'general', weekFolder: 'General' };
}

function extractCourseName(body: string): string {
    const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) {
        const t = stripTags(h1[1]);
        if (t && !/^my courses$/i.test(t)) return makeSafeFilename(t);
    }
    const title = body.match(/<title[^>]*>\s*Course:\s*([^|<]+)/i);
    if (title) return makeSafeFilename(title[1].trim());
    const title2 = body.match(/<title[^>]*>([^|<]+)/i);
    if (title2) return makeSafeFilename(title2[1].replace(/\|\s*Miva.*/i, '').trim());
    return 'Unknown_Course';
}

export function scanQuizzesFromCourseHtml(body: string, baseUrl = config.baseUrl): QuizActivity[] {
    const byId = new Map<string, QuizActivity>();

    const re =
        /href="([^"]*mod\/quiz\/view\.php\?id=(\d+)[^"]*)"[\s\S]{0,500}?class="instancename"[^>]*>([\s\S]*?)<\//gi;
    let m: RegExpExecArray | null;
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

    if (byId.size === 0) {
        const re2 = /href="([^"]*mod\/quiz\/view\.php\?id=(\d+)[^"]*)"/gi;
        while ((m = re2.exec(body)) !== null) {
            const cmid = m[2];
            if (byId.has(cmid)) continue;
            const href = decodeEntities(m[1]);
            const name = `Quiz ${cmid}`;
            const { bucket, weekFolder } = classifyQuiz(name);
            byId.set(cmid, {
                cmid,
                name,
                url: href.startsWith('http') ? href : new URL(href, baseUrl).toString(),
                bucket,
                weekFolder,
            });
        }
    }

    return [...byId.values()].sort((a, b) => {
        const order = (q: QuizActivity) => {
            if (q.bucket === 'pre') return 0;
            if (q.bucket === 'week') {
                const w = parseInt(q.weekFolder.replace(/\D/g, '') || '0', 10);
                return 100 + w;
            }
            if (q.bucket === 'mid') return 200;
            if (q.bucket === 'end') return 300;
            if (q.bucket === 'post') return 400;
            return 500;
        };
        return order(a) - order(b) || a.name.localeCompare(b.name);
    });
}

export function findReviewUrl(quizViewHtml: string, baseUrl = config.baseUrl): string | null {
    const links: { attempt: number; url: string }[] = [];
    const re = /href="([^"]*\/mod\/quiz\/review\.php\?[^"]+)"/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(quizViewHtml)) !== null) {
        const raw = decodeEntities(m[1]);
        const abs = raw.startsWith('http') ? raw : new URL(raw, baseUrl).toString();
        const attemptMatch = abs.match(/[?&]attempt=(\d+)/i);
        const attempt = attemptMatch ? parseInt(attemptMatch[1], 10) : 0;
        links.push({ attempt, url: abs });
    }
    if (!links.length) return null;
    links.sort((a, b) => b.attempt - a.attempt);
    return links[0].url;
}

function extractStemHtml(block: string): string {
    // Prefer inner clearfix of qtext; keep math spans + images
    const qtext = block.match(
        /class="qtext"[^>]*>([\s\S]*?)(?:<div class="ablock"|<fieldset|<\/div>\s*<div class="(?:ablock|outcome|im-feedback))/i
    );
    if (qtext) return qtext[1].trim();
    const qtext2 = block.match(/class="qtext"[^>]*>([\s\S]*?)$/i);
    if (qtext2) {
        // cut at first outcome if present
        const cut = qtext2[1].split(/class="(?:ablock|outcome)/i)[0];
        return cut.replace(/<\/div>\s*$/i, '').trim();
    }
    return '';
}

export function parseReviewQuestions(html: string): ExtractedQuestion[] {
    const questions: ExtractedQuestion[] = [];
    const blocks = html.split(/(?=<div id="question-\d+-\d+")/);

    for (const block of blocks) {
        if (!/\bclass="[^"]*\bque\b/.test(block)) continue;

        const typeMatch = block.match(/class="que\s+([a-z0-9_]+)/i);
        const type = typeMatch?.[1] || 'unknown';
        const number =
            (block.match(/class="qno"[^>]*>([^<]+)/i) || [])[1]?.trim() ||
            String(questions.length + 1);
        const state = (block.match(/class="state"[^>]*>([^<]+)/i) || [])[1]?.trim() || '';
        const gradeRaw = (block.match(/class="grade"[^>]*>([\s\S]*?)<\/div>/i) || [])[1];
        const grade = gradeRaw ? stripTags(gradeRaw) : '';

        const stemHtml = extractStemHtml(block);
        const stem = stripTags(stemHtml);

        const options: QuizOption[] = [];
        const answerSection =
            block.match(/class="answer"[^>]*>([\s\S]*?)<\/div>\s*<\/fieldset>/i) ||
            block.match(
                /class="answer"[^>]*>([\s\S]*?)(?:class="outcome"|class="rightanswer"|<\/div><\/div><\/div>)/i
            );
        const ansHtml = answerSection?.[1] || '';

        const optionChunks = ansHtml
            .split(/(?=<div class="r[01])/i)
            .filter((c) => /class="r[01]/i.test(c));
        for (const chunk of optionChunks) {
            const selected = /\bchecked(=|"checked")/i.test(chunk);
            const correct =
                /\bcorrect\b/i.test(chunk.match(/<div class="r[01][^"]*"/i)?.[0] || '') ||
                /fa-circle-check|title="Correct"/i.test(chunk);
            const num = (chunk.match(/class="answernumber"[^>]*>([\s\S]*?)<\/span>/i) || [])[1];
            const label = num
                ? stripTags(num).replace(/\.\s*$/, '')
                : String.fromCharCode(97 + options.length);

            let textHtml = '';
            const flex = chunk.match(/class="flex-fill[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
            if (flex) textHtml = flex[1].trim();
            else {
                const labelEl = chunk.match(/data-region="answer-label"[^>]*>([\s\S]*?)$/i);
                if (labelEl) {
                    textHtml = labelEl[1]
                        .replace(/class="answernumber"[^>]*>[\s\S]*?<\/span>/i, '')
                        .trim();
                }
            }
            const text = stripTags(textHtml);
            if (!text && !num && !/<img/i.test(textHtml)) continue;
            options.push({
                label: label.replace(/\.$/, ''),
                text: text || '(see figure)',
                textHtml,
                selected,
                correct,
            });
        }

        const rightRaw = (block.match(/class="rightanswer"[^>]*>([\s\S]*?)<\/div>/i) || [])[1];
        const rightAnswerHtml = rightRaw
            ? rightRaw.replace(/^[\s\S]*?The correct answer is:\s*/i, '').trim()
            : '';
        const rightAnswer = rightRaw
            ? stripTags(rightRaw).replace(/^The correct answer is:\s*/i, '')
            : '';

        let feedbackHtml = '';
        const correctComment = block.match(
            /question_correct_comment[\s\S]*?class="question_comment_html[^"]*"[^>]*>([\s\S]*?)<\/div>/i
        );
        const incorrectComment = block.match(
            /question_incorrect_comment[\s\S]*?class="question_comment_html[^"]*"[^>]*>([\s\S]*?)<\/div>/i
        );
        const specific = block.match(/class="specificfeedback[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (/incorrect/i.test(state) && incorrectComment) feedbackHtml = incorrectComment[1];
        else if (correctComment) feedbackHtml = correctComment[1];
        else if (specific) feedbackHtml = specific[1];
        if (!feedbackHtml && incorrectComment) feedbackHtml = incorrectComment[1];
        const feedback = stripTags(feedbackHtml);

        const selectedOpt = options.find((o) => o.selected);
        const yourAnswer = selectedOpt ? `${selectedOpt.label}. ${selectedOpt.text}` : '';

        if (!stem && !options.length && !stemHtml) continue;

        questions.push({
            number,
            type,
            state,
            grade,
            stem: stem || '(no stem text)',
            stemHtml,
            options,
            yourAnswer,
            rightAnswer,
            rightAnswerHtml,
            feedback,
            feedbackHtml,
        });
    }

    questions.sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));
    return questions;
}

function gradeSummaryFromQuizView(html: string): string | undefined {
    const table = html.match(/Attempt\s+\d+\s+summary[\s\S]{0,2500}/i);
    if (!table) return undefined;
    const grade = table[0].match(
        /Grade[\s\S]{0,200}?([\d.]+)\s*out of\s*([\d.]+)[\s\S]{0,40}?\(([\d.]+)\s*%\)/i
    );
    if (grade) return `${grade[1]} / ${grade[2]} (${grade[3]}%)`;
    const status = table[0].match(/Status[\s|]*\|?\s*(Finished|In progress|Never submitted)/i);
    return status ? status[1] : undefined;
}

// ─── image / asset rewriting ─────────────────────────────────────────────────

function isIgnorableImage(src: string): boolean {
    return /siteinnerloader|favicon|logo|spacer|icon\/|\/i\/|flag|yui|emoji|gravatar|user\/pix/i.test(
        src
    );
}

function collectImageUrls(...htmlParts: string[]): string[] {
    const urls = new Set<string>();
    for (const html of htmlParts) {
        if (!html) continue;
        for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
            const src = decodeEntities(m[1].trim());
            if (!src || src.startsWith('data:') || isIgnorableImage(src)) continue;
            urls.add(src);
        }
        // CSS background rarely used; skip
    }
    return [...urls];
}

function absolutizeUrl(src: string, base: string): string {
    try {
        return new URL(src, base).toString();
    } catch {
        return src;
    }
}

function extFromContentType(ct: string | null, url: string): string {
    if (ct?.includes('png')) return '.png';
    if (ct?.includes('jpeg') || ct?.includes('jpg')) return '.jpg';
    if (ct?.includes('gif')) return '.gif';
    if (ct?.includes('webp')) return '.webp';
    if (ct?.includes('svg')) return '.svg';
    const pathOnly = url.split('?')[0];
    const m = pathOnly.match(/\.(png|jpe?g|gif|webp|svg)$/i);
    return m ? `.${m[1].toLowerCase().replace('jpeg', 'jpg')}` : '.png';
}

async function downloadAssets(
    urls: string[],
    assetsDir: string,
    cookieHeader: string,
    pageBaseUrl: string
): Promise<Map<string, string>> {
    /** original absolute URL → relative path from Exam Pack root (assets/xxx.ext) */
    const map = new Map<string, string>();
    fs.mkdirSync(assetsDir, { recursive: true });

    let i = 0;
    for (const raw of urls) {
        const abs = absolutizeUrl(raw, pageBaseUrl);
        if (map.has(abs) || map.has(raw)) continue;
        i++;
        try {
            const res = await fetch(abs, {
                redirect: 'follow',
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    Cookie: cookieHeader,
                    Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                    Referer: pageBaseUrl,
                },
            });
            if (!res.ok) continue;
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length < 20) continue;
            const ext = extFromContentType(res.headers.get('content-type'), abs);
            const filename = `img_${String(i).padStart(3, '0')}${ext}`;
            fs.writeFileSync(path.join(assetsDir, filename), buf);
            const rel = `assets/${filename}`;
            map.set(abs, rel);
            map.set(raw, rel);
            // also key without amp encoding variants
            map.set(decodeEntities(raw), rel);
        } catch {
            /* skip broken image */
        }
    }
    return map;
}

function rewriteHtmlImages(html: string, urlMap: Map<string, string>, pageBaseUrl: string): string {
    if (!html) return html;
    return html.replace(/<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi, (full, pre, src, post) => {
        const decoded = decodeEntities(src.trim());
        const abs = absolutizeUrl(decoded, pageBaseUrl);
        const rel = urlMap.get(decoded) || urlMap.get(abs) || urlMap.get(src);
        if (!rel) {
            // keep remote equation images if download failed (PDF gen needs network)
            const safeSrc = abs.replace(/"/g, '&quot;');
            return `<img${pre}src="${safeSrc}"${post}>`;
        }
        return `<img${pre}src="${rel}"${post}>`;
    });
}

function rewriteResultImages(
    results: QuizExtractResult[],
    urlMap: Map<string, string>,
    pageBaseUrl: string
) {
    for (const r of results) {
        for (const q of r.questions) {
            q.stemHtml = rewriteHtmlImages(q.stemHtml, urlMap, pageBaseUrl);
            q.rightAnswerHtml = rewriteHtmlImages(q.rightAnswerHtml, urlMap, pageBaseUrl);
            q.feedbackHtml = rewriteHtmlImages(q.feedbackHtml, urlMap, pageBaseUrl);
            for (const opt of q.options) {
                opt.textHtml = rewriteHtmlImages(opt.textHtml, urlMap, pageBaseUrl);
            }
        }
    }
}

// ─── markdown (text fallback) ────────────────────────────────────────────────

function formatQuizMarkdown(result: QuizExtractResult, courseName: string): string {
    const lines: string[] = [];
    lines.push(`# ${result.quiz.name}`);
    lines.push('');
    lines.push(`- **Course:** ${courseName}`);
    lines.push(`- **Bucket:** ${result.quiz.bucket}`);
    lines.push(`- **Source:** ${result.quiz.url}`);
    if (result.reviewUrl) lines.push(`- **Review:** ${result.reviewUrl}`);
    if (result.gradeSummary) lines.push(`- **Attempt grade:** ${result.gradeSummary}`);
    lines.push(`- **Questions extracted:** ${result.questions.length}`);
    lines.push(`- **Generated:** ${new Date().toISOString()}`);
    lines.push('');
    lines.push(
        '> Prefer the PDF/HTML Exam Pack for maths and diagrams. This Markdown is a text fallback.'
    );
    lines.push('');
    lines.push('---');
    lines.push('');

    for (const q of result.questions) {
        lines.push(`### Question ${q.number}${q.state ? ` — ${q.state}` : ''}`);
        if (q.grade) lines.push(`*${q.grade}* · \`${q.type}\``);
        lines.push('');
        lines.push(q.stem);
        lines.push('');
        if (q.options.length) {
            for (const opt of q.options) {
                const marks: string[] = [];
                if (opt.selected) marks.push('your answer');
                if (opt.correct) marks.push('correct');
                const suffix = marks.length ? ` _(${marks.join(', ')})_` : '';
                lines.push(`- **${opt.label}.** ${opt.text}${suffix}`);
            }
            lines.push('');
        }
        if (q.yourAnswer) lines.push(`**Your answer:** ${q.yourAnswer}`);
        if (q.rightAnswer) lines.push(`**Correct answer:** ${q.rightAnswer}`);
        if (q.feedback) {
            lines.push('');
            lines.push(`**Feedback:** ${q.feedback}`);
        }
        lines.push('');
        lines.push('---');
        lines.push('');
    }
    return lines.join('\n');
}

function formatAllQuestionsMarkdown(
    courseName: string,
    courseUrl: string,
    results: QuizExtractResult[]
): string {
    const totalQ = results.reduce((s, r) => s + r.questions.length, 0);
    const lines: string[] = [];
    lines.push(`# Exam Pack — ${courseName}`);
    lines.push('');
    lines.push(`- **Course URL:** ${courseUrl}`);
    lines.push(`- **Quizzes processed:** ${results.length}`);
    lines.push(`- **Total questions:** ${totalQ}`);
    lines.push(`- **Generated:** ${new Date().toISOString()}`);
    lines.push('');
    lines.push('> Open **Exam Pack.pdf** (or **Exam Pack.html**) for proper maths and diagrams.');
    lines.push('');
    lines.push('## Contents');
    lines.push('');
    for (const r of results) {
        const status = r.skippedReason
            ? `skipped (${r.skippedReason})`
            : `${r.questions.length} questions`;
        lines.push(`- **${r.quiz.weekFolder}** / ${r.quiz.name} — ${status}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');

    let globalN = 1;
    for (const r of results) {
        if (!r.questions.length) continue;
        lines.push(`## ${r.quiz.weekFolder}: ${r.quiz.name}`);
        lines.push('');
        if (r.gradeSummary) lines.push(`Attempt grade: **${r.gradeSummary}**`);
        lines.push('');
        for (const q of r.questions) {
            lines.push(`### Q${globalN}`);
            lines.push('');
            lines.push(q.stem);
            lines.push('');
            if (q.options.length) {
                for (const opt of q.options) {
                    const marks: string[] = [];
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
            lines.push('');
            lines.push(`*Source: ${r.quiz.name} · Q${q.number}*`);
            lines.push('');
            lines.push('---');
            lines.push('');
            globalN++;
        }
    }
    return lines.join('\n');
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

function updateProgress(
    courseId: string,
    downloaded: number,
    skipped: number,
    failed: number,
    total: number
) {
    const percent = total === 0 ? 100 : Math.round(((downloaded + skipped + failed) / total) * 100);
    downloaderEvents.emitEvent(courseId, 'progress', { downloaded, skipped, failed, percent });
}

// ─── main ────────────────────────────────────────────────────────────────────

export async function runExamPack(courseId: string, courseUrl: string) {
    beginJob(courseId);

    let cookieHeader: string;
    try {
        cookieHeader = loadCookieHeader();
    } catch (e: any) {
        downloaderEvents.emitEvent(courseId, 'error', { message: e.message });
        downloaderEvents.emitEvent(courseId, 'status', { status: 'failed' });
        return;
    }

    downloaderEvents.emitEvent(courseId, 'log', {
        message: 'Building Exam Pack (review-only) → Markdown + HTML + PDF + Study PDF…',
        type: 'info',
    });
    downloaderEvents.emitEvent(courseId, 'status', { status: 'scanning' });

    try {
        downloaderEvents.emitEvent(courseId, 'log', {
            message: `Opening course: ${courseUrl}`,
            type: 'info',
        });

        const coursePage = await fetchHtml(courseUrl, cookieHeader);
        if (isLoginPage(coursePage.url, coursePage.body)) {
            downloaderEvents.emitEvent(courseId, 'error', {
                message: 'Session invalid. Please re-login on the Welcome page.',
            });
            downloaderEvents.emitEvent(courseId, 'status', { status: 'failed' });
            return;
        }

        const courseName = extractCourseName(coursePage.body);
        downloaderEvents.emitEvent(courseId, 'meta', { name: courseName });

        const quizzes = scanQuizzesFromCourseHtml(coursePage.body);
        if (quizzes.length === 0) {
            downloaderEvents.emitEvent(courseId, 'log', {
                message: 'No quiz activities found on this course page.',
                type: 'error',
            });
            downloaderEvents.emitEvent(courseId, 'status', { status: 'failed' });
            return;
        }

        downloaderEvents.emitEvent(courseId, 'log', {
            message: `Found ${quizzes.length} quizzes. Extracting finished attempts…`,
            type: 'success',
        });
        downloaderEvents.emitEvent(courseId, 'status', {
            status: 'downloading',
            total: quizzes.length,
        });

        const packRoot = path.join(config.downloadDir, courseName, config.examPackFolder);
        const assetsDir = path.join(packRoot, 'assets');
        fs.mkdirSync(packRoot, { recursive: true });

        const results: QuizExtractResult[] = [];
        let downloaded = 0;
        let skipped = 0;
        let failed = 0;
        let totalQuestions = 0;
        const allImageUrls: string[] = [];
        let lastReviewBase = config.baseUrl;

        for (let i = 0; i < quizzes.length; i++) {
            if (isAborted(courseId)) {
                downloaderEvents.emitEvent(courseId, 'log', {
                    message: 'Cancelled by user — writing partial pack if any…',
                    type: 'warning',
                });
                break;
            }

            const quiz = quizzes[i];
            downloaderEvents.emitEvent(courseId, 'log', {
                message: `[${i + 1}/${quizzes.length}] ${quiz.name}`,
                type: 'info',
            });

            try {
                const view = await fetchHtml(quiz.url, cookieHeader);
                if (isLoginPage(view.url, view.body)) {
                    throw new Error('Session lost mid-run');
                }

                const reviewUrl = findReviewUrl(view.body);
                const gradeSummary = gradeSummaryFromQuizView(view.body);

                if (!reviewUrl) {
                    downloaderEvents.emitEvent(courseId, 'log', {
                        message: `No finished attempt to review — skipped: ${quiz.name}`,
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
                    updateProgress(courseId, downloaded, skipped, failed, quizzes.length);
                    await sleep(config.examPackDelay);
                    continue;
                }

                const review = await fetchHtml(reviewUrl, cookieHeader);
                if (isLoginPage(review.url, review.body)) {
                    throw new Error('Session lost on review page');
                }
                lastReviewBase = review.url;

                const questions = parseReviewQuestions(review.body);
                const result: QuizExtractResult = {
                    quiz,
                    reviewUrl,
                    questions,
                    gradeSummary,
                };
                results.push(result);

                for (const q of questions) {
                    allImageUrls.push(
                        ...collectImageUrls(
                            q.stemHtml,
                            q.rightAnswerHtml,
                            q.feedbackHtml,
                            ...q.options.map((o) => o.textHtml)
                        )
                    );
                }

                if (questions.length === 0) {
                    downloaderEvents.emitEvent(courseId, 'log', {
                        message: `Review opened but 0 questions parsed: ${quiz.name}`,
                        type: 'warning',
                    });
                    skipped++;
                } else {
                    const weekDir = path.join(packRoot, makeSafeFilename(quiz.weekFolder));
                    fs.mkdirSync(weekDir, { recursive: true });
                    const filePath = path.join(weekDir, makeSafeFilename(quiz.name) + '.md');
                    fs.writeFileSync(filePath, formatQuizMarkdown(result, courseName), 'utf8');
                    totalQuestions += questions.length;
                    downloaded++;
                    downloaderEvents.emitEvent(courseId, 'log', {
                        message: `Saved ${questions.length} questions — ${quiz.name}`,
                        type: 'success',
                    });
                }
            } catch (err: any) {
                failed++;
                results.push({
                    quiz,
                    reviewUrl: null,
                    questions: [],
                    skippedReason: err.message || 'error',
                });
                downloaderEvents.emitEvent(courseId, 'log', {
                    message: `Failed: ${quiz.name} — ${err.message}`,
                    type: 'error',
                });
            }

            updateProgress(courseId, downloaded, skipped, failed, quizzes.length);
            await sleep(config.examPackDelay);
        }

        // Download figures / equation images once, rewrite HTML fragments
        const uniqueImgs = [...new Set(allImageUrls)];
        if (uniqueImgs.length) {
            downloaderEvents.emitEvent(courseId, 'log', {
                message: `Downloading ${uniqueImgs.length} figure/equation image(s)…`,
                type: 'pulse',
            });
            const urlMap = await downloadAssets(
                uniqueImgs,
                assetsDir,
                cookieHeader,
                lastReviewBase
            );
            rewriteResultImages(results, urlMap, lastReviewBase);
            downloaderEvents.emitEvent(courseId, 'log', {
                message: `Embedded ${urlMap.size / 2} image file(s) under assets/`,
                type: 'info',
            });
        }

        // Combined markdown + JSON
        fs.writeFileSync(
            path.join(packRoot, 'ALL_QUESTIONS.md'),
            formatAllQuestionsMarkdown(courseName, courseUrl, results),
            'utf8'
        );

        const generatedAt = new Date().toISOString();
        const manifest = {
            courseName,
            courseUrl,
            generatedAt,
            quizzes: results.map((r) => ({
                name: r.quiz.name,
                cmid: r.quiz.cmid,
                bucket: r.quiz.bucket,
                weekFolder: r.quiz.weekFolder,
                url: r.quiz.url,
                reviewUrl: r.reviewUrl,
                gradeSummary: r.gradeSummary,
                questionCount: r.questions.length,
                skippedReason: r.skippedReason,
                questions: r.questions,
            })),
            totals: {
                quizzes: results.length,
                withQuestions: downloaded,
                skipped,
                failed,
                questions: totalQuestions,
            },
        };
        fs.writeFileSync(
            path.join(packRoot, 'exam-pack.json'),
            JSON.stringify(manifest, null, 2),
            'utf8'
        );

        // HTML booklets: full (answers inline) + study (answers at end)
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
        const htmlPath = path.join(packRoot, 'Exam Pack.html');
        const htmlStudyPath = path.join(packRoot, 'Exam Pack Study.html');
        fs.writeFileSync(htmlPath, htmlFull, 'utf8');
        fs.writeFileSync(htmlStudyPath, htmlStudy, 'utf8');
        downloaderEvents.emitEvent(courseId, 'log', {
            message: 'Wrote Exam Pack.html + Exam Pack Study.html',
            type: 'success',
        });

        // PDFs via Playwright
        const pdfName = makeSafeFilename(`${courseName} - Exam Pack`) + '.pdf';
        const pdfStudyName = makeSafeFilename(`${courseName} - Exam Pack Study`) + '.pdf';
        const pdfPath = path.join(packRoot, pdfName);
        const pdfStudyPath = path.join(packRoot, pdfStudyName);

        downloaderEvents.emitEvent(courseId, 'log', {
            message: 'Rendering PDFs (full + study)…',
            type: 'pulse',
        });
        const pdfOut = await htmlFileToPdf(htmlPath, pdfPath, (msg) => {
            downloaderEvents.emitEvent(courseId, 'log', { message: msg, type: 'warning' });
        });
        if (pdfOut) {
            downloaderEvents.emitEvent(courseId, 'log', {
                message: `PDF ready: ${pdfName}`,
                type: 'success',
            });
        }
        const pdfStudyOut = await htmlFileToPdf(htmlStudyPath, pdfStudyPath, (msg) => {
            downloaderEvents.emitEvent(courseId, 'log', { message: msg, type: 'warning' });
        });
        if (pdfStudyOut) {
            downloaderEvents.emitEvent(courseId, 'log', {
                message: `Study PDF ready: ${pdfStudyName}`,
                type: 'success',
            });
        }

        const cancelled = isAborted(courseId);
        const readme = [
            `# ${courseName} — Exam Pack`,
            '',
            cancelled ? '## Partial run (cancelled)\n' : '',
            '## Open these (recommended for students)',
            '',
            pdfOut
                ? `1. **${pdfName}** — full booklet (answers + feedback inline)`
                : '1. **Exam Pack.html** — open in Chrome/Edge, then Print → Save as PDF',
            pdfStudyOut
                ? `2. **${pdfStudyName}** — study mode (questions first, answer key at end)`
                : '2. **Exam Pack Study.html** — study mode in browser',
            '3. **Exam Pack.html** / **Exam Pack Study.html** — interactive KaTeX view',
            '',
            '## Also included',
            '',
            '- `ALL_QUESTIONS.md` — plain-text fallback',
            '- `Week N/` and `Semester/` — per-quiz Markdown',
            '- `exam-pack.json` — structured data',
            '- `assets/` — downloaded figures / equation images',
            '',
            `Generated: ${generatedAt}`,
            '',
        ].join('\n');
        fs.writeFileSync(path.join(packRoot, 'README.txt'), readme, 'utf8');

        downloaderEvents.emitEvent(courseId, 'log', {
            message: cancelled
                ? `Exam Pack stopped early (partial): ${totalQuestions} questions → ${packRoot}`
                : `Exam Pack ready: ${totalQuestions} questions → ${packRoot}`,
            type: cancelled ? 'warning' : 'success',
        });

        const skippedQuizzes = results
            .filter((r) => r.skippedReason || r.questions.length === 0)
            .map((r) => ({
                name: r.quiz.name,
                weekFolder: r.quiz.weekFolder,
                reason: r.skippedReason || 'no questions extracted',
            }));

        downloaderEvents.emitEvent(courseId, 'summary', {
            mode: 'exam-pack',
            courseName,
            totalQuestions,
            quizzesWithQuestions: downloaded,
            skipped,
            failed,
            skippedQuizzes,
            packRelative: path.join(courseName, config.examPackFolder),
            pdfFileName: pdfOut ? pdfName : null,
            studyPdfFileName: pdfStudyOut ? pdfStudyName : null,
            htmlFileName: 'Exam Pack.html',
            hasPdf: Boolean(pdfOut),
            hasStudyPdf: Boolean(pdfStudyOut),
            cancelled,
        });
        downloaderEvents.emitEvent(courseId, 'status', {
            status: cancelled && totalQuestions === 0 ? 'failed' : 'completed',
        });
    } catch (err: any) {
        downloaderEvents.emitEvent(courseId, 'log', {
            message: `Fatal: ${err.message}`,
            type: 'error',
        });
        downloaderEvents.emitEvent(courseId, 'status', { status: 'failed' });
    }
}


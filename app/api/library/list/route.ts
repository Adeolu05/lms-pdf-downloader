import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { config } from '@/core/config';

export const dynamic = 'force-dynamic';

function countPdfs(dir: string, depth = 0): number {
    if (depth > 6 || !fs.existsSync(dir)) return 0;
    let n = 0;
    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return 0;
    }
    for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            // Don't double-count Exam Pack assets as "materials" deeply wrong
            n += countPdfs(p, depth + 1);
        } else if (e.isFile() && e.name.toLowerCase().endsWith('.pdf')) {
            n++;
        }
    }
    return n;
}

function findExamPackPdf(examDir: string): string | null {
    if (!fs.existsSync(examDir)) return null;
    try {
        const files = fs.readdirSync(examDir);
        const named = files.find(
            (f) => f.toLowerCase().endsWith('.pdf') && /exam\s*pack/i.test(f)
        );
        if (named) return named;
        const anyPdf = files.find((f) => f.toLowerCase().endsWith('.pdf'));
        return anyPdf || null;
    } catch {
        return null;
    }
}

export async function GET() {
    try {
        if (process.env.VERCEL) {
            return NextResponse.json({
                items: [],
                root: null,
                message: 'Library only available in the local app.',
            });
        }

        const root = path.resolve(config.downloadDir);
        if (!fs.existsSync(root)) {
            return NextResponse.json({ items: [], root, total: 0 });
        }

        const entries = fs.readdirSync(root, { withFileTypes: true });
        const items = [];

        for (const e of entries) {
            if (!e.isDirectory()) continue;
            if (e.name.startsWith('.')) continue;

            const courseDir = path.join(root, e.name);
            const examDir = path.join(courseDir, config.examPackFolder);
            const hasExamPack = fs.existsSync(examDir);
            const examPdf = hasExamPack ? findExamPackPdf(examDir) : null;
            const hasHtml =
                hasExamPack && fs.existsSync(path.join(examDir, 'Exam Pack.html'));
            const hasJson =
                hasExamPack && fs.existsSync(path.join(examDir, 'exam-pack.json'));

            let questionCount: number | null = null;
            let skippedQuizCount: number | null = null;
            if (hasJson) {
                try {
                    const manifest = JSON.parse(
                        fs.readFileSync(path.join(examDir, 'exam-pack.json'), 'utf8')
                    );
                    questionCount = manifest?.totals?.questions ?? null;
                    skippedQuizCount = manifest?.totals?.skipped ?? null;
                } catch {
                    /* ignore */
                }
            }

            // PDF materials = all PDFs under course, minus exam pack PDFs if we can
            let pdfCount = countPdfs(courseDir);
            if (examPdf) pdfCount = Math.max(0, pdfCount - 1);

            let mtime = 0;
            try {
                mtime = fs.statSync(courseDir).mtimeMs;
            } catch {
                /* ignore */
            }

            items.push({
                name: e.name,
                pdfCount,
                hasExamPack,
                examPdfName: examPdf,
                hasExamHtml: hasHtml,
                questionCount,
                skippedQuizCount,
                mtime,
            });
        }

        items.sort((a, b) => b.mtime - a.mtime);

        return NextResponse.json({
            items,
            root,
            total: items.length,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, items: [] }, { status: 500 });
    }
}

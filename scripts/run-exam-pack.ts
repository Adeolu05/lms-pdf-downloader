/**
 * CLI: build Exam Packs for one or more course URLs.
 *
 *   npx tsx scripts/run-exam-pack.ts "https://lms.miva.university/course/view.php?id=383"
 *   npx tsx scripts/run-exam-pack.ts 383 386
 */
import { runExamPack } from '../core/exam-pack';
import { downloaderEvents } from '../lib/events';

function resolveUrl(arg: string): string {
    if (/^https?:\/\//i.test(arg)) return arg;
    if (/^\d+$/.test(arg)) {
        return `https://lms.miva.university/course/view.php?id=${arg}`;
    }
    throw new Error(`Unrecognized course argument: ${arg}`);
}

async function main() {
    const args = process.argv.slice(2);
    if (!args.length) {
        console.error('Usage: npx tsx scripts/run-exam-pack.ts <courseUrl|id> [...]');
        console.error('Example: npx tsx scripts/run-exam-pack.ts 383 386');
        process.exit(1);
    }

    const urls = args.map(resolveUrl);

    downloaderEvents.on('event', (ev: any) => {
        const { courseId, type, data } = ev;
        if (type === 'log') {
            console.log(`[${courseId}] ${data.type || 'info'}: ${data.message}`);
        } else if (type === 'status') {
            console.log(`[${courseId}] status → ${data.status}${data.total != null ? ` (total ${data.total})` : ''}`);
        } else if (type === 'progress') {
            console.log(
                `[${courseId}] progress ${data.percent}% (saved ${data.downloaded}, skip ${data.skipped}, fail ${data.failed})`
            );
        } else if (type === 'meta') {
            console.log(`[${courseId}] course: ${data.name}`);
        } else if (type === 'error') {
            console.error(`[${courseId}] ERROR: ${data.message}`);
        }
    });

    for (let i = 0; i < urls.length; i++) {
        const id = `cli-${i + 1}`;
        console.log(`\n======== Exam Pack ${id}: ${urls[i]} ========\n`);
        await runExamPack(id, urls[i]);
    }

    console.log('\nDone.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

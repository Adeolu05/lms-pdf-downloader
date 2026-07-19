/**
 * Cooperative job cancellation for PDF download + Exam Pack engines.
 * API routes and UI call abort*; engines poll isAborted between items.
 */

const abortedIds = new Set<string>();
let abortAllFlag = false;

export function clearAbort(courseId: string) {
    abortedIds.delete(courseId);
}

export function clearAllAborts() {
    abortedIds.clear();
    abortAllFlag = false;
}

export function abortJob(courseId: string) {
    abortedIds.add(courseId);
}

export function abortAllJobs() {
    abortAllFlag = true;
}

export function isAborted(courseId: string): boolean {
    return abortAllFlag || abortedIds.has(courseId);
}

export function beginJob(courseId: string) {
    abortedIds.delete(courseId);
    // Don't clear abortAllFlag here if other jobs still running — only when starting fresh batch
}

/** Call once when a new batch is started from the UI */
export function beginBatch() {
    abortAllFlag = false;
    abortedIds.clear();
}

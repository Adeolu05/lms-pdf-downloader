/**
 * Course URL helpers — Miva LMS first, light validation for the queue UI.
 */

export type UrlCheck =
    | { ok: true; url: string; kind: 'miva-course' | 'generic' }
    | { ok: false; reason: string };

/** Normalise whitespace and trailing junk from pasted lines. */
export function cleanUrlCandidate(raw: string): string {
    return raw
        .trim()
        .replace(/^["'`]+|["'`]+$/g, '')
        .replace(/[),.;]+$/g, '');
}

/**
 * Split a paste blob into candidate URLs (newlines, commas, or spaces).
 */
export function splitUrlPaste(text: string): string[] {
    return text
        .split(/[\n\r,]+|\s{2,}/)
        .map(cleanUrlCandidate)
        .filter(Boolean);
}

export function isMivaCourseUrl(url: string): boolean {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        if (!host.includes('lms.miva.university') && !host.includes('miva.university')) {
            return false;
        }
        return /\/course\/view\.php/i.test(u.pathname) && u.searchParams.has('id');
    } catch {
        return false;
    }
}

/**
 * Validate a single course URL for the queue.
 * Accepts Miva course pages; allows other http(s) LMS course-like URLs with a warning path.
 */
export function validateCourseUrl(raw: string): UrlCheck {
    const cleaned = cleanUrlCandidate(raw);
    if (!cleaned) {
        return { ok: false, reason: 'Empty URL' };
    }

    let parsed: URL;
    try {
        parsed = new URL(cleaned);
    } catch {
        return {
            ok: false,
            reason: 'Not a valid URL. Use something like https://lms.miva.university/course/view.php?id=383',
        };
    }

    if (!/^https?:$/i.test(parsed.protocol)) {
        return { ok: false, reason: 'URL must start with http:// or https://' };
    }

    if (isMivaCourseUrl(cleaned)) {
        return { ok: true, url: parsed.toString(), kind: 'miva-course' };
    }

    // Soft accept: other LMS course pages (still runnable if user knows what they're doing)
    const path = parsed.pathname.toLowerCase();
    const looksLikeCourse =
        path.includes('/course/') ||
        path.includes('/courses/') ||
        parsed.searchParams.has('id');

    if (looksLikeCourse) {
        return { ok: true, url: parsed.toString(), kind: 'generic' };
    }

    return {
        ok: false,
        reason:
            'Expected a Miva course link (lms.miva.university/course/view.php?id=…). Open the course in LMS and copy the address bar.',
    };
}

export function validateCourseUrls(rawList: string[]): {
    accepted: string[];
    rejected: { raw: string; reason: string }[];
    nonMiva: number;
} {
    const accepted: string[] = [];
    const rejected: { raw: string; reason: string }[] = [];
    let nonMiva = 0;
    const seen = new Set<string>();

    for (const raw of rawList) {
        const result = validateCourseUrl(raw);
        if (!result.ok) {
            rejected.push({ raw, reason: result.reason });
            continue;
        }
        if (seen.has(result.url)) continue;
        seen.add(result.url);
        accepted.push(result.url);
        if (result.kind === 'generic') nonMiva++;
    }

    return { accepted, rejected, nonMiva };
}

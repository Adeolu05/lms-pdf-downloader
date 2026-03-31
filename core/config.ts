/**
 * Configuration for the Miva LMS PDF Downloader.
 */
import path from 'path';

/** Writable root for `sessions/` and `downloads/` (set by Electron when packaged). */
function dataRoot(): string {
    return process.env.LMS_USER_DATA_DIR
        ? path.resolve(process.env.LMS_USER_DATA_DIR)
        : process.cwd();
}

export const config = {
    baseUrl: 'https://lms.miva.university/',
    get sessionPath(): string {
        return path.join(dataRoot(), 'sessions', 'storageState.json');
    },
    get downloadDir(): string {
        return path.join(dataRoot(), 'downloads');
    },
    selectors: {
        course: {
            pdfLink: 'a.aalink:has(img.icon), a:has(span.instancename:has-text("(PDF)")), .activityinstance a:has(img[src*="pdf"])',
            title: 'span.instancename',
            courseName: 'nav#breadcrumbs ul li:last-child span, h1.page-title, .page-header-headings h1',
        },
        viewer: {
            pdfIframe: 'iframe[src*=".pdf"], iframe#content_iframe, iframe.tool_launch',
            pdfEmbed: 'embed[type="application/pdf"], embed[src*=".pdf"]',
            pdfObject: 'object[data*=".pdf"], object[type="application/pdf"]',
            pdfAnchor: 'a[href*=".pdf"], a[href*="forcedownload=1"]',
            gatewayLink: '.resourcecontent a, .resourceworkaround a, a[href*="resource/view.php"], a:has-text("open the resource")',
            navigationWait: 5000,
            extractionWait: 3000,
        },
        auth: {
            loginIndicator: '#login, .login-container, form[action*="login"], #loginbtn, input[type="password"]',
            accessDeniedIndicator: '.error-message, .access-denied, #access-denied, .alert-danger',
        }
    },
    pdfMatchRegex: /\(PDF\)/gi,
    weekRegex: /Week\s*(\d+)/i,
    delay: 2000,
    retryWait: 5000,
    elementTimeout: 30000,
};

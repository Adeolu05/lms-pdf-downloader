/**
 * Configuration for the Miva LMS PDF Downloader.
 * Updated for Direct Download Strategy (v4.0).
 */
module.exports = {
  // 1. Updated LMS Base URL
  baseUrl: 'https://lms.miva.university/',

  // Path to save session state (Playwright storageState)
  sessionPath: './sessions/storageState.json',

  // Directory to save downloads
  downloadDir: './downloads',

  // Selectors
  selectors: {
    // Course Page Selectors
    course: {
      pdfLink: 'a:has(span.instancename:has-text("(PDF)"))',
      title: 'span.instancename',
      courseName: 'nav#breadcrumbs ul li:last-child span, h1.page-title, .page-header-headings h1',
    },

    // PDF Resource Page / Viewer Selectors
    viewer: {
      // Extraction Strategies (Ordered by priority)
      pdfIframe: 'iframe[src*=".pdf"], iframe#content_iframe, iframe.tool_launch',
      pdfEmbed: 'embed[type="application/pdf"], embed[src*=".pdf"]',
      pdfObject: 'object[data*=".pdf"], object[type="application/pdf"]',
      pdfAnchor: 'a[href*=".pdf"], a[href*="forcedownload=1"]',

      // Gateway / Intermediate Link Selectors
      gatewayLink: '.resourcecontent a, .resourceworkaround a, a[href*="resource/view.php"], a:has-text("open the resource")',

      // Wait Times
      navigationWait: 5000, // Wait for intermediate hops
      extractionWait: 3000, // Wait for embeds to render after navigation
    },

    // Session Validation Selectors
    auth: {
      // Refined: specifically target login forms/containers, avoid generic buttons/inputs.
      loginIndicator: '#login, .login-container, form[action*="login"], #loginbtn',
      accessDeniedIndicator: '.error-message, .access-denied, #access-denied, .alert-danger',
    }
  },

  // Regex to match items that contain (PDF)
  pdfMatchRegex: /\(PDF\)/gi,

  // Regex to extract Week number (e.g., "Week 3")
  weekRegex: /Week\s*(\d+)/i,

  // Delay between actions (milliseconds)
  delay: 2000,

  // Wait time before retrying a scan (milliseconds)
  retryWait: 5000,

  // Timeout for waiting for elements
  elementTimeout: 30000,
};

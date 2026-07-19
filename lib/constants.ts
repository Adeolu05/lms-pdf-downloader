/** Public GitHub URLs (download landing, footer links). */
export const GITHUB_REPO_URL = 'https://github.com/Adeolu05/lms-pdf-downloader';
export const GITHUB_RELEASES_LATEST_URL = `${GITHUB_REPO_URL}/releases/latest`;
export const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues`;

/** @deprecated Prefer DESIGN_TOKENS / Tailwind theme — kept aligned for any legacy imports */
export const THEME = {
    colors: {
        background: "#F6F6F3",
        surface: "#FFFFFF",
        surfaceAlt: "#F0EDE7",
        border: "#1A1A1A",
        primary: "#0F0F0F",
        primaryHover: "#333333",
        accent: "#8FE388",
        mint: "#8FE388",
        lilac: "#C6B8FF",
        sky: "#B8D9FF",
        yellow: "#F4E3B2",
        heading: "#0F0F0F",
        body: "#0F0F0F",
        muted: "#6B6B6B",
        success: "#8FE388",
        warning: "#F4E3B2",
        error: "#F2C6C6",
    },
    radius: {
        card: "20px",
        button: "14px",
    }
};

export type CourseStatus = 'scanning' | 'downloading' | 'completed' | 'failed';

export const STATUS_CONFIG = {
    scanning: {
        label: 'Scanning',
        variant: 'default' as const,
        animate: true,
    },
    downloading: {
        label: 'Downloading',
        variant: 'primary' as const,
        animate: false,
    },
    completed: {
        label: 'Completed',
        variant: 'success' as const,
        animate: false,
    },
    failed: {
        label: 'Failed',
        variant: 'error' as const,
        animate: false,
    },
};

export const MOCK_LOGS = [
    { time: '14:20:01', message: 'Found 15 PDF items in Canvas', type: 'info' as const },
    { time: '14:20:03', message: 'Skipped: Week 1 Lecture.pdf (Already exists)', type: 'warning' as const },
    { time: '14:21:45', message: 'Saved: Week 3 - Cognitive Dev.pdf (4.2MB)', type: 'success' as const },
    { time: '14:22:10', message: 'Error: Week 4 - Lab Guide (Timeout)', type: 'error' as const },
    { time: '14:22:15', message: 'Downloading: Final Review Material.pdf...', type: 'pulse' as const },
];

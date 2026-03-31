/** Public GitHub URLs (download landing, footer links). */
export const GITHUB_REPO_URL = 'https://github.com/Adeolu05/lms-pdf-downloader';
export const GITHUB_RELEASES_LATEST_URL = `${GITHUB_REPO_URL}/releases/latest`;
export const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues`;

export const THEME = {
    colors: {
        background: "#F4F1EB",
        surface: "#FFFFFF",
        surfaceAlt: "#F8F5EF",
        border: "#111111",
        primary: "#111111",
        primaryHover: "#333333",
        accent: "#A7F48B",
        mint: "#A7F48B",
        lilac: "#D8B9FF",
        sky: "#8EC9FF",
        yellow: "#FFE28A",
        heading: "#111111",
        body: "#2B2B2B",
        muted: "#6B6B6B",
        success: "#7BE27B",
        warning: "#FFC857",
        error: "#FF7A7A",
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

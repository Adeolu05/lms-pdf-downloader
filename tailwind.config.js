/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#F4F1EB",
                surface: "#FFFFFF",
                "surface-alt": "#F8F5EF",
                border: "#111111",
                primary: {
                    DEFAULT: "#111111",
                    hover: "#333333",
                },
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
            fontFamily: {
                sans: ["var(--font-sans)", "sans-serif"],
                mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
            },
            borderRadius: {
                card: "20px",
                btn: "14px",
            },
            borderWidth: {
                thick: "2px",
            },
            animation: {
                "fade-in-up": "fadeInUp 0.4s ease-out both",
                "slide-in-right": "slideInRight 0.3s ease-out both",
                "count-pop": "countPop 0.3s ease-out",
                "gentle-pulse": "gentlePulse 2s ease-in-out infinite",
            },
            keyframes: {
                fadeInUp: {
                    "0%": { opacity: "0", transform: "translateY(16px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                slideInRight: {
                    "0%": { opacity: "0", transform: "translateX(12px)" },
                    "100%": { opacity: "1", transform: "translateX(0)" },
                },
                countPop: {
                    "0%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.12)" },
                    "100%": { transform: "scale(1)" },
                },
                gentlePulse: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.7" },
                },
            },
        },
    },
    plugins: [],
};

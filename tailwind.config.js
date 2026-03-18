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
                // Spec-exact colours
                background:   "#F6F6F3",
                surface:      "#FFFFFF",
                "surface-alt":"#F0EDE7",
                border:       "#1A1A1A",
                heading:      "#0F0F0F",
                body:         "#0F0F0F",
                muted:        "#6B6B6B",
                // Accents
                mint:   "#8FE388",
                lilac:  "#C6B8FF",
                sky:    "#B8D9FF",
                yellow: "#F4E3B2",
                // Semantic
                success: "#8FE388",
                warning: "#F4E3B2",
                error:   "#F2C6C6",
                "error-text": "#C43C3C",
            },
            fontFamily: {
                sans: ["var(--font-sans)", "Inter", "sans-serif"],
                mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
            },
            borderRadius: {
                card: "20px",
                btn:  "14px",
            },
            boxShadow: {
                hard:   "4px 4px 0px #1A1A1A",
                "hard-sm": "2px 2px 0px #1A1A1A",
                "hard-lg": "6px 6px 0px #1A1A1A",
            },
            animation: {
                "fade-in-up":   "fadeInUp 0.4s ease-out both",
                "slide-in-right": "slideInRight 0.3s ease-out both",
                "count-pop":    "countPop 0.3s ease-out",
                "gentle-pulse": "gentlePulse 2s ease-in-out infinite",
                "hero-glow":    "heroGlow 4s ease-in-out infinite",
                "success-pop":  "successPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
                "blink":        "blink 1s step-start infinite",
            },
            keyframes: {
                fadeInUp: {
                    "0%":   { opacity: "0", transform: "translateY(16px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                slideInRight: {
                    "0%":   { opacity: "0", transform: "translateX(12px)" },
                    "100%": { opacity: "1", transform: "translateX(0)" },
                },
                countPop: {
                    "0%":   { transform: "scale(1)" },
                    "50%":  { transform: "scale(1.12)" },
                    "100%": { transform: "scale(1)" },
                },
                gentlePulse: {
                    "0%, 100%": { opacity: "1" },
                    "50%":      { opacity: "0.65" },
                },
                heroGlow: {
                    "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
                    "50%":      { opacity: "0.8", transform: "scale(1.04)" },
                },
                successPop: {
                    "0%":   { transform: "scale(0.85)", opacity: "0" },
                    "60%":  { transform: "scale(1.06)", opacity: "1" },
                    "100%": { transform: "scale(1)" },
                },
                blink: {
                    "0%, 100%": { opacity: "1" },
                    "50%":      { opacity: "0" },
                },
            },
        },
    },
    plugins: [],
};

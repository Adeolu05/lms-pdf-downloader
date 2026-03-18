/**
 * Core Design Tokens
 * 
 * This file serves as the single source of truth for programmatic styling across
 * the application, ensuring consistency between Tailwind classes and any dynamic
 * inline styles or JS-driven animations.
 * 
 * Reference: `docs/design-system.md`
 */

export const DESIGN_TOKENS = {
    colors: {
        // Base & Background
        background: '#F6F6F3',
        surface: '#FFFFFF',
        surfaceAlt: '#F0EDE7',
        
        // Text & Borders
        heading: '#0F0F0F',
        body: '#0F0F0F',
        muted: '#6B6B6B',
        border: '#1A1A1A',
        
        // Accents (Status & Callouts)
        mint: '#8FE388',     // Success, Primary Action
        lilac: '#C6B8FF',    // Secondary Accent
        sky: '#B8D9FF',      // Info, Scanning State
        yellow: '#F4E3B2',   // Warning, Skipped State
        red: '#F2C6C6',      // Error, Failed State
        errorText: '#C43C3C',// High-contrast error text
    },
    
    borders: {
        width: '2px',
        color: '#1A1A1A',
        radii: {
            sm: '12px',
            btn: '14px',
            card: '20px',
        }
    },
    
    shadows: {
        hardSm: '2px 2px 0px #1A1A1A',
        hard: '4px 4px 0px #1A1A1A',
        hardLg: '6px 6px 0px #1A1A1A',
    },
    
    animation: {
        durations: {
            fast: '200ms',
            normal: '400ms',
            slow: '700ms',
        },
        easing: {
            pop: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            smooth: 'ease-out',
        }
    }
} as const;

export type AppColor = keyof typeof DESIGN_TOKENS.colors;
export type AppShadow = keyof typeof DESIGN_TOKENS.shadows;

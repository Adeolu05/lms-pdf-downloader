# LMS PDF Downloader — Design System

This document outlines the core visual language and design philosophy for the LMS PDF Downloader web application. 

Our goal is to create a tool that feels **premium, distinctive, and slightly playful**, elevating it above generic SaaS templates while remaining highly functional for students.

## 1. Typography

We use a two-font system to separate the user interface from technical outputs.

*   **Primary (UI): `Inter`**
    *   Used for all headings, body text, buttons, and general UI elements.
    *   Weights: `font-medium` (body), `font-bold` (buttons/labels), `font-black` (heroes & core headlines).
    *   Tracking: Tightly kerned on large headlines (`tracking-tight`, `tracking-[-0.03em]`).
*   **Secondary (Logs & Data): `JetBrains Mono`**
    *   Used exclusively for the Live Log Panel, file tree previews, and status output.
    *   Provides a precise, technical "terminal" aesthetic.

## 2. Colour Tokens

Our colour palette is tight, warm, and highly intentional. Avoid using default Tailwind colours outside of this system.

### Base & Backgrounds
*   **Background:** `#F6F6F3` (Soft, warm neutral. Never pure white.)
*   **Surface:** `#FFFFFF` (For elevated cards against the background.)
*   **Surface Alt:** `#F0EDE7` (For secondary containers, inputs, or hovered rows.)

### Text & Borders
*   **Text Primary (Heading/Body):** `#0F0F0F` (Near black, high contrast.)
*   **Text Muted:** `#6B6B6B` (For subtitles, hints, and secondary info.)
*   **Borders:** `#1A1A1A` (Strong, defining outlines for all interactive elements.)

### Accents (Pastel / Neo-brutalist)
*   🟢 **Mint:** `#8FE388` (Primary action, success state, main brand colour)
*   🟣 **Lilac:** `#C6B8FF` (Secondary accent, bulk/folder actions)
*   🔵 **Sky:** `#B8D9FF` (Info, scanning states, ambient glows)
*   🟡 **Yellow:** `#F4E3B2` (Warning, skipped files, secondary hover states)
*   🔴 **Red:** `#F2C6C6` (Error, destructive actions. Deep red `#C43C3C` used for error text.)

## 3. Component Rules

All components must adhere strictly to these physical properties to maintain the "premium tactile" aesthetic.

*   **Borders:** `2px solid #1A1A1A` on almost all components (Cards, Buttons, Inputs, Badges).
*   **Corner Radii:**
    *   Cards & major containers: `20px` (`rounded-card`)
    *   Buttons & inputs: `14px` (`rounded-btn`)
    *   Avatars & small elements: `12px`
*   **Shadow System (Hard Shadows):**
    *   No blur. Solid `#1A1A1A`.
    *   `shadow-hard`: `4px 4px 0px #1A1A1A` (Default for Cards and Buttons)
    *   `shadow-hard-sm`: `2px 2px 0px #1A1A1A` (Badges, Inputs, small widgets)
    *   `shadow-hard-lg`: `6px 6px 0px #1A1A1A` (Hover state for Cards/Buttons)
*   **Spacing:** Strict 8pt / 4pt grid system using standard Tailwind spacing (`gap-4`, `p-6`, `p-8`).

## 4. UI Philosophy & Interaction

The interface should feel "alive" and responsive.

*   **Micro-interactions:** Every interactive element MUST have a hover and active state.
    *   Buttons: `hover:-translate-y-0.5 hover:scale-[1.02]`
    *   Active/Press: `active:scale-[0.97]`
    *   Cards (interactive): `hover:-translate-y-1`
*   **Transitions:** Swift but smooth (`transition-all duration-200 ease-out`).
*   **Ambient Motion:** Use subtle, slow animations for background elements (e.g., `hero-glow` orbes).
*   **Texture:** The background includes a 3% opacity SVG fractal noise (grain) to reduce the "flat digital" feel and make it feel more tactile.

## 5. Status System

When representing states (like in the Course Card or Log Panel):

*   **Success / Completed:** Mint (`#8FE388`). Uses the `success-pop` keyframe animation for celebratory reveals.
*   **Pending / Scanning:** Sky (`#B8D9FF`). Uses the `scanning-dot` or `gentle-pulse` keyframe animation to indicate active background work.
*   **Warning / Skipped:** Yellow (`#F4E3B2`).
*   **Error / Failed:** Red (`#F2C6C6`).

*See `tailwind.config.js` and `app/globals.css` for the technical implementation of these tokens.*

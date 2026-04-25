# BIGBADPHOTOS: Unified Home Screen Code Handoff

This document contains the finalized HTML and CSS for the BIGBADPHOTOS Home Screen across Mobile, Tablet, and Desktop viewports.

## 1. Responsive Design Tokens
- **Font:** Manrope (Primary, Bold/Medium for emphasis)
- **Primary Accent:** #00D1FF (Cyan)
- **Backgrounds:** #0E0E0E (Primary), #131313 (Surface)
- **Hero Image:** {{DATA:IMAGE:IMAGE_21}} (Eagle Photo)

## 2. Mobile Version (Simple UX)
**Goal:** High-velocity configuration on a single column.
**Code:**
```html
{{DATA:SCREEN:SCREEN_27}}
```

## 3. Tablet Version (Hybrid UX)
**Goal:** Balanced layout for touch devices with compact side navigation.
**Code:**
```html
{{DATA:SCREEN:SCREEN_40}}
```

## 4. Desktop Version (Dashboard UX)
**Goal:** Professional workstation feel with persistent navigation and expanded telemetry.
**Code:**
```html
{{DATA:SCREEN:SCREEN_29}}
```

## 5. Technical Implementation Notes
- **Placeholder Logic:** Use the Eagle Photo as a `src` placeholder before a directory is selected.
- **Dynamic Content:** Upon directory selection, replace the hero `src` with the first image asset and update the filename label.
- **Tailwind CSS:** All code uses standard Tailwind classes. No custom CSS files are required beyond the Tailwind CDN/build.
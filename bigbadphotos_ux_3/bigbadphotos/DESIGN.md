# Design System Documentation: BIGBADPHOTOS

## 1. Overview & Creative North Star: "The Obsidian Lens"
The BIGBADPHOTOS visual identity is rooted in the "Obsidian Lens" aesthetic—a creative direction that mimics the high-stakes, surgical environment of a professional darkroom. We are moving away from the "generic SaaS" look toward a **High-End Editorial** experience.

**The Creative North Star: The Digital Curator**
This design system treats the screen as a high-precision optical instrument. It is cold, focused, and intentionally brutalist in its geometry (0px border radii), yet sophisticated in its use of light and depth. We eschew traditional UI decorations in favor of **Tonal Layering** and **Asymmetric Balance**. Every element should feel like it was placed by a master printer, prioritizing the image and the technical metadata over "friendly" UI tropes.

---

## 2. Colors: High-Contrast Obsidian
The palette is built on a foundation of deep blacks and technical cyans. We use light not as a decoration, but as a functional highlight.

### The Palette (Material Design Tokens)
*   **Surface/Background:** `#131313` (The base obsidian layer)
*   **Primary (The Glow):** `#a4e6ff` | **Primary Container (The Accent):** `#00d1ff`
*   **On-Primary:** `#003543` (Deep contrast for legibility)
*   **Secondary (The Technical):** `#9ccee2`
*   **Tertiary (The Warning/Warmth):** `#ffd59c`

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections. In the BIGBADPHOTOS ecosystem, boundaries are defined by **Background Color Shifts**. 
*   To separate a sidebar, use `surface_container_low` against the `surface` background. 
*   To highlight a workspace, use `surface_container_high`.
*   Lines are only permitted as "Ghost Borders" (see Section 4) when absolute technical containment is required.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of glass plates. Use the `surface_container` tiers to create depth:
1.  **Base Layer:** `surface` (`#131313`)
2.  **Inset/Low Importance:** `surface_container_lowest` (`#0e0e0e`)
3.  **Standard Elevated Section:** `surface_container` (`#201f1f`)
4.  **Active/Interaction Layer:** `surface_container_highest` (`#353534`)

### The "Glass & Gradient" Rule
To prevent the UI from feeling "flat," use **Glassmorphism** for floating technical panels. Use a semi-transparent `surface_variant` with a `backdrop-filter: blur(20px)`. Main CTAs should utilize a subtle linear gradient from `primary` to `primary_container` to simulate the glow of a light table.

---

## 3. Typography: Technical Manrope
We use **Manrope** exclusively. Its geometric yet humanist qualities provide the "Surgical Precision" required for BIGBADPHOTOS.

*   **Display (Lg/Md/Sm):** 3.5rem down to 2.25rem. Use for massive, editorial impact. Apply `-0.02em` letter spacing to feel tighter and more premium.
*   **Headline & Title:** Use for section headers. Always in `on_surface`.
*   **Body (Lg/Md/Sm):** 1rem to 0.75rem. This is your workhorse. Use `body-md` for technical metadata.
*   **Label (Md/Sm):** 0.75rem to 0.6875rem. Use all-caps for "Technical Tags" or "Camera Settings" to lean into the professional gear aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows and borders are replaced by light-physics and stacking.

*   **The Layering Principle:** Avoid `z-index` with drop shadows. Instead, place a `surface_container_highest` element over a `surface_container_low` background. The change in hex value provides all the "lift" needed for a professional darkroom feel.
*   **Ambient Shadows:** If a floating element (like a context menu) requires a shadow, use a 32px blur at 6% opacity, using the `primary` color as the shadow tint. This simulates the way light bleeds around high-end optical equipment.
*   **The Ghost Border:** If a boundary is necessary for accessibility, use the `outline_variant` token at 15% opacity. Never use 100% opaque lines.
*   **Zero-Radius Mandate:** Every container, button, and input must have a **0px border radius**. The BIGBADPHOTOS brand is sharp, clinical, and uncompromising.

---

## 5. Components: Precision Tools

### Buttons
*   **Primary:** Solid `primary_container` (#00D1FF) with `on_primary` text. No rounded corners. Hard edges only.
*   **Secondary:** `outline` border (at 20% opacity) with `on_surface` text.
*   **State Change:** On hover, a primary button should "glow"—increasing the brightness of the cyan, not changing the color.

### Input Fields
*   **Style:** Minimalist. No background fill by default. A bottom-only "Ghost Border" using `outline_variant`. 
*   **Focus State:** The border transitions to `primary` (#00D1FF) with a subtle outer glow (box-shadow: 0 0 8px #00D1FF22).

### Cards & Lists
*   **Prohibition:** No divider lines between list items. Use 16px or 24px vertical whitespace (Spacing Scale) to separate content.
*   **Hover State:** Entire list items should shift to `surface_container_high` on hover to indicate interactivity.

### Technical Metadata Chips
*   Used for ISO, Aperture, and Shutter Speed. 
*   Background: `surface_container_lowest`. 
*   Text: `secondary` (#9CCEE2) in `label-sm` all-caps.

---

## 6. Do's and Don'ts

### Do
*   **DO** use intentional asymmetry. Align large display text to the left while keeping technical data right-aligned to create a professional, "non-templated" editorial grid.
*   **DO** embrace the dark. Ensure 90% of the UI remains in the `surface` to `surface_container_low` range.
*   **DO** use high-contrast cyan (#00D1FF) sparingly for "Success" or "Action" states to maintain its impact.

### Don't
*   **DON'T** use rounded corners. If it’s not a perfect 90-degree angle, it’s not BIGBADPHOTOS.
*   **DON'T** use standard grey shadows. Shadows should be invisible or tinted with the "Obsidian" blue.
*   **DON'T** use generic icons. Use "Surgical" stroke-based icons with 1.5px or 1px weights to match the Manrope font weight.
*   **DON'T** use "Safety Blue." Only use the specified Cyan (#00D1FF) to maintain the darkroom aesthetic.
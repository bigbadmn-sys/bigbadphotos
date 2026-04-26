# BIGBADPHOTOS: Developer Creative Brief & Handoff Guide

## 1. Project Vision: "The Obsidian Lens"
BIGBADPHOTOS is a professional-grade image culling and review application designed for high-velocity workflows. The aesthetic, "Obsidian Lens," is a darkroom-inspired interface that prioritizes visual focus on photography, minimizes eye fatigue, and exudes technical precision.

## 2. Design Principles
*   **Minimalist Utilitarianism:** Every UI element must serve a functional purpose. Eliminate clutter to keep the focus on the images.
*   **Surgical Precision:** Use sharp lines, tight tracking (Manrope), and a high-contrast cyan accent (#00D1FF) for critical actions and states.
*   **Immersive Atmosphere:** A deep charcoal/black palette (#0E0E0E / #131313) creates a "Digital Darkroom" environment.
*   **Responsiveness:** The app must provide a seamless experience across mobile, tablet, and desktop, adapting its navigation and layout to the device's strengths.

## 3. Core User Flow: Home Screen
The entry point of the app is designed for immediate action. 
1.  **Initial Load:** Displays a high-quality placeholder (User's Eagle Photo) to set the professional tone.
2.  **Configuration:** User selects "Source Directory" (Input) and "Export Target" (Output).
3.  **Engagement:** Once a source is selected, the placeholder is replaced by the first image in that directory, and the "Begin Review" button is activated.

## 4. Technical Specifications
*   **Typography:** Manrope (Primary). Use uppercase for navigation and labels to enhance the "tool-like" feel.
*   **Color Palette:**
    *   Background: `#0E0E0E` (Primary), `#131313` (Surface)
    *   Accent: `#00D1FF` (Cyan)
    *   Text: `#FFFFFF` (Primary), `#9CCEE2` (Secondary/Subtle)
*   **Components:** Leverage the predicted `TopAppBar`, `SideNavBar`, and `BottomNavBar` for structural consistency across views.

## 5. Implementation Guidance
*   **Image Handling:** Ensure the hero image on the home screen scales correctly (contain/cover) to avoid cropping the user's photography.
*   **Transitions:** Aim for instantaneous transitions between states to maintain "flow state" for the user.
*   **Tailwind CSS:** All provided code snippets use standard Tailwind CSS classes for rapid styling.
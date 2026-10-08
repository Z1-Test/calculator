---
type: Journey
title: "First Launch and Theme Customization Journey"
status: stable
tags: [journey, onboarding, theme, user-experience]
generated:
  by: "process:implement"
  at: "2026-10-08T00:00:00Z"
sources:
  - resource: "docs/context/project/architecture.md"
  - resource: "docs/context/features/app-shell/feature.md"
---

# First Launch and Theme Customization Journey

## 1. Journey Objective

Provide an intuitive, friction-free initial experience where a user opens StayCalc for the first time, immediately recognizes the clean, distraction-free interface, interacts with the keypad, and effortlessly personalizes the theme according to their ambient lighting environment.

## 2. Step-by-Step Experience

### Step 1: Immediate First Contentful Paint
- **User Action**: Navigates to the StayCalc URL or opens the PWA from home screen.
- **System Presentation**: The Declarative Shadow DOM renders the complete application shell instantly with zero visual flicker (FOUC). The header displays the "StayCalc" brand title, calculation mode pills, and a theme switch button. The display shows a crisp `0` with tabular typography, and the arithmetic keypad presents tactile pill-shaped buttons.
- **User Emotion**: Delighted by the immediate startup velocity and clean visual aesthetic.

### Step 2: Keypad Exploration & Arithmetic Input
- **User Action**: Clicks or taps button `7`, then `+`, then `5`.
- **System Presentation**: Primary display immediately shows `7`, secondary line updates with `7 +`, and active keys provide subtle tactile micro-interactions (`transform: scale(0.96)`).
- **User Emotion**: Confident in the calculator's responsiveness.

### Step 3: Theme Toggle & Preference Persistence
- **User Action**: Taps the sun/moon theme toggle button in the header to switch to dark mode.
- **System Presentation**: Color tokens transition instantaneously via CSS custom properties from light canvas (`#ffffff`) to rich dark surface canvas (`#09090b` / `#18181b`). The theme setting is written to `localStorage`.
- **User Emotion**: Appreciates the aesthetic dark theme and eye-comfort during low-light sessions.

### Step 4: Session Restoration
- **User Action**: Closes the tab and returns later.
- **System Presentation**: StayCalc initializes directly with the previously chosen dark theme without a momentary light flash.

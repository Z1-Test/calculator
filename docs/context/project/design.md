---
type: Concept
title: "StayCalc Design System"
status: stable
tags: [design, tokens, theme]
version: alpha
name: "StayCalc Design System"
description: >
  High-precision, distraction-free calculation interface anchored on clean neutral canvas,
  vibrant electric blue accents, crisp tabular typography, and tactile pill geometry.

colors:
  primary: "var(--calc-primary, #2563eb)"
  on-primary: "var(--calc-on-primary, #ffffff)"
  secondary: "var(--calc-secondary, #475569)"
  tertiary: "var(--calc-tertiary, #f4f4f5)"
  background: "var(--calc-background, #ffffff)"
  surface: "var(--calc-surface, #f4f4f5)"
  container-high: "var(--calc-container-high, #ffffff)"
  container-medium: "var(--calc-container-medium, #f4f4f5)"
  container-low: "var(--calc-container-low, #e4e4e7)"
  text-primary: "var(--calc-text-primary, #09090b)"
  text-secondary: "var(--calc-text-secondary, #71717a)"
  outline-low: "var(--calc-outline-low, #e4e4e7)"
  info: "var(--calc-info, #0a84ff)"
  success: "var(--calc-success, #30d158)"
  warning: "var(--calc-warning, #ffd60a)"
  error: "var(--calc-error, #ff453a)"
  scrim: "var(--calc-scrim, rgba(0, 0, 0, 0.4))"

typography:
  display-xl:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.02em
  display-lg:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.015em
  title-md:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  button-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.01em
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: 0

rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 14px
  lg: 16px
  xl: 24px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

components:
  calc-key-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: 16px 20px
    height: 56px
  calc-key-numeric:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    border: "1px solid {colors.outline-low}"
    padding: 16px 20px
    height: 56px
  calc-display:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text-primary}"
    typography: "{typography.display-xl}"
    rounded: "{rounded.lg}"
    padding: 24px
    border: "1px solid {colors.outline-low}"
  history-drawer:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.outline-low}"
    padding: 20px
---

# StayCalc Design System

## Overview
A high-velocity, tactile calculator interface optimized for instant calculation response, clean neutral canvas backgrounds, and expressive electric blue highlights. Supports seamless dynamic light and dark theme switching through CSS variable bindings.

## Colors
Color values use native CSS variable syntax `var(--calc-*, <fallback>)` to bind directly to theme variables while providing brand fallback colors. `{colors.primary}` is the primary evaluation action trigger (`=`). Standard numeric keys utilize `{colors.surface}` with high-contrast text.

## Typography
Calculated totals and active expressions utilize tabular lining numerals with Plus Jakarta Sans and Inter font stacks to prevent digit jumping during rapid entry.

## Layout
Keypad layouts utilize CSS Grid with 8px to 12px gaps:
- **Mobile Viewport**: 4-column compact keypad grid with expandable scientific drawer.
- **Desktop / Wide Viewport**: Expanded 6-column to 8-column layout with side-by-side history panel.

## Elevation & Depth
Depth is created through clean hairline borders (`1px solid {colors.outline-low}`) and subtle key depression active states (`transform: scale(0.96)`) rather than heavy drop shadows.

## Shapes
All calculator keypad triggers are strictly pill-shaped (`{rounded.full}`). Container panels and the display card use 16px radius (`{rounded.lg}`).

## Do's and Don'ts
- **DO** maintain pill shape (`rounded: full`) on all keypad buttons.
- **DO** provide immediate visual `:active` feedback on keypresses.
- **DON'T** use multi-color gradients or distracting animations that slow down calculation flow.
- **DON'T** hide current memory indicator state (`M`) from the active display.

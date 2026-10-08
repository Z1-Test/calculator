---
type: Concept
title: "StayCalc Design System"
status: stable
tags: [design, staylook, tokens]
version: alpha
name: "StayCalc Design System"
description: >
  High-precision, distraction-free calculation interface anchored on clean neutral canvas,
  vibrant electric blue accents, crisp tabular typography, and tactile pill geometry.

colors:
  sl-primary: "var(--sl-primary, #2563eb)"
  sl-on-primary: "var(--sl-on-primary, #ffffff)"
  sl-secondary: "var(--sl-secondary, #475569)"
  sl-tertiary: "var(--sl-tertiary, #f4f4f5)"
  sl-background: "var(--sl-background, #ffffff)"
  sl-surface: "var(--sl-surface, #f4f4f5)"
  sl-container-high: "var(--sl-container-high, #ffffff)"
  sl-container-medium: "var(--sl-container-medium, #f4f4f5)"
  sl-container-low: "var(--sl-container-low, #e4e4e7)"
  sl-text-primary: "var(--sl-text-primary, #09090b)"
  sl-text-secondary: "var(--sl-text-secondary, #71717a)"
  sl-outline-low: "var(--sl-outline-low, #e4e4e7)"
  sl-info: "var(--sl-info, #0a84ff)"
  sl-success: "var(--sl-success, #30d158)"
  sl-warning: "var(--sl-warning, #ffd60a)"
  sl-error: "var(--sl-error, #ff453a)"
  sl-scrim: "var(--sl-scrim, oklch(0.4184 0 89.88))"

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
  full: 624.9375rem

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
    backgroundColor: "{colors.sl-primary}"
    textColor: "{colors.sl-on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: 16px 20px
    height: 56px
  calc-key-numeric:
    backgroundColor: "{colors.sl-surface}"
    textColor: "{colors.sl-text-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    border: "1px solid {colors.sl-outline-low}"
    padding: 16px 20px
    height: 56px
  calc-display:
    backgroundColor: "{colors.sl-background}"
    textColor: "{colors.sl-text-primary}"
    typography: "{typography.display-xl}"
    rounded: "{rounded.lg}"
    padding: 24px
    border: "1px solid {colors.sl-outline-low}"
  history-drawer:
    backgroundColor: "{colors.sl-background}"
    textColor: "{colors.sl-text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.sl-outline-low}"
    padding: 20px
---

# StayCalc Design System

## Overview
A high-velocity, tactile calculator interface optimized for instant calculation response, clean neutral canvas backgrounds, and expressive electric blue highlights. Supports seamless dynamic light and dark theme switching through CSS variable bindings.

## Colors
Color names come from Staytoken in `@staytunedllp/staystack`. Color values use Staylook CSS variable syntax `var(--sl-*, <fallback>)` to bind directly to theme variables while providing brand fallback colors. `{colors.sl-primary}` is the primary evaluation action trigger (`=`). Standard numeric keys utilize `{colors.sl-surface}` with high-contrast text.

## Typography
Calculated totals and active expressions utilize tabular lining numerals with Plus Jakarta Sans and Inter font stacks to prevent digit jumping during rapid entry.

## Layout
Keypad layouts utilize CSS Grid with 8px to 12px gaps:
- **Mobile Viewport**: 4-column compact keypad grid with expandable scientific drawer.
- **Desktop / Wide Viewport**: Expanded 6-column to 8-column layout with side-by-side history panel.

## Elevation & Depth
Depth is created through clean hairline borders (`1px solid {colors.sl-outline-low}`) and subtle key depression active states (`transform: scale(0.96)`) rather than heavy drop shadows.

## Shapes
All calculator keypad triggers are strictly pill-shaped (`{rounded.full}`, Staytoken `--sl-radius-9999` at 624.9375rem). Container panels and the display card use 16px radius (`{rounded.lg}`).

## Do's and Don'ts
- **DO** maintain pill shape (`rounded: full`) on all keypad buttons.
- **DO** provide immediate visual `:active` feedback on keypresses.
- **DON'T** use multi-color gradients or distracting animations that slow down calculation flow.
- **DON'T** hide current memory indicator state (`M`) from the active display.

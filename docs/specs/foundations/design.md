---
type: Concept
title: "StayCalc Design System"
status: draft
level: L1
owner: unassigned
last_reviewed: "2026-11-02"
tags: [design, tokens, specification]
version: alpha
name: "StayCalc Design System"
description: >
  A clean, high-precision web calculator interface anchored on neutral canvas,
  high-contrast visual clarity, and accessible physical keypad interactions.

colors:
  primary: "#2563eb"
  on-primary: "#ffffff"
  secondary: "#475569"
  tertiary: "#f1f5f9"
  background: "#ffffff"
  surface: "#f8fafc"
  container-high: "#ffffff"
  container-medium: "#f8fafc"
  container-low: "#e2e8f0"
  text-primary: "#0f172a"
  text-secondary: "#64748b"
  outline: "#e2e8f0"
  outline-subtle: "#f1f5f9"
  info: "#0284c7"
  success: "#16a34a"
  warning: "#d97706"
  error: "#dc2626"
  scrim: "rgba(0, 0, 0, 0.4)"

typography:
  display-xl:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.02em
  display-lg:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.015em
  title-md:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  body-md:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  button-md:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0
  caption:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: 0

rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 12px
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
  calc-display:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.display-xl}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.outline}"
    padding: 16px
    height: 72px
  calc-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    border: "1px solid {colors.outline}"
    padding: 12px
    height: 48px
  calc-button-operator:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 48px
---

# StayCalc Design System

## Overview
A high-precision, accessible web calculator interface designed for instant response and clarity. Defines color tokens, typography scales, keypad spacing, and WCAG 2.2 AA contrast rules.

## Colors
Color roles follow standard semantic design token naming. `{colors.primary}` represents the primary arithmetic action and equals trigger. Surfaces utilize `{colors.background}`, `{colors.surface}`, and `{colors.container-medium}`. Text readability adheres strictly to WCAG 2.2 AA contrast standards (>= 4.5:1 text, >= 3:1 controls).

### Runtime CSS Variable Mapping (`--sl-*`)

All design tokens map to canonical runtime `--sl-*` CSS variables that cascade across document and Shadow DOM boundaries:

| Token Role | Runtime CSS Variable | Light Value | Dark Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `primary` | `--sl-primary` | `{colors.primary}` | `{colors.primary}` | Primary operator and equals highlight |
| `on-primary` | `--sl-on-primary` | `{colors.on-primary}` | `{colors.on-primary}` | Text and icons on primary action |
| `secondary` | `--sl-secondary` | `{colors.secondary}` | `{colors.secondary}` | Secondary control keys (C, AC, +/-) |
| `background` | `--sl-background` | `{colors.background}` | `#0f172a` | Calculator card background |
| `surface` | `--sl-surface` | `{colors.surface}` | `#1e293b` | Display readout and number key surface |
| `text-primary` | `--sl-text-primary` | `{colors.text-primary}` | `#f8fafc` | Primary display and button labels |
| `text-secondary` | `--sl-text-secondary` | `{colors.text-secondary}` | `#94a3b8` | Subtext and secondary indicators |
| `outline` | `--sl-outline` | `{colors.outline}` | `#334155` | Keypad and display borders |
| `focus-ring` | `--sl-focus-ring` | `{colors.primary}` | `#60a5fa` | High-contrast focus outline |

## Typography
Display numbers and calculation results use clean tabular numerals with generous sizing for rapid visual recognition. Keypad labels use medium weight font with clear character distinction.

## Layout
The calculator keypad utilizes CSS Grid with CSS logical properties (`inline-size: 100%`, `box-sizing: border-box`). Container queries adapt key spacing across 320px to 390px mobile viewports ensuring `scrollWidth <= clientWidth`.

## Focus & Accessibility
All interactive controls bind visible focus indicators strictly to `:focus-visible` with a 2px high-contrast outline and 2px offset. Focus indicators never produce host-border collisions.

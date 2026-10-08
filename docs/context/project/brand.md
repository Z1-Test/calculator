---
type: Concept
title: "StayCalc Brand Guidelines"
description: "Canonical brand identity, voice, tone, logo rules, and core color values for StayCalc."
status: stable
tags: [brand, identity, voice, tone, colors]
brand_colors:
  primary: "#2563eb"
  primary_active: "#1d4ed8"
  secondary: "#475569"
  accent: "#3b82f6"
  canvas: "#ffffff"
  canvas_dark: "#09090b"
  surface: "#f4f4f5"
  surface_dark: "#121215"
  text: "#09090b"
  text_dark: "#f4f4f5"
  muted: "#71717a"
  hairline: "#e4e4e7"
---

# Brand Guidelines: StayCalc

> The single source of truth for brand personality, tone of voice, visual identity rules, and core brand color values.

## 1. Brand Essence & Mission
- **Name**: StayCalc
- **Mission**: Deliver instantaneous, precise, and accessible calculation for everyone, everywhere, with zero distraction.
- **Target Audience**: Everyday consumers, students, engineers, and programmers.
- **Brand Personality**: Precise, minimalist, dependable, and high-velocity.

## 2. Voice & Tone Architecture
- **Voice Pillars**: Direct, deterministic, and uncluttered.
- **Banned Words**: Bloated, cloud-required, subscription, laggy.
- **Signature Motto**: "Instant precision, offline and everywhere."

## 3. Logo & Visual Identity Rules
- **Primary Mark**: Clean geometric calculator glyph paired with crisp modern typography.
- **Clear Space**: Always maintain a buffer zone equal to 50% of the logo's height.
- **Prohibitions**: Never rotate, skew, recolor, or add drop shadows to the logo.

## 4. Core Brand Palette & Values
Palette values live only in the `brand_colors` YAML frontmatter above. Do not copy them into a markdown table. `stayplan-brand` sync writes each mapped key into `docs/context/project/design.md` as an `sl-*` color with Staylook syntax `var(--sl-*, <hex>)`. `primary_active`, `accent`, and the `*_dark` keys stay in this frontmatter.

## 5. Imagery & Asset Direction
- Crisp SVG vector iconography with consistent 2px stroke width.
- High-contrast visual tokens ensuring WCAG 2.2 AA compliance across both light and dark themes.
- Zero decorative photographic fluff; strictly functional UI graphics.

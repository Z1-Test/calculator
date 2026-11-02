---
type: Concept
title: "StayCalc Brand Guidelines"
description: "Canonical brand identity, voice, tone, logo rules, and core color values for StayCalc."
status: draft
level: L1
owner: unassigned
last_reviewed: "2026-11-02"
tags: [brand, identity, voice, tone, colors]
brand_colors:
  primary: "#2563eb"
  primary_active: "#1d4ed8"
  secondary: "#475569"
  accent: "#f59e0b"
  canvas: "#ffffff"
  canvas_dark: "#0f172a"
  surface: "#f8fafc"
  surface_dark: "#1e293b"
  text: "#0f172a"
  text_dark: "#f8fafc"
  muted: "#64748b"
  hairline: "#e2e8f0"
---

# Brand Guidelines: StayCalc

> The single source of truth for brand personality, tone of voice, visual identity rules, and core brand color values.

## 1. Brand Essence & Mission
- **Name**: StayCalc
- **Mission**: Deliver instantaneous, mathematically accurate, and universally accessible calculation experiences with zero friction and zero external dependencies.
- **Target Audience**: Developers, educators, students, and everyday web users requiring high-precision arithmetic and accessible interfaces.
- **Brand Personality**: Precise, dependable, lightweight, minimalist, and universally welcoming.

## 2. Voice & Tone Architecture
- **Voice Pillars**:
  - Deterministic Precision: State facts directly and cleanly without hyperbole.
  - Transparent Simplicity: Keep UI labels concise and legible (e.g. C, AC, =).
  - Uncompromising Accessibility: Treat assistive technologies as first-class citizens.
- **Banned Words**: magical, disruptive, bloated, complicated, approximate.
- **Signature Motto**: "Zero dependencies, pure precision."

## 3. Logo & Visual Identity Rules
- **Primary Mark**: A crisp glyph featuring paired arithmetic operators (+ and =) enclosed within a rounded squircle badge.
- **Clear Space**: Always maintain a buffer zone equal to 50% of the logo's height.
- **Prohibitions**: Never rotate, skew, recolor, or add drop shadows to the logo.

## 4. Core Brand Palette & Values
Palette values live only in the `brand_colors` YAML frontmatter above. Do not copy them into a markdown table. `stayspec-brand` sync writes each mapped key directly into `docs/specs/foundations/design.md` as semantic color tokens (`primary`, `secondary`, `background`, `surface`, `text-primary`, etc.). Theme variants and secondary accents stay in frontmatter.

## 5. Imagery & Asset Direction
- Crisp vector iconography with consistent 2px stroke width.
- High contrast, distraction-free neutral backgrounds that spotlight numerical content.
- Generous touch targets adhering to 48px standard touch sizing.

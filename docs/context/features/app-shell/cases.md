---
type: Cases
title: "App Shell and Theme System Test Cases"
status: stable
tags: [cases, test-cases, app-shell, verification]
generated:
  by: "process:implement"
  at: "2026-10-08T00:00:00Z"
sources:
  - resource: "docs/context/features/app-shell/feature.md"
---

# App Shell and Theme System Test Cases

## 1. Universal Case Matrix

| Case ID | Rule / Invariant Ref | Scenario | Expected Behavior | Verification Criterion |
| :--- | :--- | :--- | :--- | :--- |
| `CASE-SHELL-001` | `RULE-SHELL-001`, `RULE-SHELL-002` | First-time launch in light mode environment | Application mounts with `<stay-calc-app>`, renders DSD header, display, and keypad with light tokens without external framework dependencies | `document.documentElement.getAttribute('data-theme') === 'light'` or clean neutral canvas |
| `CASE-SHELL-002` | `RULE-SHELL-003` | First-time launch in dark mode environment | System media query resolves dark mode; dark palette applied | `document.documentElement.getAttribute('data-theme') === 'dark'` |
| `CASE-SHELL-003` | `RULE-SHELL-003` | User clicks theme toggle button in header | Theme toggles between light and dark; selection saved to storage | `localStorage.getItem('staycalc_theme')` reflects new mode |
| `CASE-SHELL-004` | `RULE-SHELL-002`, `RULE-SHELL-003` | Page reload after theme selection | Previous theme selection is retrieved from `localStorage` immediately on mount | Zero theme flicker upon page refresh |
| `CASE-SHELL-005` | `RULE-SHELL-001` | Keypad numeric button tap (`7`) | Custom event `calc-input` with `{ value: '7' }` is dispatched and updates display | Primary display line shows `7` |
| `CASE-SHELL-006` | `RULE-SHELL-001` | Keypad operator button tap (`+`) | Custom event `calc-action` with `{ action: '+' }` is dispatched | Secondary line displays active operator expression |
| `CASE-SHELL-007` | `RULE-SHELL-001` | Keypad clear button tap (`C`) | Custom event `calc-clear` resets display buffer | Primary display resets to `0` and secondary line is cleared |
| `CASE-SHELL-008` | `RULE-SHELL-004` | Screen reader accessibility check | Display elements have `aria-live="polite"` and `aria-atomic="true"` | Accessible live announcements present in DOM |
| `CASE-SHELL-009` | `RULE-SHELL-005` | Mobile viewport scaling (<480px) | Layout maintains 4-column compact grid without horizontal scroll or button squishing, maintaining pill button geometry | Container query evaluates correctly |
| `CASE-SHELL-010` | `RULE-SHELL-005` | Keyboard navigation and focus | Keypad buttons are focusable with visible focus rings and accessible labels | Focus indicators visible on `Tab` |
| `CASE-SHELL-011` | `RULE-SHELL-001`, `RULE-SHELL-002` | DSD Fallback for legacy / headless DOM | Components attach shadow root programmatically when pre-rendered shadow root is absent | Elements mount gracefully in test environments |

## 2. Stalls & Edge Cases

- `STALL-SHELL-001` (Storage Access Denied): When `localStorage` throws `SecurityError`, `ThemeManager` catches the exception (`RULE-SHELL-003`), applies theme to DOM, and continues without runtime crash.
- `STALL-SHELL-002` (Rapid Consecutive Theme Clicks): Rapid toggling transitions cleanly via CSS variables without race conditions or half-styled states (`RULE-SHELL-003`).
- `STALL-SHELL-003` (Digit Overflow): Input exceeding 10 digits triggers CSS dynamic font scaling clamp so digits remain fully visible within the display container (`RULE-SHELL-004`).

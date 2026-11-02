/**
 * CSS stylesheet for <stay-calc> autonomous custom element.
 * Implements design tokens, CSS logical properties, container queries,
 * :focus-visible focus rings, and mobile zero-overflow (320px–390px).
 * Satisfies RULE-UI-004, RULE-UI-005, NEVER-UI-001.
 */
export const stayCalcStyles = `
:host {
  display: block;
  box-sizing: border-box;
  inline-size: 100%;
  max-inline-size: 400px;
  margin-inline: auto;
  font-family: var(--sl-font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  color: var(--sl-text-primary, #0f172a);
  contain: content;
  container-type: inline-size;
}

*, *::before, *::after {
  box-sizing: border-box;
}

.calc-shell {
  display: flex;
  flex-direction: column;
  gap: var(--sl-spacing-md, 12px);
  padding-inline: var(--sl-spacing-base, 16px);
  padding-block: var(--sl-spacing-base, 16px);
  background-color: var(--sl-background, #ffffff);
  border: 1px solid var(--sl-outline, #e2e8f0);
  border-radius: var(--sl-rounded-lg, 16px);
  inline-size: 100%;
  overflow: hidden;
}

.calc-display-wrapper {
  position: relative;
  inline-size: 100%;
}

.calc-memory-indicator {
  position: absolute;
  inset-block-start: 12px;
  inset-inline-start: 14px;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1;
  color: var(--sl-primary, #2563eb);
  background: transparent;
  user-select: none;
  pointer-events: none;
  z-index: 1;
}

.calc-memory-indicator[hidden] {
  display: none;
}


.calc-display {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  inline-size: 100%;
  min-block-size: 64px;
  padding-inline: var(--sl-spacing-base, 16px);
  padding-block: var(--sl-spacing-sm, 8px);
  background-color: var(--sl-surface, #f8fafc);
  border: 1px solid var(--sl-outline, #e2e8f0);
  border-radius: var(--sl-rounded-md, 12px);
  font-size: clamp(1.5rem, 5cqi, 2.25rem);
  font-weight: 700;
  line-height: 1.2;
  text-align: end;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--sl-text-primary, #0f172a);
}

.calc-keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sl-spacing-sm, 8px);
  inline-size: 100%;
}

.calc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 0;
  inline-size: 100%;
  block-size: 52px;
  padding-inline: var(--sl-spacing-xs, 4px);
  padding-block: 0;
  border: 1px solid var(--sl-outline, #e2e8f0);
  border-radius: var(--sl-rounded-sm, 8px);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  transition: background-color 120ms ease, border-color 120ms ease, transform 60ms ease;
  background-color: var(--sl-surface, #f8fafc);
  color: var(--sl-text-primary, #0f172a);
}

.calc-btn:hover {
  background-color: var(--sl-outline-subtle, #f1f5f9);
}

.calc-btn:active {
  transform: scale(0.97);
}

.calc-btn-secondary {
  background-color: var(--sl-container-low, #e2e8f0);
  color: var(--sl-text-primary, #0f172a);
  font-weight: 600;
}

.calc-btn-secondary:hover {
  background-color: var(--sl-outline, #cbd5e1);
}

.calc-btn-memory {
  font-size: 1rem;
  font-weight: 600;
}

.calc-btn-operator {

  background-color: var(--sl-primary, #2563eb);
  color: var(--sl-on-primary, #ffffff);
  border-color: var(--sl-primary, #2563eb);
  font-size: 1.35rem;
}

.calc-btn-operator:hover {
  background-color: var(--sl-primary-active, #1d4ed8);
  border-color: var(--sl-primary-active, #1d4ed8);
}

.calc-btn-primary {
  background-color: var(--sl-primary, #2563eb);
  color: var(--sl-on-primary, #ffffff);
  border-color: var(--sl-primary, #2563eb);
  font-size: 1.35rem;
}

.calc-btn-primary:hover {
  background-color: var(--sl-primary-active, #1d4ed8);
  border-color: var(--sl-primary-active, #1d4ed8);
}

/* Strict :focus-visible invariant */
.calc-btn:focus {
  outline: none;
}

.calc-btn:focus-visible {
  outline: 2px solid var(--sl-focus-ring, #2563eb);
  outline-offset: 2px;
  z-index: 2;
}

/* Visually hidden ARIA live status for polite screen reader announcements */
.sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Container query responsiveness for mobile zero-overflow down to 320px */
@container (max-width: 390px) {
  .calc-shell {
    padding-inline: 12px;
    padding-block: 12px;
    gap: 8px;
    border-radius: 12px;
  }
  .calc-keypad {
    gap: 6px;
  }
  .calc-btn {
    block-size: 48px;
    font-size: 1.05rem;
  }
  .calc-display {
    min-block-size: 56px;
    padding-inline: 12px;
  }
  .calc-memory-indicator {
    inset-block-start: 10px;
    inset-inline-start: 12px;
    font-size: 0.8125rem;
  }
}

@container (max-width: 340px) {
  .calc-shell {
    padding-inline: 8px;
    padding-block: 8px;
    gap: 6px;
  }
  .calc-keypad {
    gap: 4px;
  }
  .calc-btn {
    block-size: 44px;
    font-size: 0.95rem;
    border-radius: 6px;
  }
  .calc-display {
    min-block-size: 48px;
    padding-inline: 8px;
    font-size: 1.25rem;
  }
  .calc-memory-indicator {
    inset-block-start: 8px;
    inset-inline-start: 10px;
    font-size: 0.75rem;
  }
  .calc-btn-memory {
    font-size: 0.875rem;
  }
}

`.trim();

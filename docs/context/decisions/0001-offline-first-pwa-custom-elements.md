---
type: Decision
title: "ADR 0001: Offline-First PWA with W3C Custom Elements"
status: stable
generated:
  by: "human:maintainer"
  at: "2026-10-08T00:00:00Z"
sources:
  - resource: "docs/context/project/architecture.md"
---

# ADR 0001: Offline-First PWA with W3C Custom Elements

## Context

Web calculators require immediate startup velocity, zero-latency tactile key responsiveness, reliable offline execution, and universal accessibility. Modern single-page application frameworks (such as React or Angular) introduce unnecessary runtime overhead, large JavaScript bundles (150KB–500KB), and hydration latency that degrade performance on mobile devices.

## Decision

We decide to build StayCalc as an offline-first Progressive Web Application (PWA) using native W3C Custom Elements and Declarative Shadow DOM (DSD), styled with native CSS design tokens and powered by a pure native calculation engine.

Key architectural choices:
1. **W3C Custom Elements & DSD**: Encapsulated component architecture without third-party framework runtime dependencies.
2. **Service Worker Cache-First Strategy**: Assets are cached immediately on install, ensuring full offline functionality.
3. **Pure Native Math Engine**: Deterministic decimal arithmetic without external runtime evaluation packages.
4. **CSS Custom Properties**: Direct CSS variable binding for instant theme switching without re-rendering component trees.

## Alternatives Considered

1. **React / Next.js SPA**:
   - *Pros*: Vast ecosystem and JSX syntax.
   - *Cons*: Large bundle size, hydration delay, and external runtime dependencies violating zero-dependency invariants.
2. **Electron Native Desktop App**:
   - *Pros*: Native windowing integration.
   - *Cons*: 100MB+ binary footprint, heavyweight memory consumption for a simple utility tool.

## Consequences

### Positive
- Sub-50KB total bundle size with instant First Contentful Paint (<0.8s).
- 100% offline reliability with zero remote API dependencies.
- Zero runtime licensing friction or vulnerability alerts from nested dependencies.

### Negative / Trade-offs
- Custom DOM event bus and state coordinator must be maintained natively without third-party state libraries (Redux/Zustand).

## References

- [StayCalc System Architecture](../project/architecture.md)
- [W3C Custom Elements Specification](https://html.spec.whatwg.org/multipage/custom-elements.html)
- [Service Worker API](https://w3c.github.io/ServiceWorker/)

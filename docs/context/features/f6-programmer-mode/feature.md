---
type: Feature
title: "F6: Programmer Radix Mode & Bitwise Operations"
description: "Multi-base integer conversion (HEX, DEC, OCT, BIN), bitwise operations (AND, OR, XOR, NOT, LSH, RSH), and bit-width clamping (BYTE, WORD, DWORD, QWORD)."
status: stable
tags: [programmer, radix, bitwise, hex, bin, f6]
generated: { by: "factory:planner", at: "2026-10-13T14:24:00Z" }
sources:
  - id: source-architecture
    resource: docs/context/project/architecture.md
    title: System Architecture
  - id: source-rules
    resource: docs/context/project/domain-rules.md
    title: Domain Rules & Invariants
---

# Feature: Programmer Radix Mode & Bitwise Operations (F6)

## 1. Intent & Scope

Provide software developers and computer engineering students with a deterministic programmer calculator mode. Supports instant conversions and simultaneous base displays (Decimal, Hexadecimal, Octal, Binary), binary bitwise operations (`AND`, `OR`, `XOR`, `LSH`, `RSH`), unary bitwise complement (`NOT`), and standard word-size bit-masking (`BYTE`: 8-bit, `WORD`: 16-bit, `DWORD`: 32-bit, `QWORD`: 64-bit).

## 2. Invariants & Rules

- **`RULE-CALC-004` (Radix Integer Clamping)**:
  - All programmer calculations operate on integer values using BigInt to eliminate 64-bit float precision loss.
  - Word sizes constrain values using bit masks:
    - `BYTE`: 8 bits (`0xFF`, 255 max unsigned)
    - `WORD`: 16 bits (`0xFFFF`, 65,535 max unsigned)
    - `DWORD`: 32 bits (`0xFFFFFFFF`, 4,294,967,295 max unsigned)
    - `QWORD`: 64 bits (`0xFFFFFFFFFFFFFFFFn`, 18,446,744,073,709,551,615 max unsigned)
- **`RULE-PROG-001` (Radix Synchronization)**:
  - Entering or evaluating a number in the active radix immediately updates the representations across all 4 bases:
    - `DEC`: Base 10
    - `HEX`: Base 16 uppercase (e.g. `255` $\to$ `FF`)
    - `OCT`: Base 8 (e.g. `255` $\to$ `377`)
    - `BIN`: Base 2 (e.g. `255` $\to$ `11111111`)
- **`RULE-PROG-002` (Bitwise Shift Invariants)**:
  - `LSH(a, b)`: Left shift $a \ll b$, masked to active word size.
  - `RSH(a, b)`: Logical right shift $a \gg b$, masked to active word size.

## 3. Interfaces

```typescript
export type Radix = 'HEX' | 'DEC' | 'OCT' | 'BIN';
export type WordSize = 'BYTE' | 'WORD' | 'DWORD' | 'QWORD';

export interface RadixRepresentations {
  HEX: string;
  DEC: string;
  OCT: string;
  BIN: string;
}

export class ProgrammerEngine {
  getActiveRadix(): Radix;
  setActiveRadix(radix: Radix): void;
  getWordSize(): WordSize;
  setWordSize(size: WordSize): void;
  getValue(): bigint;
  setValue(val: bigint | number | string): void;
  getRepresentations(): RadixRepresentations;
  bitwiseAnd(other: bigint): bigint;
  bitwiseOr(other: bigint): bigint;
  bitwiseXor(other: bigint): bigint;
  bitwiseNot(): bigint;
  shiftLeft(bits: number): bigint;
  shiftRight(bits: number): bigint;
}
```

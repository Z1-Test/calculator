import { normalizePrecision } from './calc-engine.ts';

export interface MemoryState {
  value: number;
  hasMemory: boolean;
}

export class MemoryStore {
  private value: number = 0;

  public getValue(): number {
    return this.value;
  }

  public hasMemory(): boolean {
    return this.value !== 0;
  }

  public getState(): Readonly<MemoryState> {
    return {
      value: this.value,
      hasMemory: this.hasMemory(),
    };
  }

  public add(amount: number): number {
    this.value = normalizePrecision(this.value + amount);
    return this.value;
  }

  public subtract(amount: number): number {
    this.value = normalizePrecision(this.value - amount);
    return this.value;
  }

  public recall(): number {
    return this.value;
  }

  public clear(): void {
    this.value = 0;
  }
}

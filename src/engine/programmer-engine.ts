export type Radix = 'HEX' | 'DEC' | 'OCT' | 'BIN';
export type WordSize = 'BYTE' | 'WORD' | 'DWORD' | 'QWORD';

export interface RadixRepresentations {
  HEX: string;
  DEC: string;
  OCT: string;
  BIN: string;
}

export class ProgrammerEngine {
  private activeRadix: Radix = 'DEC';
  private wordSize: WordSize = 'DWORD';
  private value: bigint = 0n;

  public getActiveRadix(): Radix {
    return this.activeRadix;
  }

  public setActiveRadix(radix: Radix): void {
    this.activeRadix = radix;
  }

  public getWordSize(): WordSize {
    return this.wordSize;
  }

  public setWordSize(size: WordSize): void {
    this.wordSize = size;
    this.value = this.applyMask(this.value);
  }

  public getValue(): bigint {
    return this.value;
  }

  public setValue(val: bigint | number | string): void {
    try {
      if (typeof val === 'bigint') {
        this.value = this.applyMask(val);
      } else if (typeof val === 'number') {
        this.value = this.applyMask(BigInt(Math.trunc(val)));
      } else {
        const base = this.activeRadix === 'HEX' ? 16 : this.activeRadix === 'OCT' ? 8 : this.activeRadix === 'BIN' ? 2 : 10;
        this.value = this.applyMask(this.parseRadixString(val, base));
      }
    } catch {
      this.value = 0n;
    }
  }

  public getRepresentations(): RadixRepresentations {
    const v = this.value;
    return {
      HEX: v.toString(16).toUpperCase(),
      DEC: v.toString(10),
      OCT: v.toString(8),
      BIN: v.toString(2),
    };
  }

  public bitwiseAnd(other: bigint | number): bigint {
    const o = typeof other === 'number' ? BigInt(other) : other;
    this.value = this.applyMask(this.value & o);
    return this.value;
  }

  public bitwiseOr(other: bigint | number): bigint {
    const o = typeof other === 'number' ? BigInt(other) : other;
    this.value = this.applyMask(this.value | o);
    return this.value;
  }

  public bitwiseXor(other: bigint | number): bigint {
    const o = typeof other === 'number' ? BigInt(other) : other;
    this.value = this.applyMask(this.value ^ o);
    return this.value;
  }

  public bitwiseNot(): bigint {
    this.value = this.applyMask(~this.value);
    return this.value;
  }

  public shiftLeft(bits: number): bigint {
    this.value = this.applyMask(this.value << BigInt(bits));
    return this.value;
  }

  public shiftRight(bits: number): bigint {
    this.value = this.applyMask(this.value >> BigInt(bits));
    return this.value;
  }

  public getMask(): bigint {
    switch (this.wordSize) {
      case 'BYTE':
        return 0xFFn;
      case 'WORD':
        return 0xFFFFn;
      case 'DWORD':
        return 0xFFFFFFFFn;
      case 'QWORD':
        return 0xFFFFFFFFFFFFFFFFn;
    }
  }

  private applyMask(val: bigint): bigint {
    return val & this.getMask();
  }

  private parseRadixString(str: string, base: number): bigint {
    const clean = str.trim();
    if (!clean || clean === '0') return 0n;
    if (base === 16) return BigInt('0x' + clean);
    if (base === 8) return BigInt('0o' + clean);
    if (base === 2) return BigInt('0b' + clean);
    return BigInt(clean.split('.')[0]);
  }
}

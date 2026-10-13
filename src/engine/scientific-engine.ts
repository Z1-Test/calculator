import { normalizePrecision } from './calc-engine.ts';

export type AngleMode = 'DEG' | 'RAD';

export class ScientificEngine {
  private angleMode: AngleMode = 'DEG';

  public getAngleMode(): AngleMode {
    return this.angleMode;
  }

  public toggleAngleMode(): AngleMode {
    this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
    return this.angleMode;
  }

  public setAngleMode(mode: AngleMode): void {
    this.angleMode = mode;
  }

  public sqrt(val: number): number | 'Invalid input' {
    if (val < 0) return 'Invalid input';
    return normalizePrecision(Math.sqrt(val));
  }

  public square(val: number): number {
    return normalizePrecision(val * val);
  }

  public power(base: number, exp: number): number {
    return normalizePrecision(Math.pow(base, exp));
  }

  public sin(val: number): number {
    const rad = this.angleMode === 'DEG' ? (val * Math.PI) / 180 : val;
    const res = Math.sin(rad);
    if (Math.abs(res) < 1e-12) return 0;
    return normalizePrecision(res);
  }

  public cos(val: number): number {
    const rad = this.angleMode === 'DEG' ? (val * Math.PI) / 180 : val;
    const res = Math.cos(rad);
    if (Math.abs(res) < 1e-12) return 0;
    return normalizePrecision(res);
  }

  public tan(val: number): number | 'Invalid input' {
    if (this.angleMode === 'DEG') {
      const normalizedDeg = Math.abs(val) % 180;
      if (Math.abs(normalizedDeg - 90) < 1e-10) {
        return 'Invalid input';
      }
    }
    const rad = this.angleMode === 'DEG' ? (val * Math.PI) / 180 : val;
    const res = Math.tan(rad);
    if (Math.abs(res) < 1e-12) return 0;
    return normalizePrecision(res);
  }

  public pi(): number {
    return 3.1415926536;
  }

  public e(): number {
    return 2.7182818285;
  }
}

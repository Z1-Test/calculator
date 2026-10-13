import type { CalcEngine } from '../engine/calc-engine.ts';

export class ExpressionDisplayController {
  public static getPreview(engine: CalcEngine): string {
    return engine.getFormulaPreview();
  }
}

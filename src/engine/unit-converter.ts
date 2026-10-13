export type LengthUnit = 'm' | 'km' | 'cm' | 'in' | 'ft' | 'mi';
export type MassUnit = 'kg' | 'g' | 'lb' | 'oz';
export type TempUnit = 'C' | 'F' | 'K';
export type UnitCategory = 'length' | 'mass' | 'temperature';

const LENGTH_FACTORS: Record<LengthUnit, number> = {
  m: 1,
  km: 1000,
  cm: 0.01,
  in: 0.0254,
  ft: 0.3048,
  mi: 1609.344,
};

const MASS_FACTORS: Record<MassUnit, number> = {
  kg: 1,
  g: 0.001,
  lb: 0.45359237,
  oz: 0.028349523125,
};

export class UnitConverterEngine {
  public convertLength(val: number, from: LengthUnit, to: LengthUnit): number {
    if (from === to) return val;
    const inMeters = val * LENGTH_FACTORS[from];
    const result = inMeters / LENGTH_FACTORS[to];
    return this.roundResult(result);
  }

  public convertMass(val: number, from: MassUnit, to: MassUnit): number {
    if (from === to) return val;
    const inKg = val * MASS_FACTORS[from];
    const result = inKg / MASS_FACTORS[to];
    return this.roundResult(result);
  }

  public convertTemperature(val: number, from: TempUnit, to: TempUnit): number | 'Invalid input' {
    // Convert to Celsius first
    let celsius: number;
    if (from === 'C') {
      celsius = val;
    } else if (from === 'F') {
      celsius = (val - 32) * (5 / 9);
    } else {
      celsius = val - 273.15;
    }

    // Absolute zero guard: -273.15 C
    if (celsius < -273.15) {
      return 'Invalid input';
    }

    if (from === to) {
      return this.roundResult(val);
    }

    // Convert from Celsius to target
    let result: number;
    if (to === 'C') {
      result = celsius;
    } else if (to === 'F') {
      result = celsius * (9 / 5) + 32;
    } else {
      result = celsius + 273.15;
    }

    return this.roundResult(result);
  }

  private roundResult(val: number): number {
    return parseFloat(val.toFixed(8));
  }
}

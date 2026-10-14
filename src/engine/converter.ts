/**
 * src/engine/converter.ts
 *
 * Deterministic multi-unit conversion engine for StayCalc:
 * - Length: cm, m, km, in, ft (exact meter ratios)
 * - Mass: g, kg, oz, lb (exact kilogram ratios)
 * - Temperature: C, F, K (thermodynamic linear formulas + absolute zero safeguard)
 * - Precision normalization: eliminates IEEE-754 floating-point noise (RULE-CALC-002)
 * - Zero dynamic eval (NEVER-CALC-001)
 * - Zero external runtime dependencies
 */

import type {
  UnitCategory,
  LengthUnit,
  MassUnit,
  TemperatureUnit,
  ConversionUnit,
  ConversionResult,
} from './types.ts';

/**
 * Length conversion ratios to base unit meter (m).
 */
export const LENGTH_RATIOS: Record<LengthUnit, number> = {
  cm: 0.01,
  m: 1.0,
  km: 1000.0,
  in: 0.0254,
  ft: 0.3048,
};

/**
 * Mass conversion ratios to base unit kilogram (kg).
 */
export const MASS_RATIOS: Record<MassUnit, number> = {
  g: 0.001,
  kg: 1.0,
  oz: 0.028349523125,
  lb: 0.45359237,
};

/**
 * Unit options definitions for UI dropdowns.
 */
export const UNIT_OPTIONS: Record<UnitCategory, readonly { value: ConversionUnit; label: string }[]> = {
  length: [
    { value: 'cm', label: 'Centimeters (cm)' },
    { value: 'm', label: 'Meters (m)' },
    { value: 'km', label: 'Kilometers (km)' },
    { value: 'in', label: 'Inches (in)' },
    { value: 'ft', label: 'Feet (ft)' },
  ],
  mass: [
    { value: 'g', label: 'Grams (g)' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'oz', label: 'Ounces (oz)' },
    { value: 'lb', label: 'Pounds (lb)' },
  ],
  temperature: [
    { value: 'C', label: 'Celsius (°C)' },
    { value: 'F', label: 'Fahrenheit (°F)' },
    { value: 'K', label: 'Kelvin (K)' },
  ],
};

/**
 * Default source and target unit pairings per category.
 */
export const DEFAULT_UNITS: Record<UnitCategory, { source: ConversionUnit; target: ConversionUnit }> = {
  length: { source: 'cm', target: 'm' },
  mass: { source: 'kg', target: 'g' },
  temperature: { source: 'C', target: 'F' },
};

/**
 * Normalizes floating-point precision to max 12 significant digits (RULE-CALC-002).
 */
export function normalizeConversionPrecision(n: number): { value: number; formatted: string } {
  if (Object.is(n, -0) || (n === 0 && Object.is(1 / n, -Infinity))) {
    return { value: 0, formatted: '0' };
  }
  if (!Number.isFinite(n)) {
    return { value: n, formatted: String(n) };
  }

  // Pre-clean representation noise via 12-digit significant precision
  const clean = parseFloat(n.toPrecision(12));
  if (Object.is(clean, -0) || clean === 0) {
    return { value: 0, formatted: '0' };
  }

  return {
    value: clean,
    formatted: clean.toString(),
  };
}

/**
 * Converts a temperature from any supported scale to Kelvin.
 */
function toKelvin(val: number, unit: TemperatureUnit): number {
  switch (unit) {
    case 'C':
      return val + 273.15;
    case 'F':
      return ((val - 32) * 5) / 9 + 273.15;
    case 'K':
      return val;
  }
}

/**
 * Converts a temperature from Kelvin to target scale.
 */
function fromKelvin(kelvin: number, unit: TemperatureUnit): number {
  switch (unit) {
    case 'C':
      return kelvin - 273.15;
    case 'F':
      return ((kelvin - 273.15) * 9) / 5 + 32;
    case 'K':
      return kelvin;
  }
}

/**
 * Performs bidirectional unit conversion across Length, Mass, and Temperature.
 */
export function convertUnits(
  category: UnitCategory,
  fromUnit: string,
  toUnit: string,
  inputValue: string | number
): ConversionResult {
  // Empty, null, undefined, or whitespace yields formatted: "-"
  if (
    inputValue === '' ||
    inputValue === null ||
    inputValue === undefined ||
    (typeof inputValue === 'string' && inputValue.trim() === '')
  ) {
    return { value: 0, formatted: '-' };
  }

  const num = typeof inputValue === 'number' ? inputValue : Number(inputValue);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return { value: 0, formatted: '-' };
  }

  // Temperature conversions with thermodynamic absolute zero validation
  if (category === 'temperature') {
    const fromTemp = fromUnit as TemperatureUnit;
    const toTemp = toUnit as TemperatureUnit;

    const kelvin = toKelvin(num, fromTemp);
    // Absolute zero check: Kelvin cannot be below 0 (with float epsilon safeguard)
    if (kelvin < -1e-9) {
      return {
        value: NaN,
        formatted: 'Invalid temperature',
        error: 'Invalid temperature',
      };
    }

    if (fromTemp === toTemp) {
      const normalized = normalizeConversionPrecision(num);
      return {
        value: normalized.value,
        formatted: normalized.formatted,
      };
    }

    const rawTarget = fromKelvin(kelvin, toTemp);
    const normalized = normalizeConversionPrecision(rawTarget);
    return {
      value: normalized.value,
      formatted: normalized.formatted,
    };
  }

  // Length conversions
  if (category === 'length') {
    const fromRatio = LENGTH_RATIOS[fromUnit as LengthUnit];
    const toRatio = LENGTH_RATIOS[toUnit as LengthUnit];
    if (fromRatio === undefined || toRatio === undefined) {
      return { value: 0, formatted: '-', error: `Invalid length units: ${fromUnit} -> ${toUnit}` };
    }

    if (fromUnit === toUnit) {
      const normalized = normalizeConversionPrecision(num);
      return { value: normalized.value, formatted: normalized.formatted };
    }

    const meters = num * fromRatio;
    const targetVal = meters / toRatio;
    const normalized = normalizeConversionPrecision(targetVal);
    return {
      value: normalized.value,
      formatted: normalized.formatted,
    };
  }

  // Mass conversions
  if (category === 'mass') {
    const fromRatio = MASS_RATIOS[fromUnit as MassUnit];
    const toRatio = MASS_RATIOS[toUnit as MassUnit];
    if (fromRatio === undefined || toRatio === undefined) {
      return { value: 0, formatted: '-', error: `Invalid mass units: ${fromUnit} -> ${toUnit}` };
    }

    if (fromUnit === toUnit) {
      const normalized = normalizeConversionPrecision(num);
      return { value: normalized.value, formatted: normalized.formatted };
    }

    const kg = num * fromRatio;
    const targetVal = kg / toRatio;
    const normalized = normalizeConversionPrecision(targetVal);
    return {
      value: normalized.value,
      formatted: normalized.formatted,
    };
  }

  return { value: 0, formatted: '-', error: `Unknown unit category: ${category}` };
}

/**
 * Returns available unit options for a category.
 */
export function getUnitsForCategory(category: UnitCategory): readonly { value: ConversionUnit; label: string }[] {
  return UNIT_OPTIONS[category] ?? UNIT_OPTIONS.length;
}

/**
 * Type guard for UnitCategory.
 */
export function isUnitCategory(val: unknown): val is UnitCategory {
  return val === 'length' || val === 'mass' || val === 'temperature';
}

/**
 * Type guard for ConversionUnit.
 */
export function isConversionUnit(val: unknown): val is ConversionUnit {
  if (typeof val !== 'string') return false;
  return (
    ['cm', 'm', 'km', 'in', 'ft'].includes(val) ||
    ['g', 'kg', 'oz', 'lb'].includes(val) ||
    ['C', 'F', 'K'].includes(val)
  );
}

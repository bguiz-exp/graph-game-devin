import type { EquationType } from "../types";

/**
 * Maps coefficient names to the power of x they multiply, per equation type.
 * Naming convention (highest degree first):
 *   linear:    m -> x^1, c -> x^0
 *   quadratic: a -> x^2, b -> x^1, c -> x^0
 *   cubic:     a -> x^3, b -> x^2, c -> x^1, d -> x^0
 */
const POWERS: Record<EquationType, Record<string, number>> = {
  linear: { m: 1, c: 0 },
  quadratic: { a: 2, b: 1, c: 0 },
  cubic: { a: 3, b: 2, c: 1, d: 0 },
};

/** Coefficient names expected for each equation type, highest degree first. */
export function coefficientNames(type: EquationType): string[] {
  return Object.keys(POWERS[type]);
}

/** Infer the equation type from the set of coefficient keys present. */
export function inferEquationType(
  coefficients: Record<string, number>,
): EquationType {
  if ("m" in coefficients) return "linear";
  if ("d" in coefficients) return "cubic";
  if ("a" in coefficients) return "quadratic";
  return "linear";
}

/**
 * Evaluate y for a polynomial described by named coefficients at a given x.
 * The equation type is inferred from the coefficient keys unless provided.
 */
export function evaluateEquation(
  coefficients: Record<string, number>,
  x: number,
  equationType?: EquationType,
): number {
  const type = equationType ?? inferEquationType(coefficients);
  const powers = POWERS[type];
  let y = 0;
  for (const [name, value] of Object.entries(coefficients)) {
    const power = powers[name] ?? 0;
    y += value * Math.pow(x, power);
  }
  return y;
}

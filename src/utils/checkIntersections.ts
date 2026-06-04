import type { BalloonTarget, EquationType } from "../types";
import { evaluateEquation } from "./evaluateEquation";

export type HitMiss = "hit" | "miss";

export interface IntersectionResult {
  id: string;
  result: HitMiss;
}

/**
 * Default vertical tolerance (in maths units) for counting a balloon as hit.
 * Wide enough to feel fair, narrow enough to require the correct equation.
 */
export const HIT_TOLERANCE = 0.3;

/**
 * N31 — pure function (no Phaser dependency). For each target, evaluate the
 * curve's y at the target's x and classify it as a hit when within `tolerance`
 * of the target's y, otherwise a miss.
 */
export function checkIntersections(
  coefficients: Record<string, number>,
  equationType: EquationType,
  targets: BalloonTarget[],
  tolerance: number = HIT_TOLERANCE,
): IntersectionResult[] {
  return targets.map((target) => {
    const yCurve = evaluateEquation(coefficients, target.x, equationType);
    const result: HitMiss =
      Math.abs(yCurve - target.y) <= tolerance ? "hit" : "miss";
    return { id: target.id, result };
  });
}

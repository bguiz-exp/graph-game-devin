import type {
  Question,
  QuestionTemplate,
  QuestionOption,
  BalloonTarget,
  Range,
} from "../types";
import type { Rng } from "./rng";
import { evaluateEquation, coefficientNames } from "./evaluateEquation";
import { renderEquation } from "./renderEquation";

/** Number of values on a range's grid, inclusive of both ends. */
function gridSteps(range: Range): number {
  return Math.max(0, Math.floor((range.max - range.min) / range.step));
}

function isExcluded(range: Range, value: number): boolean {
  return (
    range.excludeMin !== undefined &&
    range.excludeMax !== undefined &&
    value >= range.excludeMin &&
    value <= range.excludeMax
  );
}

/** Sample a single value from a range's grid, respecting exclusions. */
function sampleFromRange(rng: Rng, range: Range): number {
  const steps = gridSteps(range);
  for (let attempt = 0; attempt < 1000; attempt++) {
    const value = range.min + range.step * Math.floor(rng() * (steps + 1));
    if (!isExcluded(range, value)) return value;
  }
  // Fallback: every grid point excluded (should not happen for valid templates).
  return range.min;
}

/** Sample `count` distinct values from a range's grid. */
function sampleDistinct(rng: Rng, range: Range, count: number): number[] {
  const values = new Set<number>();
  for (let attempt = 0; attempt < 5000 && values.size < count; attempt++) {
    values.add(sampleFromRange(rng, range));
  }
  return [...values];
}

function serialize(names: string[], coeffs: Record<string, number>): string {
  return names.map((n) => `${n}:${coeffs[n]}`).join("|");
}

function pickDelta(rng: Rng): number {
  const deltas = [-2, -1, 1, 2];
  return deltas[Math.floor(rng() * deltas.length)];
}

function makeDistractor(
  rng: Rng,
  names: string[],
  correct: Record<string, number>,
  strategy: QuestionTemplate["distractorStrategy"],
): Record<string, number> {
  const next: Record<string, number> = { ...correct };
  if (strategy === "perturb-all-small") {
    for (const name of names) {
      next[name] = correct[name] + (rng() < 0.5 ? -1 : 1);
    }
  } else {
    // perturb-one
    const name = names[Math.floor(rng() * names.length)];
    next[name] = correct[name] + pickDelta(rng);
  }
  return next;
}

/**
 * Sample a concrete Question from a template using the provided RNG.
 * The correct equation is guaranteed to pass through every target exactly.
 */
export function generateQuestion(
  template: QuestionTemplate,
  rng: Rng,
): Question {
  const names = coefficientNames(template.equationType);

  // 1. Sample coefficients.
  const correctCoefficients: Record<string, number> = {};
  for (const name of names) {
    const range = template.ranges[name];
    correctCoefficients[name] = range ? sampleFromRange(rng, range) : 0;
  }

  // 2. Sample distinct x-values for the targets.
  const xs = sampleDistinct(rng, template.ranges.x, template.targetCount);

  // 3. Build targets; correct equation passes through each exactly.
  const targets: BalloonTarget[] = xs.map((x, i) => ({
    id: `${template.id}-tgt-${i}`,
    x,
    y: evaluateEquation(correctCoefficients, x, template.equationType),
  }));

  // 4. Generate 3 distinct distractors (different from correct and each other).
  const correctKey = serialize(names, correctCoefficients);
  const seen = new Set<string>([correctKey]);
  const distractors: Record<string, number>[] = [];
  for (let attempt = 0; attempt < 2000 && distractors.length < 3; attempt++) {
    const d = makeDistractor(rng, names, correctCoefficients, template.distractorStrategy);
    const key = serialize(names, d);
    if (!seen.has(key)) {
      seen.add(key);
      distractors.push(d);
    }
  }

  // 5. Assemble options (correct + distractors), each labelled with its equation.
  const optionCoeffs = [correctCoefficients, ...distractors];
  const options: QuestionOption[] = optionCoeffs.map((coeffs) => ({
    label: renderEquation(template.templateLabel, coeffs),
    coefficients: coeffs,
  }));

  return {
    id: `${template.id}#${correctKey}`,
    equationType: template.equationType,
    templateLabel: renderEquation(template.templateLabel),
    targets,
    correctCoefficients,
    options,
  };
}

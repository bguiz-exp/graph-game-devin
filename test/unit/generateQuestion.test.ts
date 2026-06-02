import { describe, it, expect } from "vitest";
import { generateQuestion } from "../../src/utils/generateQuestion";
import { evaluateEquation } from "../../src/utils/evaluateEquation";
import { createRng } from "../../src/utils/rng";
import type { QuestionTemplate } from "../../src/types";

const linearTemplate: QuestionTemplate = {
  id: "lin-test",
  equationType: "linear",
  templateLabel: "y = {m}x + {c}",
  targetCount: 2,
  ranges: {
    x: { min: 0, max: 4, step: 1 },
    m: { min: -3, max: 3, step: 1, excludeMin: 0, excludeMax: 0 },
    c: { min: -4, max: 4, step: 1 },
    graphX: { min: -6, max: 6, step: 1 },
    graphY: { min: -8, max: 8, step: 1 },
  },
  start: { x: 0, y: 0 },
  distractorStrategy: "perturb-one",
};

describe("generateQuestion", () => {
  it("produces targets that the correct equation passes through exactly", () => {
    const q = generateQuestion(linearTemplate, createRng(1));
    for (const t of q.targets) {
      expect(t.y).toBe(evaluateEquation(q.correctCoefficients, t.x, q.equationType));
    }
    expect(q.targets).toHaveLength(linearTemplate.targetCount);
  });

  it("is reproducible for a fixed seed", () => {
    const a = generateQuestion(linearTemplate, createRng(42));
    const b = generateQuestion(linearTemplate, createRng(42));
    expect(a).toEqual(b);
  });

  it("differs across different seeds (eventually)", () => {
    const a = generateQuestion(linearTemplate, createRng(1));
    const b = generateQuestion(linearTemplate, createRng(2));
    // Not a hard guarantee, but for these ranges the seeds diverge.
    expect(a.id === b.id && JSON.stringify(a.targets) === JSON.stringify(b.targets)).toBe(false);
  });

  it("generates distractors that differ from the correct coefficients", () => {
    const q = generateQuestion(linearTemplate, createRng(7));
    const distractors = q.options.filter(
      (o) => JSON.stringify(o.coefficients) !== JSON.stringify(q.correctCoefficients),
    );
    expect(distractors.length).toBeGreaterThanOrEqual(3);
    for (const d of distractors) {
      expect(d.coefficients).not.toEqual(q.correctCoefficients);
    }
  });

  it("includes the correct coefficients among the options", () => {
    const q = generateQuestion(linearTemplate, createRng(3));
    const hasCorrect = q.options.some(
      (o) => JSON.stringify(o.coefficients) === JSON.stringify(q.correctCoefficients),
    );
    expect(hasCorrect).toBe(true);
  });

  it("respects excludeMin/excludeMax (m is never zero)", () => {
    for (let seed = 0; seed < 200; seed++) {
      const q = generateQuestion(linearTemplate, createRng(seed));
      expect(q.correctCoefficients.m).not.toBe(0);
    }
  });

  it("samples target x-values within the template x range", () => {
    for (let seed = 0; seed < 50; seed++) {
      const q = generateQuestion(linearTemplate, createRng(seed));
      for (const t of q.targets) {
        expect(t.x).toBeGreaterThanOrEqual(linearTemplate.ranges.x.min);
        expect(t.x).toBeLessThanOrEqual(linearTemplate.ranges.x.max);
      }
    }
  });
});

import { describe, it, expect } from "vitest";
import {
  evaluateEquation,
  inferEquationType,
  coefficientNames,
} from "../../src/utils/evaluateEquation";

describe("evaluateEquation", () => {
  it("evaluates a linear equation", () => {
    expect(evaluateEquation({ m: 2, c: 3 }, 4)).toBe(11);
    expect(evaluateEquation({ m: -1, c: 5 }, 2)).toBe(3);
  });

  it("evaluates a quadratic equation", () => {
    expect(evaluateEquation({ a: 1, b: 0, c: -1 }, 3)).toBe(8);
    expect(evaluateEquation({ a: 2, b: -3, c: 1 }, 2)).toBe(3);
  });

  it("evaluates a cubic equation", () => {
    expect(evaluateEquation({ a: 1, b: 0, c: 0, d: 0 }, 2)).toBe(8);
    expect(evaluateEquation({ a: 1, b: 1, c: 1, d: 1 }, 2)).toBe(15);
  });

  it("infers equation type from coefficient keys", () => {
    expect(inferEquationType({ m: 1, c: 2 })).toBe("linear");
    expect(inferEquationType({ a: 1, b: 2, c: 3 })).toBe("quadratic");
    expect(inferEquationType({ a: 1, b: 2, c: 3, d: 4 })).toBe("cubic");
  });

  it("exposes coefficient names per equation type (highest degree first)", () => {
    expect(coefficientNames("linear")).toEqual(["m", "c"]);
    expect(coefficientNames("quadratic")).toEqual(["a", "b", "c"]);
    expect(coefficientNames("cubic")).toEqual(["a", "b", "c", "d"]);
  });
});

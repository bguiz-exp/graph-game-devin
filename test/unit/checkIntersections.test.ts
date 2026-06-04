import { describe, it, expect } from "vitest";
import {
  checkIntersections,
  HIT_TOLERANCE,
} from "../../src/utils/checkIntersections";
import type { BalloonTarget } from "../../src/types";

const t = (id: string, x: number, y: number): BalloonTarget => ({ id, x, y });

describe("checkIntersections (V3)", () => {
  it("returns 'hit' when the curve passes exactly through a target", () => {
    // y = 2x + 1 → at x=3, y=7.
    const res = checkIntersections({ m: 2, c: 1 }, "linear", [t("a", 3, 7)]);
    expect(res).toEqual([{ id: "a", result: "hit" }]);
  });

  it("returns 'hit' when within the tolerance threshold", () => {
    // Curve y at x=3 is 7; target y is offset by < tolerance.
    const within = HIT_TOLERANCE - 0.05;
    const res = checkIntersections({ m: 2, c: 1 }, "linear", [
      t("a", 3, 7 + within),
      t("b", 3, 7 - within),
    ]);
    expect(res.map((r) => r.result)).toEqual(["hit", "hit"]);
  });

  it("returns 'miss' when beyond the tolerance threshold", () => {
    const beyond = HIT_TOLERANCE + 0.2;
    const res = checkIntersections({ m: 2, c: 1 }, "linear", [
      t("a", 3, 7 + beyond),
    ]);
    expect(res).toEqual([{ id: "a", result: "miss" }]);
  });

  it("classifies a mixed list of hits and misses correctly", () => {
    // y = 2x + 1: at x=1 → 3 (hit), at x=2 → 5 (target 10 = miss), x=4 → 9 (hit).
    const res = checkIntersections({ m: 2, c: 1 }, "linear", [
      t("hit1", 1, 3),
      t("miss1", 2, 10),
      t("hit2", 4, 9),
    ]);
    expect(res).toEqual([
      { id: "hit1", result: "hit" },
      { id: "miss1", result: "miss" },
      { id: "hit2", result: "hit" },
    ]);
  });

  it("works for quadratic equations (curve through a known target)", () => {
    // y = x^2 - 1: at x=3 → 8 (hit), at x=2 → 3 (target 0 = miss).
    const res = checkIntersections({ a: 1, b: 0, c: -1 }, "quadratic", [
      t("hit", 3, 8),
      t("miss", 2, 0),
    ]);
    expect(res).toEqual([
      { id: "hit", result: "hit" },
      { id: "miss", result: "miss" },
    ]);
  });

  it("works for cubic equations (curve through a known target)", () => {
    // y = x^3: at x=2 → 8 (hit), at x=-1 → -1 (target 5 = miss).
    const res = checkIntersections({ a: 1, b: 0, c: 0, d: 0 }, "cubic", [
      t("hit", 2, 8),
      t("miss", -1, 5),
    ]);
    expect(res).toEqual([
      { id: "hit", result: "hit" },
      { id: "miss", result: "miss" },
    ]);
  });

  it("respects a custom tolerance argument", () => {
    const res = checkIntersections({ m: 1, c: 0 }, "linear", [t("a", 2, 3)], 1);
    expect(res[0].result).toBe("hit"); // |2-3| = 1 ≤ 1
  });
});

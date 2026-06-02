import { describe, it, expect } from "vitest";
import { mathToCanvas } from "../../src/utils/mathToCanvas";
import type { GraphConfig } from "../../src/types";

const config: GraphConfig = {
  originX: 400,
  originY: 300,
  scaleX: 40,
  scaleY: 40,
};

describe("mathToCanvas", () => {
  it("maps the maths origin to the canvas origin pixel", () => {
    expect(mathToCanvas(0, 0, config)).toEqual({ x: 400, y: 300 });
  });

  it("shifts right by x * scaleX for positive x (y = 0)", () => {
    const p = mathToCanvas(3, 0, config);
    expect(p.x).toBe(config.originX + 3 * config.scaleX);
    expect(p.y).toBe(config.originY);
  });

  it("shifts upward (negative canvas y) by y * scaleY for positive y (x = 0)", () => {
    const p = mathToCanvas(0, 2, config);
    expect(p.x).toBe(config.originX);
    expect(p.y).toBe(config.originY - 2 * config.scaleY);
    expect(p.y).toBeLessThan(config.originY); // inverted y-axis
  });
});

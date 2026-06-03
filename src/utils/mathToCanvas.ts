import type { GraphConfig, Coordinate } from "../types";

/**
 * Pure conversion from maths coordinates to canvas pixel coordinates.
 * Phaser's y-axis grows downward while maths y grows upward, hence the
 * subtraction on the y term.
 *
 *   canvasX = originX + x * scaleX
 *   canvasY = originY - y * scaleY
 */
export function mathToCanvas(
  x: number,
  y: number,
  graphConfig: GraphConfig,
): Coordinate {
  return {
    x: graphConfig.originX + x * graphConfig.scaleX,
    y: graphConfig.originY - y * graphConfig.scaleY,
  };
}

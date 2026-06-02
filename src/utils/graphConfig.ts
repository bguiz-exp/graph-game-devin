import type { GraphConfig, Range } from "../types";

export interface PixelRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Compute a GraphConfig that maps the maths domain defined by graphX/graphY
 * ranges onto the given pixel rectangle. Pure (no Phaser dependency).
 */
export function computeGraphConfig(
  graphX: Range,
  graphY: Range,
  rect: PixelRect,
): GraphConfig {
  const scaleX = (rect.right - rect.left) / (graphX.max - graphX.min);
  const scaleY = (rect.bottom - rect.top) / (graphY.max - graphY.min);
  return {
    scaleX,
    scaleY,
    originX: rect.left - graphX.min * scaleX,
    originY: rect.top + graphY.max * scaleY,
  };
}

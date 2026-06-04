import type { PixelRect } from "./utils/graphConfig";

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

/** Pixel rectangle (within the canvas) that the graph paper is drawn into. */
export const GRAPH_RECT: PixelRect = {
  left: 50,
  right: 560,
  top: 40,
  bottom: 560,
};

export const COLORS = {
  background: 0x1d1f27,
  graphBg: 0xf7f9fc,
  minorGrid: 0xd6deeb,
  majorAxis: 0x4a5568,
  balloon: 0xff5470,
  curve: 0x3b82f6,
  text: "#e6e9f0",
  darkText: "#2d3748",
  errorText: "#ff6b6b",
  pointsHit: "#34d399",
  pointsMiss: "#f87171",
};

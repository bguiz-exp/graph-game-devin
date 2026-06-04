// Inline SVG sprite assets, encoded as data URIs so no external files are
// fetched (works identically in the browser and in headless tests). Loaded in
// GameScene.preload() under the texture keys 'plane' and 'balloon-pop'.

function svgDataUri(svg: string): string {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/** U12 — aeroplane sprite, nose pointing right (+x) at rotation 0. */
export const PLANE_TEXTURE = svgDataUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="26" viewBox="0 0 40 26">` +
    `<g fill="#f4d35e" stroke="#1d1f27" stroke-width="1.5" stroke-linejoin="round">` +
    `<path d="M6 13 L4 6 L10 13 L4 20 Z" />` +
    `<path d="M16 13 L11 3 L21 13 L11 23 Z" />` +
    `<path d="M5 11 L30 11 L38 13 L30 15 L5 15 Z" />` +
    `</g>` +
    `<circle cx="33" cy="13" r="1.6" fill="#1d1f27" />` +
    `</svg>`,
);

/** U14 — particle texture for the balloon-pop burst. */
export const PARTICLE_TEXTURE = svgDataUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">` +
    `<circle cx="6" cy="6" r="6" fill="#ff5470" />` +
    `</svg>`,
);

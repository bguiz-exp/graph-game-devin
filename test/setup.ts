// Test environment setup for Phaser running headless under jsdom.
import "vitest-canvas-mock";

// jsdom does not implement requestAnimationFrame/cancelAnimationFrame that
// Phaser's TimeStep relies on. Provide simple shims.
if (typeof globalThis.requestAnimationFrame !== "function") {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16) as unknown as number) as typeof requestAnimationFrame;
}
if (typeof globalThis.cancelAnimationFrame !== "function") {
  globalThis.cancelAnimationFrame = ((id: number) =>
    clearTimeout(id as unknown as NodeJS.Timeout)) as typeof cancelAnimationFrame;
}

// jsdom logs "Not implemented: window.focus" when Phaser focuses the game.
if (typeof window !== "undefined") {
  window.focus = () => {};
}

// Phaser reads canvas.getContext('webgl') in some code paths even in HEADLESS;
// vitest-canvas-mock covers '2d'. Returning null for webgl is fine for HEADLESS.

// jsdom never fires `load` events for images (including base64 data URIs), so
// Phaser's TextureManager — which boots by loading a few base64 textures —
// would stall forever after preBoot. Return a real jsdom <img> (so canvas
// drawImage type-checks pass) but fire `load` asynchronously when src is set.
function createLoadingImage(): HTMLImageElement {
  const img = document.createElement("img");
  Object.defineProperty(img, "src", {
    configurable: true,
    get() {
      return img.getAttribute("src") ?? "";
    },
    set(value: string) {
      img.setAttribute("src", value);
      setTimeout(() => img.dispatchEvent(new Event("load")), 0);
    },
  });
  return img;
}
// @ts-expect-error - test-only Image stand-in that resolves load events
globalThis.Image = function Image() {
  return createLoadingImage();
};

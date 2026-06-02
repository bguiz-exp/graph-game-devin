import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Use Phaser's prebuilt UMD bundle in tests (same one Vite uses for the
      // app). The raw `src` entry eagerly requires the optional native
      // `phaser3spectorjs` dependency, which isn't needed for HEADLESS.
      phaser: "phaser/dist/phaser.js",
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
    deps: {
      optimizer: {
        web: {
          // Phaser ships as a large CJS-ish bundle; let Vitest inline it.
          include: ["phaser"],
        },
      },
    },
  },
});

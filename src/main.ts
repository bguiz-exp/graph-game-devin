import Phaser from "phaser";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { ResultScene } from "./scenes/ResultScene";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "./config";

const isHeadless =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("headless");

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: isHeadless ? Phaser.HEADLESS : Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.background,
  dom: {
    createContainer: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MenuScene, GameScene, ResultScene],
};

export function startGame(): Phaser.Game {
  return new Phaser.Game(gameConfig);
}

// Auto-start only when the mount point exists (real browser, not tests).
if (typeof document !== "undefined" && document.getElementById("game")) {
  startGame();
}

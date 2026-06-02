import Phaser from "phaser";
import { MenuScene } from "../../src/scenes/MenuScene";
import { GameScene } from "../../src/scenes/GameScene";
import { ResultScene } from "../../src/scenes/ResultScene";

/** Boot a real (headless) Phaser.Game with the game's scenes. */
export function bootGame(): Promise<Phaser.Game> {
  return new Promise((resolve) => {
    const g = new Phaser.Game({
      type: Phaser.HEADLESS,
      width: 800,
      height: 600,
      banner: false,
      audio: { noAudio: true },
      scene: [MenuScene, GameScene, ResultScene],
      callbacks: {
        postBoot: () => resolve(g),
      },
    });
  });
}

export function waitFor(predicate: () => boolean, timeout = 4000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (predicate()) return resolve();
      if (Date.now() - start > timeout) return reject(new Error("waitFor timed out"));
      setTimeout(tick, 16);
    };
    tick();
  });
}

/** Boot, start the game with a deterministic seed, and return the GameScene. */
export async function startGameScene(seed = 12345): Promise<{
  game: Phaser.Game;
  scene: GameScene;
}> {
  const game = await bootGame();
  await waitFor(() => game.scene.isActive("MenuScene"));
  game.registry.set("seed", seed);
  const menu = game.scene.getScene("MenuScene") as MenuScene;
  menu.proxyStartGame();
  await waitFor(() => game.scene.isActive("GameScene"));
  await waitFor(() => Boolean(game.registry.get("currentQuestion")));
  return { game, scene: game.scene.getScene("GameScene") as GameScene };
}

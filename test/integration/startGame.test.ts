import { describe, it, expect, afterEach } from "vitest";
import Phaser from "phaser";
import { MenuScene } from "../../src/scenes/MenuScene";
import { GameScene } from "../../src/scenes/GameScene";
import { ResultScene } from "../../src/scenes/ResultScene";
import type { Question } from "../../src/types";

let game: Phaser.Game | undefined;

function bootGame(): Promise<Phaser.Game> {
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
    game = g;
  });
}

function waitFor(predicate: () => boolean, timeout = 4000): Promise<void> {
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

afterEach(() => {
  game?.destroy(true);
  game = undefined;
});

describe("game boot + start transition", () => {
  it("boots with MenuScene active and the question bank loaded", async () => {
    const g = await bootGame();
    await waitFor(() => g.scene.isActive("MenuScene"));
    expect(g.scene.isActive("MenuScene")).toBe(true);
    expect(g.registry.get("questionBank")).toBeTruthy();
    expect(g.scene.isActive("GameScene")).toBe(false);
  });

  it("proxyStartGame() transitions MenuScene -> GameScene", async () => {
    const g = await bootGame();
    await waitFor(() => g.scene.isActive("MenuScene"));

    g.registry.set("seed", 12345); // deterministic question
    const menu = g.scene.getScene("MenuScene") as MenuScene;
    menu.proxyStartGame();

    await waitFor(() => g.scene.isActive("GameScene"));
    expect(g.scene.isActive("GameScene")).toBe(true);
    expect(g.scene.isActive("MenuScene")).toBe(false);
  });

  it("writes currentQuestion to the registry after starting the game", async () => {
    const g = await bootGame();
    await waitFor(() => g.scene.isActive("MenuScene"));

    g.registry.set("seed", 999);
    const menu = g.scene.getScene("MenuScene") as MenuScene;
    menu.proxyStartGame();

    await waitFor(() => Boolean(g.registry.get("currentQuestion")));
    const q = g.registry.get("currentQuestion") as Question;
    expect(q).toBeTruthy();
    expect(q.targets.length).toBeGreaterThan(0);
    expect(q.equationType).toBe("linear");
  });
});

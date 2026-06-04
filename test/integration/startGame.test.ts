import { describe, it, expect, afterEach } from "vitest";
import Phaser from "phaser";
import { bootGame, waitFor } from "./helpers";
import type { MenuScene } from "../../src/scenes/MenuScene";
import type { Question } from "../../src/types";

let game: Phaser.Game | undefined;

afterEach(() => {
  game?.destroy(true);
  game = undefined;
});

describe("game boot + start transition", () => {
  it("boots with MenuScene active and the question bank loaded", async () => {
    game = await bootGame();
    const g = game;
    await waitFor(() => g.scene.isActive("MenuScene"));
    expect(g.scene.isActive("MenuScene")).toBe(true);
    expect(g.registry.get("questionBank")).toBeTruthy();
    expect(g.scene.isActive("GameScene")).toBe(false);
  });

  it("proxyStartGame() transitions MenuScene -> GameScene", async () => {
    game = await bootGame();
    const g = game;
    await waitFor(() => g.scene.isActive("MenuScene"));

    g.registry.set("seed", 12345);
    const menu = g.scene.getScene("MenuScene") as MenuScene;
    menu.proxyStartGame();

    await waitFor(() => g.scene.isActive("GameScene"));
    expect(g.scene.isActive("GameScene")).toBe(true);
    expect(g.scene.isActive("MenuScene")).toBe(false);
  });

  it("writes currentQuestion to the registry after starting the game", async () => {
    game = await bootGame();
    const g = game;
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

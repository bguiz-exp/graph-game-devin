import { describe, it, expect, afterEach } from "vitest";
import Phaser from "phaser";
import { startGameScene, waitFor } from "./helpers";
import type { GameScene } from "../../src/scenes/GameScene";
import type { Question } from "../../src/types";

let game: Phaser.Game | undefined;

afterEach(() => {
  game?.destroy(true);
  game = undefined;
});

function question(scene: GameScene): Question {
  return scene.registry.get("currentQuestion") as Question;
}

/** Correct coefficients shifted so every target is missed. */
function wrongCoefficients(correct: Record<string, number>): Record<string, number> {
  const wrong = { ...correct };
  const constKey = "d" in wrong ? "d" : "c";
  wrong[constKey] = (wrong[constKey] ?? 0) + 5;
  return wrong;
}

describe("aeroplane flight + hit/miss (V3)", () => {
  it("sets every balloonState to 'hit' for correct coefficients after the flight", async () => {
    const { game: g, scene } = await startGameScene(12345);
    game = g;
    const q = question(scene);

    scene.proxySubmitEquation(q.correctCoefficients);
    await waitFor(() => !scene.isFlying(), 8000);

    const states = (g.registry.get("gameState") as { balloonStates: Record<string, string> })
      .balloonStates;
    expect(q.targets.length).toBeGreaterThan(0);
    for (const target of q.targets) {
      expect(states[target.id]).toBe("hit");
    }
  });

  it("sets at least one balloonState to 'miss' for wrong coefficients after the flight", async () => {
    const { game: g, scene } = await startGameScene(12345);
    game = g;
    const q = question(scene);

    scene.proxySubmitEquation(wrongCoefficients(q.correctCoefficients));
    await waitFor(() => !scene.isFlying(), 8000);

    const states = (g.registry.get("gameState") as { balloonStates: Record<string, string> })
      .balloonStates;
    const misses = q.targets.filter((t) => states[t.id] === "miss");
    expect(misses.length).toBeGreaterThan(0);
  });

  it("calls proxyOnHit exactly once per hit balloon", async () => {
    const { game: g, scene } = await startGameScene(12345);
    game = g;
    const q = question(scene);

    const calls: string[] = [];
    const orig = scene.proxyOnHit.bind(scene);
    scene.proxyOnHit = (balloon) => {
      calls.push(balloon.id);
      orig(balloon);
    };

    scene.proxySubmitEquation(q.correctCoefficients);
    await waitFor(() => !scene.isFlying(), 8000);

    expect(calls.sort()).toEqual(q.targets.map((t) => t.id).sort());
    expect(new Set(calls).size).toBe(calls.length); // each exactly once
  });

  it("calls proxyOnMiss exactly once per miss balloon", async () => {
    const { game: g, scene } = await startGameScene(12345);
    game = g;
    const q = question(scene);

    const calls: string[] = [];
    const orig = scene.proxyOnMiss.bind(scene);
    scene.proxyOnMiss = (balloon) => {
      calls.push(balloon.id);
      orig(balloon);
    };

    scene.proxySubmitEquation(wrongCoefficients(q.correctCoefficients));
    await waitFor(() => !scene.isFlying(), 8000);

    expect(calls.sort()).toEqual(q.targets.map((t) => t.id).sort());
    expect(new Set(calls).size).toBe(calls.length);
  });

  it("hides the balloon sprite after proxyOnHit", async () => {
    const { game: g, scene } = await startGameScene(12345);
    game = g;
    const target = question(scene).targets[0];
    const sprite = scene.getBalloonSprites().get(target.id)!;
    expect(sprite.visible).toBe(true);

    scene.proxyOnHit(target);
    expect(sprite.visible).toBe(false);
  });

  it("animates the balloon off-screen (y increasing) after proxyOnMiss", async () => {
    const { game: g, scene } = await startGameScene(12345);
    game = g;
    const target = question(scene).targets[0];
    const sprite = scene.getBalloonSprites().get(target.id)!;
    const startY = sprite.y;

    scene.proxyOnMiss(target);
    await waitFor(() => sprite.y > startY + 1, 4000);
    expect(sprite.y).toBeGreaterThan(startY);
  });

  it("disables Submit during flight and re-enables it once complete", async () => {
    const { game: g, scene } = await startGameScene(12345);
    game = g;
    const q = question(scene);

    expect(scene.isSubmitEnabled()).toBe(true);
    scene.proxySubmitEquation(q.correctCoefficients);

    // Synchronously after submit, the flight is running and Submit is disabled.
    expect(scene.isFlying()).toBe(true);
    expect(scene.isSubmitEnabled()).toBe(false);

    await waitFor(() => !scene.isFlying(), 8000);
    expect(scene.isSubmitEnabled()).toBe(true);
  });
});

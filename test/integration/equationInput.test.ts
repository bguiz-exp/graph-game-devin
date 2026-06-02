import { describe, it, expect, afterEach } from "vitest";
import Phaser from "phaser";
import { startGameScene } from "./helpers";
import { GRAPH_RECT } from "../../src/config";

let game: Phaser.Game | undefined;

afterEach(() => {
  game?.destroy(true);
  game = undefined;
});

function withinGraphRect(p: { x: number; y: number }): boolean {
  return (
    p.x >= GRAPH_RECT.left - 0.5 &&
    p.x <= GRAPH_RECT.right + 0.5 &&
    p.y >= GRAPH_RECT.top - 0.5 &&
    p.y <= GRAPH_RECT.bottom + 0.5
  );
}

describe("equation input + curve plot (V2)", () => {
  it("plots a curve with points inside the graph bounds on submit", async () => {
    const { game: g, scene } = await startGameScene(12345);
    game = g;

    scene.proxySubmitEquation({ m: 2, c: 1 });
    const points = scene.getCurvePoints();

    expect(points.length).toBeGreaterThan(0);
    expect(points.every(withinGraphRect)).toBe(true);
    expect(scene.getError()).toBeNull();
  });

  it("clears and redraws the curve when submitting different coefficients", async () => {
    const { game: g, scene } = await startGameScene(12345);
    game = g;

    scene.proxySubmitEquation({ m: 2, c: 1 });
    const first = JSON.stringify(scene.getCurvePoints());

    scene.proxySubmitEquation({ m: -1, c: 3 });
    const second = JSON.stringify(scene.getCurvePoints());

    expect(scene.getCurvePoints().length).toBeGreaterThan(0);
    expect(second).not.toBe(first); // redrawn, not appended/residual
  });

  it("does not plot and shows an error hint when coefficients are missing", async () => {
    const { game: g, scene } = await startGameScene(12345);
    game = g;

    scene.proxySubmitEquation({ m: 2 }); // missing 'c'

    expect(scene.getCurvePoints().length).toBe(0);
    expect(scene.getError()).toBeTruthy();
  });
});

import Phaser from "phaser";
import type {
  BalloonTarget,
  Coordinate,
  EquationType,
  GameState,
  GraphConfig,
  Question,
  QuestionTemplate,
  Settings,
} from "../types";
import { createRng } from "../utils/rng";
import { generateQuestion } from "../utils/generateQuestion";
import { mathToCanvas } from "../utils/mathToCanvas";
import { computeGraphConfig } from "../utils/graphConfig";
import { evaluateEquation, coefficientNames } from "../utils/evaluateEquation";
import {
  checkIntersections,
  type IntersectionResult,
} from "../utils/checkIntersections";
import { EquationPanel } from "../components/EquationPanel";
import { GRAPH_RECT, COLORS } from "../config";
import { PLANE_TEXTURE, PARTICLE_TEXTURE } from "../assets/sprites";

export class GameScene extends Phaser.Scene {
  private graphConfig!: GraphConfig;
  private currentTemplate!: QuestionTemplate;
  private balloonSprites: Map<string, Phaser.GameObjects.Arc> = new Map();
  private equationPanel!: EquationPanel;
  private curveGraphics?: Phaser.GameObjects.Graphics;
  private lastCurvePoints: Coordinate[] = [];
  private lastError: string | null = null;
  private planeSprite?: Phaser.GameObjects.Sprite;
  private flightTween?: Phaser.Tweens.Tween;
  private flying = false;
  private lastHitMiss: IntersectionResult[] = [];

  constructor() {
    super("GameScene");
  }

  /** Prep — load the aeroplane (U12) and pop-particle (U14) textures. */
  preload(): void {
    if (!this.textures.exists("plane")) this.load.image("plane", PLANE_TEXTURE);
    if (!this.textures.exists("balloon-pop")) {
      this.load.image("balloon-pop", PARTICLE_TEXTURE);
    }
  }

  create(): void {
    this.equationPanel = new EquationPanel(this, GRAPH_RECT.right + 20, 120);
    this.loadQuestion();

    const question = this.registry.get("currentQuestion") as Question;
    const names = coefficientNames(question.equationType);
    this.equationPanel.createInputs(names, () =>
      this.proxySubmitEquation(this.equationPanel.readCoefficients(names)),
    );
  }

  /** N10 — select + generate the current question and render the scene. */
  loadQuestion(): void {
    const bank =
      (this.registry.get("questionBank") as QuestionTemplate[] | undefined) ?? [];
    const settings =
      (this.registry.get("settings") as Settings | undefined) ?? {
        difficulty: "linear",
        inputMode: "direct",
      };

    // Allocate the game-state store now (fully wired in V4).
    let gameState = this.registry.get("gameState") as GameState | undefined;
    if (!gameState) {
      gameState = {
        score: 0,
        streak: 0,
        level: 1,
        questionIndex: 0,
        attemptCount: 0,
        balloonStates: {},
        levelUpPending: false,
      };
      this.registry.set("gameState", gameState);
    }

    const templates = bank.filter((t) => t.equationType === settings.difficulty);
    if (templates.length === 0) {
      throw new Error(`No question templates for difficulty "${settings.difficulty}"`);
    }
    this.currentTemplate = templates[gameState.questionIndex % templates.length];

    const seed =
      (this.registry.get("seed") as number | undefined) ??
      Math.floor(Math.random() * 0xffffffff);
    const question = generateQuestion(this.currentTemplate, createRng(seed));

    this.registry.set("currentQuestion", question);

    this.graphConfig = computeGraphConfig(
      this.currentTemplate.ranges.graphX,
      this.currentTemplate.ranges.graphY,
      GRAPH_RECT,
    );

    this.drawGraphPaper();
    this.placeBalloons(question);
    this.placePlane(question);
    this.equationPanel.render(question.templateLabel);
  }

  /** U12 — add the aeroplane on the curve at the start x, hidden until flight. */
  placePlane(question: Question): void {
    const startX = this.currentTemplate.start.x;
    const startY = evaluateEquation(
      question.correctCoefficients,
      startX,
      question.equationType,
    );
    const p = mathToCanvas(startX, startY, this.graphConfig);
    if (!this.planeSprite) {
      this.planeSprite = this.add
        .sprite(p.x, p.y, "plane")
        .setOrigin(0.5, 0.5)
        .setDepth(20);
    } else {
      this.planeSprite.setPosition(p.x, p.y).setRotation(0);
    }
    this.planeSprite.setVisible(false);
  }

  getPlaneSprite(): Phaser.GameObjects.Sprite | undefined {
    return this.planeSprite;
  }

  isFlying(): boolean {
    return this.flying;
  }

  /** Whether the Submit control is currently enabled (test/automation hook). */
  isSubmitEnabled(): boolean {
    return this.equationPanel.isSubmitEnabled();
  }

  getHitMissResults(): IntersectionResult[] {
    return this.lastHitMiss;
  }

  /** N11 — render graph paper (U10). */
  drawGraphPaper(): void {
    const g = this.add.graphics();
    const { graphX, graphY } = this.currentTemplate.ranges;

    // Background.
    g.fillStyle(COLORS.graphBg, 1);
    g.fillRect(
      GRAPH_RECT.left,
      GRAPH_RECT.top,
      GRAPH_RECT.right - GRAPH_RECT.left,
      GRAPH_RECT.bottom - GRAPH_RECT.top,
    );

    // Minor grid lines.
    g.lineStyle(1, COLORS.minorGrid, 1);
    for (let x = graphX.min; x <= graphX.max; x += 1) {
      const top = mathToCanvas(x, graphY.max, this.graphConfig);
      const bottom = mathToCanvas(x, graphY.min, this.graphConfig);
      g.lineBetween(top.x, top.y, bottom.x, bottom.y);
    }
    for (let y = graphY.min; y <= graphY.max; y += 1) {
      const left = mathToCanvas(graphX.min, y, this.graphConfig);
      const right = mathToCanvas(graphX.max, y, this.graphConfig);
      g.lineBetween(left.x, left.y, right.x, right.y);
    }

    // Major axes.
    g.lineStyle(2.5, COLORS.majorAxis, 1);
    const yAxisTop = mathToCanvas(0, graphY.max, this.graphConfig);
    const yAxisBottom = mathToCanvas(0, graphY.min, this.graphConfig);
    g.lineBetween(yAxisTop.x, yAxisTop.y, yAxisBottom.x, yAxisBottom.y);
    const xAxisLeft = mathToCanvas(graphX.min, 0, this.graphConfig);
    const xAxisRight = mathToCanvas(graphX.max, 0, this.graphConfig);
    g.lineBetween(xAxisLeft.x, xAxisLeft.y, xAxisRight.x, xAxisRight.y);

    // Tick labels at even intervals (skip origin clutter).
    const labelStep = 2;
    for (let x = Math.ceil(graphX.min / labelStep) * labelStep; x <= graphX.max; x += labelStep) {
      if (x === 0) continue;
      const p = mathToCanvas(x, 0, this.graphConfig);
      this.add
        .text(p.x, p.y + 4, String(x), { fontSize: "12px", color: COLORS.darkText })
        .setOrigin(0.5, 0);
    }
    for (let y = Math.ceil(graphY.min / labelStep) * labelStep; y <= graphY.max; y += labelStep) {
      if (y === 0) continue;
      const p = mathToCanvas(0, y, this.graphConfig);
      this.add
        .text(p.x - 6, p.y, String(y), { fontSize: "12px", color: COLORS.darkText })
        .setOrigin(1, 0.5);
    }
  }

  /** N12 — place balloon targets (U13). */
  placeBalloons(question: Question): void {
    this.balloonSprites.clear();
    for (const target of question.targets) {
      const p = mathToCanvas(target.x, target.y, this.graphConfig);
      const balloon = this.add.circle(p.x, p.y, 12, COLORS.balloon);
      balloon.setStrokeStyle(2, 0xffffff);
      this.balloonSprites.set(target.id, balloon);
    }
  }

  /** Exposed for V3 tests/integration. */
  getBalloonSprites(): Map<string, Phaser.GameObjects.Arc> {
    return this.balloonSprites;
  }

  /**
   * N20 — validate the submitted coefficients and plot the curve (U11).
   * `checkIntersections` (V3) and `animateFlight` (V5) are invoked here later.
   */
  proxySubmitEquation(coefficients: Record<string, number>): void {
    const question = this.registry.get("currentQuestion") as Question;
    const names = coefficientNames(question.equationType);

    const complete = names.every((n) => Number.isFinite(coefficients[n]));
    if (!complete) {
      this.lastError = "Enter a number for every coefficient.";
      this.equationPanel.showError(this.lastError);
      return;
    }

    this.lastError = null;
    this.equationPanel.clearError();
    this.plotCurve(coefficients, question.equationType);

    // V3 — classify each balloon, then fly the plane along the plotted curve.
    const results = checkIntersections(
      coefficients,
      question.equationType,
      question.targets,
    );
    this.lastHitMiss = results;
    this.animateFlight(results, coefficients, question.equationType);
  }

  /**
   * N40 — tween the plane along the plotted curve, rotating it to face the
   * direction of travel, firing onHit/onMiss as it passes each balloon.
   */
  animateFlight(
    hitMissResults: IntersectionResult[],
    coefficients: Record<string, number>,
    equationType: EquationType,
  ): void {
    if (!this.planeSprite) return;
    this.flightTween?.remove();

    const { graphX, graphY } = this.currentTemplate.ranges;
    // Sample the curve into canvas waypoints (clamped to the visible range).
    const step = 0.1;
    const waypoints: Coordinate[] = [];
    for (let x = graphX.min; x <= graphX.max + 1e-9; x += step) {
      let y = evaluateEquation(coefficients, x, equationType);
      y = Phaser.Math.Clamp(y, graphY.min, graphY.max);
      waypoints.push(mathToCanvas(x, y, this.graphConfig));
    }
    if (waypoints.length < 2) {
      this.onFlightComplete();
      return;
    }

    // Pre-compute each balloon's canvas x + result so we can fire callbacks as
    // the plane passes (left-to-right, so canvas x increases monotonically).
    const resultById = new Map(hitMissResults.map((r) => [r.id, r.result]));
    const question = this.registry.get("currentQuestion") as Question;
    const pending = question.targets
      .map((target) => ({
        target,
        canvasX: mathToCanvas(target.x, target.y, this.graphConfig).x,
        result: resultById.get(target.id) ?? "miss",
        fired: false,
      }))
      .sort((a, b) => a.canvasX - b.canvasX);

    const firePending = (px: number): void => {
      for (const pt of pending) {
        if (!pt.fired && px >= pt.canvasX) {
          pt.fired = true;
          if (pt.result === "hit") this.proxyOnHit(pt.target);
          else this.proxyOnMiss(pt.target);
        }
      }
    };

    this.flying = true;
    this.equationPanel.setSubmitEnabled(false);
    this.planeSprite.setVisible(true).setPosition(waypoints[0].x, waypoints[0].y);

    const segments = waypoints.length - 1;
    // Duration proportional to curve length, clamped so it always feels snappy.
    const duration = Phaser.Math.Clamp(segments * 30, 1000, 3000);

    this.flightTween = this.tweens.addCounter({
      from: 0,
      to: segments,
      duration,
      ease: "Linear",
      onUpdate: (tween) => {
        const v = tween.getValue() ?? segments;
        const i = Math.min(Math.floor(v), segments - 1);
        const frac = v - i;
        const a = waypoints[i];
        const b = waypoints[i + 1];
        const px = Phaser.Math.Linear(a.x, b.x, frac);
        const py = Phaser.Math.Linear(a.y, b.y, frac);
        this.planeSprite!.setPosition(px, py);
        // Rotation follows the curve's slope (direction of travel).
        this.planeSprite!.setRotation(Math.atan2(b.y - a.y, b.x - a.x));
        firePending(px);
      },
      onComplete: () => {
        firePending(Number.POSITIVE_INFINITY); // any balloons past the last sample
        this.onFlightComplete();
      },
    });
  }

  private onFlightComplete(): void {
    this.flying = false;
    this.equationPanel.setSubmitEnabled(true);
    this.checkSolved();
  }

  /** N60 — stub in V3; wired to scoring/level progression in V4. */
  checkSolved(): void {
    // Intentionally empty until V4.
  }

  /**
   * N41 — handle the plane reaching a balloon it hits: pop particles (U14),
   * float "+10" upward (U16), and record the hit in S4.
   */
  proxyOnHit(balloon: BalloonTarget): void {
    const p = mathToCanvas(balloon.x, balloon.y, this.graphConfig);
    if (this.textures.exists("balloon-pop")) {
      const emitter = this.add.particles(p.x, p.y, "balloon-pop", {
        speed: { min: 60, max: 180 },
        angle: { min: 0, max: 360 },
        lifespan: 600,
        scale: { start: 0.9, end: 0 },
        emitting: false,
      });
      emitter.setDepth(15);
      emitter.explode(20, p.x, p.y);
      this.time.delayedCall(700, () => emitter.destroy());
    }
    const sprite = this.balloonSprites.get(balloon.id);
    if (sprite) {
      sprite.setVisible(false);
      this.time.delayedCall(50, () => sprite.destroy());
    }
    this.floatPoints(p.x, p.y, "+10", COLORS.pointsHit, -60);
    this.markBalloonState(balloon.id, "hit");
  }

  /**
   * N42 — handle the plane passing a balloon it misses: the balloon falls and
   * fades (U15), "−5" floats downward (U16), and the miss is recorded in S4.
   */
  proxyOnMiss(balloon: BalloonTarget): void {
    const p = mathToCanvas(balloon.x, balloon.y, this.graphConfig);
    const sprite = this.balloonSprites.get(balloon.id);
    if (sprite) {
      this.tweens.add({
        targets: sprite,
        y: sprite.y + 300,
        alpha: 0,
        duration: 800,
        ease: "Quad.easeIn",
        onComplete: () => sprite.destroy(),
      });
    }
    this.floatPoints(p.x, p.y, "\u22125", COLORS.pointsMiss, 60);
    this.markBalloonState(balloon.id, "miss");
  }

  /** U16 — a points label that drifts (dy) while fading, then is removed. */
  private floatPoints(
    x: number,
    y: number,
    label: string,
    color: string,
    dy: number,
  ): void {
    const text = this.add
      .text(x, y, label, { fontSize: "20px", color, fontStyle: "bold" })
      .setOrigin(0.5)
      .setDepth(25);
    this.tweens.add({
      targets: text,
      y: y + dy,
      alpha: 0,
      duration: 800,
      ease: "Quad.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  private markBalloonState(id: string, state: "hit" | "miss"): void {
    const gameState = this.registry.get("gameState") as GameState | undefined;
    if (gameState) gameState.balloonStates[id] = state;
  }

  /** N32 — sample the equation across the visible range and draw it dashed. */
  plotCurve(
    coefficients: Record<string, number>,
    equationType: Question["equationType"],
  ): void {
    if (!this.curveGraphics) {
      this.curveGraphics = this.add.graphics();
    }
    this.curveGraphics.clear();
    this.curveGraphics.lineStyle(3, COLORS.curve, 1);

    const { graphX, graphY } = this.currentTemplate.ranges;
    const runs: Coordinate[][] = [];
    let run: Coordinate[] = [];
    const step = 0.05;
    for (let x = graphX.min; x <= graphX.max + 1e-9; x += step) {
      const y = evaluateEquation(coefficients, x, equationType);
      // Skip points outside the visible vertical range (avoids off-canvas spikes).
      if (!Number.isFinite(y) || y < graphY.min || y > graphY.max) {
        if (run.length > 0) {
          runs.push(run);
          run = [];
        }
        continue;
      }
      run.push(mathToCanvas(x, y, this.graphConfig));
    }
    if (run.length > 0) runs.push(run);

    this.lastCurvePoints = runs.flat();
    for (const points of runs) {
      this.drawDashedPath(this.curveGraphics, points);
    }
  }

  private drawDashedPath(
    g: Phaser.GameObjects.Graphics,
    points: Coordinate[],
  ): void {
    // Dense samples (0.05 units) — render ~3 drawn segments then ~3 gaps.
    for (let i = 1; i < points.length; i++) {
      if (i % 6 < 3) continue;
      g.lineBetween(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
    }
  }

  /** Points of the most recently plotted curve (test/automation hook). */
  getCurvePoints(): Coordinate[] {
    return this.lastCurvePoints;
  }

  /** Last validation error message, or null (test/automation hook). */
  getError(): string | null {
    return this.lastError;
  }

  proxyNextQuestion(): void {
    // V4
  }
}

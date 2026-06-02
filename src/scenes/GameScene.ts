import Phaser from "phaser";
import type {
  Coordinate,
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
import { EquationPanel } from "../components/EquationPanel";
import { GRAPH_RECT, COLORS } from "../config";

export class GameScene extends Phaser.Scene {
  private graphConfig!: GraphConfig;
  private currentTemplate!: QuestionTemplate;
  private balloonSprites: Map<string, Phaser.GameObjects.Arc> = new Map();
  private equationPanel!: EquationPanel;
  private curveGraphics?: Phaser.GameObjects.Graphics;
  private lastCurvePoints: Coordinate[] = [];
  private lastError: string | null = null;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.equationPanel = new EquationPanel(this, GRAPH_RECT.right + 30, 120);
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
    this.equationPanel.render(question.templateLabel);
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

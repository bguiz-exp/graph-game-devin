import Phaser from "phaser";
import questionBank from "../data/questionBank.json";
import type { EquationType, QuestionTemplate, Settings } from "../types";
import { GAME_WIDTH, COLORS } from "../config";

export class MenuScene extends Phaser.Scene {
  private difficultyButtons: Map<EquationType, Phaser.GameObjects.Text> = new Map();

  constructor() {
    super("MenuScene");
  }

  create(): void {
    // N1 — load the question bank into the registry (S1). Must be first.
    this.loadQuestionBank();

    // Default settings (S2).
    this.setDifficulty("linear");

    // U1 — title card.
    this.add
      .text(GAME_WIDTH / 2, 120, "Graph Game", {
        fontSize: "48px",
        color: COLORS.text,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 180, "Fly the aeroplane through the balloons!", {
        fontSize: "20px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    // U2 — difficulty selector.
    const difficulties: EquationType[] = ["linear", "quadratic", "cubic"];
    difficulties.forEach((difficulty, i) => {
      const btn = this.add
        .text(GAME_WIDTH / 2, 260 + i * 56, this.difficultyLabel(difficulty), {
          fontSize: "24px",
          color: COLORS.text,
          backgroundColor: "#2a2d3a",
          padding: { x: 16, y: 8 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.setDifficulty(difficulty));
      this.difficultyButtons.set(difficulty, btn);
    });

    // U3 — Start button.
    this.add
      .text(GAME_WIDTH / 2, 470, "▶ Start", {
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "#3b82f6",
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.proxyStartGame());

    this.refreshDifficultyButtons();
  }

  /** N1 — load question bank JSON into the registry (S1). */
  loadQuestionBank(): void {
    this.registry.set("questionBank", questionBank as unknown as QuestionTemplate[]);
  }

  /** N2 — write difficulty + input mode to the registry (S2). */
  setDifficulty(difficulty: EquationType): void {
    const settings: Settings = { difficulty, inputMode: "direct" };
    this.registry.set("settings", settings);
    this.refreshDifficultyButtons();
  }

  /** N3 — start the game. Exposed so tests can drive it directly. */
  proxyStartGame(): void {
    this.scene.start("GameScene");
  }

  private difficultyLabel(difficulty: EquationType): string {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }

  private refreshDifficultyButtons(): void {
    const settings = this.registry.get("settings") as Settings | undefined;
    const active = settings?.difficulty;
    for (const [difficulty, btn] of this.difficultyButtons) {
      btn.setBackgroundColor(difficulty === active ? "#3b82f6" : "#2a2d3a");
    }
  }
}

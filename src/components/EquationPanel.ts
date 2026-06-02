import Phaser from "phaser";
import { COLORS } from "../config";

/**
 * U20/U21/U23 — shows the equation template, a coefficient input per blank, and
 * a Submit button. DOM inputs (U21) are only created when a DOM container is
 * available (real browser); headless tests drive `proxySubmitEquation` directly.
 */
export class EquationPanel {
  private scene: Phaser.Scene;
  private x: number;
  private y: number;

  private labelText?: Phaser.GameObjects.Text;
  private errorText?: Phaser.GameObjects.Text;
  private inputs: Record<string, HTMLInputElement> = {};
  private onSubmit?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
  }

  render(templateLabel: string): void {
    this.scene.add.text(this.x, this.y - 30, "Equation", {
      fontSize: "18px",
      color: COLORS.text,
      fontStyle: "bold",
    });
    this.labelText = this.scene.add.text(this.x, this.y, templateLabel, {
      fontSize: "24px",
      color: COLORS.text,
      backgroundColor: "#2a2d3a",
      padding: { x: 10, y: 8 },
    });
  }

  setLabel(label: string): void {
    this.labelText?.setText(label);
  }

  /** U21 + U23 — build a numeric input per coefficient and a Submit button. */
  createInputs(coeffNames: string[], onSubmit: () => void): void {
    this.onSubmit = onSubmit;

    // U23 — Phaser Submit button (also works in headless tests).
    this.scene.add
      .text(this.x, this.y + 130, "Submit", {
        fontSize: "22px",
        color: "#ffffff",
        backgroundColor: "#3b82f6",
        padding: { x: 18, y: 8 },
      })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.onSubmit?.());

    // U21 — DOM number inputs (browser only).
    const game = this.scene.game as Phaser.Game & { domContainer?: HTMLElement };
    if (!game.domContainer) return;

    const fields = coeffNames
      .map(
        (n) =>
          `<label style="color:#e6e9f0;font:16px monospace;display:flex;` +
          `align-items:center;gap:6px;margin:4px 0;">${n}` +
          `<input type="number" step="1" data-coeff="${n}" ` +
          `style="width:64px;font:16px monospace;padding:4px;" /></label>`,
      )
      .join("");
    const html =
      `<div style="display:flex;flex-direction:column;">${fields}</div>`;

    const dom = this.scene.add.dom(this.x + 70, this.y + 60).createFromHTML(html);
    const node = dom.node as HTMLElement;
    this.inputs = {};
    for (const n of coeffNames) {
      const el = node.querySelector(
        `input[data-coeff="${n}"]`,
      ) as HTMLInputElement | null;
      if (!el) continue;
      this.inputs[n] = el;
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.onSubmit?.();
      });
    }
  }

  /** Read the current coefficient values from the DOM inputs. */
  readCoefficients(coeffNames: string[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const n of coeffNames) {
      const el = this.inputs[n];
      const raw = el ? el.value : "";
      out[n] = raw === "" ? NaN : parseFloat(raw);
    }
    return out;
  }

  showError(message: string): void {
    if (!this.errorText) {
      this.errorText = this.scene.add
        .text(this.x, this.y + 180, "", {
          fontSize: "14px",
          color: COLORS.errorText,
        })
        .setWordWrapWidth(190);
    }
    this.errorText.setText(message);
  }

  clearError(): void {
    this.errorText?.setText("");
  }
}

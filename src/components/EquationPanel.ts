import Phaser from "phaser";
import { COLORS } from "../config";

/**
 * U20/U21/U23 — shows the equation with a coefficient input overlaid inline at
 * each blank, plus a Submit button. The DOM inputs (U21) are only created when a
 * DOM container is available (real browser); headless tests drive
 * `proxySubmitEquation` directly.
 */
export class EquationPanel {
  private scene: Phaser.Scene;
  private x: number;
  private y: number;

  private equationLabel = "";
  private errorText?: Phaser.GameObjects.Text;
  private inputs: Record<string, HTMLInputElement> = {};
  private onSubmit?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
  }

  render(templateLabel: string): void {
    // Keep the blanked label (e.g. "y = _x + _"); inputs are overlaid inline
    // at each blank in createInputs().
    this.equationLabel = templateLabel;
    this.scene.add.text(this.x, this.y - 30, "Equation", {
      fontSize: "18px",
      color: COLORS.text,
      fontStyle: "bold",
    });
  }

  /** U21 + U23 — overlay an input at each blank inline, plus a Submit button. */
  createInputs(coeffNames: string[], onSubmit: () => void): void {
    this.onSubmit = onSubmit;

    const game = this.scene.game as Phaser.Game & { domContainer?: HTMLElement };
    if (game.domContainer) {
      this.renderInlineInputs(coeffNames);
    } else {
      // Headless fallback: a static label so the scene still has the equation.
      this.scene.add.text(this.x, this.y, this.equationLabel, {
        fontSize: "24px",
        color: COLORS.text,
        backgroundColor: "#2a2d3a",
        padding: { x: 10, y: 8 },
      });
    }

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
  }

  /**
   * Build a single inline DOM equation: the blanked label is split on each
   * blank (`_`) and an `<input>` is woven in at each gap, in coefficient order,
   * so the user sees e.g. `y = [ ]x + [ ]`.
   */
  private renderInlineInputs(coeffNames: string[]): void {
    const segments = this.equationLabel.split("_");
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const inputStyle =
      "width:42px;font:20px monospace;text-align:center;padding:2px 3px;" +
      "margin:0 2px;color:#e6e9f0;background:#1b1e2b;" +
      "border:1px solid #3b82f6;border-radius:4px;";

    let html = "";
    segments.forEach((seg, i) => {
      if (seg) html += `<span>${esc(seg)}</span>`;
      const name = coeffNames[i];
      // A blank lives between every pair of segments; weave an input there.
      if (i < segments.length - 1 && name) {
        html += `<input type="number" step="1" data-coeff="${name}" style="${inputStyle}" />`;
      }
    });

    const wrapper =
      `<div style="display:flex;align-items:center;font:20px monospace;` +
      `color:${COLORS.text};background:#2a2d3a;padding:6px 8px;` +
      `border-radius:6px;white-space:nowrap;">${html}</div>`;

    const dom = this.scene.add
      .dom(this.x, this.y)
      .createFromHTML(wrapper)
      .setOrigin(0, 0);
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

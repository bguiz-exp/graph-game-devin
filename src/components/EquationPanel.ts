import Phaser from "phaser";
import { COLORS } from "../config";

/**
 * U20 — shows the equation template (with blanks in V1). Input fields and the
 * Submit button are added in V2.
 */
export class EquationPanel {
  private scene: Phaser.Scene;
  private labelText?: Phaser.GameObjects.Text;
  private x: number;
  private y: number;

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
}

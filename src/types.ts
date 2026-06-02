// Shared types used across the game.

export type EquationType = "linear" | "quadratic" | "cubic";
export type InputMode = "direct" | "multiple-choice";

export interface BalloonTarget {
  x: number;
  y: number;
  id: string;
}

export interface QuestionOption {
  label: string;
  coefficients: Record<string, number>;
}

/** A concrete, playable question sampled from a QuestionTemplate. */
export interface Question {
  id: string;
  equationType: EquationType;
  /** Display label with blanks, e.g. "y = _x + _". */
  templateLabel: string;
  targets: BalloonTarget[];
  correctCoefficients: Record<string, number>;
  options: QuestionOption[];
}

export interface Settings {
  difficulty: EquationType;
  inputMode: InputMode;
}

export interface GameState {
  score: number;
  streak: number;
  level: number;
  questionIndex: number;
  attemptCount: number;
  balloonStates: Record<string, "pending" | "hit" | "miss">;
  levelUpPending: boolean;
}

// ---- Generator specification (template) types ----

export interface Range {
  min: number;
  max: number;
  step: number;
  excludeMin?: number;
  excludeMax?: number;
}

export interface Coordinate {
  x: number;
  y: number;
}

export type DistractorStrategy = "perturb-one" | "perturb-all-small";

/**
 * A generator specification — NOT a question. No absolute answer values are
 * stored; every concrete value is sampled at runtime from the ranges.
 */
export interface QuestionTemplate {
  id: string;
  equationType: EquationType;
  /** e.g. "y = {m}x + {c}" — placeholders in braces are coefficient names. */
  templateLabel: string;
  targetCount: number;
  ranges: Record<string, Range>;
  start: Coordinate;
  distractorStrategy: DistractorStrategy;
}

/** Pixel-space mapping config for converting maths coordinates to canvas. */
export interface GraphConfig {
  originX: number;
  originY: number;
  scaleX: number;
  scaleY: number;
}

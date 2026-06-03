# Graph Game

An educational maths game: read an equation, then fly an aeroplane along its
graph to pop balloon targets. Built with **Vite + TypeScript + Phaser 3**.

This repository is implemented in sequential slices (V1–V6), each tracked as an
epic on the project board.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
```

Open the app, pick a difficulty, and click **Start**.

## Scripts

| Command                    | Description                                       |
| -------------------------- | ------------------------------------------------- |
| `npm run dev`              | Start the Vite dev server.                        |
| `npm run build`            | Type-check and build the production bundle.        |
| `npm run preview`          | Preview the production build.                      |
| `npm run typecheck`        | Run the TypeScript compiler with no emit.          |
| `npm test`                 | Run all unit + integration tests once (Vitest).    |
| `npm run test:watch`       | Run tests in watch mode.                           |
| `npm run test:unit`        | Run only the unit tests.                           |
| `npm run test:integration` | Run only the integration tests.                    |

There is no CI and there are no pre-commit hooks — run the commands locally.

## Testing approach

- **Unit tests** cover the pure functions (`mathToCanvas`, `evaluateEquation`,
  `generateQuestion`) with no Phaser dependency.
- **Integration tests** boot a real `Phaser.Game` in `HEADLESS` mode under
  jsdom and drive it through the proxy methods (e.g. `proxyStartGame()`),
  asserting on registry state and scene transitions. End-to-end (browser)
  tests are intentionally out of scope.

## Architecture (V1)

- `src/main.ts` — creates the `Phaser.Game` (`AUTO`, or `HEADLESS` with
  `?headless`) and registers the scenes.
- `src/scenes/` — `MenuScene`, `GameScene`, `ResultScene` (stub).
- `src/utils/` — pure, unit-testable helpers (RNG, equation evaluation,
  question generation, coordinate mapping, graph config).
- `src/data/questionBank.json` — **generator specifications** (templates), not
  pre-baked questions. Concrete questions are sampled at runtime via a seedable
  RNG, so the correct equation always passes through every target exactly.
- `src/types.ts` — shared types.

Scenes communicate through Phaser's registry (the data stores S1–S4):
`questionBank`, `settings`, `currentQuestion`, `gameState`.

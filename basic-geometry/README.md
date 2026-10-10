# Basic Geometry

Interactive formula-learning app for **https://learning.hayden-gilbert.com/basic-geometry**.

Pick a Pair matching game (3 levels + 6 practice modes), end-of-round review that explains every mistake, persistent
local learning history with **Reset progress**, a formula calculator with metric units, an area-unit converter,
a formula reference, a progress dashboard and the free PDF cheat sheet.

Static site — no server, database, account, analytics or third-party services. Progress lives in the browser's
`localStorage` only.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173/basic-geometry/
npm test           # unit tests (Vitest, 42 tests)
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173/basic-geometry/
```

Requires Node 18+ (built and tested on Node 22).

## Routes

| Route | Page |
|---|---|
| `/basic-geometry/` | Overview / homepage |
| `/basic-geometry/play` | Pick a Pair menu → game → review (`?level=2`, `?mode=mistakes`, `?mode=area` deep-link straight into a round) |
| `/basic-geometry/calculator` | Formula calculator + area converter (`?shape=cone&formula=cone-surface-area`) |
| `/basic-geometry/formulas` | Formula reference |
| `/basic-geometry/progress` | Progress dashboard |

## Deploying under `/basic-geometry`

1. `npm run build`
2. Upload the **contents** of `dist/` to the `basic-geometry/` folder of the web root for `learning.hayden-gilbert.com`
   (so `dist/index.html` is served at `/basic-geometry/index.html`). Include the hidden `.htaccess` file.

Direct navigation to every route works on **any static host with no configuration**, because the build writes a real
`index.html` copy into `play/`, `calculator/`, `progress/` and `formulas/`. Unknown paths are handled by:

- **Apache** — the generated `dist/.htaccess` (needs `mod_rewrite`; `mod_headers` for the PDF attachment header).
- **Netlify / GitHub Pages / Cloudflare Pages** — the generated `dist/404.html`.
- **Nginx** — add:
  ```nginx
  location /basic-geometry/ {
    try_files $uri $uri/ /basic-geometry/index.html;
  }
  ```

To deploy at a different path, set `BASE_PATH` at build time: `BASE_PATH=/maths/geometry/ npm run build`
(or `BASE_PATH=/` for a domain root). All asset, route and download URLs follow it.

The site header links to `https://learning.hayden-gilbert.com/` (Home) and its `#all-games` section (Other Games), and
`https://learn-thai.hayden-gilbert.com/` (Learn Thai) — edit `src/lib/paths.ts` and `src/components/Layout.tsx` if these change.

## Architecture

```
src/
  data/                 ← single source of truth (pure data)
    types.ts            Formula / Shape / Calculation types
    formulas.ts         all 26 formulas: id, category, question, LaTeX, variables, difficulty, explanation, hints, calculator
    shapes.ts           13 shapes, categories (with unit powers), variable legend
    levels.ts           LEVELS and PRACTICE_MODES configuration
  lib/                  ← logic, no UI
    game.ts             Pick a Pair engine: pure transitions (select / choose / abandon) + review builder
    rounds.ts           practice engine: question + distractor selection, Practise My Mistakes weighting
    history.ts          learning-history store (localStorage, validation, recovery, reset)
    historyTypes.ts     stats / session record types, accuracy
    progress.ts         dashboard aggregation and sorting
    explain.ts          mistake explanations (in-game hints that never reveal the answer; full review text)
    units.ts            central metric conversion (length/area/volume), number parsing/formatting
    useGameSession.ts   connects engine ↔ React ↔ history store
  components/           Layout, Math (KaTeX), ShapeIllustration (SVG), AreaConverter, common UI, game/*
  pages/                Home, Play, Calculator, Formulas, Progress, NotFound
scripts/postbuild.mjs   route copies, 404.html, .htaccess, PDF check
```

Key decisions:

- **Matching uses stable IDs** (`circle-area`), never displayed text. Area and perimeter/circumference are separate formulas with separate stats.
- **No timers drive game state.** Every click is a pure state transition applied to the latest state (held in a ref),
  so rapid double-taps can't double-match or corrupt progress. Animations are CSS only and respect `prefers-reduced-motion`.
- **Every attempt is persisted immediately** (not only at the end of a round).
- **Accuracy** = questions matched on the first try ÷ questions finished. Percentages only show after 3+ attempts.
- **In-game feedback never shows the correct formula**; it says what the chosen formula actually calculates plus a hint.
  The review screen shows the correct formula and a specific explanation.
- **Practise My Mistakes** samples weighted by mistakes, low accuracy and recency (not a fixed top 4). With ≤ 4 recorded
  mistakes it keeps one slot for a fresh formula so rounds never repeat exactly; empty slots are filled from the chosen difficulty.
- **Calculator units:** each measurement has its own unit selector (mm / cm / m, or mm² / cm² / m² for a base area);
  everything is converted to the "Answer in" unit before the formula is applied, and the conversion is shown. π ≈ 3.14159.
- **Impossible inputs** are rejected: negatives, zero, non-numbers, triangle inequality, trapezoid legs, and prism bases whose
  area is too large for the perimeter.
- **Storage failures:** if storage is disabled the app works in memory and says progress won't be saved; malformed records
  are skipped and reported; unreadable data is never overwritten until the user presses *Start fresh* (a backup is kept).
- **Reset progress** (game menu) and **Clear saved history** (progress page) both confirm before deleting — for shared computers.

## Common tasks

### Replace the PDF cheat sheet
Overwrite `public/downloads/geometry-formula-cheat-sheet.pdf` (keep the name) and rebuild. The build fails if the file is
missing or not a PDF.

### Add a formula
1. Append an entry to `FORMULAS` in `src/data/formulas.ts` with a **new, permanent** `id` (never rename IDs — saved history uses them).
   Use LaTeX in `tex`, a spoken version in `plain`, and a `calculation` with `inputs` + `compute`.
2. Add the id to its shape's `formulaIds` in `src/data/shapes.ts`.
3. Optionally add it to a level `pool` in `src/data/levels.ts`, and a contrast for common confusions in `src/lib/explain.ts`.
4. `npm test` checks the new formula renders, has unique text and is wired up correctly.

### Add a shape
Add the `ShapeId` to `types.ts`, the shape to `SHAPES`, its formulas as above, and a drawing case in
`src/components/ShapeIllustration.tsx`. The calculator, reference page and game pick it up automatically.

### Add a practice mode
Add an entry to `PRACTICE_MODES` in `src/data/levels.ts` (id, title, description, `filter`, pairs, optionCount), add the id to
`ModeId`, and an icon in `GameMenu.tsx`'s `MODE_ICON`. Add the id to `MODES` in `src/lib/history.ts` so saved sessions validate.

### Add a level
Append to `LEVELS` — the menu, "Level X of N" and Next Level button update automatically.

### Add another game to learning.hayden-gilbert.com
Build it as its own app with its own base path (e.g. `/fractions/`, using this project's `vite.config.ts` + `postbuild.mjs`
pattern), deploy it to its own folder, and link it from the root learning homepage. Use a distinct localStorage key prefix
(`fractions:...`) so progress never collides with `basic-geometry:history:v1`.

## Testing performed

- `npm test` — 42 unit tests: formula coverage (every 2D area/perimeter, circle circumference, every 3D volume + surface area,
  distinct IDs), KaTeX rendering of every formula, calculator results for every shape, cone and pyramid slant heights,
  invalid input, all area-conversion directions and the five specified examples, game engine (correct/incorrect, recovery,
  no re-matching, double-click safety, abandon), round generation for every level/mode across 200 seeds (no ambiguous rounds),
  history persistence, sessions-with-mistakes counting, reset, disabled/throwing storage, malformed and corrupt data, Practise
  My Mistakes prioritisation and variety, explanations.
- Browser end-to-end (Playwright/Chromium against the production build served under `/basic-geometry/` by a plain static
  server): 64 checks covering direct navigation to every route, a full level with a mistake, review table and explanations,
  persistence after reload, Practise My Mistakes, last-level Next Level disabled, Reset progress with cancel/confirm,
  calculator (circle, cone, mixed m/cm units, invalid inputs), converter incl. swap/clear, PDF download byte-identical to
  the supplied file, keyboard selection and focus ring, desktop/tablet/phone layouts with no horizontal scrolling, touch play,
  storage disabled, and corrupt storage recovery.

Not performed: deployment to the live server (no hosting access from the build environment), and testing with real screen
readers (semantic HTML, labels, live regions and MathML are in place).

# CLAUDE.md — learning.hayden-gilbert.com

Free, ad-free learning games for kids (and anyone). Static site on SiteGround, no backend. Progress lives only in the learner's browser (`localStorage`).

- **Homepage + Arithmetic Gang:** plain HTML/CSS/JS, **no build step, no framework, no npm**. Edit files in `public_html/` directly. Keep it that way unless Alex asks otherwise.
- **Basic Geometry:** Vite + React + TypeScript with a build step. Source in `basic-geometry/`, built output in `public_html/basic-geometry/`. See `basic-geometry/README.md`.

## Repo layout

```
public_html/          ← exactly what goes on the server (deploy the CONTENTS into SiteGround's public_html/)
  index.html, home.js, styles.css     homepage (shared site styles: navy header, white cards, blue buttons)
  favicon.svg
  basic-geometry/     Basic Geometry BUILT output (never edit by hand; rebuild from basic-geometry/), incl. hidden .htaccess
  maths/              "Meet the Arithmetic Gang" launch page + shared core + character art
    core/js/          profile.js, progress.js, facts.js, curriculum-kit.js, shell.js
    core/css/core.css shared lesson design system; per-character theme via <body class="theme-andy|susy|mandy|danny">
    assets/gang/<char>/<pose>.webp, group.webp
  addition/           Andy the Adder      (6 levels)   green  #178246
  subtraction/        Susy the Subtractor (14 levels)  purple #7c4fd6
  multiplication/     Mandy the Multiplier (7 levels + times-table check/practice) pink #c81e6c
  division/           Danny the Divisor   (10 levels)  blue   #2563eb
basic-geometry/       Basic Geometry SOURCE (Vite/React/TS, Vitest tests, own README)
geometry-2/           Geometry 2 with Geometry Gina SOURCE (Vite/React/TS, own README); built output in public_html/geometry-2/
tests/                Arithmetic Gang node unit tests + Playwright e2e
docs/                 DEPLOY.md, original specs (spec-1 Susy, spec-2 Arithmetic Gang)
design/               source mockups and pose sheets (not deployed)
```

**Basic Geometry workflow:** edit `basic-geometry/src`, then:

```
cd basic-geometry && npm install && npm test && npm run build
rm -rf ../public_html/basic-geometry && mkdir ../public_html/basic-geometry && cp -R dist/. ../public_html/basic-geometry/
```

Its storage key is `basic-geometry:history:v1`, which the homepage `home.js` reads for "Welcome back". Don't change that shape without updating `home.js`.

`learn-thai.hayden-gilbert.com` is a separate subdomain/site, not in this repo.

## How a subject is built

Each subject folder has `index.html` + `css/<subject>.css` + `js/`:

1. `engine.js`: pure arithmetic, no DOM, UMD (works in browser and `require`). Produces the **full step script**, not just the answer, and self-checks (throws on any inconsistency).
2. `curriculum.js`: levels as plain data (`short`, `sub`, `objective`, `newSkill`, `intro[]`, `examples[]`, `profiles[]`, optional `config`, `mixedFrom`), built with `ArithCurriculumKit.make({ LEVELS, candidate, solve, matches })`. The generator only returns questions where `matches(sol, profile)` is true.
3. `dialogue.js`: everything the character says: `welcome, demoStart, demoStep, prompt, afterStep, choiceWrong, hint, wrong, reveal, finish`.
4. `board.js`: renders the working from the engine's steps. **Never computes maths itself**; it only displays validated step values.
5. `start.js`: `ArithShell.start({ id, title, noun, char, storageKey, C, D, board, … })`.

**Step contract** (every engine step): `{ kind: 'entry', expected: '24', … }` (keypad) or `{ kind: 'choice', choices: [{label, correct}] }` (buttons). `guidedOnly: true` steps appear only in guided mode. `expected` is always a **string**.

**Lesson flow** (shell): Learn (demo) → Guided practice → Your turn (practice) → Mastery check. Mastery default: 5 questions, 80%, a question counts only if every step is right first time, no hints. Watching or clicking through never unlocks a level. Defaults are in `curriculum-kit.js` (`DEFAULTS`).

Number facts (3 + 4, 6 × 7, 12 ÷ 3) use `maths/core/js/facts.js` (`format: 'fact'`) and the shared fact board.

## Non-negotiables

- **Mathematical correctness of every intermediate step.** The board must never show wrong working (e.g. wrong regrouping across zeros, misaligned partial products, a remainder ≥ divisor). Add or adjust engine tests for any engine change.
- No-borrow/no-carry levels must never generate a borrow/carry question; division order is exact → remainders → decimals.
- Use the real character art. Don't redraw characters with CSS/SVG or swap in emoji.
- Touch-first: every action works on iPad/phone; keys ≥ 44px; no hover-only UI; speech bubbles must not cover the working.
- Accessibility: `aria-live` announcements, visible focus, reduced-motion respected, never colour-only feedback.
- Sound optional and muted by default.

## Current scope limits (by design)

- Danny: one-digit divisors (2–9); decimal answers must **terminate** (≤ 3 dp). No recurring decimals or rounding yet.
- Mandy: multiplier digits are non-zero (no 304 × 20 yet).
- Subtraction answers are never negative.

## Character poses

All four characters share nine poses: `waving, thinking, pointing, curious, encouraging, celebrating, cheering, reassuring, neutral` (≈320–400 px transparent WebP). To change art, replace `maths/assets/gang/<char>/<pose>.webp` with the same name. Shell falls back to `placeholder-<char>.svg` if an image fails.

## localStorage keys (don't rename; learners would lose progress)

`arithmetic:profile:v1` (shared name/sound/welcomed) · `arith-addition:progress:v1` · `subtraction-susy:progress:v1` (kept from the first Susy release) · `arith-multiplication:progress:v1` (`extra.diagnostic`, `extra.facts`) · `arith-division:progress:v1`. Stored data is sanitised on load; malformed data must never crash a page.

## Caching / versioning

Every page links CSS/JS with `?v=N`. **Bump the version on every page whenever you change a CSS or JS file**, or browsers and SiteGround will serve stale files (this already broke the homepage once). The homepage Gang card also has inline sizing so it survives a stale `styles.css`.

## Tests (run before committing)

```
for t in tests/*.test.js; do node "$t"; done          # Arithmetic Gang
(cd basic-geometry && npm test)                         # Basic Geometry (when touched)
(cd public_html && python3 -m http.server 8765 &)
python3 tests/e2e.py http://127.0.0.1:8765 /tmp/shots
```

`e2e.py` covers all four apps, launch page, homepage, persistence/reset/legacy migration, and layouts at phone, phone-landscape, iPad portrait/landscape, iPad Pro and desktop. In the cloud container Chromium is at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Measure layout boxes in a single `page.evaluate`, because the site uses smooth scrolling and separate calls give false overlaps.

## Deploy

See `docs/DEPLOY.md`. `public_html/` is now a full copy of the site: zip its contents (include hidden files like `basic-geometry/.htaccess`) and extract over the server's `public_html/`; flush SiteGround cache afterwards. Don't deploy to production without Alex's go-ahead.

## Working with Alex

- Prefers exact copy-paste terminal commands with no extra explanation, and ready-to-drop-in replacement files over manual edit instructions.
- British spelling in learner-facing text (practise/practice, colour, maths).
- New learning games follow the same pattern: own folder under `public_html/`, a card on the homepage, link back to `/`.

## Basic Geometry: notes from the build project

- **Audience:** a public resource for students, parents and teachers, not built for one child. No registration, analytics, ads, cookies or third-party requests. `localStorage` only.
- **Spec:** 26 formulas across 13 shapes. Pick a Pair game: 3 levels × 4 pairs, plus 6 practice modes, including Practise My Mistakes. Also an end-of-round review, a calculator with metric units, an area-unit converter, a formula reference and a progress dashboard. Routes: `/play`, `/calculator`, `/formulas`, `/progress`, each pre-rendered as a real `index.html` by `scripts/postbuild.mjs`. `BASE_PATH` overrides `/basic-geometry/`.
- **Reset progress is required.** Kids share one computer. There is a "Sharing this computer?" card on the Pick a Pair menu (with a confirmation dialog), plus "Clear saved history" on Progress. Keep both in any rework.
- **Notation must be unambiguous.** Alex has advanced maths credentials and pointed out that `P = 2a + 2b` is valid for a rectangle, and `4w` for a square, if the letters are undefined. So every question card shows a large labelled diagram using only that formula's letters. Feedback flags a chosen formula whose letters aren't on the diagram, and the review shows side-by-side labelled diagrams. Never show a formula whose variables aren't defined on screen.
- **Cheat sheet:** `public/downloads/geometry-formula-cheat-sheet.pdf` is Alex's own PDF. Serve it as-is; never regenerate or edit it. The homepage card labels it Grades 7–10, taken from the cheat sheet.
- **Design:** navy header with "Learning / hayden-gilbert.com" and nav Home `/` · Learn Thai (subdomain) · Math Games `/#math` · Other Games `/#all-games`. White cards and blue actions. Links live in `src/lib/paths.ts` and `src/components/Layout.tsx`.
- **`.htaccess`:** wrap any `Header` rule in `<IfModule mod_headers.c>`. An unguarded one gives a 500 on hosts without that module. Dotfiles are hidden in Finder and plain `ls`, so Alex may not see them: give the file's text when asked, and check with `unzip -l` or `ls -A`.
- **Open idea (undecided):** a multi-match mechanic, where 2–3 right-hand formula cards can match one left-hand card.

## Geometry 2 (Geometry Gina) — built

Source `geometry-2/`, output `public_html/geometry-2/`, storage key `geometry-2:history:v1` (home.js reads `skills`). Read `geometry-2/README.md` first. Workflow:

```
cd geometry-2 && npm install && npm test && npm run build
rm -rf ../public_html/geometry-2 && mkdir ../public_html/geometry-2 && cp -R dist/. ../public_html/geometry-2/
cd .. && python3 tests/serve_site.py 8766 & python3 tests/e2e_geometry2.py http://127.0.0.1:8766 /tmp/g2shots
```

- Source worksheet: `design/worksheets/geometry-2-revision-worksheet.docx`. Its numbers are used **only** for each lesson's worked example; every other question is generated fresh.
- Alex's rules from the build: every answer must be right (tests include an independent recomputation and KaTeX strict rendering); whole-number answers at warm-up/standard level; units scope is single-step mass conversions (×/÷ 1000) and small lengths (nm, μm) to metres in standard form, not general order-of-magnitude conversions; weak skills come up more often (mistakes + mixed exam weighting); the Unit converter page is wanted.
- Worksheet Q4's diagram is wrong (110° drawn where 70° must be). The app uses correct values; don't "fix" it back.
- Gina's nine poses: `waving, thinking, explaining, curious, encouraging, celebrating, cheering, reassuring, neutral` (note: `explaining`, not the Gang's `pointing`).
- Hints: once one is opened, learners can flip ← Previous / Next → through the hints they've opened (free); only "Another hint" counts as help. Alex asked for this — keep it.
- Triangle construction is tap-only and easy on purpose: the three side lengths stay pinned above the board and tick off; pick the base length, then the arc lengths from A and B; tapping within 1 cm of the crossing snaps to C (a hint ring shows after two misses); one tap joins up. No sliders.

## Adding Geometry 2 (or other React geometry games)

- Use its own folders: source in `geometry-2/` and built output in `public_html/geometry-2/`, with its own `BASE_PATH`, `.htaccess`, `404.html` and a storage key such as `geometry-2:history:v1`. Never write into `basic-geometry/` or the Arithmetic Gang folders, and never share their storage keys.
- Reuse Basic Geometry by copying from it (formula data, diagrams, Layout/header, postbuild), not by importing across folders, so each app builds on its own.
- Add a homepage card in `public_html/index.html` under the maths subject, and bump the `?v=N` versions if you touch `styles.css` or `home.js`. To show "Welcome back" for it, extend `home.js` to read the new key.
- Keep the Basic Geometry rules: labelled diagrams for every formula, Reset progress, no tracking, British spelling.

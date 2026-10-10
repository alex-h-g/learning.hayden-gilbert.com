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

# Geometry 2 with Geometry Gina

Exam-revision game at **https://learning.hayden-gilbert.com/geometry-2/**. Gina, a cartoon tutor, teaches the 12 areas of the revision worksheet (`design/worksheets/geometry-2-revision-worksheet.docx`) step by step, Socratic style: she asks, the learner answers, hints build up, and she only shows the working when it's needed.

Vite + React + TypeScript. No backend, no accounts, no tracking. Progress lives only in the browser (`localStorage`).

## Commands

```
cd geometry-2
npm install
npm run dev            # http://localhost:5173/geometry-2/
npm test               # 115 unit tests (maths, every generator, independent cross-check, KaTeX rendering)
npm run build          # type-check + build to dist/ + postbuild (route copies, 404.html, .htaccess)
rm -rf ../public_html/geometry-2 && mkdir ../public_html/geometry-2 && cp -R dist/. ../public_html/geometry-2/
```

Browser tests (from the repo root, after copying the build into `public_html/`):

```
python3 tests/serve_site.py 8766 &
python3 tests/e2e_geometry2.py http://127.0.0.1:8766 /tmp/g2shots
```

98 checks: welcome/name, worked examples answered correctly and wrongly, hints, the never-stuck reveal, the compass constructions, the cube planes, √63 and π answers, standard form, the converter, strengths/weaknesses, mistakes practice, revision guide, persistence, malformed storage, reset with confirmation, deep links and 404, a full mixed exam, and no horizontal scroll / touch targets / Gina size at phone, phone-landscape, iPad, iPad-landscape and desktop.

## Deploying under /geometry-2

`BASE_PATH` defaults to `/geometry-2/` (`vite.config.ts`). The postbuild step pre-renders every route in `scripts/routes.json` as a real `index.html` (a unit test checks the list covers every lesson and topic), writes `404.html`, and writes an Apache `.htaccess` that serves `index.html` for any other path under `/geometry-2/`. `Header` rules are wrapped in `<IfModule mod_headers.c>`. Upload the **contents** of `public_html/` (including the hidden `geometry-2/.htaccess`) over the server's `public_html/`, then flush the SiteGround cache. See `docs/DEPLOY.md`.

## Structure

```
src/math/core.ts        every formula and calculation (angles, Pythagoras, circles, compound, exact decimals, prefixes, standard form, construction geometry)
src/math/cube.ts        cube planes; proves the 9 symmetry planes by reflecting all 8 corners
src/math/parse.ts       reads typed answers: 64,800 · 7.94 · 3√7 · sqrt(63) · 48 + 8π · units
src/math/validate.ts    marking: exact, rounded (stated tolerance), standard form, exact decimals
src/content/lessons/    the 22 lessons (6 topics): intro slides, worksheet worked example, generator, revision-guide text
src/content/types.ts    Problem / Step / Diagram types
src/components/         Gina, ProblemRunner (steps, hints, feedback, poses), Layout, Rich (text + $maths$)
src/diagrams/           Diagram.tsx (all 2D figures), Cube3D.tsx (rotatable cube), Construction.tsx (compass boards)
src/lib/store.ts        localStorage (key geometry-2:history:v1), sanitised on load, in-memory fallback
src/lib/progress.ts     outcomes, confidence, status, weak/strong skills, weighting, stars, badges
src/lib/fresh.ts        no-repeat guard (recent question wording, per browser tab)
src/pages/              Home (welcome + dashboard), Topic, Lesson, Practice (exam / mistakes / topic), Progress, Guide, Reference, Converter
public/gina/            the nine poses (transparent WebP)
```

## How a lesson works

Learn (Gina's slides) → Worked example (the worksheet's numbers, every step, hints free, not scored) → Practice (3 new questions, adaptive: simpler after a struggle, harder after two clean answers) → Mastery check (4 new questions; passes at 3/4 right first time with no hints) → Review. Stages can be visited in any order; prerequisites are recommended, never enforced.

Each question is a list of steps (`choice`, `multi`, `number`, `decimal`, `sf`, `widget`). Steps marked `guidedOnly` appear only in the worked example, so practice and mastery ask fewer, bigger steps. Hints: 1 concept, 2 next operation, 3 explicit step, then "Show me the working". After 2 wrong tries a hint appears automatically; after 3 Gina shows the working and the next question is easier. Empty or unreadable input never counts as an attempt.

## Correctness rules (don't break these)

- **Answers are computed from the question data by `src/math/core.ts`.** Generators never hard-code answers; validators use the same values.
- Generators self-check and throw on inconsistency.
- `npm test` runs every generator 600 times, feeds each expected answer back through the marker, and recomputes every final answer **independently** (coordinate geometry, numerical integration, plain arithmetic) in `src/content/independent.test.ts`.
- Every `$…$` fragment of every generated question is rendered by KaTeX in strict mode (`render.test.ts`); a mistyped `\t` in `\times` fails the build.
- Whole-number answers at warm-up and standard difficulty; π answers are whole multiples of π with whole-number radii; surds (like worksheet 7b, √63) only at stretch level.
- Worksheet scope for units: mass conversions are single ×/÷ 1000 steps; standard form uses small lengths (nm, μm) in metres.

**Worksheet Q4 note:** the original diagram labels ∠QRT as 110°, which is impossible with 70° at S (it must be 70°, corresponding angles); 110° is the interior angle QRS. The app uses the diagram's layout with correct values: x = ∠QRS = 110°, y = ∠QRT = 70°.

## Adding things

- **New question variety:** edit the lesson's `generate(rng, difficulty)`; compute answers with `src/math/core.ts`. Run `npm test`.
- **New lesson:** add a `LessonDef` in `src/content/lessons/`, export it in that file's list, add its id to `TOPICS` (automatic via the list) and `scripts/routes.json` (`lesson/<id>`), and add independent checks.
- **Gina art:** replace `public/gina/gina-<pose>.webp` (waving, thinking, explaining, curious, encouraging, celebrating, cheering, reassuring, neutral). `design/pose-sheets/crop-gina.py` re-crops a 3×3 transparent sheet: `python3 design/pose-sheets/crop-gina.py sheet.png outdir`. The postbuild fails if a pose is missing.

## Progress storage

Key `geometry-2:history:v1`: `{ name, welcomed, stars, badges[], skills{ attempted, firstTry, afterHelp, revealed, wrongAttempts, hints, recent[], last, wrong[] }, lessons{ opened, introSeen, guidedDone, practiceDone, masteryBest, masteryPassed }, examBest, examsDone, lastLesson }`. The homepage `home.js` reads `skills` for "Welcome back" — keep that shape. Recent question wording (no-repeat guard) is in `sessionStorage` only.

## Troubleshooting

- **Blank page or 404 on refresh:** `.htaccess` missing (dotfile) or `mod_rewrite` off. Route copies still make the main pages load.
- **Old version after deploy:** flush SiteGround cache; `index.html` is sent `no-cache`, assets are hashed.
- **"Progress can't be saved":** private mode / storage blocked. The app still works for the visit.

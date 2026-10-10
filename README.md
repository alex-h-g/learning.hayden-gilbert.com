# learning.hayden-gilbert.com

Free, ad-free learning games. Static HTML/CSS/JS hosted on SiteGround; no build step, no backend, progress stays in the learner's browser.

## Layout

| Path | What it is |
|---|---|
| `public_html/` | Everything that goes on the server (upload the contents of this folder to SiteGround's `public_html/`). |
| `public_html/maths/` | **Meet the Arithmetic Gang** launch page, shared lesson engine (`maths/core/`) and all character art (`maths/assets/gang/`). |
| `public_html/addition/` | Andy the Adder: 6 levels, carrying. |
| `public_html/subtraction/` | Susy the Subtractor: 14 levels, borrowing across zeros. |
| `public_html/multiplication/` | Mandy the Multiplier: times-table check & practice, 7 levels of long multiplication. |
| `public_html/division/` | Danny the Divisor: 10 levels, long division, remainders, decimals. |
| `public_html/basic-geometry/` | **Basic Geometry** — built output (do not edit by hand). Pick a Pair, calculator, formula reference, progress, cheat-sheet PDF, `.htaccess`. |
| `basic-geometry/` | Basic Geometry **source** (Vite + React + TypeScript). Has its own README and tests. |
| `tests/` | Engine, curriculum and browser tests. |
| `docs/` | `DEPLOY.md` plus the two original build specs. |
| `design/` | Original mockups and character pose sheets (source artwork). |

> Note: `favicon.svg` (site root) lives on the server but isn't in this repo yet.

## Basic Geometry

Unlike the other games, Basic Geometry has a build step. Edit `basic-geometry/`, then rebuild and copy the output into `public_html/basic-geometry/`:

```
cd basic-geometry
npm install
npm test
npm run build
rm -rf ../public_html/basic-geometry && mkdir ../public_html/basic-geometry && cp -R dist/. ../public_html/basic-geometry/
```

Upload `public_html/basic-geometry/` (including the hidden `.htaccess`) to SiteGround's `public_html/basic-geometry/`.

## Each subject

`js/engine.js` (pure arithmetic, step by step) → `js/curriculum.js` (levels as data + validated question generator) → `js/dialogue.js` (what the character says) → `js/board.js` (renders the working) → `js/start.js` (plugs into `maths/core/js/shell.js`).

## Tests

```
for t in tests/*.test.js; do node "$t"; done
(cd public_html && python3 -m http.server 8765 &)
python3 tests/e2e.py http://127.0.0.1:8765 /tmp
```

## Deploy

See [docs/DEPLOY.md](docs/DEPLOY.md).

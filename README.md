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
| `tests/` | Engine, curriculum and browser tests. |
| `docs/` | `DEPLOY.md` plus the two original build specs. |
| `design/` | Original mockups and character pose sheets (source artwork). |

> Note: `public_html/` currently holds the homepage and the Arithmetic Gang. Basic Geometry (`/basic-geometry/`) and `favicon.svg` live on the server but aren't in this repo yet. Add them from SiteGround so the repo becomes a full copy of the site.

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

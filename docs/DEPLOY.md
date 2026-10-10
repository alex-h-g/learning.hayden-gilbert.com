# The Arithmetic Gang — deploy to learning.hayden-gilbert.com (SiteGround)

Static HTML/CSS/JS. No build step, no server code, no external services, no accounts.

## What's in `arithmetic-gang-deploy.zip` (paths relative to `public_html/`)

| Path | Status |
|---|---|
| `index.html` | **Replaces** homepage. Math section now leads with the Arithmetic Gang card (group art + four "Let's …!" buttons). Geometry and Learn Thai unchanged. Nav + footer link to `/maths/`. |
| `home.js` | **Replaces**. "Welcome back" summarises Andy/Susy/Mandy/Danny and Basic Geometry. |
| `styles.css` | **Replaces**. Only additions: `.art-gang`, `.tag-gang`, `.gang-btn`, card spacing. |
| `maths/` | **New**. Launch page "Meet the Arithmetic Gang" (`/maths/`), shared core (`maths/core/`), all character art (`maths/assets/gang/`). |
| `addition/` | **New**. Andy the Adder, 6 levels. |
| `subtraction/` | **Replaces** the earlier Susy build. Same 14 levels, now on the shared core. Existing learners keep their progress (same storage key) and their name carries over. |
| `multiplication/` | **New**. Mandy: 3-question times-table check, times-table practice, 7 levels of written/long multiplication. |
| `division/` | **New**. Danny: 10 levels, sharing → exact → long division → remainders → decimals. |

## Steps

1. In Site Tools → File Manager, download a backup of `index.html`, `home.js`, `styles.css` and the `subtraction/` folder.
2. **Delete the old `subtraction/` folder** (the new one has a different layout; leftover `subtraction/assets/` and `subtraction/css/susy.css` are no longer used).
3. Upload `arithmetic-gang-deploy.zip` to `public_html/` and Extract, overwriting.
4. Check: `/maths/`, `/addition/`, `/subtraction/`, `/multiplication/`, `/division/`, and the homepage.
5. Flush SiteGround's cache (Speed → Caching → Flush) so the new `styles.css` and `home.js` are served.

No `.htaccess` changes needed.

## Tests (in `arithmetic-gang-source.zip`)

```
node tests/engine.test.js        # Susy's subtraction engine (+ exhaustive 0–999)
node tests/curriculum.test.js    # Susy's 14 levels
node tests/engines.test.js       # Andy, Mandy, Danny engines (+ exhaustive sweeps)
node tests/curricula.test.js     # Andy/Mandy/Danny levels, diagnostic, unlock/mastery rules
(cd public_html && python3 -m http.server 8765 &)   # serve the site
python3 tests/e2e.py http://127.0.0.1:8765 /tmp   # 197 browser checks, phone → iPad → desktop
```

## Tuning

- Question counts and pass mark: `DEFAULTS` in `maths/core/js/curriculum-kit.js` (guided 3, practice 5, mastery 5, 80%). Any level can override with `config`.
- Levels: each subject's `js/curriculum.js` (plain data: examples + profiles).
- What each character says: each subject's `js/dialogue.js`.
- Character art: `maths/assets/gang/<name>/<pose>.webp` (waving, thinking, pointing, curious, encouraging, celebrating, cheering, reassuring, neutral).
- Storage keys: `arithmetic:profile:v1` (name, sound), `arith-addition:progress:v1`, `subtraction-susy:progress:v1`, `arith-multiplication:progress:v1`, `arith-division:progress:v1`.

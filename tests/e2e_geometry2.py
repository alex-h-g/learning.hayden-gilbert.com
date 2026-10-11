"""Browser walkthrough of Geometry 2 (served from public_html at /geometry-2/).

Usage:  python3 tests/serve_site.py 8765 &      # static server with the .htaccess fallback
        python3 tests/e2e_geometry2.py http://127.0.0.1:8765 /tmp/g2shots
"""
import math, os, sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://127.0.0.1:8765'
SHOTS = sys.argv[2] if len(sys.argv) > 2 else '/tmp/g2shots'
CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
os.makedirs(SHOTS, exist_ok=True)
APP = BASE + '/geometry-2'
results = []

def ok(name, cond, detail=''):
    results.append((name, bool(cond), detail))
    print(('PASS ' if cond else 'FAIL ') + name + (f' — {detail}' if detail and not cond else ''))

def bubble(p):
    return p.locator('.runner-gina .bubble').inner_text()

def click_option(p, text):
    p.locator('.option', has_text=text).first.click()

def check(p):
    p.get_by_role('button', name='Check', exact=True).click()

def next_step(p):
    p.locator('.question-card .step-actions .btn-lg').click()

def type_answer(p, value):
    p.locator('.answer-input input').fill(str(value))
    check(p)

def set_range(p, value):
    p.locator('input[type=range]').evaluate(
        "(el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, String(v)); el.dispatchEvent(new Event('input', {bubbles: true})); }", value)

def no_hscroll(p):
    return p.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')

def finish_by_struggling(p, max_steps=30):
    """Answer every step wrongly three times so Gina shows the working (tests the never-stuck path)."""
    for _ in range(max_steps):
        if p.locator('.summary').count():
            return True
        if p.locator('.question-card .step-actions .btn-lg').count():
            next_step(p); continue
        box = p.locator('.step-box')
        if box.locator('.option').count():
            opts = box.locator('.option')
            # choose a wrong option if one is identifiable: try each until wrong feedback appears
            for i in range(opts.count()):
                opts.nth(i).click(); check(p)
                if p.locator('.fb-bad').count() or p.locator('.question-card .step-actions .btn-lg').count():
                    break
            continue
        if box.locator('.sf-row').count():
            box.locator('.sf-box input').fill('9.9'); box.locator('.sf-exp input').fill('99'); check(p); continue
        if box.locator('.answer-input input').count():
            type_answer(p, '987654'); continue
        return False
    return p.locator('.summary').count() > 0

def demo_walk(p, tag, reduced=False, touch=False):
    """Walks the whole 'Why Pythagoras works' demonstration and the transfer questions."""
    press = (lambda loc: loc.tap()) if touch else (lambda loc: loc.click())
    btn = lambda name, exact=False: p.get_by_role('button', name=name, exact=exact)
    nxt = lambda: press(btn('Next →'))
    p.goto(APP + '/lesson/pythagoras-why')
    ok(f'{tag}: demo opens with the formula', p.locator('.demo-card .big-formula').count() == 1 and 'discover' in bubble(p))
    ok(f'{tag}: Gina starts in her explaining pose', p.locator('img[src$="gina-explaining.webp"]').count() == 1)
    nxt()
    ok(f'{tag}: hypotenuse question hides the letters', p.locator('.dside-pill', has_text='c =').count() == 0)
    ok(f'{tag}: Next is locked until the hypotenuse is found', btn('Next →').is_disabled())
    press(btn('Side 3'))
    ok(f'{tag}: wrong side gets the right-angle hint', 'opposite' in bubble(p) and p.locator('.fb-bad').count() == 1)
    press(btn('Side 5'))
    ok(f'{tag}: hypotenuse found, labels a, b, c shown', p.locator('.dside-pill', has_text='c = 5').count() == 1 and p.locator('img[src$="gina-celebrating.webp"]').count() == 1)
    nxt()
    press(p.locator('.option', has_text='thirty-two'))
    press(btn('Check', True))
    ok(f'{tag}: squared misconception explained', 'digit' in p.locator('.feedback').inner_text())
    press(p.locator('.option').nth(1)); press(btn('Check', True))
    ok(f'{tag}: 3² shown as 9 tiles', p.locator('.sq-grid').nth(0).locator('rect').count() == 9)
    press(btn('Show 4² →')); press(btn('Show 5² →'))
    ok(f'{tag}: 4² = 16 tiles and 5² = 25 tiles', p.locator('.sq-grid').nth(1).locator('rect').count() == 16 and p.locator('.sq-grid').nth(2).locator('rect').count() == 25)
    nxt()
    cells = [p.locator(f'[data-square={x}] .dcell').count() for x in 'abc']
    ok(f'{tag}: squares on the triangle have 9, 16, 25 cells', cells == [9, 16, 25], str(cells))
    nxt()
    ok(f'{tag}: sum box waits until both squares are counted', p.locator('.answer-input input').count() == 0)
    press(btn('Blue square (side 3)'))
    ok(f'{tag}: blue square counted 3 × 3 = 9', '3 × 3 = 9' in p.locator('.demo-counter').first.inner_text())
    press(btn('Orange square (side 4)'))
    ok(f'{tag}: orange square counted 4 × 4 = 16', '4 × 4 = 16' in p.locator('.demo-counter').first.inner_text())
    p.locator('.answer-input input').fill('20'); press(btn('Check', True))
    ok(f'{tag}: wrong total gets Gina’s nudge', 'put them together' in bubble(p))
    p.locator('.answer-input input').fill('25'); press(btn('Check', True))
    ok(f'{tag}: 9 + 16 = 25 accepted', p.locator('.fb-ok').count() == 1)
    nxt()
    neutral = p.locator('[data-square=c] .dcell.neutral').count()
    ok(f'{tag}: green square starts as 25 empty cells', neutral == 25, str(neutral))
    ok(f'{tag}: Next locked before the animation', btn('Next →').is_disabled())

    def run_to_end():
        if reduced:
            for _ in range(10):
                if p.locator('.demo-caption.done').count(): break
                press(btn('Next step →'))
        else:
            p.wait_for_selector('.demo-caption.done', timeout=20000)

    def tile_state():
        return p.evaluate("""() => { const t=[...document.querySelectorAll('[data-tile]')];
          return {n:t.length, blue:t.filter(x=>x.dataset.colour==='blue'&&x.dataset.arrived==='yes').length,
                  orange:t.filter(x=>x.dataset.colour==='orange'&&x.dataset.arrived==='yes').length,
                  targets:new Set(t.map(x=>x.dataset.target)).size} }""")
    press(btn('Let’s put the squares together'))
    mid = tile_state()
    ok(f'{tag}: animation shows exactly 25 tiles', mid['n'] == 25, str(mid))
    if reduced:
        ok(f'{tag}: reduced motion uses step buttons, no timers', btn('Next step →').count() == 1)
    run_to_end()
    st = tile_state()
    ok(f'{tag}: green square ends with 9 blue + 16 orange, every cell used once', st == {'n': 25, 'blue': 9, 'orange': 16, 'targets': 25}, str(st))
    ok(f'{tag}: result shows 9 + 16 = 25 and 3² + 4² = 5²', p.locator('.demo-result .katex').count() >= 2 and 'twenty-five' in bubble(p))
    if not reduced:
        press(btn('Replay the animation'))
        ok(f'{tag}: replay never duplicates tiles', tile_state()['n'] == 25)
        run_to_end()
        ok(f'{tag}: replay ends in the same correct state', tile_state() == st)
    press(btn('Reset the demonstration to the start'))
    ok(f'{tag}: reset clears the tiles', tile_state()['n'] == 0 and btn('Let’s put the squares together').count() == 1)
    press(btn('Let’s put the squares together')); run_to_end()
    p.locator('.demo-toggle input').check()
    press(btn('Green square (c²)'))
    p.wait_for_function("document.querySelectorAll('.dcount').length === 25", timeout=15000)
    ok(f'{tag}: counting mode numbers all 25 cells', p.locator('.dcount').count() == 25 and '25' in p.locator('.demo-counter').inner_text())
    on_top = p.evaluate("() => { const l=document.querySelector('.dcount-layer'); const t=[...document.querySelectorAll('[data-tile]')].pop(); return !!l && !!t && (t.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; }")
    ok(f'{tag}: count numbers are drawn above the tiles', on_top)
    ok(f'{tag}: no horizontal scroll on the demo', no_hscroll(p))
    p.screenshot(path=f'{SHOTS}/{tag}-demo-done.png', full_page=True)
    nxt()
    press(p.locator('.option', has_text='always equal')); press(btn('Check', True))
    ok(f'{tag}: wrong discovery gets the 9 and 16 hint', 'nine blue' in bubble(p))
    press(p.locator('.option', has_text='add up')); press(btn('Check', True))
    ok(f'{tag}: discovery accepted, formula shown', p.locator('.big-formula').count() == 1)
    nxt()
    for _ in range(3): press(btn('Next line →'))
    ok(f'{tag}: formula steps to 25 = 25', p.locator('.formula-steps li').count() == 4 and 'every' in bubble(p))
    press(btn('Now try a new triangle →'))
    ok(f'{tag}: transfer question is 5-12-13', '$5$' not in p.locator('.q-text').inner_text() and '5' in p.locator('.q-text').inner_text() and '12' in p.locator('.q-text').inner_text() and 'new triangle' in p.locator('.stage-note').inner_text())
    press(p.locator('.option').filter(has_text='c^2').filter(has_text='5^2 + 12^2').first) if False else None
    for i in range(p.locator('.option').count()):
        press(p.locator('.option').nth(i)); press(btn('Check', True))
        if p.locator('.question-card .step-actions .btn-lg').count(): break
    press(p.locator('.question-card .step-actions .btn-lg'))
    for v in [25, 144, 169, 13]:
        p.locator('.answer-input input').fill(str(v)); press(btn('Check', True)); press(p.locator('.question-card .step-actions .btn-lg'))
    ok(f'{tag}: second example is the missing side (3, 5 → b)', 'hypotenuse' in p.locator('.q-text').inner_text() and 'shorter side' in p.locator('.q-text').inner_text())
    for _ in range(2):
        for i in range(p.locator('.option').count()):
            press(p.locator('.option').nth(i)); press(btn('Check', True))
            if p.locator('.question-card .step-actions .btn-lg').count(): break
        press(p.locator('.question-card .step-actions .btn-lg'))
    p.locator('.answer-input input').fill('16'); press(btn('Check', True)); press(p.locator('.question-card .step-actions .btn-lg'))
    p.locator('.answer-input input').fill('4'); press(btn('Check', True))
    ok(f'{tag}: b = 4 connects back to the 3-4-5 triangle', 'same' in bubble(p))
    press(p.locator('.question-card .step-actions .btn-lg'))
    ok(f'{tag}: practice questions follow', 'Practice: question 1 of 3' in p.content())
    d = p.evaluate("JSON.parse(localStorage.getItem('geometry-2:history:v1'))")
    demo = d['demos']['pythagoras-squares']
    ok(f'{tag}: demo progress recorded', demo['completed'] and demo['hypotenuse'] == 'help' and demo['squaresUnderstood'] and demo['discoveryCorrect'] and demo['transferDone'] and demo['hints'] >= 4, str(demo))
    ok(f'{tag}: watching the demo is not mastery', not d['lessons']['pythagoras-why']['masteryPassed'] and 'pythagoras-why' not in d['skills'])
    ok(f'{tag}: Square Seer badge earned', any(b['id'] == 'square-seer' for b in d['badges']))


with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME)
    ctx = browser.new_context(viewport={'width': 1366, 'height': 900})
    p = ctx.new_page()
    errors = []
    p.on('pageerror', lambda e: errors.append(str(e)))
    p.on('console', lambda m: errors.append(m.text + ' @ ' + str(m.location.get('url'))) if m.type == 'error' and 'does-not-exist' not in str(m.location.get('url')) else None)

    # ── Welcome ──
    p.goto(APP + '/')
    ok('welcome shows Gina waving', p.locator('img[src$="gina-waving.webp"]').count() > 0)
    ok('welcome asks for a name', 'What should I call you?' in p.content())
    p.get_by_label('Your first name or a nickname').fill('Sam')
    p.get_by_role('button', name='Let’s go! →').click()
    ok('dashboard greets by name', 'Lovely to meet you, Sam' in p.locator('.dash-hero').inner_text())
    ok('six topic cards + exam + progress', p.locator('.topic-card').count() == 8)
    p.screenshot(path=f'{SHOTS}/desktop-dashboard.png', full_page=True)
    ok('all 9 poses load', p.evaluate("""async () => { const poses=['waving','thinking','explaining','curious','encouraging','celebrating','cheering','reassuring','neutral']; const r = await Promise.all(poses.map(x => fetch('gina/gina-'+x+'.webp').then(r=>r.ok))); return r.every(Boolean); }"""))

    # ── Lesson 1: worksheet octagon, answered correctly ──
    p.goto(APP + '/lesson/interior-sum')
    ok('lesson opens on Learn stage', p.locator('.slide-card').count() == 1)
    for _ in range(3): p.get_by_role('button', name='Next →').click()
    p.get_by_role('button', name='Let’s try one together →').click()
    ok('guided example starts without the answer shown', '1080' not in p.locator('.question-card').inner_text().split('Show that')[0] and p.locator('.summary').count() == 0)
    type_answer(p, 8); next_step(p)
    type_answer(p, 6); next_step(p)
    click_option(p, '(8 - 2)'); check(p); next_step(p)
    # wrong first, then hint, then right
    type_answer(p, 1440)
    ok('wrong answer gets reassurance', p.locator('img[src$="gina-reassuring.webp"]').count() == 1 and p.locator('.fb-bad').count() == 1)
    p.locator('.btn-hint').click()
    ok('hint shows thinking pose', p.locator('img[src$="gina-thinking.webp"]').count() == 1 and 'Hint 1 of 3' in bubble(p))
    h1 = p.locator('.hint-text').inner_text()
    p.get_by_role('button', name='Another hint →').click()
    ok('second hint opens', 'Hint 2 of 3' in p.locator('.hint-label').inner_text())
    p.get_by_role('button', name='← Previous hint').click()
    ok('can go back to hint 1', p.locator('.hint-text').inner_text() == h1 and 'Hint 1 of 3' in bubble(p))
    p.get_by_role('button', name='Next hint →').click()
    ok('and forward again to hint 2', 'Hint 2 of 3' in p.locator('.hint-label').inner_text())
    ok('flipping back and forth doesn’t open new hints', p.get_by_role('button', name='Another hint →').count() == 1 and 'Hint 2 of 3' in p.locator('.hint-label').inner_text())
    type_answer(p, 1080)
    ok('worksheet 1080° accepted', p.locator('.summary').count() == 1 and '1080' in p.locator('.summary').inner_text())
    ok('celebrates the solved question', p.locator('img[src$="gina-celebrating.webp"]').count() == 1)
    p.screenshot(path=f'{SHOTS}/desktop-octagon-done.png', full_page=True)
    next_step(p)
    ok('practice follows the worked example', 'Practice: question 1 of 3' in p.content())
    q1 = p.locator('.q-text').inner_text()
    # empty input must not count
    check(p)
    ok('empty answer is not marked wrong', p.locator('.fb-bad').count() == 0 and 'first' in p.locator('.feedback').inner_text().lower())
    ok('struggling leads to the worked answer (never stuck)', finish_by_struggling(p))
    ok('revealed question uses the reassuring pose', p.locator('img[src$="gina-reassuring.webp"]').count() == 1)
    next_step(p)
    q2 = p.locator('.q-text').inner_text()
    ok('next practice question is new', q1 != q2, f'{q1!r} vs {q2!r}')

    # ── Compound shape: the full Socratic walkthrough with worksheet numbers ──
    p.goto(APP + '/lesson/compound')
    p.get_by_role('button', name='Worked example').click()
    click_option(p, 'A full circle'); click_option(p, 'A rectangle'); check(p)
    ok('full circle gets the “only half” explanation', 'half' in p.locator('.feedback').inner_text().lower())
    click_option(p, 'A full circle'); click_option(p, 'A semicircle'); check(p); next_step(p)
    click_option(p, 'Rectangle width'); check(p)
    ok('partial selection is encouraged, not penalised', p.locator('.fb-info').count() == 1)
    click_option(p, 'Rectangle height'); click_option(p, 'Semicircle diameter')
    ok('selected measurement is highlighted on diagram', p.locator('.q-diagram .hl-line').count() >= 1)
    check(p); next_step(p)
    click_option(p, 'Circumference'); check(p)
    ok('circumference distractor explained', 'around' in p.locator('.feedback').inner_text().lower())
    click_option(p, 'Circumference'); click_option(p, 'Area of a rectangle'); click_option(p, 'Area of a semicircle'); check(p); next_step(p)
    click_option(p, 'Divide by 2'); check(p); next_step(p)
    type_answer(p, 4); next_step(p)
    click_option(p, 'l \\times w') if False else p.locator('.option').filter(has_text='×').first.click()
    check(p)
    if p.locator('.fb-bad').count():  # pick the l × w option precisely
        for i in range(p.locator('.option').count()):
            p.locator('.option').nth(i).click(); check(p)
            if p.locator('.question-card .step-actions .btn-lg').count(): break
    next_step(p)
    type_answer(p, 48); next_step(p)
    type_answer(p, '8π')
    ok('8π accepted for the semicircle', p.locator('.fb-ok').count() == 1)
    next_step(p)
    click_option(p, 'Add the two areas'); check(p); next_step(p)
    type_answer(p, '73.13')
    summ = p.locator('.summary').inner_text()
    ok('compound total 48 + 8π ≈ 73.13 accepted', '73.13' in summ)
    ok('summary explains the dashed internal line', 'dashed line' in p.locator('.runner-gina').inner_text())
    p.screenshot(path=f'{SHOTS}/desktop-compound-done.png', full_page=True)

    # ── Construction: triangle 5, 8, 9 on the drawing board (tap-only) ──
    p.goto(APP + '/lesson/construct-triangle')
    p.get_by_role('button', name='Worked example').click()
    chips = p.locator('.target-sides').inner_text()
    ok('side lengths pinned above the board', '5 cm' in chips and '8 cm' in chips and '9 cm' in chips)
    p.locator('.construct-controls button', has_text='5 cm').click()
    ok('non-longest base is explained', 'longest' in bubble(p))
    p.locator('.construct-controls button', has_text='9 cm').click()
    ok('side lengths still shown after first step', '9 cm' in p.locator('.target-sides').inner_text() and p.locator('.ts-chip.used').count() == 1)
    p.locator('.construct-controls button', has_text='5 cm').click()
    p.locator('.construct-controls button', has_text='5 cm').click()
    ok('reusing the same length from B is caught', 'other length' in bubble(p))
    p.locator('.construct-controls button', has_text='8 cm').click()
    ok('both arcs drawn and labelled', p.locator('.c-arc').count() == 2 and p.locator('.c-arc-label').count() == 2)
    board = p.locator('svg.board'); box = board.bounding_box()
    board.click(position={'x': 2 / 15 * box['width'], 'y': 2 / 11 * box['height']})
    board.click(position={'x': 2 / 15 * box['width'], 'y': 2 / 11 * box['height']})
    ok('hint ring appears after missing twice', p.locator('.c-hint-ring').count() == 1)
    A = (3.0, 9.6); ax = (25 - 64 + 81) / 18; C = (A[0] + ax, A[1] - math.sqrt(25 - ax * ax))
    board.click(position={'x': (C[0] + 0.6) / 15 * box['width'], 'y': (C[1] + 0.5) / 11 * box['height']})  # near enough → snaps
    ok('tap near the crossing snaps to C', 'third corner' in bubble(p))
    p.get_by_role('button', name='Join C to A and to B').click()
    ok('triangle construction completes with all sides labelled', p.locator('.working li').count() >= 1 and p.locator('.c-measure').count() == 3)
    ok('all three lengths ticked', p.locator('.ts-chip.used').count() == 3)
    p.screenshot(path=f'{SHOTS}/desktop-construction.png', full_page=True)

    # ── Perpendicular bisector ──
    p.goto(APP + '/lesson/perp-bisector')
    p.get_by_role('button', name='Worked example').click()
    set_range(p, 4); p.get_by_role('button', name='Draw arcs from A').click()
    ok('too-small compass width explained', 'can’t meet' in bubble(p))
    set_range(p, 6); p.get_by_role('button', name='Draw arcs from A').click()
    set_range(p, 5.5); p.get_by_role('button', name='Draw arcs from B').click()
    ok('changed compass width is caught', 'same width' in bubble(p))
    set_range(p, 6); p.get_by_role('button', name='Draw arcs from B').click()
    board = p.locator('svg.board'); box = board.bounding_box()
    Ax = 3.0; Y = 5.5; h = math.sqrt(36 - 4.5 ** 2)
    for yy, label in [(Y - h, 'Mark top crossing'), (Y + h, 'Mark bottom crossing')]:
        board.click(position={'x': (Ax + 4.5) / 15 * box['width'], 'y': yy / 11 * box['height']})
        p.get_by_role('button', name=label).click()
        print('   bisector:', label, '→', bubble(p)[:80])
    p.get_by_role('button', name='Draw line through both points').click()
    ok('bisector drawn with right-angle mark', p.locator('.c-right').count() == 1, bubble(p))
    next_step(p); type_answer(p, 4.5)
    ok('AM = 4.5 cm accepted', p.locator('.fb-ok').count() == 1)

    # ── Cube planes explorer ──
    p.goto(APP + '/lesson/cube-symmetry')
    p.get_by_role('button', name='Next →').click()
    caps = set()
    for _ in range(9):
        caps.add(p.locator('.cube-explore p').inner_text()); p.get_by_role('button', name='Next plane').click()
    ok('explorer cycles through 9 distinct planes', len(caps) == 9, str(len(caps)))

    # ── Pythagoras worksheet 7b: √63 accepted exactly and as 7.94 ──
    p.goto(APP + '/lesson/find-short')
    p.get_by_role('button', name='Worked example').click()
    click_option(p, '20'); check(p); next_step(p)
    p.locator('.option').filter(has_text='a^2 + 16^2').first.click() if p.locator('.option').filter(has_text='a^2 + 16^2').count() else None
    check(p)
    if not p.locator('.question-card .step-actions .btn-lg').count():
        for i in range(p.locator('.option').count()):
            p.locator('.option').nth(i).click(); check(p)
            if p.locator('.question-card .step-actions .btn-lg').count(): break
    next_step(p); type_answer(p, 144); next_step(p); type_answer(p, 12)
    next_step(p)  # on to worked example 2
    click_option(p, '12'); check(p); next_step(p)
    for i in range(p.locator('.option').count()):
        p.locator('.option').nth(i).click(); check(p)
        if p.locator('.question-card .step-actions .btn-lg').count(): break
    next_step(p); type_answer(p, 63); next_step(p); type_answer(p, '3√7')
    ok('3√7 accepted for worksheet 7b', '7.94' in p.locator('.summary').inner_text())

    # ── Standard form 350 nm ──
    p.goto(APP + '/lesson/units-sf')
    p.get_by_role('button', name='Worked example').click()
    p.locator('.option').filter(has_text='-9').first.click(); check(p); next_step(p)
    p.locator('.sf-box input').fill('35'); p.locator('.sf-exp input').fill('1'); check(p)
    ok('35 × 10¹ flagged: coefficient must be < 10', 'less than 10' in p.locator('.feedback').inner_text())
    p.locator('.sf-box input').fill('3.5'); p.locator('.sf-exp input').fill('2'); check(p); next_step(p)
    type_answer(p, -7); next_step(p)
    p.locator('.sf-box input').fill('3.5'); p.locator('.sf-exp input').fill('−7'); check(p)
    ok('3.5 × 10⁻⁷ m accepted', p.locator('.summary').count() == 1)

    # ── Converter ──
    p.goto(APP + '/converter')
    ok('converter: 64.8 t = 64,800 kg', '64,800 kg' in p.locator('.converter-answer').inner_text())
    p.get_by_role('button', name='Length').click()
    ok('converter: 350 nm in standard form', '0.00000035 m' in p.locator('.converter-answer').inner_text() and p.locator('.converter-result .katex').count() >= 1)

    # ── Progress, mistakes, guide, persistence ──
    p.goto(APP + '/progress')
    ok('progress shows strengths and needs-practice', 'Your strengths' in p.content() and 'Needs more practice' in p.content())
    ok('a struggled skill is listed for practice', 'Sum of interior angles' in p.locator('.sw-weak').inner_text())
    p.goto(APP + '/practice?mode=mistakes')
    ok('practise my mistakes targets weak skill', 'Sum of interior angles' in p.locator('.runner-gina').inner_text())
    p.goto(APP + '/guide')
    ok('revision guide is personalised', 'Sam’s Revision Guide' in p.content() and p.locator('.guide-item').count() >= 1)
    ok('guide has print/PDF button', p.get_by_role('button', name='🖨 Print or save as PDF').count() == 1)
    p.reload()
    ok('progress persists after reload', 'Sam’s Revision Guide' in p.content())
    stored = p.evaluate("JSON.parse(localStorage.getItem('geometry-2:history:v1'))")
    ok('storage records attempts, hints and wrong answers', stored['skills']['interior-sum']['attempted'] >= 1 and stored['skills']['interior-sum']['wrongAttempts'] >= 3 and stored['skills']['interior-sum']['hints'] >= 1)
    p.evaluate("localStorage.setItem('geometry-2:history:v1', '{\"skills\": 5, \"name\": [1]}')")
    p.goto(APP + '/progress')
    ok('malformed storage does not crash', p.locator('h1').inner_text() == 'My Progress')
    p.evaluate("localStorage.setItem('geometry-2:history:v1', JSON.stringify(%s))" % __import__('json').dumps(__import__('json').dumps(stored)))
    p.goto(APP + '/progress')
    p.get_by_role('button', name='↺ Delete saved progress').click()
    ok('reset asks for confirmation', p.locator('dialog[open]').count() == 1)
    p.get_by_role('button', name='Cancel').click()
    ok('cancel keeps progress', p.evaluate("localStorage.getItem('geometry-2:history:v1') !== null"))
    p.get_by_role('button', name='↺ Delete saved progress').click()
    p.get_by_role('button', name='Yes, delete it').click()
    p.goto(APP + '/')
    ok('after reset the welcome screen returns', 'What should I call you?' in p.content())

    # ── Direct navigation / deep links / 404 ──
    for path in ['/lesson/compound', '/topic/pythagoras', '/practice?mode=exam', '/reference', '/guide', '/converter']:
        r = p.goto(APP + path)
        ok(f'direct load {path}', r.status == 200 and p.locator('#root *').count() > 5)
    p.goto(APP + '/lesson/does-not-exist')
    ok('unknown lesson shows friendly not-found', 'can’t find that page' in p.content())

    # ── Mixed exam: 10 questions, all topics ──
    p.goto(APP + '/practice?mode=exam')
    p.get_by_role('button', name='Start').click()
    titles = set()
    for i in range(10):
        titles.add(p.locator('.set-head em').inner_text())
        ok_done = finish_by_struggling(p)
        if not ok_done: ok(f'exam question {i+1} completes', False); break
        next_step(p)
    ok('mixed exam covers many lessons', len(titles) >= 6, str(titles))
    ok('exam results page', 'results' in p.locator('h1').inner_text())

    # ── Why Pythagoras works: the squares demonstration ──
    demo_walk(p, 'desktop')
    p.goto(APP + '/progress')
    ok('progress page shows the demonstration record', 'Why Pythagoras works' in p.content() and 'Worked out 9 + 16 = 25' in p.content())
    p.goto(APP + '/lesson/pythagoras-why?stage=learn')
    ok('“see why it works again” link opens the demo', p.locator('.demo-card').count() == 1)
    p.goto(APP + '/lesson/find-hyp')
    p.get_by_role('button', name='Worked example').click()
    ok('existing Pythagoras lessons still open', 'hypotenuse' in p.locator('.q-text').inner_text())
    rctx = browser.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce', has_touch=True, is_mobile=True)
    rp = rctx.new_page()
    rp.on('pageerror', lambda e: errors.append(str(e)))
    rp.goto(APP + '/'); rp.get_by_role('button', name='Continue without a name').tap()
    demo_walk(rp, 'phone-reduced-motion', reduced=True, touch=True)
    rctx.close()

    # ── Layouts ──
    sizes = {'phone': (390, 844), 'phone-landscape': (844, 390), 'ipad': (820, 1180), 'ipad-landscape': (1180, 820), 'desktop': (1366, 900)}
    for name, (w, h) in sizes.items():
        p.set_viewport_size({'width': w, 'height': h})
        for path in ['/', '/lesson/compound', '/lesson/construct-triangle', '/progress', '/converter', '/reference']:
            p.goto(APP + path)
            if path.startswith('/lesson'):
                p.get_by_role('button', name='Worked example').click()
            ok(f'{name} {path}: no horizontal scroll', no_hscroll(p))
        p.goto(APP + '/lesson/compound'); p.get_by_role('button', name='Worked example').click()
        g = p.evaluate("""() => { const g = document.querySelector('.runner-gina img').getBoundingClientRect(); return {h: g.height, vh: innerHeight}; }""")
        ok(f'{name}: Gina doesn’t take over the screen', g['h'] < g['vh'] * 0.45, str(g))
        small = p.evaluate("""() => [...document.querySelectorAll('.question-card button, .question-card input')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < 42; }).length""")
        ok(f'{name}: touch targets ≥ 42px', small == 0, str(small))
        p.screenshot(path=f'{SHOTS}/{name}-compound.png', full_page=True)
        p.goto(APP + '/'); p.screenshot(path=f'{SHOTS}/{name}-home.png', full_page=True)

    ok('no console or page errors', not errors, '; '.join(errors[:5]))
    browser.close()

failed = [r for r in results if not r[1]]
print(f'\n{len(results) - len(failed)}/{len(results)} checks passed')
sys.exit(1 if failed else 0)

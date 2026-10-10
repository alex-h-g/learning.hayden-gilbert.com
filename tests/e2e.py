"""End-to-end browser tests for the Arithmetic Gang.
Serve the site root, then:  python3 tests/e2e.py http://127.0.0.1:8765 /path/for/screenshots
"""
import sys, re
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765'
SHOTS = sys.argv[2] if len(sys.argv) > 2 else '.'
CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
results, errors = [], []
APPS = [('addition', 'andy', 6), ('subtraction', 'susy', 14), ('multiplication', 'mandy', 7), ('division', 'danny', 10)]

def ok(name, cond, detail=''):
    results.append((name, bool(cond)))
    print(('PASS ' if cond else 'FAIL ') + name + ((' — ' + str(detail)) if detail and not cond else ''))

def state(p):
    return p.evaluate("""()=>{const a=window.__arith,S=a.S; if(!S||a.screen!=='lesson') return {screen:a.screen};
      const q=S.q, st=q&&!q.done?q.sol.steps[q.si]:null;
      return {screen:a.screen, demo:!!S.demo, inter:!!S.inter, done:!!(q&&q.done), mastery:!!(q&&q.mastery), guided:!!(q&&q.guided),
        st: st && {kind:st.kind, type:st.type, expected:st.expected, choices:st.choices}, si:q?q.si:null}}""")

def answer(p, st, keyboard):
    if st['kind'] == 'choice':
        i = [c['correct'] for c in st['choices']].index(True)
        p.locator(f'.bubble-actions button[data-i="{i}"]').click(); return
    for ch in st['expected']:
        if keyboard: p.keyboard.press(ch)
        else: p.locator(f'.key[data-d="{ch}"]').click()
    if keyboard: p.keyboard.press('Enter')
    else: p.locator('.key-done').click()

def play(p, keyboard=False, wrong_mastery=0, limit=1500):
    """Play until we leave the lesson screen. wrong_mastery: number of mastery questions to slip on once."""
    slipped_q = set(); left = wrong_mastery
    for _ in range(limit):
        s = state(p)
        if s['screen'] != 'lesson': return s
        if s['demo'] or s['inter'] or s['done']:
            p.locator('.bubble-actions button').first.click(); continue
        st = s['st']
        if s['mastery'] and left > 0 and st['kind'] == 'entry':
            qi = p.evaluate('window.__arith.S.qi')
            if qi not in slipped_q:
                slipped_q.add(qi); left -= 1
                bad = str((int(st['expected'][-1]) + 1) % 10) if st['expected'][-1].isdigit() else '1'
                p.keyboard.press(bad); p.keyboard.press('Enter'); continue
        answer(p, st, keyboard)
    raise RuntimeError('play() did not finish')

def no_hscroll(p): return p.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
def overlap(a, b): return not (a['x'] + a['width'] <= b['x'] or b['x'] + b['width'] <= a['x'] or a['y'] + a['height'] <= b['y'] or b['y'] + b['height'] <= a['y'])

with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=CHROME)
    ctx = br.new_context(viewport={'width': 1280, 'height': 900})
    p = ctx.new_page()
    p.on('pageerror', lambda e: errors.append(str(e)))
    p.on('console', lambda m: m.type == 'error' and 'favicon' not in (m.location or {}).get('url', '') and errors.append(m.text))

    # ── Launch page ──
    p.goto(BASE + '/maths/')
    ok('launch: heading', 'Meet the' in p.locator('h1').inner_text() and 'Arithmetic Gang' in p.locator('h1').inner_text())
    ok('launch: group image loads', p.evaluate("(()=>{const i=document.querySelector('.gang-group img'); return i.complete && i.naturalWidth>0})()"))
    ok('launch: four cards with real artwork', p.locator('.gang-card').count() == 4 and p.evaluate("[...document.querySelectorAll('.gc-art img')].every(i=>i.naturalWidth>0 && /gang\\/(andy|susy|mandy|danny)\\//.test(i.src))"))
    ok('launch: no progress shown for a new learner', p.locator('#gang-progress').is_hidden())
    for (app, who, n), label in zip(APPS, ['Let’s Add!', 'Let’s Subtract!', 'Let’s Multiply!', 'Let’s Divide!']):
        ok(f'launch: {label} links to /{app}/', p.get_by_role('link', name=label).get_attribute('href') == f'/{app}/')

    # ── Each app: welcome, shared name, level 1 lesson with keypad, locked level 2 ──
    for idx, (app, who, nlev) in enumerate(APPS):
        p.goto(f'{BASE}/{app}/')
        if idx == 0:
            ok(f'{app}: welcome screen', p.locator('.welcome').is_visible())
            p.fill('#learner-name', 'Alex'); p.get_by_role('button', name='Let’s Go!').click()
        else:
            ok(f'{app}: name shared from profile', p.locator('#learner-name').input_value() == 'Alex')
            p.get_by_role('button', name='Let’s Go!').click()
        if app == 'multiplication':
            ok('mandy: asks “Do you know your times tables?”', 'Do you know your times tables?' in p.locator('.bubble').inner_text())
            ok('mandy: both choices offered', p.get_by_role('button', name='Yes, let’s go!').count() == 1 and p.get_by_role('button', name='Not yet. I need some practice.').count() == 1)
            p.get_by_role('button', name='Not yet. I need some practice.').click()
            p.locator('.bubble-actions button').first.click()
            qs = []
            for k in range(3):
                q = p.evaluate("(()=>{const s=window.__arith.S.q.sol; return [s.a,s.b,s.answer]})()"); qs.append(q)
                ans = str(q[2]) if k != 1 else str(q[2] + 1)  # get one wrong
                for ch in ans: p.keyboard.press(ch)
                p.keyboard.press('Enter')
                p.locator('.bubble-actions button').first.click()
            ok('mandy: diagnostic has exactly 3 questions, factors 1–9, no repeats', len(qs) == 3 and all(1 <= a <= 9 and 1 <= b <= 9 for a, b, _ in qs) and len({(min(a, b), max(a, b)) for a, b, _ in qs}) == 3, qs)
            summary = p.locator('.bubble').inner_text()
            ok('mandy: summary says 2 out of 3', '2 out of 3' in summary, summary)
            p.get_by_role('button', name='Practise my times tables').click()
            ok('mandy: times-table page', p.locator('.table-chip').count() == 9)
            p.locator('.table-chip').nth(6).click()  # 7 times table
            first = p.evaluate("(()=>{const s=window.__arith.S.q.sol; return [s.a,s.b]})()")
            ok('mandy: 7× drill uses the 7 times table', 7 in first)
            # answer all 10, getting the first wrong twice to trigger retry
            for k in range(10):
                s = p.evaluate("(()=>{const q=window.__arith.S.q; return q.sol.answer})()")
                if k == 0:
                    p.keyboard.press('1'); p.keyboard.press('Enter')
                    ok('mandy: drill wrong answer gives supportive feedback', bool(re.search(r'Not quite|typed|close|Nearly', p.locator('.tutor .bubble').inner_text())))
                for ch in str(s): p.keyboard.press(ch)
                p.keyboard.press('Enter')
                p.locator('.bubble-actions button').first.click()
            ok('mandy: offers to retry missed facts', p.get_by_role('button', name=re.compile('Try (it|them) again')).count() == 1)
            p.get_by_role('button', name=re.compile('Try (it|them) again')).click()
            ok('mandy: retry drill contains the missed fact', p.evaluate("window.__arith.S.queue.length") == 1)
            p.evaluate("window.__arith.go('hub')")
        ok(f'{app}: {nlev} level cards', p.locator('.level-card').count() == nlev)
        ok(f'{app}: level 2 locked', p.locator('.level-card').nth(1).get_attribute('aria-disabled') == 'true')
        p.locator('.level-card').first.click()
        p.get_by_role('button', name='Start the lesson').click()
        ok(f'{app}: lesson starts with Learn', state(p)['demo'])
        p.locator('.bubble-actions button').first.click()
        p.get_by_role('button', name='Next →').click()
        p.get_by_role('button', name='← Back').click()
        while state(p)['demo']: p.locator('.bubble-actions button').first.click()
        s = state(p)
        ok(f'{app}: guided practice follows', s['guided'])
        if s['st']['kind'] == 'entry':
            wrong = str((int(s['st']['expected'][-1]) + 3) % 10)
            p.locator(f'.key[data-d="{wrong}"]').click(); p.locator('.key-done').click()
            ok(f'{app}: wrong answer → supportive feedback, same step', state(p)['si'] == s['si'] and len(p.locator('.tutor .bubble').inner_text()) > 10)
            p.locator('.key[data-d="5"]').click(); p.locator('.key-back').click(); p.locator('.key-done').click()
            ok(f'{app}: empty Done does not get stuck', 'Type a number' in p.locator('.tutor .bubble').inner_text())
        end = play(p, keyboard=(idx % 2 == 1))
        ok(f'{app}: level 1 complete → result screen', end['screen'] == 'result' and p.locator('.big-title').count() == 1)
        p.screenshot(path=f'{SHOTS}/{app}-complete.png')
        ok(f'{app}: level 2 unlocked after mastery', p.evaluate('window.__arith.P.isUnlocked(2)'))

    # ── Level 2 failing then passing mastery (Andy) ──
    p.goto(f'{BASE}/addition/')
    p.evaluate("window.__arith.startSession(2,'lesson')")
    end = play(p, keyboard=True, wrong_mastery=2)
    ok('andy: slips on 2 of 5 mastery questions → not passed', end['screen'] == 'result' and p.locator('.big-title').count() == 0)
    ok('andy: level 3 still locked', not p.evaluate('window.__arith.P.isUnlocked(3)'))
    p.get_by_role('button', name='Practise a bit more, then try again').click()
    play(p, keyboard=True, wrong_mastery=1)
    ok('andy: 4/5 passes', p.locator('.big-title').count() == 1 and p.evaluate('window.__arith.P.isUnlocked(3)'))

    # ── Hints, show-me and replay (Susy level 4, independent practice) ──
    p.goto(f'{BASE}/subtraction/')
    p.evaluate("()=>{const P=window.__arith.P; for(let i=1;i<=3;i++){P.markPhase(i,'learned');P.recordMastery(i,5,5);} P.markPhase(4,'learned'); window.__arith.startSession(4,'practice')}")
    p.locator('.bubble-actions button').first.click()
    p.get_by_role('button', name='Hint', exact=True).click()
    ok('susy: hint shown', len(p.locator('.tutor .bubble').inner_text()) > 10)
    p.get_by_role('button', name='Another hint').click(); p.get_by_role('button', name='Show me').click()
    ok('susy: show me advances', state(p)['si'] > 0)
    p.get_by_role('button', name='Replay lesson').click()
    ok('susy: replay opens demo', state(p)['demo'])
    while state(p)['demo']: p.locator('.bubble-actions button').first.click()
    ok('susy: back to the same question after replay', not state(p)['demo'] and state(p)['si'] > 0)

    # ── Specific working checks ──
    def setup(app, level, expr, guided=True):
        p.goto(f'{BASE}/{app}/')
        p.evaluate(f"""()=>{{const A=window.__arith; A.P.markPhase({level},'learned'); A.startSession({level},'lesson'); const S=A.S; S.demo=null; S.pi=1;
          const sol={expr}; sol.profile=S.level.profiles[0]; S.queue=[{{sol:sol,guided:{str(guided).lower()}}}]; S.qi=0;
          S.inter={{msg:{{pose:'neutral',text:'go'}},actions:[['begin','Go']]}}; A.go('lesson');}}""")
        p.locator('.bubble-actions button').first.click()
    def run_all():
        for _ in range(80):
            s = state(p)
            if s['done']: break
            answer(p, s['st'], True)
    setup('subtraction', 9, 'SusyEngine.solve(402,187)')
    run_all()
    w = [p.locator('.board .cell.working').nth(i).inner_text().split() for i in range(3)]
    ok('susy: 402−187 working 3 | 10 9 | 12', w == [['3'], ['10', '9'], ['12']], w)
    setup('multiplication', 4, 'MandyEngine.solve(23,12)')
    for _ in range(3): answer(p, state(p)['st'], True)  # 6, 4, then the placeholder 0
    ok('mandy: placeholder 0 shown in second row', p.locator('.slot.zero-ph').count() == 1)
    run_all()
    rows = p.evaluate("[...document.querySelectorAll('.mult-board .row-note')].map(e=>e.textContent).filter(Boolean)")
    ok('mandy: rows labelled 23 × 2 = 46 and 23 × 10 = 230', any('23 × 2 = 46' in r for r in rows) and any('23 × 10 = 230' in r for r in rows), rows)
    ok('mandy: total 276', 'equals' in p.locator('.tutor .bubble').inner_text() or '276' in p.locator('.tutor .bubble').inner_text())
    p.screenshot(path=f'{SHOTS}/mandy-23x12.png')
    setup('division', 5, "DannyEngine.solve(408,4,'exact')")
    run_all()
    q = p.evaluate("[...document.querySelectorAll('.div-board .qd')].map(e=>e.textContent).join('')")
    ok('danny: 408 ÷ 4 shows quotient 102 including the 0', q == '102', q)
    setup('division', 6, "DannyEngine.solve(29,8,'remainder')")
    run_all()
    ok('danny: 29 ÷ 8 shows r 5', 'r 5' in p.locator('.div-board .rem-tag').inner_text())
    setup('division', 8, "DannyEngine.solve(7,2,'decimal')")
    run_all()
    q = p.evaluate("[...document.querySelectorAll('.div-board .q')].map(e=>e.textContent).join('')")
    ok('danny: 7 ÷ 2 shows 3.5', q.replace(' ', '') == '3.5', q)
    setup('division', 6, "DannyEngine.solve(29,8,'remainder')")
    for _ in range(4): answer(p, state(p)['st'], True)  # tooSmall, quotient, product, subtract → remainder step
    p.keyboard.press('9'); p.keyboard.press('Enter')
    ok('danny: remainder ≥ divisor explained', 'smaller than 8' in p.locator('.tutor .bubble').inner_text())

    # ── Persistence, shared name and reset ──
    p.reload()
    ok('progress persists after refresh', p.evaluate('window.__arith.P.level(1).mastered'))
    p.evaluate("window.__arith.go('progress')")
    p.fill('#nm', 'Sam'); p.get_by_role('button', name='Save name').click()
    p.goto(f'{BASE}/addition/'); p.evaluate("window.__arith.go('hub')")
    ok('renamed learner shared across apps', 'Sam' in p.locator('.tutor-card').inner_text())
    p.evaluate("window.__arith.go('progress')")
    p.get_by_role('button', name=re.compile('Reset my addition progress')).click()
    p.get_by_role('button', name=re.compile('Yes, reset')).click()
    ok('reset clears only Andy', p.evaluate('window.__arith.P.totals().mastered') == 0)
    p.goto(f'{BASE}/subtraction/')
    ok('…and leaves Susy alone', p.evaluate('window.__arith.P.level(1).mastered'))
    # malformed storage
    p.evaluate("localStorage.setItem('arith-division:progress:v1','{oops'); localStorage.setItem('arithmetic:profile:v1','[1,2')")
    p.goto(f'{BASE}/division/')
    ok('malformed storage handled', p.locator('.welcome, .hub').count() == 1)
    # legacy Susy data (from the first release) migrates name
    p.evaluate("localStorage.clear(); localStorage.setItem('subtraction-susy:progress:v1', JSON.stringify({v:1,name:'Old',sound:false,welcomed:true,current:3,levels:{'1':{mastered:true,learned:true,practised:true,attempts:9,correct:9},'2':{mastered:true}}}))")
    p.goto(f'{BASE}/subtraction/')
    ok('legacy Susy progress kept and name migrated', p.locator('.hub').count() == 1 and 'Old' in p.locator('.tutor-card').inner_text() and p.evaluate('window.__arith.P.isUnlocked(3)'))

    # ── Launch page and homepage show progress ──
    p.evaluate("()=>{const s=JSON.parse(localStorage.getItem('arith-multiplication:progress:v1')||'null');}")
    p.goto(f'{BASE}/maths/')
    ok('launch: progress overview appears after playing', p.locator('#gang-progress').is_visible() and 'Susy' in p.locator('#gang-progress').inner_text())
    ok('launch: untried subjects not shown', 'Danny' not in p.locator('#gang-progress').inner_text())
    p.goto(f'{BASE}/')
    ok('homepage: Gang card present', p.locator('text=Meet the Arithmetic Gang').count() >= 1)
    ok('homepage: Geometry & Thai still listed', p.locator('text=Basic Geometry').count() >= 1 and p.locator('text=Learn Thai').count() >= 1)
    ok('homepage: welcome back mentions the Gang', p.locator('#continue').is_visible() and 'Arithmetic Gang' in p.locator('#continue').inner_text())

    # ── Responsive: phone, tablet portrait/landscape, desktop ──
    p.evaluate("localStorage.setItem('arithmetic:profile:v1', JSON.stringify({v:1,name:'Alex',sound:false,welcomed:{addition:1,subtraction:1,multiplication:1,division:1}}))")
    SIZES = [(375, 740, 'phone'), (320, 640, 'small-phone'), (768, 1024, 'ipad-portrait'), (1024, 768, 'ipad-landscape'), (820, 1180, 'ipad-air-portrait'), (1180, 820, 'ipad-air-landscape'), (1366, 1024, 'ipad-pro-landscape'), (1280, 900, 'desktop'), (740, 375, 'phone-landscape')]
    HARD = {'addition': ('AndyEngine.solve([4875,3268])', 5), 'subtraction': ('SusyEngine.solve(7002,3487)', 13), 'multiplication': ('MandyEngine.solve(346,127)', 6), 'division': ("DannyEngine.solve(891,4,'decimal')", 9)}
    for w, h, tag in SIZES:
        p.set_viewport_size({'width': w, 'height': h})
        p.goto(f'{BASE}/maths/'); ok(f'{tag}: launch page no sideways scroll', no_hscroll(p))
        if tag in ('phone', 'ipad-portrait', 'desktop'): p.screenshot(path=f'{SHOTS}/launch-{tag}.png', full_page=True)
        for app, (expr, lvl) in HARD.items():
            setup(app, lvl, expr)
            for _ in range(4):
                s = state(p)
                if not s['done']: answer(p, s['st'], True)
            p.wait_for_timeout(450)
            boxes = p.evaluate("""(()=>{const r=s=>{const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return {x:b.x,y:b.y,width:b.width,height:b.height}};
              return [r('.board'), r('.tutor .bubble'), r('.keypad')]})()""")
            bd, bub, kp = boxes
            board_fits = p.evaluate("(()=>{const b=document.querySelector('.board'); return b.scrollWidth <= b.clientWidth + 2})()")
            ok(f'{tag} {app}: no sideways scroll, board fits', no_hscroll(p) and board_fits)
            ok(f'{tag} {app}: bubble and keypad clear of the working', not overlap(bd, bub) and (kp is None or not overlap(bd, kp)))
            key = p.locator('.key').first.bounding_box()
            ok(f'{tag} {app}: keys ≥ 44px', key['height'] >= 44 and key['width'] >= 44, key)
            if tag in ('phone', 'ipad-portrait', 'ipad-landscape', 'desktop'): p.screenshot(path=f'{SHOTS}/{tag}-{app}.png')

    ok('no console errors', not errors, errors[:5])
    br.close()

failed = [r for r in results if not r[1]]
print(f'\n{len(results) - len(failed)}/{len(results)} checks passed')
sys.exit(1 if failed else 0)

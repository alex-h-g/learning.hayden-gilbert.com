"""Browser tests for Mandy's Times Tables (/multiplication/times-tables/).
Serve the site root, then:  python3 tests/e2e_times_tables.py http://127.0.0.1:8765 /path/for/screenshots

speechSynthesis is replaced with a recorder (headless Chromium has no voices), so the tests can check
exactly what Mandy says, which voice/pitch is used, that lines never overlap, and that only Chant Along speaks.
"""
import sys, os, re, time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765'
SHOTS = sys.argv[2] if len(sys.argv) > 2 else '.'
CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
URL = BASE + '/multiplication/times-tables/'
KEY = 'mandy-times-tables:v1'
os.makedirs(SHOTS, exist_ok=True)
results, errors, external = [], [], []

def ok(name, cond, detail=''):
    results.append((name, bool(cond)))
    print(('PASS ' if cond else 'FAIL ') + name + ((' — ' + str(detail)) if detail and not cond else ''))

SPEECH_MOCK = """(() => {
  const log = []; let speaking = null; let overlaps = 0;
  const voices = [
    {name:'Daniel', lang:'en-GB', localService:true, voiceURI:'Daniel'},
    {name:'Google UK English Female', lang:'en-GB', localService:false, voiceURI:'Google UK English Female'},
    {name:'Thomas', lang:'fr-FR', localService:true, voiceURI:'Thomas'}];
  window.__speech = { log, get overlaps(){ return overlaps; }, delay: 40, cancels: 0 };
  class U { constructor(t){ this.text = t; } }
  const synth = {
    getVoices(){ return voices; },
    speak(u){ if (speaking) overlaps++; speaking = u;
      log.push({text:u.text, voice:u.voice && u.voice.name, pitch:u.pitch, rate:u.rate, at:performance.now()});
      u._t = setTimeout(() => { if (speaking === u) { speaking = null; u.onend && u.onend({}); } }, window.__speech.delay); },
    cancel(){ window.__speech.cancels++; if (speaking) { const u = speaking; clearTimeout(u._t); speaking = null; u.onerror && u.onerror({error:'interrupted'}); } },
    pause(){}, resume(){}, get speaking(){ return !!speaking; }, addEventListener(){}
  };
  Object.defineProperty(window, 'speechSynthesis', {value: synth, configurable: true});
  window.SpeechSynthesisUtterance = U;
})();"""

def ev(p, js): return p.evaluate(js)
def shot(pg, path): pg.wait_for_timeout(400); pg.screenshot(path=path, full_page=True)
def screen(p): return ev(p, 'window.__tt.V.screen')
def spoken(p): return ev(p, 'window.__speech.log.map(x=>x.text)')
def no_hscroll(p): return ev(p, 'document.documentElement.scrollWidth <= innerWidth + 1')

def wait_screen(p, name, timeout=5):
    end = time.time() + timeout
    while time.time() < end:
        if screen(p) == name: return True
        p.wait_for_timeout(50)
    return False

def enter_name(p, name, use_enter=True):
    p.fill('#tt-name', name)
    if use_enter: p.press('#tt-name', 'Enter')
    else: p.click('.tt-name-form button[type=submit]')

def game_state(p):
    return ev(p, """()=>{const g=window.__tt.V.game; if(!g) return null; const q=g.round.current();
      return q && {a:q.a,b:q.b,answer:q.answer,solved:q.solved,tries:q.tries,choices:q.choices.map(c=>({v:c.value,c:c.correct,d:c.disabled})),index:g.round.index,total:g.round.total}}""")

def play_round(p, plan, max_a=None, max_b=None, check=None):
    """plan[i] = taps to reach the right answer for question i (1 = first time)."""
    seen_pos, info = set(), []
    for i, tries in enumerate(plan):
        assert wait_screen(p, 'game'), 'not on game screen'
        s = game_state(p)
        btns = p.locator('.tt-answer')
        vals = [int(x) for x in btns.locator('span:last-child').all_inner_texts()]
        info.append((s, vals))
        seen_pos.add([c['c'] for c in s['choices']].index(True))
        if check: check(s, vals)
        wrong = [k for k, c in enumerate(s['choices']) if not c['c']]
        for k in range(tries - 1):
            btns.nth(wrong[k]).click()
        right = [c['c'] for c in s['choices']].index(True)
        btns.nth(right).click()
        p.wait_for_timeout(60)
        p.locator('[data-action="next-q"]').click()  # skip the 1.6 s pause
    return seen_pos, info

with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=CHROME)
    ctx = br.new_context(viewport={'width': 1280, 'height': 900})
    ctx.add_init_script(SPEECH_MOCK)
    host = urlparse(BASE).hostname
    ctx.on('request', lambda r: urlparse(r.url).hostname not in (host, None) and not r.url.startswith('data:') and external.append(r.url))
    p = ctx.new_page()
    p.on('pageerror', lambda e: errors.append(str(e)))
    p.on('console', lambda m: m.type == 'error' and errors.append(m.text))

    # seed unrelated apps' data, which must never be touched
    p.goto(BASE + '/')
    ev(p, """()=>{localStorage.setItem('arith-multiplication:progress:v1','{"v":1,"current":3,"levels":{},"extra":{}}');
      localStorage.setItem('unrelated-app','keep me'); localStorage.setItem('arithmetic:profile:v1','{"v":1,"name":"Gang Kid","sound":false,"welcomed":{}}');}""")
    before_other = ev(p, "[localStorage.getItem('arith-multiplication:progress:v1'), localStorage.getItem('unrelated-app'), localStorage.getItem('arithmetic:profile:v1')]")

    # ── welcome ──
    p.goto(URL)
    ok('new student sees welcome', screen(p) == 'welcome')
    ok('welcome uses Mandy art', p.locator('img[src*="/gang/mandy/waving.webp"]').count() >= 1)
    ok('welcome message', 'I’m Mandy, and I’m here to help you learn your multiplication tables. What’s your name?' in p.inner_text('main'))
    ok('name box prefilled from the Gang name', p.input_value('#tt-name') == 'Gang Kid')
    for bad in ['', '    ']:
        p.fill('#tt-name', bad); p.press('#tt-name', 'Enter')
        ok(f'empty name rejected ({bad!r})', screen(p) == 'welcome' and 'Please type your name first.' in p.inner_text('.tt-error'))
    ok('no profile created for empty names', ev(p, 'window.__tt.S.students().length') == 0)
    enter_name(p, '   Alex   ')
    ok('Enter key starts', screen(p) == 'menu')
    ok('greets by trimmed name', 'Hello, Alex. It’s lovely to see you. Are you ready to practise your multiplication tables with me?' in p.inner_text('main'))
    ok('active student visible', 'Practising as Alex' in re.sub(r'\s+', ' ', p.inner_text('.tt-studentbar')))
    ok('three modes on the menu', p.locator('.tt-mode').count() == 3 and all(t in p.inner_text('.tt-modes') for t in ['Chant Along', 'Flashcards', 'Play the Game']))
    shot(p, f'{SHOTS}/tt-menu-desktop.png')
    alex1 = ev(p, 'window.__tt.S.activeId')

    # ── Chant Along ──
    p.click('[data-action="chant"]')
    ok('chant screen', screen(p) == 'chant')
    ok('name kept across modes', 'Alex' in p.inner_text('.tt-studentbar'))
    for n in [1, 3, 10]:
        p.click(f'[data-action="chant-table"][data-n="{n}"]')
        lines = [re.sub(r'\s+', ' ', x).strip() for x in p.locator('.tt-chant-line').all_inner_texts()]
        ok(f'chant table {n} listed and correct', lines == [f'{n} × {k} = {n * k}' for k in range(1, 11)], lines[:3])
    p.click('[data-action="chant-table"][data-n="3"]')
    ev(p, 'window.__speech.log.length = 0')
    p.click('[data-k="play"]')
    p.wait_for_timeout(250)
    ok('first line highlighted while speaking', ev(p, "document.querySelector('.tt-chant-line.is-now')?.dataset.i") == '0')
    p.wait_for_function('window.__tt.V.chant.line >= 2', timeout=8000)
    cur = ev(p, 'window.__tt.V.chant.line')
    ok('highlight follows speech', ev(p, f"document.querySelector('.tt-chant-line.is-now')?.dataset.i") == str(cur) and spoken(p)[-1] == ev(p, f'window.__tt.TT.chantLines(3)[{cur}].spoken'))
    p.click('[data-k="pause"]')
    n_paused = len(spoken(p)); p.wait_for_timeout(1200)
    ok('pause stops speech', len(spoken(p)) == n_paused and ev(p, 'window.__tt.V.chant.state') == 'paused')
    p.click('[data-k="resume"]')
    p.wait_for_function('window.__tt.V.chant.state === "finished"', timeout=20000)
    texts = spoken(p)
    expected = ev(p, 'window.__tt.TT.chantLines(3).map(l=>l.spoken)')
    ok('chant speaks the whole table in order', [t for i, t in enumerate(texts) if i == 0 or t != texts[i - 1]] == expected, texts[:4])
    ok('spoken words: "Three times one equals three."', texts[0] == 'Three times one equals three.' and texts[-1] == 'Three times ten equals thirty.')
    log = ev(p, 'window.__speech.log')
    ok('same chosen voice every line (female, en-GB)', {x['voice'] for x in log} == {'Google UK English Female'})
    ok('high pitch', all(x['pitch'] >= 1.4 for x in log))
    ok('no overlapping speech', ev(p, 'window.__speech.overlaps') == 0)
    ev(p, 'window.__speech.log.length = 0'); p.click('[data-k="play"]')  # a clean, uninterrupted run
    p.wait_for_function('window.__tt.V.chant.state === "finished"', timeout=20000)
    log = ev(p, 'window.__speech.log')
    gaps = [log[i + 1]['at'] - log[i]['at'] for i in range(len(log) - 1)]
    ok('longer pause after the fifth line', len(gaps) >= 9 and gaps[4] > max(gaps[0:4]) + 300, [round(g) for g in gaps])
    # stop / restart / change table mid-chant
    ev(p, 'window.__speech.log.length = 0'); p.click('[data-k="play"]'); p.wait_for_timeout(700)
    p.click('[data-k="stop"]'); n_stop = len(spoken(p)); p.wait_for_timeout(1000)
    ok('stop silences the chant', len(spoken(p)) == n_stop and ev(p, 'window.__tt.V.chant.line') == -1)
    p.click('[data-k="restart"]'); p.wait_for_timeout(200)
    ok('restart begins at the top', spoken(p)[-1] == 'Three times one equals three.')
    p.wait_for_timeout(600)
    p.click('[data-action="chant-table"][data-n="7"]'); n_change = len(spoken(p)); p.wait_for_timeout(1200)
    ok('changing table cancels the old chant', len(spoken(p)) == n_change and ev(p, 'window.__tt.V.chant.state') == 'stopped')
    rate0 = ev(p, 'window.__tt.S.rate'); p.click('[data-action="faster"]'); p.click('[data-action="faster"]')
    ok('faster raises speed', ev(p, 'window.__tt.S.rate') > rate0)
    p.click('[data-action="slower"]'); p.click('[data-action="slower"]'); p.click('[data-action="slower"]')
    ok('slower lowers speed', ev(p, 'window.__tt.S.rate') < rate0)
    p.click('[data-action="voice-test"]'); p.wait_for_timeout(150)
    ok('voice test speaks', 'Mandy' in spoken(p)[-1])
    p.click('[data-k="play"]'); p.wait_for_timeout(300)
    p.click('.tt-studentbar [data-action="menu"]'); n_leave = len(spoken(p)); p.wait_for_timeout(1200)
    ok('leaving Chant Along stops speech', len(spoken(p)) == n_leave)
    p.goto(URL); p.click('[data-action="chant"]')
    ok('speed remembered after refresh', abs(ev(p, 'window.__tt.S.rate') - (rate0 - 0.1)) < 0.011)
    p.click('.tt-studentbar [data-action="menu"]')

    # ── Flashcards ──
    ev(p, 'window.__speech.log.length = 0')
    p.click('[data-action="flash"]')
    ok('flashcards screen', screen(p) == 'flash')
    p.click('[data-action="flash-table"][data-n="6"]')
    ok('answer hidden at first', p.inner_text('.tt-card-q') == '6 × 1 = ?')
    p.click('[data-k="reveal"]')
    ok('reveal shows answer', p.inner_text('.tt-card-q') == '6 × 1 = 6')
    ok('Mandy responds after reveal (no right/wrong assumed)', not re.search(r'well done|that’s right|not quite', p.inner_text('.tt-bubble').lower()))
    seq = []
    for k in range(10):
        seq.append(p.inner_text('.tt-card-q'))
        if k < 9: p.click('[data-action="flash-next"]')
    ok('sequential order', [s.split(' =')[0] for s in seq] == [f'6 × {k}' for k in range(1, 11)], seq)
    ok('no auto-advance / next hides answer', seq[1].endswith('?'))
    p.click('.tt-card'); ok('tap the card to reveal', p.inner_text('.tt-card-q') == '6 × 10 = 60')
    p.click('[data-action="flash-prev"]'); ok('previous works', p.inner_text('.tt-card-q') == '6 × 9 = ?')
    p.click('[data-action="flash-restart"]'); ok('restart goes to card 1', p.inner_text('.tt-card-q') == '6 × 1 = ?')
    orders = set()
    for _ in range(4):
        p.click('[data-action="flash-shuffle"]')
        orders.add(tuple(ev(p, 'window.__tt.V.flash.deck.map(c=>c.b)')))
    ok('shuffle mixes the cards', any(o != tuple(range(1, 11)) for o in orders) and all(sorted(o) == list(range(1, 11)) for o in orders))
    p.click('[data-action="flash-order"][data-v="random"]')
    ok('random mode', ev(p, 'window.__tt.V.flash.order') == 'random')
    ok('every card correct', ev(p, 'window.__tt.V.flash.deck.every(c=>c.answer===c.a*c.b && c.a===6)'))
    shot(p, f'{SHOTS}/tt-flash-desktop.png')
    ok('flashcards never speak', len(spoken(p)) == 0)

    # ── Game: setup with independent limits ──
    p.click('[data-action="setup"]')
    ok('setup screen', screen(p) == 'setup')
    ok('beginner default 5 × 5', ev(p, 'window.__tt.S.settings()') == {'maxA': 5, 'maxB': 5, 'count': 10, 'order': 'random'})
    p.click('[data-action="max-a"][data-n="7"]'); p.click('[data-action="max-b"][data-n="3"]')
    ok('limits stored independently', ev(p, 'window.__tt.S.settings()')['maxA'] == 7 and ev(p, 'window.__tt.S.settings()')['maxB'] == 3)
    ok('no revision before any mistakes', p.locator('[data-action="kind"][data-v="revise"]').is_disabled())
    p.click('[data-action="start-game"]')
    ok('game screen', screen(p) == 'game')
    ok('exactly three answers', p.locator('.tt-answer').count() == 3)
    ok('prompt shown as text', len(p.inner_text('.tt-bubble')) > 5)
    sizes = ev(p, "({eq: parseFloat(getComputedStyle(document.querySelector('.tt-equation')).fontSize), ans: parseFloat(getComputedStyle(document.querySelector('.tt-answer')).fontSize)})")
    ok('equation much larger than answers', sizes['eq'] >= sizes['ans'] * 1.6, sizes)
    shot(p, f'{SHOTS}/tt-game-desktop.png')

    problems = []
    def check(s, vals):
        if not (1 <= s['a'] <= 7 and 1 <= s['b'] <= 3): problems.append(f"range {s['a']}x{s['b']}")
        if len(vals) != 3 or len(set(vals)) != 3: problems.append(f'dupes {vals}')
        if sum(1 for v in vals if v == s['a'] * s['b']) != 1: problems.append(f'correct count {vals}')
        if any(v <= 0 for v in vals): problems.append(f'non-positive {vals}')
    # wrong answer handling on Q1 explicitly
    s = game_state(p); wrong = [k for k, c in enumerate(s['choices']) if not c['c']][0]
    p.locator('.tt-answer').nth(wrong).click()
    ok('wrong answer keeps the same question', game_state(p)['index'] == 0 and game_state(p)['a'] == s['a'] and game_state(p)['b'] == s['b'])
    ok('wrong answer is disabled', p.locator('.tt-answer').nth(wrong).is_disabled())
    ok('gentle correction', any(w in p.inner_text('.tt-bubble') for w in ['not quite', 'Not that one', 'Almost', 'tricky one']))
    p.locator('.tt-answer').nth(wrong).click(force=True)
    ok('disabled option cannot add attempts', game_state(p)['tries'] == 1)
    right = [c['c'] for c in s['choices']].index(True)
    p.locator('.tt-answer').nth(right).click()
    ok('correct locks the question', game_state(p)['solved'] and all(p.locator('.tt-answer').nth(k).is_disabled() for k in range(3)))
    ok('congratulates', any(w in p.inner_text('.tt-bubble') for w in ['found it', 'that’s the one', 'Well done', 'got there', 'Brilliant']))
    p.locator('.tt-answer').nth(right).click(force=True)
    ok('correct cannot be scored twice', game_state(p)['tries'] == 2)
    p.wait_for_function('window.__tt.V.game.round.index === 1', timeout=4000)
    ok('advances by itself after a short pause', True)
    plan = [1, 3, 1, 2, 1, 1, 1, 2, 1]
    pos, info = play_round(p, plan, check=check)
    ok('every question within 7 × 3, three distinct, one correct', not problems, problems[:5])
    ok('correct answer moves around', len(pos) >= 2, pos)
    ok('results screen', wait_screen(p, 'results'))
    txt = re.sub(r'\s+', ' ', p.inner_text('.tt-stats'))
    ok('summary matches actual play', '10 questions completed' in txt and '6 right on the first try' in txt and '4 needed another try' in txt, txt)
    ok('results greet by name', 'Alex' in p.inner_text('.tt-results .tt-bubble'))
    ok('facts to practise listed', p.locator('.tt-facts li').count() >= 1)
    ok('result actions present', all(p.locator(f'[data-action="{a}"]').count() for a in ['play-again', 'revise-these', 'setup', 'flash', 'change-student', 'menu']))
    ok('range overview grid 7 × 3', p.locator('.tt-overview tbody tr').count() == 7 and p.locator('.tt-overview tbody tr').first.locator('td').count() == 3)
    ok('no "strong" after a single round', p.locator('.tt-overview td.g-strong').count() == 0)
    shot(p, f'{SHOTS}/tt-results-desktop.png')
    ok('game never speaks', len(spoken(p)) == 0)

    stats = ev(p, 'window.__tt.S.facts()')
    total_seen = sum(v['seen'] for v in stats.values())
    total_wrong = sum(v['wrong'] for v in stats.values())
    ok('attempts recorded accurately', total_seen == 10 and total_wrong == 1 + 2 + 1 + 1, (total_seen, total_wrong))

    # ── revision persists across refresh, respects range ──
    p.goto(URL)
    ok('refresh keeps the active student', screen(p) == 'menu' and ev(p, 'window.__tt.S.activeId') == alex1)
    rev = ev(p, 'window.__tt.TT.revisionFacts(window.__tt.S.facts(), 7, 3).map(f=>f.key)')
    ok('mistakes remembered after refresh', len(rev) >= 1)
    p.click('[data-action="setup"]')
    ok('revise option offered with count', p.locator('[data-action="kind"][data-v="revise"]').is_enabled() and f'({len(rev)})' in p.inner_text('[data-action="kind"][data-v="revise"]'))
    p.click('[data-action="max-a"][data-n="1"]'); p.click('[data-action="max-b"][data-n="1"]')
    in_small = ev(p, 'window.__tt.TT.revisionFacts(window.__tt.S.facts(), 1, 1).length')
    ok('revision respects a smaller range', (in_small == 0) == p.locator('[data-action="kind"][data-v="revise"]').is_disabled())
    p.click('[data-action="max-a"][data-n="7"]'); p.click('[data-action="max-b"][data-n="3"]')
    p.click('[data-action="kind"][data-v="revise"]'); p.click('[data-action="start-game"]')
    keys = ev(p, 'window.__tt.V.game.round.questions().map(q=>q.key)')
    ok('revision round = flagged facts only', sorted(keys) == sorted(rev), (keys, rev))
    play_round(p, [1] * len(keys))
    ok('revision results', wait_screen(p, 'results'))
    p.click('[data-action="menu"]')

    # ── second student with the same name ──
    p.click('.tt-studentbar [data-action="change-student"]')
    ok('change student → profile list', screen(p) == 'welcome' and p.locator('.tt-profile-btn').count() == 1)
    p.click('.tt-new summary'); enter_name(p, 'alex', use_enter=False)
    ok('same name offers existing profile', 'already know someone called alex' in p.inner_text('main').lower())
    p.click('[data-action="create-anyway"]')
    alex2 = ev(p, 'window.__tt.S.activeId')
    ok('a different Alex gets a separate profile', alex2 != alex1 and ev(p, 'window.__tt.S.students().length') == 2)
    ok('second Alex starts empty', ev(p, 'Object.keys(window.__tt.S.facts()).length') == 0)
    p.click('[data-action="setup"]'); p.click('[data-action="start-game"]'); play_round(p, [2] + [1] * 9)
    p.click('[data-action="change-student"]')
    ok('both Alexes listed', p.locator('.tt-profile-btn').count() == 2)
    p.locator('.tt-profile-btn').first.click()
    ok('returning student picks profile without typing', screen(p) == 'menu' and ev(p, 'window.__tt.S.activeId') == alex1)
    ok('first Alex’s progress untouched', ev(p, 'Object.values(window.__tt.S.facts()).reduce((n,s)=>n+s.seen,0)') == total_seen + len(keys))

    # ── reset ──
    p.click('[data-action="ask-reset"]')
    ok('reset dialog appears', p.locator('.tt-dialog').count() == 1 and 'Mandy will forget the questions you have practised' in p.inner_text('.tt-dialog'))
    ok('dialog focuses Cancel', ev(p, "document.activeElement.dataset.action") == 'dlg-cancel')
    p.click('[data-action="dlg-cancel"]')
    ok('cancel keeps progress', p.locator('.tt-dialog').count() == 0 and ev(p, 'Object.keys(window.__tt.S.facts()).length') > 0)
    p.click('[data-action="ask-reset"]'); p.keyboard.press('Escape')
    ok('Escape cancels', p.locator('.tt-dialog').count() == 0 and ev(p, 'Object.keys(window.__tt.S.facts()).length') > 0)
    p.click('[data-action="ask-reset"]'); p.click('[data-action="dlg-confirm"]')
    ok('reset clears this student', ev(p, 'Object.keys(window.__tt.S.facts()).length') == 0)
    ok('other student untouched', ev(p, f"Object.keys(window.__tt.S.facts('{alex2}')).length") > 0)
    p.reload()
    ok('reset survives refresh; no auto reset on refresh for others', ev(p, 'Object.keys(window.__tt.S.facts()).length') == 0 and ev(p, f"Object.keys(window.__tt.S.facts('{alex2}')).length") > 0)
    # remove profile
    p.click('.tt-studentbar [data-action="change-student"]')
    p.locator('[data-action="ask-remove"]').nth(1).click()
    ok('remove asks for confirmation', 'deletes' in p.inner_text('.tt-dialog'))
    p.click('[data-action="dlg-cancel"]'); ok('cancel keeps profile', ev(p, 'window.__tt.S.students().length') == 2)
    p.locator('[data-action="ask-remove"]').nth(1).click(); p.click('[data-action="dlg-confirm"]')
    ok('profile removed', ev(p, 'window.__tt.S.students().length') == 1 and ev(p, f"!JSON.parse(localStorage.getItem('{KEY}')).progress['{alex2}']"))
    after_other = ev(p, "[localStorage.getItem('arith-multiplication:progress:v1'), localStorage.getItem('unrelated-app'), localStorage.getItem('arithmetic:profile:v1')]")
    ok('unrelated saved data untouched', before_other == after_other)
    ok('only one new storage key', ev(p, f"Object.keys(localStorage).filter(k=>!['arith-multiplication:progress:v1','unrelated-app','arithmetic:profile:v1','{KEY}'].includes(k))") == [])

    # malformed storage
    ev(p, f"localStorage.setItem('{KEY}', '{{not json')"); p.reload()
    ok('malformed data does not crash', screen(p) == 'welcome' and not errors, errors[-3:])

    # ── Mandy's long-multiplication hub links here, old drills still there ──
    ev(p, "localStorage.setItem('arithmetic:profile:v1', JSON.stringify({v:1,name:'Gang Kid',sound:false,welcomed:{multiplication:true}}))")
    ev(p, "localStorage.setItem('arith-multiplication:progress:v1', JSON.stringify({v:1,current:1,levels:{},extra:{diagnostic:{right:2,total:3,at:1}}}))")
    p.goto(BASE + '/multiplication/')
    ok('Mandy hub links to Times Tables', p.locator('a.tt-promo[href="/multiplication/times-tables/"]').count() == 1)
    ok('existing times-table drills kept', p.locator('[data-action="drill-table"]').count() == 9 and p.locator('.level-card').count() >= 7)

    # ── layouts ──
    sizes = [('phone', 390, 844), ('phone-landscape', 844, 390), ('ipad-portrait', 820, 1180), ('ipad-landscape', 1180, 820), ('android-tablet', 800, 1280), ('desktop', 1440, 900)]
    for name, w, h in sizes:
        c2 = br.new_context(viewport={'width': w, 'height': h}, has_touch=name != 'desktop', is_mobile=name.startswith('phone'))
        c2.add_init_script(SPEECH_MOCK)
        q = c2.new_page(); q.on('pageerror', lambda e: errors.append(str(e)))
        q.goto(URL); enter_name(q, 'Sam')
        bad = []
        for scr in ['menu', 'chant', 'flash', 'setup', 'game']:
            if scr == 'game': q.click('[data-action="start-game"]')
            elif scr != 'menu':
                if q.locator('.tt-studentbar [data-action="menu"]').count(): q.click('.tt-studentbar [data-action="menu"]')
                q.click(f'.tt-modes [data-action="{scr}"]')
            if screen(q) != scr: bad.append(f'could not reach {scr}')
            if not no_hscroll(q): bad.append(scr + ' scrolls sideways')
            shot(q, f'{SHOTS}/tt-{scr}-{name}.png')
        m = q.evaluate("""()=>{const b=[...document.querySelectorAll('.tt-answer')].map(e=>e.getBoundingClientRect());
            const eq=document.querySelector('.tt-equation').getBoundingClientRect();
            const small=[...document.querySelectorAll('button:not(.tt-card), a.btn')].filter(e=>e.offsetParent).map(e=>[e.textContent.trim().slice(0,24),Math.round(e.getBoundingClientRect().width),Math.round(e.getBoundingClientRect().height)]).filter(r=>r[2]<44||r[1]<44);
            const ov=(a,c)=>!(a.right<=c.left||c.right<=a.left||a.bottom<=c.top||c.bottom<=a.top);
            return {n:b.length, minH:Math.min(...b.map(r=>r.height)), sameRow: Math.abs(b[0].top-b[2].top)<2,
              gaps:[b[1].left-b[0].right, b[2].left-b[1].right], overlap: ov(b[0],b[1])||ov(b[1],b[2]),
              eqFits: eq.right <= innerWidth && eq.left >= 0, small}}""")
        if m['n'] != 3 or m['minH'] < 60 or not m['sameRow'] or m['overlap'] or abs(m['gaps'][0] - m['gaps'][1]) > 2: bad.append('answers ' + str(m))
        if not m['eqFits']: bad.append('equation clipped')
        if m['small']: bad.append(f"tap targets under 44px: {m['small']}")
        # results layout
        q.evaluate("""()=>{const t=window.__tt; t.V.results={summary:t.V.game.round.summary(),kind:'practise'}; t.V.results.summary.tricky=[t.TT.fact(3,4)]; t.go('results');}""")
        if not no_hscroll(q): bad.append('results scroll sideways')
        shot(q, f'{SHOTS}/tt-results-{name}.png')
        ok(f'layout {name}', not bad, bad)
        c2.close()

    ok('no requests to other sites', not external, external[:3])
    ok('no page errors', not errors, errors[:3])
    br.close()

passed = sum(1 for _, r in results if r)
print(f'\n{passed}/{len(results)} checks passed')
sys.exit(0 if passed == len(results) else 1)

"""Real HTTP/storage browser regression for the additive v16 course; no user data is accessed."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
import json

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'ci-evidence' / 'v16'
OUT.mkdir(parents=True, exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:' + str(server.server_port)
KEY = 'jcsqe-shokyu-state-v3'
passed = []
def ok(text):
    passed.append(text)
    print('PASS', text, flush=True)

def answer(page, correct=True):
    value = page.evaluate("""() => {const s=JSON.parse(localStorage.getItem('jcsqe-shokyu-state-v3'));const q=window.JCSQEApplied.current(s.profiles[s.activeProfileId]).q;return q.correct;}""")
    if not correct:
        value = (value+1)%4
    page.locator('[data-act="answer"][data-choice="'+str(value)+'"]').click()
    page.wait_for_selector('.keyword-options')

try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True)
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('dialog', lambda d: d.accept())
        page.goto(BASE+'/practice.html')
        page.wait_for_selector('#advanced-controls')
        assert page.locator('#advanced-bank').input_value() == 'advanced'
        assert page.evaluate('window.JCSQEAppliedBank.questions.length') == 156
        page.locator('#advanced-coverage > summary').click()
        assert page.locator('.advanced-table tbody tr').count() > 80
        assert page.locator('#advanced-coverage').inner_text().find('全用語') >= 0
        page.screenshot(path=str(OUT/'mobile-coverage.png'), full_page=True)
        page.locator('.advanced-table').first.scroll_into_view_if_needed()
        page.screenshot(path=str(OUT/'mobile-scope-table.png'), full_page=True)
        page.locator('#advanced-coverage > summary').click()
        ok('default stronger bank and explicit section-level coverage')
        page.locator('[data-act="start-continuous"]').click()
        assert page.locator('.keyword-options').count() == 0
        answer(page)
        assert page.locator('.keyword-options .textbook-option').count() == 4
        assert page.locator('[data-cumulative-value="answered"]').inner_text() == '1問'
        assert page.locator('[data-cumulative-value="correct"]').inner_text() == '1問'
        page.locator('.keyword-card').first.scroll_into_view_if_needed()
        page.screenshot(path=str(OUT/'mobile-explanations.png'), full_page=True)
        page.locator('[data-act="continuous-next"]').click()
        snapshot = page.evaluate("""() => {const s=JSON.parse(localStorage.getItem('jcsqe-shokyu-state-v3'));const a=s.profiles[s.activeProfileId].appliedStudy.active;return [a.questionIds[a.index],a.orders[a.questionIds[a.index]]];}""")
        page.reload()
        page.wait_for_selector('[data-act="resume"]')
        page.locator('[data-act="resume"]').click()
        after = page.evaluate("""() => {const s=JSON.parse(localStorage.getItem('jcsqe-shokyu-state-v3'));const a=s.profiles[s.activeProfileId].appliedStudy.active;return [a.questionIds[a.index],a.orders[a.questionIds[a.index]]];}""")
        assert after == snapshot
        assert page.locator('.keyword-options').count() == 0
        ok('answers, explanations, counters and exact paused resume')
        answer(page, False)
        page.locator('.nav [data-act="home"]').click()
        assert page.locator('#advanced-bank').is_disabled()
        page.get_by_role('button', name='ここまでで終了して教材を選ぶ', exact=True).click()
        page.locator('.nav [data-act="home"]').click()
        page.locator('#advanced-bank').select_option('foundation')
        page.wait_for_url('**bank=foundation')
        page.wait_for_selector('#advanced-controls')
        assert page.evaluate('window.JCSQEAppliedBank.questions.length') == 400
        assert page.locator('[data-cumulative-value="answered"]').inner_text() == '2問'
        page.locator('#advanced-bank').select_option('mixed')
        page.wait_for_url('**bank=mixed')
        page.wait_for_selector('#advanced-controls')
        assert page.evaluate('window.JCSQEAppliedBank.questions.length') == 556
        ok('old 400 and mixed 556 remain selectable without reset')
        page.goto(BASE+'/practice.html?bank=advanced&unit=3.8.1')
        page.wait_for_selector('#advanced-controls')
        assert page.evaluate("window.JCSQEAppliedBank.questions.every(q=>q.syllabusIds.includes('3.8.1'))")
        page.set_viewport_size({'width':320,'height':720})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 2')
        ok('section drill and mobile width fit')
        page.goto(BASE+'/practice.html?bank=advanced')
        page.wait_for_selector('#advanced-controls')
        page.evaluate("""() => {const key='jcsqe-shokyu-state-v3',s=JSON.parse(localStorage.getItem(key)),p=s.profiles[s.activeProfileId],E=window.JCSQEApplied;E.createSession(E.bank([window.JCSQEAdvancedBank.byId.get('H16-323')]),p,{count:1,kind:'practice',continuous:true});localStorage.setItem(key,JSON.stringify(s));}""")
        page.reload(); page.wait_for_selector('[data-act="resume"]'); page.locator('[data-act="resume"]').click()
        assert page.locator('.keyword-options').count() == 0
        answer(page)
        assert 'Failure Mode' in page.locator('.keyword-options').inner_text()
        assert 'Fault Tree Analysis' in page.locator('.keyword-options').inner_text()
        ok('correct option keywords and full abbreviation names after answering only')
        page.locator('.nav [data-act="home"]').click()
        page.get_by_role('button', name='ここまでで終了して教材を選ぶ', exact=True).click()
        page.locator('.nav [data-act="home"]').click()
        page.locator('summary').filter(has_text='強化の40問・60分演習').click()
        page.get_by_role('button', name='初見40問', exact=True).click()
        page.wait_for_selector('#exam-timer')
        assert page.locator('.cumulative-scoreboard').count() == 0
        assert page.locator('.keyword-options').count() == 0
        page.locator('[data-act="answer"]').first.click()
        assert page.locator('.keyword-options').count() == 0
        page.locator('[data-act="finish-early"]').click()
        page.wait_for_selector('.result-item')
        assert page.locator('.result-item').count() == 40
        ok('strong 40-question timed practice never reveals answers before submission')
        old = browser.new_context(viewport={'width':390,'height':844})
        op = old.new_page(); op.on('dialog', lambda d: d.accept())
        # Let the initial service-worker activation/reload finish before seeding an old profile.
        op.goto(BASE+'/index.html?legacy=1')
        op.wait_for_function('!!navigator.serviceWorker.controller', timeout=30000)
        op.wait_for_function("!!document.querySelector('main#main')")
        op.goto(BASE+'/practice.html?bank=foundation'); op.wait_for_selector('#advanced-controls')
        op.evaluate("""() => {const key='jcsqe-shokyu-state-v3',s=JSON.parse(localStorage.getItem(key)),p=s.profiles[s.activeProfileId],E=window.JCSQEApplied;p.keepMe={oldHistory:[1,2,3]};const r=E.createSession(E.bank(window.JCSQEPracticeBank),p,{count:1,kind:'practice',continuous:true,topic:'C092'});delete r.session.trainingBank;delete r.session.syllabusUnit;localStorage.setItem(key,JSON.stringify(s));}""")
        op.goto(BASE+'/practice.html'); op.wait_for_selector('[data-act="resume"]'); op.locator('[data-act="resume"]').click()
        answer(op)
        op.locator('[data-act="continuous-next"]').click()
        assert op.evaluate("""() => {const s=JSON.parse(localStorage.getItem('jcsqe-shokyu-state-v3')),p=s.profiles[s.activeProfileId],q=window.JCSQEApplied.current(p).q;return q.id.startsWith('B15-')&&q.topicKey==='C092'&&p.keepMe.oldHistory.length===3;}""")
        ok('old topic-filtered continuous session keeps its original bank and custom data')
        old.close()
        page.goto(BASE+'/practice.html?bank=advanced&unit=5.1.1'); page.wait_for_selector('#advanced-controls')
        page.evaluate('navigator.serviceWorker.ready')
        page.wait_for_function('navigator.serviceWorker.controller !== null')
        ctx.set_offline(True)
        page.reload(); page.wait_for_selector('#advanced-controls')
        assert page.evaluate('window.JCSQEAdvancedBank.questions.length') == 156
        assert page.evaluate("window.JCSQEAdvancedSelection.unit === '5.1.1'")
        ok('offline reload keeps stronger assets and scoped routing')
        ctx.set_offline(False)
        assert not errors, errors
        ok('no unhandled JavaScript errors in tested real browser routes')
        browser.close()
finally:
    server.shutdown()
    (OUT/'browser-results.json').write_text(json.dumps({'passed':passed},ensure_ascii=False,indent=2))
print('ALL',len(passed),'ADVANCED BROWSER CHECKS PASSED')

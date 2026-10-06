"""Integration on a local HTTP origin: real browser storage, old/new app and SW.
Run after: pip install playwright==1.57.0 && playwright install --with-deps chromium
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json, os, threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results'
OUT.mkdir(exist_ok=True)
KEY = 'jcsqe-shokyu-state-v3'
checks, errors = [], []
def passed(label):
    checks.append(label)
    print('PASS', label, flush=True)
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}/'
try:
    with sync_playwright() as pw:
        opts = {'headless': True, 'args': ['--no-sandbox']}
        if os.environ.get('CHROMIUM_PATH'):
            opts['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = pw.chromium.launch(**opts)
        ctx = browser.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
        page = ctx.new_page()
        page.on('pageerror', lambda error: (errors.append(str(error)), print('BROWSER_ERROR', str(error), flush=True)))
        page.on('dialog', lambda dialog: dialog.accept())
        page.goto(base+'index.html?legacy=1')
        page.wait_for_function("window.JCSQEStudy && document.querySelector('main#main')")
        page.wait_for_function('!!navigator.serviceWorker.controller', timeout=30000)
        page.wait_for_function("!!document.querySelector('main#main')")
        original = page.evaluate('''key => {
          const C=window.JCSQEStudy;
          const p=C.normalizeProfile({name:'Integration fixture',history:[],sessions:[],bookmarks:[],exposures:{}});
          const catalog=C.catalog([...window.JCSQE_QUESTIONS,...window.JCSQE_SUPPLEMENT]);
          p.activeSession=C.makeSession(catalog,p,'quick',3);
          p.history.push({questionId:'E01Q01',correct:true,timestamp:'2026-09-27T10:00:00Z'});
          p.dojo={history:[{itemId:'DOJO-DEF-C021',correct:true}],bookmarks:[],session:null};
          p.course={history:[],rounds:{},session:null};
          const s={version:7,theme:'dark',activeProfileId:'fixture',profiles:{fixture:p,other:C.normalizeProfile({name:'Other fixture'})}};
          localStorage.setItem(key,JSON.stringify(s));return s;
        }''', KEY)
        page.goto(base+'practice.html')
        page.get_by_role('heading',name='JCSQE 演習道場').wait_for()
        assert page.locator('[data-act="start-continuous"]').count()==1
        assert page.locator('[data-count]').count()==0
        assert page.get_by_text('0/400',exact=False).count()>=1
        passed('continuous dojo loads without any question-count selector')

        page.locator('#practice-mode').select_option('smart')
        page.locator('[data-act="start-continuous"]').click()
        page.locator('.question').wait_for()
        qid=page.locator('.quiz-top .muted').inner_text()
        assert 'B15-' in qid
        assert page.locator('.feedback').count()==0
        wrong=page.evaluate('''key=>{const s=JSON.parse(localStorage.getItem(key)).profiles.fixture.appliedStudy.active;const id=s.questionIds[s.index];const q=s.snapshots[id];return [0,1,2,3].find(x=>x!==q.correct)}''',KEY)
        page.locator(f'[data-act="answer"][data-choice="{wrong}"]').click()
        page.locator('.feedback').wait_for()
        page.locator('.deep>summary').click()
        assert page.locator('.reason').count()==4
        assert page.get_by_role('heading',name='あなたの選択肢が誤りになる決定的理由').count()==1
        assert page.get_by_text('正解との直接比較：',exact=False).count()>=1
        passed('continuous dojo gives detailed feedback after each answer')

        first_id=page.evaluate('''key=>{const s=JSON.parse(localStorage.getItem(key)).profiles.fixture.appliedStudy.active;return s.questionIds[s.index]}''',KEY)
        page.locator('[data-act="continuous-next"]').click()
        second_id=page.evaluate('''key=>{const s=JSON.parse(localStorage.getItem(key)).profiles.fixture.appliedStudy.active;return s.questionIds[s.index]}''',KEY)
        assert second_id!=first_id
        assert page.locator('.feedback').count()==0
        passed('next question is appended automatically without choosing a set size')

        # Answer several questions and verify no duplicate within the live cycle.
        for _ in range(7):
            correct=page.evaluate('''key=>{const s=JSON.parse(localStorage.getItem(key)).profiles.fixture.appliedStudy.active;const id=s.questionIds[s.index];return s.snapshots[id].correct}''',KEY)
            page.locator(f'[data-act="answer"][data-choice="{correct}"]').click()
            page.locator('[data-act="continuous-next"]').click()
        ids=page.evaluate('''key=>JSON.parse(localStorage.getItem(key)).profiles.fixture.appliedStudy.active.questionIds''',KEY)
        assert len(ids)==len(set(ids))
        assert len(ids)>=9
        passed('continuous cycle avoids repeating a question before the pool is exhausted')

        saved = page.evaluate('key=>JSON.parse(localStorage.getItem(key))',KEY)
        session = saved['profiles']['fixture']['appliedStudy']['active']
        page.locator('[data-act="pause"]').click()
        page.reload()
        page.locator('[data-act="resume"]').click()
        current=page.evaluate('key=>JSON.parse(localStorage.getItem(key)).profiles.fixture.appliedStudy.active',KEY)
        assert all(session[k]==current[k] for k in ['id','questionIds','orders','index'])
        passed('reload resumes exact continuous question and option order')

        page.locator('[data-act="pause"]').click()
        page.get_by_role('heading',name='JCSQE 演習道場').wait_for()
        assert page.get_by_text('続きから再開').count()>=1
        state=page.evaluate('key=>JSON.parse(localStorage.getItem(key))',KEY)
        assert len(state['profiles']['fixture']['appliedStudy']['history'])>=8
        old=dict(state['profiles']['fixture']);old.pop('appliedStudy')
        assert old==original['profiles']['fixture']
        assert state['profiles']['other']==original['profiles']['other']
        passed('continuous answers are autosaved without altering legacy profile data')
        page.goto(base+'index.html')
        page.wait_for_function("!!document.querySelector('main#main')")
        page.locator('[data-action="nav"][data-route="plan"]').click()
        plan=page.locator('[data-benchmark-form="1"]')
        plan.wait_for()
        assert '開始' in plan.locator('.tag').inner_text() or '今日' in plan.locator('.tag').inner_text()
        plan.click()
        page.get_by_text('本番80%への積み上げ').wait_for()
        page.get_by_role('heading',name='本番校正 第1回').wait_for()
        passed('study-plan card deep-links to the fixed benchmark form')
        page.goto(base+'index.html?legacy=1')
        page.wait_for_function("!!document.querySelector('main#main')")
        state=page.evaluate('key=>JSON.parse(localStorage.getItem(key))',KEY)
        assert state['profiles']['fixture']['activeSession']==original['profiles']['fixture']['activeSession']
        passed('old application migration retains new history and old active session')
        page.goto(base+'index.html')
        page.locator('[data-applied-launch]').wait_for()
        page.locator('[data-applied-launch]').click()
        page.get_by_role('heading',name='JCSQE 演習道場').wait_for()
        passed('existing homepage launches continuous dojo while keeping legacy access')
        page.wait_for_function('!!navigator.serviceWorker.controller')
        assert page.evaluate("async()=>{const c=await caches.open('jcsqe-shokyu-v15-1-20261007');return !!(await c.match('./practice.html'));}")
        ctx.set_offline(True)
        page.reload()
        page.get_by_role('heading',name='いま解く').wait_for()
        passed('service worker reloads continuous dojo while offline')
        page.goto(base+'index.html?legacy=1')
        page.wait_for_function("!!document.querySelector('main#main')")
        passed('service worker also reloads legacy application while offline')
        assert not errors, errors
        passed('no unhandled JavaScript error in tested HTTP routes')
        browser.close()
finally:
    server.shutdown()
(OUT/'applied-browser-report.json').write_text(json.dumps({'checks':checks,'passed':len(checks),'errors':errors,'scope':'Chromium local HTTP; real localStorage + service worker; synthetic profiles; not iPhone device'},ensure_ascii=False,indent=2))
print(f'ALL {len(checks)} INTEGRATION CHECKS PASSED')

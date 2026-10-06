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
        page.get_by_role('heading',name='いま解く').wait_for()
        passed('HTTP entry loads complete application with actual localStorage')
        page.locator('[data-act="start"][data-count="5"][data-mode="smart"]').first.click()
        assert page.locator('.feedback').count()==0
        wrong=page.evaluate('''key=>{const s=JSON.parse(localStorage.getItem(key)).profiles.fixture.appliedStudy.active;const id=s.questionIds[s.index];const q=s.snapshots[id];return [0,1,2,3].find(x=>x!==q.correct)}''',KEY)
        page.locator(f'[data-act="answer"][data-choice="{wrong}"][data-confidence="guess"]').click()
        page.locator('.feedback').wait_for()
        assert page.locator('.deep[open]').count()==0
        page.locator('.deep>summary').click()
        assert page.locator('.reason').count()==4
        assert page.get_by_role('heading',name='あなたの選択肢が誤りになる決定的理由').count()==1
        assert page.get_by_text('正解との直接比較：',exact=False).count()>=1
        assert page.get_by_role('heading',name='1. まず使う判定基準').count()==1
        assert page.get_by_role('heading',name='3. 似た概念との境界').count()==1
        assert page.get_by_role('heading',name='4. 4択を同じ基準で検証').count()==1
        assert page.locator('.decision-steps li').count()>=3
        qid=page.locator('.quiz-top .muted').inner_text()
        assert 'A12-' in qid
        passed('v12.1 explains the selected wrong answer with a decision rule and direct comparison')
        saved = page.evaluate('key=>JSON.parse(localStorage.getItem(key))',KEY)
        session = saved['profiles']['fixture']['appliedStudy']['active']
        page.locator('[data-act="pause"]').click()
        page.reload()
        page.locator('[data-act="resume"]').click()
        current=page.evaluate('key=>JSON.parse(localStorage.getItem(key)).profiles.fixture.appliedStudy.active',KEY)
        assert all(session[k]==current[k] for k in ['id','questionIds','orders','index'])
        passed('actual HTTP reload resumes exact set and option order')
        page.locator('[data-act="pause"]').click()
        page.locator('[data-act="finish-early"]').click()
        assert page.locator('.result-item').count()==5
        state=page.evaluate('key=>JSON.parse(localStorage.getItem(key))',KEY)
        a=state['profiles']['fixture']['appliedStudy']
        assert sum(h['observed'] for h in a['history'])==1
        assert len(a['exposures'])==1
        page.evaluate('''()=>{window.__toggleEvents=[];document.getElementById('applied-app').addEventListener('toggle',e=>__toggleEvents.push([e.target.tagName,e.target.dataset.reviewId,e.target.open]),true);}''')
        page.locator('.result-item>summary').nth(1).click()
        page.wait_for_timeout(200)
        print('EXPOSURE_DEBUG',page.evaluate('''key=>({events:window.__toggleEvents,exposures:JSON.parse(localStorage.getItem(key)).profiles.fixture.appliedStudy.exposures,details:[...document.querySelectorAll('.result-item')].map(d=>[d.dataset.reviewId,d.open]),notices:[...document.querySelectorAll('.notice.error')].map(x=>x.textContent)})''',KEY),flush=True)
        page.wait_for_function('key=>Object.keys(JSON.parse(localStorage.getItem(key)).profiles.fixture.appliedStudy.exposures).length===2',arg=KEY)
        passed('unshown tasks remain unseen until a result explanation is actually opened')
        state=page.evaluate('key=>JSON.parse(localStorage.getItem(key))',KEY)
        old=dict(state['profiles']['fixture']);old.pop('appliedStudy')
        assert old==original['profiles']['fixture']
        assert state['profiles']['other']==original['profiles']['other']
        passed('all original fixture histories, active old session and second profile unchanged')
        page.goto(base+'index.html')
        page.wait_for_function("!!document.querySelector('main#main')")
        page.locator('[data-action="nav"][data-route="plan"]').click()
        plan=page.locator('[data-applied-plan-date="2026-10-04"]')
        plan.wait_for()
        assert '開始' in plan.locator('.tag').inner_text()
        plan.click()
        page.get_by_role('heading',name='10/4 第1回').wait_for()
        start_plan=page.locator('[data-act="start"][data-plan-date="2026-10-04"]')
        assert start_plan.count()==1
        start_plan.click()
        page.locator('.option').first.click()
        assert page.locator('.feedback,.right,.deep').count()==0
        page.locator('[data-act="next"]').click()
        page.locator('[data-act="previous"]').click()
        assert page.locator('.feedback,.right,.deep').count()==0
        passed('scheduled mock launches from overdue plan card without leaking correctness')
        page.locator('[data-act="finish-early"]').click()
        assert page.locator('.result-item').count()==40
        state=page.evaluate('key=>JSON.parse(localStorage.getItem(key))',KEY)
        planned=state['profiles']['fixture']['appliedStudy']['sessions'][-1]
        assert planned['total']==40 and planned['plannedDate']=='2026-10-04' and planned['plannedRound']==1
        assert page.get_by_text('10/4 第1回',exact=True).count()>=1
        passed('scheduled mock stores target round separately from actual finish time')
        page.goto(base+'index.html')
        page.wait_for_function("!!document.querySelector('main#main')")
        page.locator('[data-action="nav"][data-route="plan"]').click()
        done=page.locator('.plan-row',has_text='10/04　第1回')
        done.wait_for()
        assert done.locator('.tag').inner_text()=='実施済み'
        assert done.get_attribute('data-applied-plan-date') is None
        passed('completed catch-up round changes the original plan card to completed')
        page.goto(base+'index.html?legacy=1')
        page.wait_for_function("!!document.querySelector('main#main')")
        state=page.evaluate('key=>JSON.parse(localStorage.getItem(key))',KEY)
        assert state['profiles']['fixture']['activeSession']==original['profiles']['fixture']['activeSession']
        passed('old application migration retains new history and old active session')
        page.goto(base+'index.html')
        page.locator('[data-applied-launch]').wait_for()
        page.locator('[data-applied-launch]').click()
        page.get_by_role('heading',name='いま解く').wait_for()
        passed('existing homepage launches new practice while keeping legacy access')
        page.wait_for_function('!!navigator.serviceWorker.controller')
        assert page.evaluate("async()=>{const c=await caches.open('jcsqe-shokyu-v13-20261006');return !!(await c.match('./practice.html'));}")
        ctx.set_offline(True)
        page.reload()
        page.get_by_role('heading',name='いま解く').wait_for()
        passed('service worker reloads new practice while offline')
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

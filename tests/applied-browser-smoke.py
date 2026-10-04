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
        page.on('pageerror', lambda error: errors.append(str(error)))
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
        page.locator('.guess').first.click()
        page.locator('.feedback').wait_for()
        assert page.locator('.deep[open]').count()==0
        page.locator('.deep>summary').click()
        assert page.locator('.reason').count()==4
        passed('one-tap uncertainty, short feedback and expandable detailed reasons')
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
        page.locator('.result-item>summary').nth(1).click()
        page.wait_for_function('key=>Object.keys(JSON.parse(localStorage.getItem(key)).profiles.fixture.appliedStudy.exposures).length===2',arg=KEY)
        passed('unshown tasks remain unseen until a result explanation is actually opened')
        state=page.evaluate('key=>JSON.parse(localStorage.getItem(key))',KEY)
        old=dict(state['profiles']['fixture']);old.pop('appliedStudy')
        assert old==original['profiles']['fixture']
        assert state['profiles']['other']==original['profiles']['other']
        passed('all original fixture histories, active old session and second profile unchanged')
        page.locator('[data-act="home"]').first.click()
        page.locator('[data-kind="mock"][data-mode="new"]').click()
        page.locator('.option').first.click()
        assert page.locator('.feedback,.right,.deep').count()==0
        page.locator('[data-act="next"]').click()
        page.locator('[data-act="previous"]').click()
        assert page.locator('.feedback,.right,.deep').count()==0
        passed('mock answer and revisit do not leak correctness')
        page.locator('[data-act="finish-early"]').click()
        assert page.locator('.result-item').count()==40
        passed('40-question mock submits all answers before feedback')
        page.goto(base+'index.html?legacy=1')
        page.wait_for_function("!!document.querySelector('main#main')")
        state=page.evaluate('key=>JSON.parse(localStorage.getItem(key))',KEY)
        assert state['profiles']['fixture']['appliedStudy']['sessions'][-1]['total']==40
        assert state['profiles']['fixture']['activeSession']==original['profiles']['fixture']['activeSession']
        passed('old application migration retains new history and old active session')
        page.goto(base+'index.html')
        page.locator('[data-applied-launch]').wait_for()
        page.locator('[data-applied-launch]').click()
        page.get_by_role('heading',name='いま解く').wait_for()
        passed('existing homepage launches new practice while keeping legacy access')
        page.wait_for_function('!!navigator.serviceWorker.controller')
        assert page.evaluate("async()=>{const c=await caches.open('jcsqe-shokyu-v11-20261004');return !!(await c.match('./practice.html'));}")
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

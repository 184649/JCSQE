"""Real local HTTP/browser storage integration; synthetic user only, not iPhone Safari."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os, threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
KEY='jcsqe-shokyu-state-v3'
errors=[]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*_): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'
try:
 with sync_playwright() as pw:
  opts={'headless':True,'args':['--no-sandbox']}
  if os.environ.get('CHROMIUM_PATH'): opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opts)
  ctx=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
  page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.goto(base+'index.html?legacy=1');page.wait_for_function('!!window.JCSQEAcronyms')
  page.wait_for_function('!!navigator.serviceWorker.controller',timeout=30000)
  page.goto(base+'practice.html');page.wait_for_function('!!window.JCSQEApplied')
  fixture=page.evaluate('''key=>{
   const E=window.JCSQEApplied,data=window.JCSQEAppliedBank;
   const q=data.questions.find(q=>q.type==='scenario-selection'&&q.options.includes('CMMI'));
   if(!q)throw Error('CMMI fixture missing');
   const p={name:'Acronym fixture',history:[],sessions:[],bookmarks:[],exposures:{}};
   E.createSession(E.bank({questions:[q]}),p,{count:1,mode:'smart',kind:'practice',continuous:true});
   const state={version:7,activeProfileId:'test',profiles:{test:p}};
   localStorage.setItem(key,JSON.stringify(state));return {id:q.id,text:q.text,options:q.options,correct:q.correct};
  }''',KEY)
  page.reload();page.locator('[data-act="resume"]').click();page.locator('.question').wait_for()
  assert page.locator('.question').inner_text()==fixture['text']
  assert page.locator('.keyword-options').count()==0
  page.locator('[data-act="unknown"]').click()
  page.wait_for_function("document.querySelector('.keyword-options')?.textContent.includes('Capability Maturity Model Integration')")
  assert page.locator('.keyword-card').count()==4
  assert '能力成熟度モデル統合' in page.locator('.keyword-options').inner_text()
  state=page.evaluate('key=>JSON.parse(localStorage.getItem(key))',KEY)
  active=state['profiles']['test']['appliedStudy']['active'];snap=active['snapshots'][fixture['id']]
  assert all(snap[k]==fixture[k] for k in ['id','text','options','correct'])
  print('PASS formal English and Japanese appear after answering; question and key unchanged',flush=True)
  page.set_viewport_size({'width':320,'height':700})
  for box in page.locator('.keyword-card').all():
   bounds=box.bounding_box();assert bounds and bounds['x']>=0 and bounds['x']+bounds['width']<=321
  print('PASS long English expansions fit 320px mobile layout',flush=True)
  page.locator('[data-act="pause"]').click();page.reload();page.locator('[data-act="resume"]').click()
  page.wait_for_function("document.querySelector('.keyword-options')?.textContent.includes('Capability Maturity Model Integration')")
  again=page.evaluate('key=>JSON.parse(localStorage.getItem(key)).profiles.test.appliedStudy.active',KEY)
  assert again['orders']==active['orders'] and again['answers']==active['answers']
  assert again['questionIds']==active['questionIds']
  print('PASS resumed answers and shuffled positions are preserved',flush=True)
  page.wait_for_function('!!navigator.serviceWorker.controller')
  assert page.evaluate("async()=>{for(const key of await caches.keys()){const c=await caches.open(key);if(await c.match('./acronym-explanations.js?v=15.9'))return true;}return false;}")
  ctx.set_offline(True);page.reload();page.locator('[data-act="resume"]').click()
  page.wait_for_function("document.querySelector('.keyword-options')?.textContent.includes('Capability Maturity Model Integration')")
  print('PASS acronym explanations survive offline reload',flush=True)
  ctx.set_offline(False);page.goto(base+'benchmark.html')
  page.locator('[data-act="start"][data-form="1"]').first.click()
  assert page.locator('.keyword-options').count()==0
  page.locator('.bench-option').first.click();assert page.locator('.keyword-options').count()==0
  page.locator('[data-act="finish"]').click();page.locator('.result-score').wait_for()
  page.wait_for_function("Array.from(document.querySelectorAll('.keyword-definition')).some(x=>x.textContent.includes('正式名称'))")
  print('PASS benchmark expansions are hidden until submission',flush=True)
  assert not errors,errors
  browser.close()
finally:
 server.shutdown()
print('ALL ACRONYM BROWSER CHECKS PASSED',flush=True)

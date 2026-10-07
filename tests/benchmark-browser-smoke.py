"""Benchmark v15 browser integration test."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json, os, threading
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
KEY='jcsqe-shokyu-state-v3'
checks=[];errors=[]
def ok(x): checks.append(x); print('PASS',x,flush=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*_): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'
try:
  with sync_playwright() as pw:
    opts={'headless':True,'args':['--no-sandbox']}
    if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
    browser=pw.chromium.launch(**opts)
    ctx=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
    page=ctx.new_page();page.on('pageerror',lambda e:(errors.append(str(e)),print('BROWSER_ERROR',str(e),flush=True)))
    page.on('dialog',lambda d:d.accept())
    page.goto(base+'benchmark.html')
    page.get_by_text('本番80%への積み上げ').wait_for()
    page.set_viewport_size({'width':320,'height':700})
    theme_btn=page.get_by_role('button',name='ライト／ダーク表示を切り替え')
    theme_btn.wait_for()
    box=theme_btn.bounding_box()
    assert box and box['x']>=0 and box['x']+box['width']<=320
    before=page.locator('html').get_attribute('data-theme')
    theme_btn.click()
    after=page.locator('html').get_attribute('data-theme')
    assert before!=after
    page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
    page.wait_for_timeout(100)
    box=theme_btn.bounding_box()
    assert box and box['y']>=0 and box['y']<110
    ok('benchmark display toggle stays visible at 320px width and while scrolling')
    page.set_viewport_size({'width':390,'height':844})
    assert page.get_by_text('0/10',exact=True).count()>=1
    assert page.get_by_text('0/400',exact=True).count()>=1
    ok('benchmark dashboard starts at 0/10 and 0/400')
    page.locator('[data-act="start"][data-form="1"]').first.click()
    page.locator('.bench-question').wait_for()
    assert page.locator('.explain-box,.result-question').count()==0
    page.locator('.bench-option').first.click()
    page.locator('[data-act="next"]').click()
    assert page.locator('.explain-box,.result-question').count()==0
    ok('40-question form never leaks correctness before submission')
    page.locator('[data-act="finish"]').click()
    page.locator('.result-score').wait_for()
    assert page.locator('.result-question').count()==40
    page.locator('.result-question').first.click()
    assert page.locator('.benchmark-textbook').count()>=1
    assert page.get_by_role('heading',name='1. 分野の全体像').count()>=1
    assert page.get_by_role('heading',name='5. 似た概念との比較').count()>=1
    assert page.get_by_role('heading',name='6. 4択を1つずつ検証').count()>=1
    assert page.locator('.textbook-option').count()>=4
    ok('submitted form reveals textbook-level explanations')
    page.locator('[data-act="home"]').click()
    assert page.get_by_text('1/10',exact=True).count()>=1
    assert page.get_by_text('40/400',exact=True).count()>=1
    assert page.locator('.form-card.next[data-form="2"]').count()==1
    ok('progress persists and unlocks only the next fixed form')
    page.goto(base+'index.html')
    page.locator('[data-action="nav"][data-route="plan"]').click()
    page.locator('[data-benchmark-form="1"]').wait_for()
    assert page.locator('[data-benchmark-form="1"] .tag').inner_text()=='実施済み'
    ok('study plan reads benchmark completion from shared profile')
    page.goto(base+'benchmark.html?form=2&plan=2026-10-11')
    page.get_by_role('heading',name='本番校正 第2回').wait_for()
    ok('scheduled plan deep-links to exact benchmark form')
    page.wait_for_function('!!navigator.serviceWorker.controller',timeout=30000)
    assert page.evaluate("async()=>{const c=await caches.open('jcsqe-shokyu-v15-5-20261007');return !!(await c.match('./benchmark.html'));}")
    ctx.set_offline(True);page.reload();page.get_by_text('本番80%への積み上げ').wait_for()
    ok('benchmark page reloads offline from v15 cache')
    assert not errors,errors
    browser.close()
finally:
  server.shutdown()
print(f'ALL {len(checks)} BENCHMARK CHECKS PASSED')

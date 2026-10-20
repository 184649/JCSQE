"""Real-browser checks for the display-only keyword layer. No user data is used."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch()
  ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  page=ctx.new_page(); errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.on('dialog',lambda dialog:dialog.accept())
  page.goto(base+'/practice.html');page.locator('[data-act="start-continuous"]').click()
  expect(page.locator('.keyword-card')).to_have_count(0)
  prompt=page.locator('h1.question').inner_text()
  shown=page.locator('.option').all_text_contents()
  page.locator('[data-act="answer"]').first.click()
  expect(page.locator('.keyword-card')).to_have_count(4)
  for i,letter in enumerate('ABCD'):
   card=page.locator('.keyword-card').nth(i)
   expect(card).to_be_visible()
   assert card.locator('.reason-head>b').inner_text().startswith(letter+'. ')
   assert card.locator('.keyword-definition').count()>=1
   assert '未確認です' not in card.inner_text()
  expect(page.locator('.keyword-steps')).to_have_count(1)
  assert not page.locator('.keyword-steps').evaluate('(e)=>e.open')
  assert not page.locator('.core-explanation').is_visible()
  assert page.locator('h1.question').inner_text()==prompt
  assert page.locator('.option').all_text_contents()==shown
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
  raw=page.evaluate("localStorage.getItem('jcsqe-shokyu-state-v3')")
  assert raw
  page.reload();page.locator('[data-act="resume"]').click()
  expect(page.locator('.keyword-card')).to_have_count(4)
  assert page.locator('h1.question').inner_text()==prompt
  page.locator('[data-act="continuous-next"]').click()
  expect(page.locator('.keyword-card')).to_have_count(0)
  print('PASS: practice A-D keyword cards, answer secrecy, shuffle alignment, reload and next question')

  page.goto(base+'/benchmark.html')
  page.locator('.form-card[data-act="start"]').first.click()
  expect(page.locator('.keyword-card')).to_have_count(0)
  page.locator('[data-act="answer"]').first.click()
  expect(page.locator('.keyword-card')).to_have_count(0)
  page.locator('[data-act="finish"]').click()
  expect(page.locator('.keyword-card')).to_have_count(160)
  assert page.locator('.keyword-options').count()==40
  print('PASS: benchmark hides definitions until submission and gives four cards for every result')

  page.goto(base+'/index.html?legacy=1')
  page.wait_for_function('window.JCSQEKeywords && window.JCSQECourse && window.JCSQEStudy')
  check=page.evaluate('''() => {
   const source=window.JCSQE_QUESTIONS[0],before=JSON.stringify(source),cat=window.JCSQEStudy.catalog(window.JCSQE_QUESTIONS),view=cat.questions.get(source.id);
   const course=window.JCSQECourse.question(window.JCSQE_SYLLABUS_CONCEPTS,'C092',1);
   return {unchanged:before===JSON.stringify(source),text:source.text===view.text,answer:source.correct===view.correct,legacy:view.explanation.includes('各選択肢のキーワード'),course:course.explanation.includes('各選択肢のキーワード')};
  }''')
  assert all(check.values()),check
  print('PASS: legacy/course view explanations enhanced without modifying source question or answer')

  page.goto(base+'/practice.html');page.wait_for_function('navigator.serviceWorker.controller !== null')
  ctx.set_offline(True);page.reload()
  expect(page.locator('#applied-app')).to_contain_text('演習')
  if page.locator('[data-act="resume"]').count():page.locator('[data-act="resume"]').click()
  else:page.locator('[data-act="start-continuous"]').click()
  if page.locator('[data-act="answer"]:enabled').count():page.locator('[data-act="answer"]:enabled').first.click()
  expect(page.locator('.keyword-card')).to_have_count(4)
  assert not errors,errors
  print('PASS: cached keyword explanations are available offline; no browser errors')
  browser.close()
finally:
 server.shutdown()

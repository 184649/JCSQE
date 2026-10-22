"""Cumulative statistics against the real app, real storage and service worker."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import threading
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
KEY = 'jcsqe-shokyu-state-v3'
checks, errors = [], []

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

def ok(label):
    checks.append(label)
    print('PASS', label, flush=True)

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}/'

try:
    with sync_playwright() as pw:
        opts = {'headless': True, 'args': ['--no-sandbox']}
        if os.environ.get('CHROMIUM_PATH'):
            opts['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = pw.chromium.launch(**opts)
        context = browser.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('dialog', lambda dialog: dialog.accept())

        def counts(answered, correct, accuracy):
            expect(page.locator('.cumulative-scoreboard')).to_have_count(1)
            expect(page.locator('[data-cumulative-value="answered"]')).to_have_text(f'{answered}問')
            expect(page.locator('[data-cumulative-value="correct"]')).to_have_text(f'{correct}問')
            expect(page.locator('[data-cumulative-value="accuracy"]')).to_have_text(accuracy)

        def choice(wrong=False):
            answer = page.evaluate('''key => {
              const data=JSON.parse(localStorage.getItem(key));
              const s=data.profiles[data.activeProfileId].appliedStudy.active;
              return s.snapshots[s.questionIds[s.index]].correct;
            }''', KEY)
            return (answer + 1) % 4 if wrong else answer

        page.goto(base + 'practice.html')
        page.wait_for_function('!!navigator.serviceWorker.controller', timeout=30000)
        page.wait_for_function('!!window.JCSQECumulative')
        counts(0, 0, '—')
        ok('new profile: 0 answers, 0 correct, rate is undefined')

        page.locator('[data-act="start-continuous"]').click()
        counts(0, 0, '—')
        expect(page.locator('.feedback')).to_have_count(0)
        ok('opening the first question does not increment the total or reveal an answer')

        good = choice()
        page.locator(f'[data-act="answer"][data-choice="{good}"]').click()
        counts(1, 1, '100.0%')
        page.locator(f'[data-act="answer"][data-choice="{good}"]').evaluate('(button) => button.click()')
        counts(1, 1, '100.0%')
        page.locator('[data-act="continuous-next"]').click()
        counts(1, 1, '100.0%')
        ok('correct answer increments once; disabled repeated tap and next question do not')

        bad = choice(True)
        page.locator(f'[data-act="answer"][data-choice="{bad}"]').click()
        counts(2, 1, '50.0%')
        page.locator('[data-act="continuous-next"]').click()
        page.locator('[data-act="unknown"]').click()
        counts(3, 1, '33.3%')
        ok('wrong and unknown answers update the denominator; percentage rounds to one decimal')

        page.set_viewport_size({'width':320, 'height':700})
        for value in page.locator('.cumulative-metric').all():
            box = value.bounding_box()
            assert box and box['x'] >= 0 and box['x'] + box['width'] <= 320
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        ok('three metrics fit a 320px mobile screen')
        page.set_viewport_size({'width':390, 'height':844})

        page.locator('[data-act="pause"]').click()
        counts(3, 1, '33.3%')
        page.reload()
        counts(3, 1, '33.3%')
        page.locator('nav [data-act="history"]').click()
        counts(3, 1, '33.3%')
        raw = page.evaluate('key => localStorage.getItem(key)', KEY)
        page.evaluate('''key => {
          const s=JSON.parse(localStorage.getItem(key));
          window.JCSQECumulative.summarize(s.profiles[s.activeProfileId]);
        }''', KEY)
        assert page.evaluate('key => localStorage.getItem(key)', KEY) == raw
        ok('home and history show the same persisted totals; summary never writes data')

        # Add a second, empty synthetic profile to check switching without cross-profile mixing.
        page.evaluate('''key => {
          const s=JSON.parse(localStorage.getItem(key));
          s.profiles.other={name:'Other profile',history:[],sessions:[],bookmarks:[],exposures:{}};
          localStorage.setItem(key,JSON.stringify(s));
        }''', KEY)
        page.reload()
        page.locator('nav [data-act="history"]').click()
        original_id = page.locator('#profile').input_value()
        page.locator('#profile').select_option('other')
        counts(0, 0, '—')
        page.locator('#profile').select_option(original_id)
        counts(3, 1, '33.3%')
        ok('profile switching uses that profile only and retains existing history')

        page.locator('nav [data-act="home"]').click()
        page.wait_for_function('!!navigator.serviceWorker.controller')
        context.set_offline(True)
        page.reload()
        counts(3, 1, '33.3%')
        page.locator('[data-act="resume"]').click()
        counts(3, 1, '33.3%')
        expect(page.locator('.keyword-options')).to_have_count(1)
        ok('offline reload and resume retain totals and existing keyword explanations')
        context.set_offline(False)

        # The old timed-mock route must not expose current correctness through the new totals.
        page.evaluate('''key => {
          const s=JSON.parse(localStorage.getItem(key));
          const p=s.profiles[s.activeProfileId], E=window.JCSQEApplied;
          E.finish(p);
          const b=E.bank(window.JCSQEAppliedBank);
          const created=E.createSession(b,p,{count:40,mode:'smart',kind:'mock'});
          if(!created.session) throw Error('cannot create fixture mock');
          localStorage.setItem(key,JSON.stringify(s));
        }''', KEY)
        page.reload()
        page.locator('[data-act="resume"]').click()
        expect(page.locator('.cumulative-scoreboard')).to_have_count(0)
        expect(page.locator('.feedback')).to_have_count(0)
        page.locator('[data-act="answer"]').first.click()
        expect(page.locator('.cumulative-scoreboard')).to_have_count(0)
        expect(page.locator('.feedback')).to_have_count(0)
        page.locator('[data-act="finish-early"]').click()
        counts(3, 1, '33.3%')
        ok('timed exam never leaks correctness; submitting it does not mix mock scores into practice')

        assert not errors, errors
        ok('no unhandled JavaScript errors')
        browser.close()
finally:
    server.shutdown()

print(f'ALL {len(checks)} CUMULATIVE BROWSER CHECKS PASSED')

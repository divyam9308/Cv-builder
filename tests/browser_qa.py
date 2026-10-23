"""Chromium UI smoke tests for the local-first resume studio.

The browser runs with a sandbox that blocks navigation to HTTP hosts, so this
harness mounts the exact app.js, domain.js and styles.css into an isolated page.
The real HTTP API is exercised separately by Node integration tests.
Requires: pip install playwright; a Chromium executable.
"""
from pathlib import Path
import os
import re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'public/index.html').read_text(encoding='utf8')
html = re.sub(r'<link rel="stylesheet" href="/styles.css"\s*/>', '', html)
html = re.sub(r'<script type="module" src="/app.js"></script>', '', html)
domain = (ROOT / 'public/lib/domain.js').read_text(encoding='utf8').replace('export ', '')
app = (ROOT / 'public/app.js').read_text(encoding='utf8')
app = re.sub(r"^import \{.*?\} from './lib/domain.js';\s*", '', app, count=1)

with sync_playwright() as playwright:
    opts = {'headless': True, 'args': ['--no-sandbox']}
    chromium_path = os.environ.get('CHROMIUM_PATH')
    if chromium_path:
        opts['executable_path'] = chromium_path
    browser = playwright.chromium.launch(**opts)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_content(html)
    page.add_style_tag(content=(ROOT / 'public/styles.css').read_text(encoding='utf8'))
    page.add_script_tag(content="""const __store = new Map(); Object.defineProperty(window, 'localStorage', {configurable:true,value: {getItem:k=>__store.get(k)||null, setItem:(k,v)=>__store.set(k,String(v)),removeItem:k=>__store.delete(k), clear:()=>__store.clear()}});""")
    page.add_script_tag(type='module', content=domain + '\n' + app)
    page.get_by_text('A strong resume begins with').wait_for()
    assert 'folio.' in page.locator('body').inner_text()
    assert page.locator('.resume-row').count() >= 1
    # Five real alternatives, with independent selection controls.
    page.locator('button[data-nav="templates"]').first.click()
    assert page.locator('.template-card').count() == 5
    page.locator('[data-action="set-template"][data-id="atelier"]').click()
    assert page.locator('[data-action="set-template"][data-id="atelier"]').get_attribute('aria-pressed') == 'true'
    # New resume and editing work without a remote API.
    page.locator('button[data-nav="resumes"]').first.click()
    page.locator('button[data-action="create"]').first.click()
    assert 'Create your resume' in page.locator('body').inner_text()
    page.locator('[data-field="personal.name"]').fill('Taylor Morgan')
    page.locator('[data-field="personal.email"]').fill('taylor@example.com')
    assert 'Taylor Morgan' in page.locator('.preview-paper').inner_text()
    # Adaptive questions are visible and can be answered.
    page.locator('button[data-nav="interview"]').first.click()
    assert page.locator('[data-answer]').count() >= 1
    q = page.locator('[data-answer]').first
    q.fill('I used SQL, Excel and Python to prepare daily performance reports.')
    page.locator('[data-action="save-answer"]').first.click()
    assert 'Your answer:' in page.locator('body').inner_text()
    # Switch to a narrow viewport and exercise mobile navigation.
    page.set_viewport_size({'width': 390, 'height': 800})
    page.locator('[data-action="menu"]').click()
    assert 'menu-open' in page.locator('.shell').get_attribute('class')
    assert not errors, errors
    print('Browser UI smoke checks passed: dashboard, templates, editor, interview and mobile navigation.')
    browser.close()

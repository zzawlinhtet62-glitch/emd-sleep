/* ============================================================
   test/runtime-check.js — loads the built index.html in headless
   Chrome, visits every chapter and asserts that it actually drew
   something. Catches the class of bug that a syntax check cannot:
   a function that is referenced but no longer defined.
   Run:  node test/runtime-check.js
   ============================================================ */
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..');

if (!fs.existsSync(CHROME)) {
  console.log('  SKIP  Chrome not found at ' + CHROME + ' (set CHROME=... to run this)');
  process.exit(0);
}

const probe = `<script>
window.__err = [];
window.addEventListener('error', function (e) { window.__err.push(String(e.message)); });
window.addEventListener('unhandledrejection', function (e) { window.__err.push('rejection ' + e.reason); });
window.addEventListener('load', function () { setTimeout(function () {
  var tabs = ['ext','env','sift','lab','stage','spec','mix','paper'], rep = { tabs: {} };
  tabs.forEach(function (k) {
    try {
      document.querySelector('.tab[data-tab="' + k + '"]').click();
      var pn = document.querySelector('.panel[data-tab="' + k + '"]');
      var cv = pn.querySelectorAll('canvas'), drawn = 0;
      for (var i = 0; i < cv.length; i++) if (cv[i].width > 10) drawn++;
      rep.tabs[k] = { canvas: cv.length, drawn: drawn, text: pn.textContent.trim().length };
    } catch (e) { rep.tabs[k] = { error: String(e) }; }
  });
  // the hero strip must be scrolling
  rep.heroW = document.getElementById('heroCanvas').width;
  // the two self-running demos must toggle
  document.querySelector('.tab[data-tab="sift"]').click();
  var a = document.getElementById('t1Auto');
  var l0 = a.textContent; a.click(); var l1 = a.textContent; a.click();
  rep.autoToggles = l0 !== l1 && a.textContent === l0;
  document.querySelector('.tab[data-tab="spec"]').click();
  var w = document.getElementById('t3Sweep');
  var s0 = w.textContent; w.click(); var s1 = w.textContent; w.click();
  rep.sweepToggles = s0 !== s1 && w.textContent === s0;
  // language switch: both halves present, exactly one lit, round trips
  var zh = document.querySelector('#langSw .langopt[data-lang="zh"]');
  var en = document.querySelector('#langSw .langopt[data-lang="en"]');
  rep.langBoth = !!zh && !!en;
  var lang0 = document.documentElement.lang;
  en.click();
  var lang1 = document.documentElement.lang;
  rep.langLit = en.getAttribute('aria-pressed') === 'true' &&
                zh.getAttribute('aria-pressed') === 'false';
  try { rep.langStored = localStorage.getItem('emd-lang-v3') === 'en'; }
  catch (e) { rep.langStored = true; }
  zh.click();
  rep.langRoundTrip = lang0 !== lang1 && document.documentElement.lang === lang0 &&
                      zh.getAttribute('aria-pressed') === 'true';
  rep.err = window.__err;
  var d = document.createElement('div'); d.id = '__probe';
  d.textContent = JSON.stringify(rep);
  document.body.appendChild(d);
}, 900); });
</script>`;

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const tmp = path.join(os.tmpdir(), 'emd-runtime-check.html');
fs.writeFileSync(tmp, html.replace('</body>', probe + '\n</body>'));

const out = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--virtual-time-budget=15000', '--window-size=1280,1000',
  '--dump-dom', 'file://' + tmp
], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });

const m = out.match(/<div id="__probe">([\s\S]*?)<\/div>/);
if (!m) { console.log('  FAIL  the page never finished running'); process.exit(1); }
const rep = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));

let bad = 0;
function check(name, ok, detail) {
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}${detail ? '\n        ' + detail : ''}`);
  if (!ok) bad++;
}

check('no uncaught JavaScript errors', rep.err.length === 0, rep.err.join(' | ') || 'none');
Object.keys(rep.tabs).forEach(k => {
  const t = rep.tabs[k];
  if (t.error) { check(`chapter "${k}" renders`, false, t.error); return; }
  const ok = t.text > 100 && (t.canvas === 0 || t.drawn === t.canvas);
  check(`chapter "${k}" renders`, ok, `${t.drawn}/${t.canvas} canvases drawn, ${t.text} characters of text`);
});
check('the hero strip is sized and drawing', rep.heroW > 10, 'canvas width = ' + rep.heroW);
check('chapter 03 auto-play toggles both ways', rep.autoToggles);
check('chapter 06 auto-sweep toggles both ways', rep.sweepToggles);
check('the language switch offers both languages', rep.langBoth);
check('the language switch lights only the current language', rep.langLit);
check('the chosen language is remembered', rep.langStored);
check('the language switch round-trips', rep.langRoundTrip);

console.log(bad ? `\n${bad} problem(s)` : '\nruntime checks passed');
process.exit(bad ? 1 : 0);

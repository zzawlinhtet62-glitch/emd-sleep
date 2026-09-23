'use strict';
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('src/app.js', 'utf8');
const I = require('../src/i18n.js');

let bad = 0;
function fail(m) { console.log('  MISSING ' + m); bad++; }

/* every #id app.js touches must exist in the document */
const ids = new Set();
let m, re = /\$\$?\('#([A-Za-z0-9_-]+)'/g;
while ((m = re.exec(app))) ids.add(m[1]);
console.log(`checking ${ids.size} element ids referenced by app.js`);
ids.forEach(id => { if (html.indexOf('id="' + id + '"') < 0) fail('id #' + id); });

/* every data-i18n key must exist in both languages */
const keys = new Set();
re = /data-i18n="([A-Za-z0-9_]+)"/g;
while ((m = re.exec(html))) keys.add(m[1]);
console.log(`checking ${keys.size} data-i18n keys`);
keys.forEach(k => {
  if (typeof I.STR.zh[k] !== 'string') fail('zh string "' + k + '"');
  if (typeof I.STR.en[k] !== 'string') fail('en string "' + k + '"');
});

/* every S.<key> app.js reads must exist too */
const used = new Set();
re = /\bS\.([A-Za-z0-9_]+)/g;
while ((m = re.exec(app))) used.add(m[1]);
console.log(`checking ${used.size} S.<key> lookups in app.js`);
used.forEach(k => {
  if (I.STR.zh[k] === undefined) fail('zh key S.' + k);
  if (I.STR.en[k] === undefined) fail('en key S.' + k);
});

/* placeholders must line up with the number of arguments passed */
const counts = { p1Round: 1, p1Step: 1, c1Val: 3, c2Val: 1, p2NoiseNote: 2, p2NoiseNoteZero: 1, p3r1: 3, p3r2: 3 };
Object.keys(counts).forEach(k => {
  ['zh', 'en'].forEach(L => {
    const s = I.STR[L][k];
    const seen = new Set((s.match(/%\d/g) || []));
    for (let i = 1; i <= counts[k]; i++) if (!seen.has('%' + i)) fail(L + '.' + k + ' has no %' + i);
    if (seen.size !== counts[k]) fail(L + '.' + k + ' expects ' + counts[k] + ' args, string uses ' + seen.size);
  });
});

/* the three scripts must be inlined, and nothing may be fetched at runtime */
['cubicSpline', 'teachingSignal', 'I18N', 'function boot'].forEach(s => {
  if (html.indexOf(s) < 0) fail('inlined source "' + s + '"');
});
const externals = (html.match(/<(?:link|script|img)[^>]*\s(?:src|href)="(https?:\/\/[^"]+)"/g) || []);
console.log('external resources: ' + (externals.length ? externals.join(', ') : 'none'));
externals.forEach(u => { if (!/fonts\.(googleapis|gstatic)\.com/.test(u)) fail('unexpected external ' + u); });

/* the JavaScript exponent-on-negation trap */
if (/-\s*[A-Za-z0-9_.()\[\]]+\s*\*\*/.test(fs.readFileSync('src/signals.js', 'utf8'))) fail('"-x ** 2" pattern in signals.js');

console.log(bad ? `\n${bad} problem(s)` : '\nall static checks passed');
process.exit(bad ? 1 : 0);

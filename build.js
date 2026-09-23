/* build.js — inline every source file into a single index.html */
'use strict';
const fs = require('fs');
const path = require('path');

const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');

let html = read('src/index.template.html');
const parts = {
  '/*__CSS__*/': read('src/style.css'),
  '/*__EMD__*/': read('src/emd.core.js'),
  '/*__SIGNALS__*/': read('src/signals.js'),
  '/*__I18N__*/': read('src/i18n.js'),
  '/*__APP__*/': read('src/app.js')
};
for (const k of Object.keys(parts)) {
  if (html.indexOf(k) < 0) throw new Error('placeholder missing: ' + k);
  /* guard against a stray </script> inside the sources */
  if (/<\/script/i.test(parts[k])) throw new Error('source contains </script>: ' + k);
  html = html.replace(k, () => parts[k]);
}
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html written — ' + (Buffer.byteLength(html) / 1024).toFixed(1) + ' kB');

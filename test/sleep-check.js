'use strict';
const E = require('../src/emd.core.js');
const S = require('../src/signals.js');

console.log('Tab 2 — IMF structure of each stage (fs = 100 Hz, N = 1024, no noise)');
for (const st of S.SLEEP_STAGES) {
  const sig = S.sleepSignal(st, 0);
  const d = E.emd(sig.y, 7);
  const parts = d.imfs.map((c, k) => {
    const f = E.zeroCrossingFreq(c, sig.fs);
    return `IMF${k + 1} ${f.toFixed(1)}Hz/${E.peakAmp(c).toFixed(0)}uV/${S.bandOf(f)}`;
  });
  console.log(`  ${st.toUpperCase().padEnd(5)} peak ${E.peakAmp(sig.y).toFixed(0).padStart(3)}uV  ${d.imfs.length} IMFs  ` + parts.join('  '));
}

console.log('\nTab 2 — the noise demonstration: does noise really land in IMF1?');
const base = S.sleepSignal('n2', 0);
const dBase = E.emd(base.y, 7);
const e0 = E.energy(dBase.imfs[0]), eTot0 = E.energy(base.y);
console.log(`  noise    IMF1 freq   IMF1 peak   IMF1 share of total energy`);
for (const nl of [0, 3, 8, 15, 25]) {
  const sig = S.sleepSignal('n2', nl);
  const d = E.emd(sig.y, 7);
  const f = E.zeroCrossingFreq(d.imfs[0], sig.fs);
  const share = E.energy(d.imfs[0]) / E.energy(sig.y) * 100;
  console.log(`  ${String(nl).padStart(5)}    ${f.toFixed(1).padStart(6)} Hz  ${E.peakAmp(d.imfs[0]).toFixed(1).padStart(7)} uV   ${share.toFixed(1).padStart(5)} %`);
}

console.log('\nTab 2 — N2: are the spindles and the K-complex visible in the IMFs?');
{
  const sig = S.sleepSignal('n2', 0);
  const d = E.emd(sig.y, 7);
  d.imfs.forEach((c, k) => {
    const f = E.zeroCrossingFreq(c, sig.fs);
    /* where is this IMF strongest? */
    let bi = 0;
    for (let i = 0; i < c.length; i++) if (Math.abs(c[i]) > Math.abs(c[bi])) bi = i;
    console.log(`  IMF${k + 1}: ${f.toFixed(1)} Hz, strongest at t = ${(bi / sig.fs).toFixed(2)} s ` +
                `(spindles at 2.3 s and 7.4 s, K-complex at 5.0 s)`);
  });
}

console.log('\nTab 3 — instantaneous frequency at the spindle (t0 = 4.0 s, f0 = 13 Hz)');
{
  const sig = S.spindleSignal(4.0, 13);
  const d = E.emd(sig.y, 7);
  const h = E.hilbert(d.imfs[0], sig.fs);
  const i0 = Math.round(4.0 * sig.fs);
  let sf = 0, n = 0;
  for (let i = i0 - 15; i <= i0 + 15; i++) { sf += h.freq[i]; n++; }
  console.log(`  IMF1 mean instantaneous frequency around t0 = ${(sf / n).toFixed(2)} Hz (target 13.00)`);
  console.log(`  IMF1 instantaneous amplitude at t0 = ${h.amp[i0].toFixed(1)} uV (spindle amplitude 26)`);
}

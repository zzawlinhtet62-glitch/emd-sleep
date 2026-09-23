'use strict';
const E = require('../src/emd.core.js');
const S = require('../src/signals.js');

function report(mode) {
  E.CFG.boundary = mode;
  const T = S.testSignal();
  const d = E.emd(T.y, 8);
  const c1 = E.correlation(d.imfs[0], T.fast, 80, T.n - 80);
  const c2 = d.imfs.length > 1 ? E.correlation(d.imfs[1], T.slow, 80, T.n - 80) : NaN;
  let eTail = 0, eTot = E.energy(T.y);
  for (let k = 2; k < d.imfs.length; k++) eTail += E.energy(d.imfs[k]);
  eTail += E.energy(d.residue);

  /* mid-signal amplitude accuracy */
  let p1 = 0, p2 = 0;
  for (let i = 80; i < T.n - 80; i++) {
    p1 = Math.max(p1, Math.abs(d.imfs[0][i]));
    if (d.imfs[1]) p2 = Math.max(p2, Math.abs(d.imfs[1][i]));
  }

  /* teaching signal rounds (check applies to the candidate h) */
  const G = S.teachingSignal();
  let h = Float64Array.from(G.y), rounds = [];
  for (let r = 1; r <= 10; r++) {
    h = E.siftOnce(h).hNew;
    const c = E.imfCheck(h);
    rounds.push(c.sym);
    if (c.ok) break;
  }

  /* sleep stage: how many IMFs, any absurd amplitudes? */
  const n2 = S.sleepSignal('n2', 0);
  const dn2 = E.emd(n2.y, 8);
  const pkIn = E.peakAmp(n2.y);
  let pkMax = 0;
  dn2.imfs.forEach(c => pkMax = Math.max(pkMax, E.peakAmp(c)));

  console.log(`\nboundary = ${mode}`);
  console.log(`  IMFs = ${d.imfs.length}   corr(IMF1,13Hz) = ${c1.toFixed(6)}   corr(IMF2,1.5Hz) = ${c2.toFixed(6)}`);
  console.log(`  mid-signal peak  IMF1 = ${p1.toFixed(3)} (true 3.000)   IMF2 = ${p2.toFixed(3)} (true 5.000)`);
  console.log(`  leftover energy in IMF3+/residue = ${(eTail / eTot * 100).toFixed(3)}%`);
  console.log(`  teaching rounds = ${rounds.length}  [${rounds.map(v => (v * 100).toFixed(1) + '%').join(' -> ')}]`);
  console.log(`  N2 stage: ${dn2.imfs.length} IMFs, input peak ${pkIn.toFixed(1)} uV, largest IMF peak ${pkMax.toFixed(1)} uV`);
}
report('mirror');
report('linear');

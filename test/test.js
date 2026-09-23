/* ============================================================
   test/test.js — verification suite required by PROMPT.md §5
   Run:  node test/test.js
   ============================================================ */
'use strict';
const E = require('../src/emd.core.js');
const S = require('../src/signals.js');

let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  if (ok) pass++; else fail++;
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}\n        ${detail}`);
}
function hr(title) { console.log('\n' + title + '\n' + '-'.repeat(64)); }

/* ---------- 0. spline sanity (the easiest thing to get wrong) */
hr('0. cubic spline self-check');
{
  /* a natural cubic spline reproduces any cubic exactly only if
     the natural boundary matches, so test with a function whose
     2nd derivative vanishes at the ends: sin over a full period */
  const xs = [], ys = [];
  for (let i = 0; i <= 20; i++) { const x = i / 20 * Math.PI; xs.push(x); ys.push(Math.sin(x)); }
  const xq = [], truth = [];
  for (let i = 0; i <= 200; i++) { const x = i / 200 * Math.PI; xq.push(x); truth.push(Math.sin(x)); }
  const got = E.cubicSpline(xs, ys, xq);
  let err = 0;
  for (let i = 0; i < xq.length; i++) err = Math.max(err, Math.abs(got[i] - truth[i]));
  check('spline interpolates sin(x) on [0,pi]', err < 1e-5, `max error = ${err.toExponential(2)} (tol 1e-5)`);

  /* exactness at the knots */
  let knotErr = 0;
  const atKnots = E.cubicSpline(xs, ys, xs);
  for (let i = 0; i < xs.length; i++) knotErr = Math.max(knotErr, Math.abs(atKnots[i] - ys[i]));
  check('spline passes through every knot', knotErr < 1e-12, `max error = ${knotErr.toExponential(2)} (tol 1e-12)`);

  /* a straight line must come back as a straight line */
  const lx = [0, 3, 7, 11, 20], ly = lx.map(x => 2 * x - 5);
  const lq = [], lg = E.cubicSpline(lx, ly, (() => { const a = []; for (let i = 0; i <= 20; i++) a.push(i); return a; })());
  let lerr = 0;
  for (let i = 0; i <= 20; i++) lerr = Math.max(lerr, Math.abs(lg[i] - (2 * i - 5)));
  check('spline reproduces a straight line', lerr < 1e-12, `max error = ${lerr.toExponential(2)} (tol 1e-12)`);
}

/* ---------- FFT round trip ---------------------------------- */
hr('0b. FFT self-check');
{
  const N = 256;
  const re = new Float64Array(N), im = new Float64Array(N);
  const orig = new Float64Array(N);
  for (let i = 0; i < N; i++) { orig[i] = Math.sin(2 * Math.PI * 7 * i / N) + 0.3 * Math.cos(2 * Math.PI * 31 * i / N); re[i] = orig[i]; }
  E.fft(re, im); E.ifft(re, im);
  let err = 0;
  for (let i = 0; i < N; i++) err = Math.max(err, Math.abs(re[i] - orig[i]));
  check('fft -> ifft round trip', err < 1e-12, `max error = ${err.toExponential(2)} (tol 1e-12)`);

  const sp = E.spectrum(orig, N);
  let kmax = 0;
  for (let k = 1; k < sp.amp.length; k++) if (sp.amp[k] > sp.amp[kmax]) kmax = k;
  check('spectrum finds the 7 Hz line with amplitude 1',
    Math.abs(sp.freq[kmax] - 7) < 1e-9 && Math.abs(sp.amp[kmax] - 1) < 1e-9,
    `peak at ${sp.freq[kmax].toFixed(3)} Hz, amplitude ${sp.amp[kmax].toFixed(6)}`);
}

/* ---------- test signal: 13 Hz (A=3) + 1.5 Hz (A=5) --------- */
hr('Test signal: 3*sin(2pi*13t) + 5*sin(2pi*1.5t), fs = 100, N = 1024');
const T = S.testSignal();
const dec = E.emd(T.y, 8);
console.log(`  EMD produced ${dec.imfs.length} IMF(s) + residue`);
dec.imfs.forEach((c, k) => {
  console.log(`    IMF${k + 1}: zero-crossing freq = ${E.zeroCrossingFreq(c, T.fs).toFixed(2)} Hz, peak = ${E.peakAmp(c).toFixed(3)}`);
});

/* 1. separation */
hr('1. Separation: corr(IMF1, 13 Hz component) > 0.99');
{
  const r = E.correlation(dec.imfs[0], T.fast, 80, T.n - 80);
  check('correlation after trimming 80 samples at each end', r > 0.99, `r = ${r.toFixed(6)}`);
  const r2 = dec.imfs.length > 1 ? E.correlation(dec.imfs[1], T.slow, 80, T.n - 80) : NaN;
  console.log(`        (informational) corr(IMF2, 1.5 Hz component) = ${r2.toFixed(6)}`);
}

/* 2. reconstruction */
hr('2. Reconstruction: max| sum(IMF) + residue - signal | < 1e-12');
{
  let maxErr = 0;
  for (let i = 0; i < T.n; i++) {
    let s = dec.residue[i];
    for (let k = 0; k < dec.imfs.length; k++) s += dec.imfs[k][i];
    maxErr = Math.max(maxErr, Math.abs(s - T.y[i]));
  }
  check('perfect reconstruction', maxErr < 1e-12, `max error = ${maxErr.toExponential(3)}`);
}

/* 3 & 4. instantaneous frequency / amplitude of IMF1 */
hr('3-4. Hilbert transform of IMF1 (middle segment, samples 200-824)');
{
  const h = E.hilbert(dec.imfs[0], T.fs);
  let sf = 0, sa = 0, m = 0;
  for (let i = 200; i < 824; i++) { sf += h.freq[i]; sa += h.amp[i]; m++; }
  const mf = sf / m, ma = sa / m;
  check('mean instantaneous frequency = 13.0 +/- 0.1 Hz', Math.abs(mf - 13) <= 0.1, `f = ${mf.toFixed(4)} Hz`);
  check('mean instantaneous amplitude = 3.0 +/- 0.1', Math.abs(ma - 3) <= 0.1, `A = ${ma.toFixed(4)}`);
}

/* 5. teaching signal convergence */
hr('5. Tab 1 teaching signal: how many sifting rounds until both IMF conditions hold?');
{
  /* Each round: sift once (steps 1-4 of the tab 1 storyboard), then
     test the candidate h against the two IMF conditions (step 5).   */
  const G = S.teachingSignal();
  let h = Float64Array.from(G.y);
  const syms = [];
  let nRounds = 0;
  for (let r = 1; r <= 8; r++) {
    h = E.siftOnce(h).hNew;
    const c = E.imfCheck(h);
    syms.push(c.sym);
    nRounds = r;
    console.log(`    round ${r}: h has ${c.nExt} extrema, ${c.nZero} zero crossings, ` +
                `C1 ${c.c1 ? 'ok' : 'NO'} | max|mean|/amp = ${(c.sym * 100).toFixed(1)}%, ` +
                `C2 ${c.c2 ? 'ok' : 'NO'}  => ${c.ok ? 'this is an IMF' : 'sift again'}`);
    if (c.ok) break;
  }
  let decreasing = true;
  for (let i = 1; i < syms.length; i++) if (syms[i] >= syms[i - 1]) decreasing = false;
  check('needs 3 rounds', nRounds === 3, `converged after ${nRounds} round(s)`);
  check('envelope-mean offset decreases every round', decreasing,
    syms.map(v => (v * 100).toFixed(1) + '%').join('  ->  '));
}

/* 6. Fourier invariance vs Hilbert localisation */
hr('6. Tab 3: move one spindle in time, watch both spectra');
{
  const times = [1.5, 5.0, 8.5];
  const f0 = 13;
  const amps = [], peaks = [];
  for (const t0 of times) {
    const sig = S.spindleSignal(t0, f0);
    const sp = E.spectrum(sig.y, sig.fs);
    let best = 0;
    for (let k = 0; k < sp.freq.length; k++) {
      if (sp.freq[k] >= 12.5 && sp.freq[k] <= 13.5 && sp.amp[k] > best) best = sp.amp[k];
    }
    amps.push(best);

    const d = E.emd(sig.y, 8);
    let bestAmp = -1, bestT = -1;
    for (let k = 0; k < d.imfs.length; k++) {
      const h = E.hilbert(d.imfs[k], sig.fs);
      for (let i = 20; i < sig.n - 20; i++) {
        if (h.freq[i] >= 10 && h.freq[i] <= 16 && h.amp[i] > bestAmp) { bestAmp = h.amp[i]; bestT = i / sig.fs; }
      }
    }
    peaks.push(bestT);
    console.log(`    spindle at ${t0.toFixed(1)}s : Fourier |X(13 Hz)| = ${best.toFixed(4)}   ` +
                `Hilbert brightest point at t = ${bestT.toFixed(2)}s (error ${Math.abs(bestT - t0).toFixed(3)}s)`);
  }
  const mn = Math.min.apply(null, amps), mx = Math.max.apply(null, amps);
  const spread = (mx - mn) / ((mx + mn) / 2) * 100;
  check('Fourier amplitude at 13 Hz varies < 5% when the spindle moves',
    spread < 5, `spread = ${spread.toFixed(2)}%  (${amps.map(a => a.toFixed(4)).join(', ')})`);
  let worst = 0;
  for (let i = 0; i < times.length; i++) worst = Math.max(worst, Math.abs(peaks[i] - times[i]));
  check('Hilbert spectrum locates the spindle to within 0.2 s',
    worst < 0.2, `largest error = ${worst.toFixed(3)} s`);
}

hr('SUMMARY');
console.log(`  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

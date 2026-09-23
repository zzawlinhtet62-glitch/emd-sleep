/* ============================================================
   emd.core.js — Empirical Mode Decomposition / Hilbert-Huang
   Pure vanilla JavaScript. No dependencies.
   Huang et al. (1998), Proc. R. Soc. Lond. A 454, 903-995.
   ============================================================ */
'use strict';
(function (global) {

  /* ---------- 1. natural cubic spline ------------------------
     Solves the tridiagonal system for the second derivatives
     (natural boundary: m[0] = m[n-1] = 0) with the Thomas
     algorithm, then evaluates the piecewise cubic at xq.
     xs must be strictly increasing; xq is assumed ascending
     (a moving interval pointer keeps evaluation O(n+m)).      */
  function cubicSpline(xs, ys, xq) {
    const n = xs.length;
    const out = new Float64Array(xq.length);
    if (n === 0) return out;
    if (n === 1) { out.fill(ys[0]); return out; }
    if (n === 2) {
      const k = (ys[1] - ys[0]) / (xs[1] - xs[0]);
      for (let i = 0; i < xq.length; i++) out[i] = ys[0] + k * (xq[i] - xs[0]);
      return out;
    }

    const h = new Float64Array(n - 1);
    for (let i = 0; i < n - 1; i++) h[i] = xs[i + 1] - xs[i];

    const sub = new Float64Array(n), diag = new Float64Array(n),
          sup = new Float64Array(n), rhs = new Float64Array(n);
    for (let i = 1; i < n - 1; i++) {
      sub[i]  = h[i - 1];
      diag[i] = 2 * (h[i - 1] + h[i]);
      sup[i]  = h[i];
      rhs[i]  = 6 * ((ys[i + 1] - ys[i]) / h[i] - (ys[i] - ys[i - 1]) / h[i - 1]);
    }

    const cp = new Float64Array(n), dp = new Float64Array(n), m = new Float64Array(n);
    cp[1] = sup[1] / diag[1];
    dp[1] = rhs[1] / diag[1];
    for (let i = 2; i < n - 1; i++) {
      const den = diag[i] - sub[i] * cp[i - 1];
      cp[i] = sup[i] / den;
      dp[i] = (rhs[i] - sub[i] * dp[i - 1]) / den;
    }
    m[n - 2] = dp[n - 2];
    for (let i = n - 3; i >= 1; i--) m[i] = dp[i] - cp[i] * m[i + 1];

    let j = 0;
    for (let q = 0; q < xq.length; q++) {
      const x = xq[q];
      while (j < n - 2 && x > xs[j + 1]) j++;
      while (j > 0 && x < xs[j]) j--;
      const hj = h[j];
      const A = (xs[j + 1] - x) / hj, B = (x - xs[j]) / hj;
      out[q] = A * ys[j] + B * ys[j + 1] +
               ((A * A * A - A) * m[j] + (B * B * B - B) * m[j + 1]) * hj * hj / 6;
    }
    return out;
  }

  /* ---------- 2. local extrema -------------------------------
     Plateaux are collapsed to their centre so that a flat top
     yields exactly one maximum.                                */
  function findExtrema(y) {
    const maxI = [], minI = [], n = y.length;
    for (let i = 1; i < n - 1; i++) {
      if (y[i] > y[i - 1] && y[i] >= y[i + 1]) {
        if (y[i] === y[i + 1]) {
          let k = i + 1;
          while (k < n - 1 && y[k] === y[i]) k++;
          if (y[k] < y[i]) maxI.push((i + k - 1) >> 1);
          i = k - 1;
        } else maxI.push(i);
      } else if (y[i] < y[i - 1] && y[i] <= y[i + 1]) {
        if (y[i] === y[i + 1]) {
          let k = i + 1;
          while (k < n - 1 && y[k] === y[i]) k++;
          if (y[k] > y[i]) minI.push((i + k - 1) >> 1);
          i = k - 1;
        } else minI.push(i);
      }
    }
    return { maxI, minI };
  }

  /* ---------- 3. envelopes -----------------------------------
     The two envelopes are cubic splines through the maxima and
     through the minima.  Both ends are mirrored (Rilling's
     boundary conditions): the extrema near an edge are reflected
     about the outermost extremum -- or about the edge sample
     itself when the signal already overshoots that extremum --
     so the spline interpolates across [0, n-1] instead of
     extrapolating.  Skipping this makes the first and last ~10%
     of every envelope visibly wrong: the classic "end effect".  */
  const N_MIRROR = 2;
  const CFG = { boundary: 'linear' };   /* 'linear' | 'mirror' | 'none' */

  function takeRev(arr, from, count) {
    const out = [];
    for (let i = Math.min(from + count, arr.length) - 1; i >= from; i--) out.push(arr[i]);
    return out;                       /* descending order */
  }
  function takeRevEnd(arr, skipFromEnd, count) {
    const last = arr.length - 1 - skipFromEnd;
    const out = [];
    for (let i = last; i > last - count && i >= 0; i--) out.push(arr[i]);
    return out;                       /* descending order */
  }

  /* Returns mirrored knot sets for both envelopes at once. */
  function extendExtrema(y, maxI, minI) {
    const n = y.length, lx = n - 1, nb = N_MIRROR;
    let lmax, lmin, lsym, rmax, rmin, rsym;

    /* ----- left edge ----- */
    if (maxI[0] < minI[0]) {
      if (y[0] > y[minI[0]]) {
        lmax = takeRev(maxI, 1, nb); lmin = takeRev(minI, 0, nb); lsym = maxI[0];
      } else {
        lmax = takeRev(maxI, 0, nb); lmin = takeRev(minI, 0, nb - 1).concat([0]); lsym = 0;
      }
    } else {
      if (y[0] < y[maxI[0]]) {
        lmax = takeRev(maxI, 0, nb); lmin = takeRev(minI, 1, nb); lsym = minI[0];
      } else {
        lmax = takeRev(maxI, 0, nb - 1).concat([0]); lmin = takeRev(minI, 0, nb); lsym = 0;
      }
    }

    /* ----- right edge ----- */
    if (maxI[maxI.length - 1] < minI[minI.length - 1]) {
      if (y[lx] < y[maxI[maxI.length - 1]]) {
        rmax = takeRevEnd(maxI, 0, nb); rmin = takeRevEnd(minI, 1, nb); rsym = minI[minI.length - 1];
      } else {
        rmax = [lx].concat(takeRevEnd(maxI, 0, nb - 1)); rmin = takeRevEnd(minI, 0, nb); rsym = lx;
      }
    } else {
      if (y[lx] > y[minI[minI.length - 1]]) {
        rmax = takeRevEnd(maxI, 1, nb); rmin = takeRevEnd(minI, 0, nb); rsym = maxI[maxI.length - 1];
      } else {
        rmax = takeRevEnd(maxI, 0, nb); rmin = [lx].concat(takeRevEnd(minI, 0, nb - 1)); rsym = lx;
      }
    }

    function build(mirrorL, core, mirrorR) {
      const xs = [], ys = [];
      for (let i = mirrorL.length - 1; i >= 0; i--) {      /* ascending */
        xs.push(2 * lsym - mirrorL[i]); ys.push(y[mirrorL[i]]);
      }
      for (let i = 0; i < core.length; i++) { xs.push(core[i]); ys.push(y[core[i]]); }
      for (let i = 0; i < mirrorR.length; i++) {
        xs.push(2 * rsym - mirrorR[i]); ys.push(y[mirrorR[i]]);
      }
      /* strictly increasing abscissae */
      const X = [], Y = [];
      for (let i = 0; i < xs.length; i++) {
        if (!X.length || xs[i] > X[X.length - 1]) { X.push(xs[i]); Y.push(ys[i]); }
      }
      /* guarantee the knots span [0, n-1]: if the mirror did not
         reach past an edge, reflect the outermost knot about it */
      if (X[0] > 0) {
        const s = X.length > 1 ? (Y[1] - Y[0]) / (X[1] - X[0]) : 0;
        X.unshift(-X[0]); Y.unshift(Y[0] - s * (X[1] - X[0]) * 2);
      }
      if (X[X.length - 1] < lx) {
        const m = X.length;
        const s = m > 1 ? (Y[m - 1] - Y[m - 2]) / (X[m - 1] - X[m - 2]) : 0;
        const d = lx - X[m - 1];
        X.push(lx + d); Y.push(Y[m - 1] + s * 2 * d);
      }
      return { X, Y };
    }

    return {
      up: build(lmax, maxI, rmax),
      lo: build(lmin, minI, rmin)
    };
  }

  function splineAt(knots, n) {
    const xq = new Float64Array(n);
    for (let i = 0; i < n; i++) xq[i] = i;
    return cubicSpline(knots.X, knots.Y, xq);
  }

  /* Alternative boundary treatment: linear extrapolation from
     the two outermost extrema of the same kind, clamped so the
     envelope neither crosses the signal at the edge nor leaves
     the global range.  Kept switchable because the two schemes
     trade off differently (see test/compare-boundary.js).      */
  function extendLinear(y, idx, isUpper) {
    const n = y.length;
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < n; i++) { if (y[i] < minY) minY = y[i]; if (y[i] > maxY) maxY = y[i]; }
    const X = [], Y = [];
    if (idx[0] !== 0) {
      let v;
      if (idx.length >= 2) {
        const sl = (y[idx[1]] - y[idx[0]]) / (idx[1] - idx[0]);
        v = y[idx[0]] - sl * idx[0];
      } else v = y[idx[0]];
      v = isUpper ? Math.min(Math.max(v, y[0]), maxY) : Math.max(Math.min(v, y[0]), minY);
      X.push(0); Y.push(v);
    }
    for (let i = 0; i < idx.length; i++) { X.push(idx[i]); Y.push(y[idx[i]]); }
    const last = idx[idx.length - 1];
    if (last !== n - 1) {
      let v;
      if (idx.length >= 2) {
        const p = idx[idx.length - 2];
        const sl = (y[last] - y[p]) / (last - p);
        v = y[last] + sl * (n - 1 - last);
      } else v = y[last];
      v = isUpper ? Math.min(Math.max(v, y[n - 1]), maxY) : Math.max(Math.min(v, y[n - 1]), minY);
      X.push(n - 1); Y.push(v);
    }
    return { X, Y };
  }

  /* Both envelopes in one call (what the sifting loop uses). */
  function envelopes(y, maxI, minI) {
    const n = y.length;
    if (maxI.length === 0 || minI.length === 0 || maxI.length + minI.length < 3) {
      const flat = new Float64Array(n), flat2 = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        flat[i] = y[0] + (y[n - 1] - y[0]) * i / (n - 1);
        flat2[i] = flat[i];
      }
      return { up: flat, lo: flat2 };
    }
    if (CFG.boundary === 'none') {
      /* no boundary treatment at all: the spline is built from the
         extrema alone, so beyond the outermost ones it extrapolates
         freely. Kept so the end effect can be shown rather than
         merely described. */
      const kx = { X: [], Y: [] }, kn = { X: [], Y: [] };
      for (let i = 0; i < maxI.length; i++) { kx.X.push(maxI[i]); kx.Y.push(y[maxI[i]]); }
      for (let i = 0; i < minI.length; i++) { kn.X.push(minI[i]); kn.Y.push(y[minI[i]]); }
      return { up: splineAt(kx, n), lo: splineAt(kn, n) };
    }
    if (CFG.boundary === 'linear') {
      return {
        up: splineAt(extendLinear(y, maxI, true), n),
        lo: splineAt(extendLinear(y, minI, false), n)
      };
    }
    const k = extendExtrema(y, maxI, minI);
    return { up: splineAt(k.up, n), lo: splineAt(k.lo, n) };
  }

  /* Public single-envelope helper, kept for the API in the spec.
     isUpper is optional; when omitted it is inferred from the
     mean level of the given extrema.                           */
  function envelope(y, idx, isUpper) {
    const ex = findExtrema(y);
    if (isUpper === undefined) {
      let sExt = 0, sAll = 0;
      for (let i = 0; i < idx.length; i++) sExt += y[idx[i]];
      for (let i = 0; i < y.length; i++) sAll += y[i];
      isUpper = (idx.length ? sExt / idx.length : 0) >= sAll / y.length;
    }
    const e = envelopes(y, isUpper ? idx : ex.maxI, isUpper ? ex.minI : idx);
    return isUpper ? e.up : e.lo;
  }

  /* ---------- 4. one sifting pass ---------------------------- */
  function siftOnce(h) {
    const { maxI, minI } = findExtrema(h);
    const e = envelopes(h, maxI, minI);
    const up = e.up, lo = e.lo;
    const n = h.length;
    const mean = new Float64Array(n), hNew = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      mean[i] = (up[i] + lo[i]) / 2;
      hNew[i] = h[i] - mean[i];
    }
    return { up, lo, mean, hNew, maxI, minI };
  }

  /* ---------- zero crossings --------------------------------- */
  function countZeroCrossings(y) {
    let c = 0;
    for (let i = 1; i < y.length; i++) {
      if ((y[i - 1] < 0 && y[i] > 0) || (y[i - 1] > 0 && y[i] < 0)) c++;
      else if (y[i] === 0 && y[i - 1] !== 0) {
        let k = i + 1;
        while (k < y.length && y[k] === 0) k++;
        if (k < y.length && Math.sign(y[k]) !== Math.sign(y[i - 1])) c++;
        i = k;
      }
    }
    return c;
  }

  /* ---------- 5. the two IMF conditions ----------------------
     C1  |#extrema - #zero crossings| <= 1
     C2  max|envelope mean| / signal amplitude < 0.05           */
  function imfCheck(h) {
    const s = siftOnce(h);
    const n = h.length;
    const nExt = s.maxI.length + s.minI.length;
    const nZero = countZeroCrossings(h);
    const c1 = Math.abs(nExt - nZero) <= 1;

    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < n; i++) { if (h[i] < mn) mn = h[i]; if (h[i] > mx) mx = h[i]; }
    const amp = (mx - mn) / 2;

    let mmax = 0;
    for (let i = 0; i < n; i++) { const a = Math.abs(s.mean[i]); if (a > mmax) mmax = a; }

    const sym = amp > 0 ? mmax / amp : 0;
    const c2 = sym < 0.05;
    return { nExt, nZero, c1, c2, sym, ok: c1 && c2,
             maxI: s.maxI, minI: s.minI, up: s.up, lo: s.lo, mean: s.mean, hNew: s.hNew };
  }

  /* ---------- 6. full sifting (SD stopping criterion) --------- */
  const SD_THRESHOLD = 0.2;
  const MAX_SIFT = 12;

  function sift(y) {
    let h = Float64Array.from(y);
    for (let it = 0; it < MAX_SIFT; it++) {
      const s = siftOnce(h);
      if (s.maxI.length + s.minI.length < 3) break;
      let num = 0, den = 0;
      for (let i = 0; i < h.length; i++) {
        const d = h[i] - s.hNew[i];
        num += d * d;
        den += h[i] * h[i] + 1e-12;
      }
      h = s.hNew;
      if (num / den < SD_THRESHOLD) break;
    }
    return h;
  }

  /* ---------- 7. EMD ----------------------------------------- */
  function emd(y, maxImf) {
    maxImf = maxImf || 8;
    const n = y.length;
    let r = Float64Array.from(y);
    const imfs = [];
    let e0 = 0;
    for (let i = 0; i < n; i++) e0 += y[i] * y[i];

    while (imfs.length < maxImf) {
      const ex = findExtrema(r);
      if (ex.maxI.length + ex.minI.length < 3) break;
      const imf = sift(r);
      const next = new Float64Array(n);
      let e = 0;
      for (let i = 0; i < n; i++) { next[i] = r[i] - imf[i]; e += next[i] * next[i]; }
      imfs.push(imf);
      r = next;
      if (e < 1e-10 * e0) break;
    }
    return { imfs, residue: r };
  }

  /* ---------- 7b. EEMD ---------------------------------------
     Ensemble EMD (Wu & Huang 2009). Each ensemble member is the
     signal plus a fresh realisation of finite-amplitude white
     noise; the members are decomposed independently and the
     IMFs averaged index by index. The noise fills the gaps that
     make an intermittent signal produce mode mixing, and it
     cancels in the average.
     The averaged IMFs no longer sum to the signal exactly, so
     the residue returned here is y - sum(IMFs), which keeps the
     reconstruction exact for display.                          */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function eemd(y, opts) {
    opts = opts || {};
    const ensemble = Math.max(1, opts.ensemble || 40);
    const maxImf = opts.maxImf || 8;
    const ratio = opts.noiseRatio === undefined ? 0.2 : opts.noiseRatio;
    const n = y.length;

    let mean = 0;
    for (let i = 0; i < n; i++) mean += y[i];
    mean /= n;
    let sd = 0;
    for (let i = 0; i < n; i++) { const d = y[i] - mean; sd += d * d; }
    sd = Math.sqrt(sd / n);
    const amp = ratio * sd;

    const acc = [];
    for (let k = 0; k < maxImf; k++) acc.push(new Float64Array(n));
    const hits = new Int32Array(maxImf);
    const rnd = mulberry32(opts.seed === undefined ? 20260923 : opts.seed);
    const work = new Float64Array(n);

    for (let e = 0; e < ensemble; e++) {
      for (let i = 0; i < n; i++) {
        /* sum of four uniforms: close enough to Gaussian here */
        const u = rnd() + rnd() + rnd() + rnd() - 2;
        work[i] = y[i] + u * amp * 0.8660254;
      }
      const d = emd(work, maxImf);
      for (let k = 0; k < d.imfs.length; k++) {
        const c = d.imfs[k], a = acc[k];
        for (let i = 0; i < n; i++) a[i] += c[i];
        hits[k]++;
      }
    }

    const imfs = [];
    for (let k = 0; k < maxImf; k++) {
      if (!hits[k]) break;
      const a = acc[k];
      for (let i = 0; i < n; i++) a[i] /= ensemble;
      imfs.push(a);
    }
    /* trim trailing modes that almost every member failed to produce */
    while (imfs.length > 1 && hits[imfs.length - 1] < ensemble * 0.5) imfs.pop();

    const residue = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let s = y[i];
      for (let k = 0; k < imfs.length; k++) s -= imfs[k][i];
      residue[i] = s;
    }
    return { imfs, residue, ensemble, noiseAmp: amp };
  }

  /* ---------- 8. FFT (iterative radix-2, in place) ------------ */
  function nextPow2(n) { let p = 1; while (p < n) p <<= 1; return p; }

  function fft(re, im) {
    const n = re.length;
    if (n <= 1) return;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len;
      const wr = Math.cos(ang), wi = Math.sin(ang);
      const half = len >> 1;
      for (let i = 0; i < n; i += len) {
        let cwr = 1, cwi = 0;
        for (let k = 0; k < half; k++) {
          const ar = re[i + k], ai = im[i + k];
          const br = re[i + k + half], bi = im[i + k + half];
          const vr = br * cwr - bi * cwi;
          const vi = br * cwi + bi * cwr;
          re[i + k] = ar + vr; im[i + k] = ai + vi;
          re[i + k + half] = ar - vr; im[i + k + half] = ai - vi;
          const nwr = cwr * wr - cwi * wi;
          cwi = cwr * wi + cwi * wr;
          cwr = nwr;
        }
      }
    }
  }

  function ifft(re, im) {
    const n = re.length;
    for (let i = 0; i < n; i++) im[i] = -im[i];
    fft(re, im);
    for (let i = 0; i < n; i++) { re[i] /= n; im[i] = -im[i] / n; }
  }

  /* single-sided amplitude spectrum */
  function spectrum(x, fs) {
    const n = x.length, N = nextPow2(n);
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < n; i++) re[i] = x[i];
    fft(re, im);
    const half = (N >> 1) + 1;
    const freq = new Float64Array(half), amp = new Float64Array(half);
    for (let k = 0; k < half; k++) {
      freq[k] = k * fs / N;
      const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / n;
      amp[k] = (k === 0 || k === N >> 1) ? mag : 2 * mag;
    }
    return { freq, amp };
  }

  /* ---------- 9. Hilbert transform ---------------------------
     Analytic signal through the FFT: keep DC and Nyquist,
     double the positive frequencies, zero the negative ones.
     Instantaneous frequency = unwrapped phase difference.      */
  function hilbert(x, fs) {
    const n = x.length, N = nextPow2(n);
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < n; i++) re[i] = x[i];
    fft(re, im);
    const half = N >> 1;
    for (let k = 1; k < half; k++) { re[k] *= 2; im[k] *= 2; }
    for (let k = half + 1; k < N; k++) { re[k] = 0; im[k] = 0; }
    ifft(re, im);

    const amp = new Float64Array(n), phase = new Float64Array(n), freq = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      amp[i] = Math.hypot(re[i], im[i]);
      phase[i] = Math.atan2(im[i], re[i]);
    }
    const TWO_PI = 2 * Math.PI;
    for (let i = 0; i < n - 1; i++) {
      let d = phase[i + 1] - phase[i];
      while (d > Math.PI) d -= TWO_PI;
      while (d < -Math.PI) d += TWO_PI;
      freq[i] = d * fs / TWO_PI;
    }
    freq[n - 1] = n > 1 ? freq[n - 2] : 0;
    return { amp, phase, freq, real: re.subarray(0, n), imag: im.subarray(0, n) };
  }

  /* ---------- helpers used by the UI and the tests ----------- */
  function zeroCrossingFreq(x, fs) {
    return countZeroCrossings(x) * fs / (2 * x.length);
  }

  /* Amplitude-weighted mean instantaneous frequency.
     The zero-crossing rate is fine for a steady oscillation but
     badly biased for an intermittent one: in the quiet stretches
     of a bursty IMF, tiny residual ripple still crosses zero and
     drags the estimate upward (a 12 Hz burst train reads as
     25 Hz). Weighting by a^2 counts a sample only as far as it
     carries energy, which is the physically meaningful measure
     and the one the Hilbert spectrum is built on.              */
  function meanFreq(x, fs) {
    const h = hilbert(x, fs);
    const n = x.length;
    const lo = Math.min(20, Math.floor(n * 0.02));
    let num = 0, den = 0;
    for (let i = lo; i < n - lo; i++) {
      const f = h.freq[i];
      if (!(f > 0) || f > fs / 2) continue;
      const w = h.amp[i] * h.amp[i];
      num += w * f;
      den += w;
    }
    return den > 0 ? num / den : 0;
  }
  function peakAmp(x) {
    let m = 0;
    for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > m) m = a; }
    return m;
  }
  function energy(x) {
    let e = 0;
    for (let i = 0; i < x.length; i++) e += x[i] * x[i];
    return e;
  }
  function correlation(a, b, from, to) {
    from = from || 0; to = (to === undefined) ? a.length : to;
    let ma = 0, mb = 0;
    const m = to - from;
    for (let i = from; i < to; i++) { ma += a[i]; mb += b[i]; }
    ma /= m; mb /= m;
    let sab = 0, saa = 0, sbb = 0;
    for (let i = from; i < to; i++) {
      const da = a[i] - ma, db = b[i] - mb;
      sab += da * db; saa += da * da; sbb += db * db;
    }
    return sab / Math.sqrt(saa * sbb);
  }

  /* Hilbert spectrum: max instantaneous amplitude on a
     time x frequency grid, assembled over all IMFs.           */
  function hilbertSpectrum(imfs, fs, opts) {
    const nT = opts.nT, nF = opts.nF, fMax = opts.fMax;
    const sT = opts.spreadT === undefined ? 1 : opts.spreadT;
    const sF = opts.spreadF === undefined ? 1 : opts.spreadF;
    const n = imfs.length ? imfs[0].length : 0;
    const grid = new Float64Array(nT * nF);
    for (let k = 0; k < imfs.length; k++) {
      const h = hilbert(imfs[k], fs);
      for (let i = 0; i < n; i++) {
        const f = h.freq[i];
        if (!(f > 0) || f >= fMax) continue;
        const ti = Math.min(nT - 1, Math.floor(i / n * nT));
        const fi = Math.min(nF - 1, Math.floor(f / fMax * nF));
        /* one sample is one point; smear it over a couple of cells so a
           continuous ridge reads as a ridge instead of scattered dots */
        for (let df = -sF; df <= sF; df++) {
          const y = fi + df;
          if (y < 0 || y >= nF) continue;
          const wf = 1 - 0.45 * Math.abs(df);
          for (let dt = -sT; dt <= sT; dt++) {
            const x = ti + dt;
            if (x < 0 || x >= nT) continue;
            const v = h.amp[i] * wf * (1 - 0.25 * Math.abs(dt));
            const q = y * nT + x;
            if (v > grid[q]) grid[q] = v;
          }
        }
      }
    }
    return { grid, nT, nF, fMax };
  }

  const EMD = {
    cubicSpline, findExtrema, envelope, envelopes, siftOnce, imfCheck, sift, emd, eemd,
    fft, ifft, spectrum, hilbert, hilbertSpectrum,
    countZeroCrossings, zeroCrossingFreq, meanFreq, peakAmp, energy, correlation,
    nextPow2, SD_THRESHOLD, MAX_SIFT, CFG
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = EMD;
  global.EMD = EMD;

})(typeof globalThis !== 'undefined' ? globalThis : this);

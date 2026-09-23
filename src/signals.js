/* ============================================================
   signals.js — synthetic signals shared by the tests and the UI
   Every waveform is deterministic: the same arguments always
   produce the same samples, so the numbers quoted on the page
   can be reproduced by the Node test suite.
   ============================================================ */
'use strict';
(function (global) {

  /* deterministic PRNG (mulberry32) — no Math.random anywhere */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* approximately normal, via the sum of 4 uniforms */
  function gaussNoise(n, sigma, seed) {
    const r = rng(seed), out = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const u = r() + r() + r() + r() - 2;
      out[i] = u * sigma * 0.8660254;
    }
    return out;
  }
  /* Gaussian window — written without ** on a negated value,
     which is a syntax error in JavaScript. */
  function gauss(t, t0, sd) {
    const a = (t - t0) / sd;
    return Math.exp(-(a * a));
  }
  function timeAxis(n, fs) {
    const t = new Float64Array(n);
    for (let i = 0; i < n; i++) t[i] = i / fs;
    return t;
  }

  /* ---------- tab 1: the teaching signal ---------------------
     Chosen so the sifting process needs several rounds before
     both IMF conditions hold — otherwise the demo would pass
     on round 1 and show nothing.                              */
  function teachingSignal() {
    const fs = 64, n = 256;
    const t = timeAxis(n, fs), y = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const ti = t[i];
      y[i] = 3 * Math.sin(2 * Math.PI * 1.75 * ti)
           + 2.2 * Math.sin(2 * Math.PI * 0.8 * ti + 1)
           + 5 * Math.sin(Math.PI * ti / 4);
    }
    return { t, y, fs, n };
  }

  /* ---------- tab 2: five sleep stages ----------------------- */
  const SLEEP_FS = 100, SLEEP_N = 1024;

  function sleepSignal(stage, noiseLevel) {
    const fs = SLEEP_FS, n = SLEEP_N;
    const t = timeAxis(n, fs), y = new Float64Array(n);
    const dur = n / fs;

    for (let i = 0; i < n; i++) {
      const ti = t[i];
      let v = 0;

      switch (stage) {
        case 'wake': {
          /* 8-13 Hz alpha with slow amplitude modulation
             (alpha bursts), plus ~19 Hz beta. Low voltage. */
          const burst = 0.55 + 0.45 * Math.sin(2 * Math.PI * 0.35 * ti - 0.6);
          v += 24 * burst * Math.sin(2 * Math.PI * 10.2 * ti);
          v += 6 * Math.sin(2 * Math.PI * 11.8 * ti + 2.1);
          v += 3.5 * Math.sin(2 * Math.PI * 19.3 * ti + 0.8);
          v += 5 * Math.sin(2 * Math.PI * 2.2 * ti + 1.4);
          break;
        }
        case 'n1': {
          /* theta takes over while alpha decays away */
          const fade = Math.exp(-ti / 3.2);
          v += 34 * Math.sin(2 * Math.PI * 6.0 * ti);
          v += 26 * fade * Math.sin(2 * Math.PI * 9.8 * ti + 0.5);
          v += 10 * Math.sin(2 * Math.PI * 3.1 * ti + 2.4);
          v += 3 * Math.sin(2 * Math.PI * 16.0 * ti + 1.1);
          break;
        }
        case 'n2': {
          /* background + two sleep spindles + one K-complex */
          v += 20 * Math.sin(2 * Math.PI * 1.1 * ti + 0.4);
          v += 7 * Math.sin(2 * Math.PI * 4.4 * ti + 1.9);
          v += 36 * gauss(ti, 2.3, 0.45) * Math.sin(2 * Math.PI * 13.1 * (ti - 2.3));
          v += 32 * gauss(ti, 7.4, 0.45) * Math.sin(2 * Math.PI * 12.7 * (ti - 7.4));
          /* K-complex: sharp negative deflection then a slower
             positive one */
          const kt = 5.0;
          v += -85 * gauss(ti, kt, 0.13);
          v += 55 * gauss(ti, kt + 0.34, 0.26);
          break;
        }
        case 'n3': {
          /* 0.5-2 Hz slow wave activity, up to ~150 uV */
          v += 95 * Math.sin(2 * Math.PI * 0.8 * ti);
          v += 32 * Math.sin(2 * Math.PI * 1.7 * ti + 1.0);
          v += 22 * Math.sin(2 * Math.PI * 0.45 * ti + 2.6);
          v += 7 * Math.sin(2 * Math.PI * 5.5 * ti + 0.3);
          v += 3 * Math.sin(2 * Math.PI * 11.0 * ti + 1.7);
          break;
        }
        case 'rem': {
          /* low voltage mixed frequency + sawtooth waves */
          v += 24 * Math.sin(2 * Math.PI * 5.6 * ti);
          v += 10 * Math.sin(2 * Math.PI * 7.4 * ti + 1.3);
          /* sawtooth train in the middle of the epoch */
          const win = gauss(ti, dur * 0.52, 1.5);
          const ph = (2.6 * ti) % 1;
          v += 26 * win * (2 * ph - 1);
          v += 3 * Math.sin(2 * Math.PI * 15.5 * ti + 0.9);
          break;
        }
      }
      y[i] = v;
    }

    if (noiseLevel > 0) {
      const nz = gaussNoise(n, noiseLevel, 20260923);
      for (let i = 0; i < n; i++) y[i] += nz[i];
    }
    return { t, y, fs, n };
  }

  const SLEEP_STAGES = ['wake', 'n1', 'n2', 'n3', 'rem'];

  /* ---------- tab 3: one spindle on a slow background --------- */
  function spindleSignal(t0, f0) {
    const fs = SLEEP_FS, n = SLEEP_N;
    const t = timeAxis(n, fs), y = new Float64Array(n);
    const nz = gaussNoise(n, 0.25, 777);
    for (let i = 0; i < n; i++) {
      const ti = t[i];
      let v = 0;
      v += 9 * Math.sin(2 * Math.PI * 0.8 * ti + 0.3);
      v += 4.5 * Math.sin(2 * Math.PI * 3.6 * ti + 1.7);
      v += 26 * gauss(ti, t0, 0.42) * Math.sin(2 * Math.PI * f0 * (ti - t0));
      y[i] = v + nz[i];
    }
    return { t, y, fs, n };
  }

  /* ---------- mode mixing demo -------------------------------
     A slow carrier plus a fast burst that is only present part
     of the time. Intermittency is exactly what makes the sifting
     process reach different decisions in different segments, so
     this is the textbook way to produce mode mixing.           */
  function mixingSignal(nBursts, burstFreq) {
    const fs = SLEEP_FS, n = SLEEP_N;
    nBursts = nBursts === undefined ? 3 : nBursts;
    burstFreq = burstFreq === undefined ? 12 : burstFreq;
    const t = timeAxis(n, fs), y = new Float64Array(n);
    const slow = new Float64Array(n), fast = new Float64Array(n);
    const dur = n / fs;
    for (let i = 0; i < n; i++) {
      const ti = t[i];
      slow[i] = 5 * Math.sin(2 * Math.PI * 1.0 * ti);
      let b = 0;
      for (let k = 0; k < nBursts; k++) {
        const c = dur * (k + 0.5) / nBursts;
        b += gauss(ti, c, 0.30);
      }
      fast[i] = 2.2 * Math.min(1, b) * Math.sin(2 * Math.PI * burstFreq * ti);
      y[i] = slow[i] + fast[i];
    }
    return { t, y, slow, fast, fs, n };
  }

  /* ---------- the scrolling hero strip -----------------------
     One period is built and then tiled three times, so the buffer
     repeats sample for sample however irregular its content looks.
     Every continuous component is an integer multiple of 1/period
     (including the slow amplitude modulation, which is a product
     of two harmonics and therefore still harmonic), and the noise
     and the transient graphoelements live inside that one period.
     Only the middle period is displayed, which keeps the visible
     slice clear of the end effects at the buffer edges.
     The point of the events is that the trace should not look the
     same twice as it goes past: slow waves wax and wane, spindles
     and K-complexes arrive and pass.                            */
  const HERO_PERIOD = 8192;                       /* 81.92 s at 100 Hz */

  function heroSignal() {
    const fs = SLEEP_FS, P = HERO_PERIOD, n = P * 3;
    const f0 = fs / P;                            /* 0.012207 Hz */
    const one = new Float64Array(P);
    const nz = gaussNoise(P, 2.2, 7331);

    /* continuous background, every k an integer */
    const slow = [
      { k: 64, a: 74, ph: 0.0 },                  /* 0.781 Hz */
      { k: 136, a: 26, ph: 1.0 },                 /* 1.660 Hz */
      { k: 27, a: 19, ph: 2.6 }                   /* 0.330 Hz */
    ];
    const fast = [
      { k: 451, a: 6, ph: 0.3 },                  /* 5.505 Hz */
      { k: 893, a: 3, ph: 1.7 }                   /* 10.900 Hz */
    ];
    /* the slow band breathes, so the page never looks uniform */
    const breathe = { k: 5, depth: 0.45 };        /* 0.061 Hz, ~16 s */

    /* graphoelements, placed well away from the wrap */
    const spindles = [
      { t: 12.5, f: 13.1, a: 30 },
      { t: 31.0, f: 12.6, a: 26 },
      { t: 58.2, f: 13.4, a: 32 }
    ];
    const kComplexes = [22.0, 47.5, 69.0];

    for (let i = 0; i < P; i++) {
      const ti = i / fs;
      const env = 1 + breathe.depth * Math.sin(2 * Math.PI * breathe.k * f0 * ti);
      let v = 0;
      for (let j = 0; j < slow.length; j++) {
        v += env * slow[j].a * Math.sin(2 * Math.PI * slow[j].k * f0 * ti + slow[j].ph);
      }
      for (let j = 0; j < fast.length; j++) {
        v += fast[j].a * Math.sin(2 * Math.PI * fast[j].k * f0 * ti + fast[j].ph);
      }
      for (let j = 0; j < spindles.length; j++) {
        const sp = spindles[j];
        v += sp.a * gauss(ti, sp.t, 0.42) * Math.sin(2 * Math.PI * sp.f * (ti - sp.t));
      }
      for (let j = 0; j < kComplexes.length; j++) {
        const kt = kComplexes[j];
        v += -70 * gauss(ti, kt, 0.13);
        v += 46 * gauss(ti, kt + 0.34, 0.26);
      }
      one[i] = v + nz[i];
    }

    const t = timeAxis(n, fs), y = new Float64Array(n);
    for (let i = 0; i < n; i++) y[i] = one[i % P];
    return { t, y, fs, n, period: P };
  }

  /* ---------- envelope / end-effect demo ---------------------
     Amplitude rises linearly, so the true upper envelope is
     known in closed form and the error of each boundary rule
     can be measured rather than argued about.                 */
  function amSignal(n) {
    const fs = SLEEP_FS, full = SLEEP_N;
    n = n || full;
    const t = timeAxis(n, fs), y = new Float64Array(n), env = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const ti = t[i];
      const A = 5 * (1 + 0.9 * ti / (full / fs));
      env[i] = A;
      y[i] = A * Math.sin(2 * Math.PI * 0.9 * ti + 0.7);
    }
    return { t, y, env, fs, n };
  }

  /* ---------- tab 4: three sinusoids you can dial ------------ */
  function labSignal(comps, noiseLevel) {
    const fs = SLEEP_FS, n = SLEEP_N;
    const t = timeAxis(n, fs), y = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let v = 0;
      for (let k = 0; k < comps.length; k++) {
        v += comps[k].a * Math.sin(2 * Math.PI * comps[k].f * t[i] + k * 0.7);
      }
      y[i] = v;
    }
    if (noiseLevel > 0) {
      const nz = gaussNoise(n, noiseLevel, 4242);
      for (let i = 0; i < n; i++) y[i] += nz[i];
    }
    return { t, y, fs, n };
  }

  /* ---------- tab 1 of the new chapters: extrema ------------- */
  function extremaSignal(f2, a2) {
    const fs = 64, n = 256;
    const t = timeAxis(n, fs), y = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      y[i] = 4 * Math.sin(2 * Math.PI * 1.2 * t[i])
           + a2 * Math.sin(2 * Math.PI * f2 * t[i] + 0.6);
    }
    return { t, y, fs, n };
  }

  /* ---------- test signal of section 5 ----------------------- */
  function testSignal() {
    const fs = 100, n = 1024;
    const t = timeAxis(n, fs);
    const y = new Float64Array(n), fast = new Float64Array(n), slow = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      fast[i] = 3 * Math.sin(2 * Math.PI * 13 * t[i]);
      slow[i] = 5 * Math.sin(2 * Math.PI * 1.5 * t[i]);
      y[i] = fast[i] + slow[i];
    }
    return { t, y, fast, slow, fs, n };
  }

  /* ---------- EEG frequency bands ----------------------------- */
  const BANDS = [
    { key: 'delta', lo: 0.5, hi: 4 },
    { key: 'theta', lo: 4, hi: 8 },
    { key: 'alpha', lo: 8, hi: 13 },
    { key: 'beta',  lo: 13, hi: 30 },
    { key: 'gamma', lo: 30, hi: 100 }
  ];
  function bandOf(f) {
    for (let i = 0; i < BANDS.length; i++) if (f >= BANDS[i].lo && f < BANDS[i].hi) return BANDS[i].key;
    return f < 0.5 ? 'sub' : 'gamma';
  }

  const SIGNALS = {
    rng, gaussNoise, gauss, timeAxis,
    teachingSignal, sleepSignal, spindleSignal, testSignal, mixingSignal,
    amSignal, labSignal, extremaSignal, heroSignal, HERO_PERIOD,
    SLEEP_STAGES, SLEEP_FS, SLEEP_N, BANDS, bandOf
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = SIGNALS;
  global.SIGNALS = SIGNALS;

})(typeof globalThis !== 'undefined' ? globalThis : this);

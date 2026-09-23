/* ============================================================
   app.js — all interaction. Everything drawn here is computed
   from emd.core.js at the moment you interact with it.
   ============================================================ */
'use strict';
(function () {

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  function fmt(s) {
    const a = arguments;
    return String(s).replace(/%(\d)/g, (m, i) => a[+i]);
  }
  const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

  /* ---------- language & theme ------------------------------ */
  let LANG = 'zh';
  let S = I18N.STR.zh;

  function initPrefs() {
    try {
      const l = localStorage.getItem('emd-lang');
      if (l === 'zh' || l === 'en') LANG = l;
      const t = localStorage.getItem('emd-theme');
      if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    } catch (e) { /* private mode: fall back to the defaults */ }
    S = I18N.STR[LANG];
  }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function currentTheme() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  /* ---------- colours straight from the stylesheet ---------- */
  let COL = {};
  function readColours() {
    const cs = getComputedStyle(document.documentElement);
    ['night', 'panel', 'haze', 'text', 'text-dim', 'trace', 'coral', 'cyan', 'sage', 'violet']
      .forEach(k => { COL[k] = cs.getPropertyValue('--' + k).trim(); });
  }
  function hex2rgb(h) {
    h = (h || '').trim();
    if (h.charAt(0) === '#') {
      if (h.length === 4) return [parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16), parseInt(h[3] + h[3], 16)];
      return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
    }
    const m = h.match(/[\d.]+/g);
    return m ? [+m[0], +m[1], +m[2]] : [0, 0, 0];
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  /* ---------- canvas plumbing -------------------------------
     devicePixelRatio is handled here; a hidden tab reports a
     client width of 0, so we simply skip and redraw on show.  */
  function ctxOf(cv, cssH) {
    const w = cv.clientWidth;
    if (!w) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(w * dpr));
    cv.height = Math.max(1, Math.round(cssH * dpr));
    cv.style.height = cssH + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, cssH);
    return { ctx: ctx, w: w, h: cssH };
  }

  function makePlot(cv, cssH, o) {
    const c = ctxOf(cv, cssH);
    if (!c) return null;
    o = Object.assign({ padL: 40, padR: 10, padT: 10, padB: 20 }, o);
    const x0 = o.padL, x1 = c.w - o.padR, y0 = o.padT, y1 = c.h - o.padB;
    const dx = (o.xMax - o.xMin) || 1, dy = (o.yMax - o.yMin) || 1;
    return {
      ctx: c.ctx, w: c.w, h: c.h, x0: x0, x1: x1, y0: y0, y1: y1, o: o,
      X: v => x0 + (v - o.xMin) / dx * (x1 - x0),
      Y: v => y1 - (v - o.yMin) / dy * (y1 - y0)
    };
  }

  function niceTicks(lo, hi, n) {
    const raw = (hi - lo) / Math.max(1, n);
    const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    const norm = raw / mag;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }

  function axes(p, o) {
    o = o || {};
    const ctx = p.ctx;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = COL.haze;
    ctx.font = '10px ' + MONO;
    ctx.fillStyle = COL['text-dim'];
    if (o.yTicks !== false) {
      const yt = o.yTicks || niceTicks(p.o.yMin, p.o.yMax, 3);
      yt.forEach(v => {
        const Y = Math.round(p.Y(v)) + 0.5;
        if (Y < p.y0 - 1 || Y > p.y1 + 1) return;
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(p.x0, Y); ctx.lineTo(p.x1, Y); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(o.yFmt ? o.yFmt(v) : String(v), p.x0 - 6, Y);
      });
    }
    if (o.xTicks !== false) {
      const xt = o.xTicks || niceTicks(p.o.xMin, p.o.xMax, 6);
      xt.forEach(v => {
        const X = Math.round(p.X(v)) + 0.5;
        if (X < p.x0 - 1 || X > p.x1 + 1) return;
        ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.moveTo(X, p.y0); ctx.lineTo(X, p.y1); ctx.stroke();
        ctx.globalAlpha = 1;
        if (o.xLabels !== false) {
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(o.xFmt ? o.xFmt(v) : String(v), X, p.y1 + 5);
        }
      });
    }
    ctx.restore();
  }

  function series(p, ys, xs, colour, width, dash, alpha) {
    const ctx = p.ctx;
    ctx.save();
    if (dash) ctx.setLineDash(dash);
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.strokeStyle = colour;
    ctx.lineWidth = width || 1.4;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < ys.length; i++) {
      const X = p.X(xs ? xs[i] : i), Y = p.Y(ys[i]);
      if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function dots(p, idx, ys, xs, colour, filled) {
    const ctx = p.ctx;
    ctx.save();
    ctx.strokeStyle = colour; ctx.fillStyle = colour; ctx.lineWidth = 1.3;
    for (let k = 0; k < idx.length; k++) {
      const i = idx[k];
      ctx.beginPath();
      ctx.arc(p.X(xs ? xs[i] : i), p.Y(ys[i]), 2.6, 0, Math.PI * 2);
      if (filled) ctx.fill(); else ctx.stroke();
    }
    ctx.restore();
  }

  function span(arr, pad) {
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr[i].length; j++) {
        const v = arr[i][j];
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
    }
    if (!isFinite(mn)) { mn = -1; mx = 1; }
    const m = (mx - mn) * (pad === undefined ? 0.12 : pad) || 1;
    return { yMin: mn - m, yMax: mx + m };
  }

  /* ==========================================================
     HERO STRIP — a page of polysomnograph paper
     ========================================================== */
  const HERO = { sig: null, dec: null };
  function heroCompute() {
    HERO.sig = SIGNALS.sleepSignal('n3', 2);
    HERO.dec = EMD.emd(HERO.sig.y, 4);
  }
  function drawHero() {
    const cv = $('#heroCanvas');
    const c = ctxOf(cv, cv.clientWidth < 560 ? 220 : 300);
    if (!c) return;
    const ctx = c.ctx, sig = HERO.sig;
    const rows = [sig.y].concat(HERO.dec.imfs, [HERO.dec.residue]);
    const nR = rows.length;
    const padL = 8, padR = 8;
    const rowH = c.h / nR;

    /* faint chart-paper ruling */
    ctx.save();
    ctx.strokeStyle = COL.haze; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
    for (let k = 1; k < nR; k++) {
      const y = Math.round(k * rowH) + 0.5;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(c.w - padR, y); ctx.stroke();
    }
    ctx.globalAlpha = 0.22;
    for (let s = 1; s < 10; s++) {
      const x = Math.round(padL + (c.w - padL - padR) * s / 10) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.h); ctx.stroke();
    }
    ctx.restore();

    rows.forEach((r, k) => {
      const top = k * rowH, mid = top + rowH / 2;
      let mx = 0;
      for (let i = 0; i < r.length; i++) mx = Math.max(mx, Math.abs(r[i]));
      const sc = mx > 0 ? (rowH * 0.40) / mx : 0;
      ctx.save();
      ctx.strokeStyle = k === 0 ? COL.trace : COL.trace;
      ctx.globalAlpha = k === 0 ? 1 : 0.55;
      ctx.lineWidth = k === 0 ? 1.5 : 1.1;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < r.length; i++) {
        const x = padL + (c.w - padL - padR) * i / (r.length - 1);
        const y = mid - r[i] * sc;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }

  /* ==========================================================
     TAB 1 — the sifting algorithm, one frame at a time
     ========================================================== */
  const T1 = { sig: null, cur: null, s: null, chk: null, round: 1, step: 0, done: false, pos: 120 };

  function t1Reset() {
    T1.sig = SIGNALS.teachingSignal();
    T1.cur = Float64Array.from(T1.sig.y);
    T1.round = 1; T1.step = 0; T1.done = false;
    t1Compute();
  }
  function t1Compute() {
    T1.s = EMD.siftOnce(T1.cur);
    T1.chk = EMD.imfCheck(T1.s.hNew);
  }
  function t1Next() {
    if (T1.done) { t1Reset(); render1(); return; }
    if (T1.step < 6) T1.step++;
    else if (T1.chk.ok) T1.done = true;
    else { T1.cur = T1.s.hNew; T1.round++; T1.step = 1; t1Compute(); }
    render1();
  }

  function render1() {
    const sig = T1.sig, st = T1.step, s = T1.s;
    const t = sig.t;

    /* ---- headline ---- */
    $('#t1Round').textContent = fmt(S.p1Round, T1.round);
    $('#t1StepNo').textContent = fmt(S.p1Step, st);
    $('#t1StepText').textContent = S.steps[st];
    $('#t1Next').textContent = T1.done ? S.p1Reset : S.p1Next;

    /* ---- main plot ---- */
    const showUp = st >= 2, showLo = st >= 3, showMean = st >= 4, showExt = st >= 1;
    const stack = [T1.cur];
    if (showUp) stack.push(s.up);
    if (showLo) stack.push(s.lo);
    const rng = span(stack, 0.1);
    const p = makePlot($('#t1Main'), 260, {
      xMin: t[0], xMax: t[t.length - 1], yMin: rng.yMin, yMax: rng.yMax
    });
    if (p) {
      axes(p, { yFmt: v => v.toFixed(0), xFmt: v => v.toFixed(1) });
      if (showUp) series(p, s.up, t, COL.cyan, 1.3);
      if (showLo) series(p, s.lo, t, COL.cyan, 1.3, [4, 4]);
      if (showMean) series(p, s.mean, t, COL.sage, 1.6);
      series(p, T1.cur, t, COL.trace, 1.7);
      if (showExt) {
        dots(p, s.maxI, T1.cur, t, COL.coral, true);
        dots(p, s.minI, T1.cur, t, COL.coral, false);
      }
      /* the sample the table is reading */
      const p1 = p, i0 = T1.pos;
      p1.ctx.save();
      p1.ctx.strokeStyle = COL.trace; p1.ctx.globalAlpha = 0.35; p1.ctx.setLineDash([3, 3]);
      p1.ctx.beginPath(); p1.ctx.moveTo(p1.X(t[i0]), p1.y0); p1.ctx.lineTo(p1.X(t[i0]), p1.y1); p1.ctx.stroke();
      p1.ctx.restore();
    }

    /* ---- h plot ---- */
    const hWrap = $('#t1HWrap');
    if (st >= 5) {
      hWrap.classList.remove('is-waiting');
      $('#t1HNote').textContent = '';
      const r2 = span([s.hNew], 0.12);
      const q = makePlot($('#t1H'), 150, { xMin: t[0], xMax: t[t.length - 1], yMin: r2.yMin, yMax: r2.yMax });
      if (q) {
        axes(q, { yFmt: v => v.toFixed(0), xFmt: v => v.toFixed(1) });
        q.ctx.save();
        q.ctx.strokeStyle = COL.haze; q.ctx.lineWidth = 1;
        q.ctx.beginPath(); q.ctx.moveTo(q.x0, Math.round(q.Y(0)) + 0.5); q.ctx.lineTo(q.x1, Math.round(q.Y(0)) + 0.5); q.ctx.stroke();
        q.ctx.restore();
        series(q, s.hNew, t, COL.trace, 1.6);
      }
    } else {
      hWrap.classList.add('is-waiting');
      $('#t1HNote').textContent = S.p1Wait;
      const c = ctxOf($('#t1H'), 150);
      if (c) { /* cleared */ }
    }

    /* ---- legend ---- */
    const L = [];
    L.push('<span><i style="background:' + COL.trace + '"></i>' + S.legSignal + '</span>');
    if (showExt) {
      L.push('<span><i class="dot" style="background:' + COL.coral + '"></i>' + S.legMax + '</span>');
      L.push('<span><i class="dot" style="border:1.4px solid ' + COL.coral + ';background:none;height:5px;width:5px"></i>' + S.legMin + '</span>');
    }
    if (showUp) L.push('<span><i style="background:' + COL.cyan + '"></i>' + S.legUp + '</span>');
    if (showLo) L.push('<span><i style="background:repeating-linear-gradient(90deg,' + COL.cyan + ' 0 4px,transparent 4px 8px)"></i>' + S.legLo + '</span>');
    if (showMean) L.push('<span><i style="background:' + COL.sage + '"></i>' + S.legMean + '</span>');
    $('#t1Legend').innerHTML = L.join('');

    /* ---- IMF conditions ---- */
    const box = $('#t1Checks');
    if (st >= 6) {
      const c = T1.chk;
      const diff = Math.abs(c.nExt - c.nZero);
      box.hidden = false;
      box.innerHTML =
        '<div class="check ' + (c.c1 ? 'ok' : 'no') + '">' +
          '<span class="tag">' + S.c1Tag + '</span>' +
          '<span>' + S.c1Name + '</span>' +
          '<span class="val">' + fmt(S.c1Val, c.nExt, c.nZero, diff) + '</span>' +
        '</div>' +
        '<div class="check ' + (c.c2 ? 'ok' : 'no') + '">' +
          '<span class="tag">' + S.c2Tag + '</span>' +
          '<span>' + S.c2Name + '</span>' +
          '<span class="val">' + fmt(S.c2Val, (c.sym * 100).toFixed(1)) + '</span>' +
        '</div>' +
        '<div class="verdict ' + (c.ok ? 'ok' : 'no') + '">' + (c.ok ? S.verdictOk : S.verdictNo) + '</div>';
    } else {
      box.hidden = true;
      box.innerHTML = '';
    }

    render1Table();
  }

  function render1Table() {
    const s = T1.s, sig = T1.sig, i0 = T1.pos, n = sig.n;
    const from = Math.max(0, Math.min(n - 9, i0 - 4));
    let html = '';
    for (let i = from; i < from + 9 && i < n; i++) {
      html += '<tr' + (i === i0 ? ' class="focus"' : '') + '>' +
        '<td>' + i + '</td>' +
        '<td>' + sig.t[i].toFixed(4) + '</td>' +
        '<td class="c-trace">' + T1.cur[i].toFixed(4) + '</td>' +
        '<td class="c-cyan">' + s.up[i].toFixed(4) + '</td>' +
        '<td class="c-cyan">' + s.lo[i].toFixed(4) + '</td>' +
        '<td class="c-sage">' + s.mean[i].toFixed(4) + '</td>' +
        '<td class="c-trace">' + s.hNew[i].toFixed(4) + '</td>' +
        '</tr>';
    }
    $('#t1Body').innerHTML = html;
    $('#t1PosOut').textContent = 'i = ' + i0;
  }

  /* ==========================================================
     TAB 2 — five sleep stages
     ========================================================== */
  const T2 = { stage: 'n2', noise: 0, sig: null, dec: null, baseF: {} };

  function t2Compute() {
    T2.sig = SIGNALS.sleepSignal(T2.stage, T2.noise);
    T2.dec = EMD.emd(T2.sig.y, 6);
    if (T2.baseF[T2.stage] === undefined) {
      const q = SIGNALS.sleepSignal(T2.stage, 0);
      const d = EMD.emd(q.y, 6);
      T2.baseF[T2.stage] = EMD.zeroCrossingFreq(d.imfs[0], q.fs);
    }
  }

  function render2() {
    $$('#t2Stages .btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.stage === T2.stage)));
    $('#t2StageDesc').textContent = S.stageDesc[T2.stage];
    $('#t2NoiseOut').textContent = T2.noise.toFixed(0) + ' ' + S.p2NoiseUnit;

    const rows = [{ label: S.p2Signal, data: T2.sig.y, isSignal: true }];
    T2.dec.imfs.forEach((c, k) => rows.push({ label: 'IMF' + (k + 1), data: c }));
    rows.push({ label: S.p2Residue, data: T2.dec.residue, isResidue: true });

    const host = $('#t2Rows');
    host.innerHTML = rows.map((r, k) => {
      let meta;
      if (r.isSignal) {
        meta = '<b>' + r.label + '</b>' + EMD.peakAmp(r.data).toFixed(0) + ' µV peak';
      } else if (r.isResidue) {
        meta = '<b>' + r.label + '</b>' + EMD.peakAmp(r.data).toFixed(0) + ' µV';
      } else {
        const f = EMD.zeroCrossingFreq(r.data, T2.sig.fs);
        const band = SIGNALS.bandOf(f);
        meta = '<b>' + r.label + '</b>' +
               f.toFixed(1) + ' Hz · ' + EMD.peakAmp(r.data).toFixed(0) + ' µV<br>' +
               '<span class="band">' + (S.p2Band[band] || band) + '</span>';
      }
      return '<div class="imf-row' + (r.isSignal ? ' is-signal' : '') + '">' +
             '<div class="imf-meta">' + meta + '</div>' +
             '<canvas data-row="' + k + '" aria-hidden="true"></canvas></div>';
    }).join('');

    const t = T2.sig.t, tmax = t[t.length - 1];
    $$('canvas', host).forEach((cv, k) => {
      const r = rows[k];
      const rg = span([r.data], 0.15);
      const p = makePlot(cv, r.isSignal ? 74 : 58, {
        xMin: 0, xMax: tmax, yMin: rg.yMin, yMax: rg.yMax,
        padL: 44, padR: 8, padT: 6, padB: k === rows.length - 1 ? 18 : 6
      });
      if (!p) return;
      axes(p, {
        yTicks: [0], yFmt: () => '0',
        xFmt: v => v.toFixed(0),
        xLabels: k === rows.length - 1
      });
      series(p, r.data, t, r.isSignal ? COL.trace : COL.trace, r.isSignal ? 1.5 : 1.2, null, r.isSignal ? 1 : 0.78);
    });

    $('#t2Axis').textContent = 't (s) →  0 … ' + tmax.toFixed(2);

    const f1 = EMD.zeroCrossingFreq(T2.dec.imfs[0], T2.sig.fs);
    $('#t2NoiseNote').textContent = T2.noise === 0
      ? fmt(S.p2NoiseNoteZero, f1.toFixed(1))
      : fmt(S.p2NoiseNote, T2.baseF[T2.stage].toFixed(1), f1.toFixed(1));
  }

  /* ==========================================================
     TAB 3 — Fourier against Hilbert
     ========================================================== */
  const T3 = {
    t0: 4.0, f0: 13,
    track: { f: null, min: Infinity, max: -Infinity },
    sig: null, spec: null, dec: null, hs: null, fAmp: 0, peakT: 0
  };
  const HS = { nT: 240, nF: 120, fMax: 25, spreadT: 1, spreadF: 1 };

  function t3Compute() {
    T3.sig = SIGNALS.spindleSignal(T3.t0, T3.f0);
    T3.spec = EMD.spectrum(T3.sig.y, T3.sig.fs);
    T3.dec = EMD.emd(T3.sig.y, 7);
    T3.hs = EMD.hilbertSpectrum(T3.dec.imfs, T3.sig.fs, HS);

    /* Fourier amplitude in a narrow window around the spindle */
    let best = 0;
    for (let k = 0; k < T3.spec.freq.length; k++) {
      const f = T3.spec.freq[k];
      if (f >= T3.f0 - 0.5 && f <= T3.f0 + 0.5 && T3.spec.amp[k] > best) best = T3.spec.amp[k];
    }
    T3.fAmp = best;
    if (T3.track.f !== T3.f0) { T3.track.f = T3.f0; T3.track.min = best; T3.track.max = best; }
    T3.track.min = Math.min(T3.track.min, best);
    T3.track.max = Math.max(T3.track.max, best);

    /* brightest point of the Hilbert spectrum inside the spindle band */
    let ba = -1, bt = 0;
    for (let k = 0; k < T3.dec.imfs.length; k++) {
      const h = EMD.hilbert(T3.dec.imfs[k], T3.sig.fs);
      for (let i = 20; i < T3.sig.n - 20; i++) {
        if (h.freq[i] >= T3.f0 - 3 && h.freq[i] <= T3.f0 + 3 && h.amp[i] > ba) { ba = h.amp[i]; bt = i / T3.sig.fs; }
      }
    }
    T3.peakT = bt;
  }

  function render3() {
    $('#t3TimeOut').textContent = T3.t0.toFixed(2) + ' s';
    $('#t3FreqOut').textContent = T3.f0.toFixed(1) + ' Hz';

    const t = T3.sig.t, tmax = t[t.length - 1];

    /* input signal */
    const rg = span([T3.sig.y], 0.12);
    const p0 = makePlot($('#t3Sig'), 110, { xMin: 0, xMax: tmax, yMin: rg.yMin, yMax: rg.yMax });
    if (p0) {
      axes(p0, { yFmt: v => v.toFixed(0), xFmt: v => v.toFixed(0) });
      series(p0, T3.sig.y, t, COL.trace, 1.3);
      p0.ctx.save();
      p0.ctx.strokeStyle = COL.coral; p0.ctx.globalAlpha = 0.5; p0.ctx.setLineDash([3, 3]);
      p0.ctx.beginPath(); p0.ctx.moveTo(p0.X(T3.t0), p0.y0); p0.ctx.lineTo(p0.X(T3.t0), p0.y1); p0.ctx.stroke();
      p0.ctx.restore();
    }

    /* ---- Fourier ---- */
    const fMaxPlot = HS.fMax;
    let aMax = 0, kMax = 0;
    for (let k = 0; k < T3.spec.freq.length; k++) {
      if (T3.spec.freq[k] > fMaxPlot) break;
      if (T3.spec.amp[k] > aMax) { aMax = T3.spec.amp[k]; }
      kMax = k;
    }
    const pf = makePlot($('#t3Fourier'), 250, {
      xMin: 0, xMax: fMaxPlot, yMin: 0, yMax: aMax * 1.12 || 1, padL: 44, padB: 32
    });
    if (pf) {
      axes(pf, { yFmt: v => v.toFixed(1), xFmt: v => v.toFixed(0) });
      const ctx = pf.ctx;
      ctx.save();
      ctx.strokeStyle = COL.trace; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let k = 0; k <= kMax; k++) {
        const X = pf.X(T3.spec.freq[k]), Y = pf.Y(T3.spec.amp[k]);
        if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
      }
      ctx.stroke();
      ctx.lineTo(pf.X(T3.spec.freq[kMax]), pf.Y(0));
      ctx.lineTo(pf.X(0), pf.Y(0));
      ctx.closePath();
      ctx.globalAlpha = 0.14; ctx.fillStyle = COL.trace; ctx.fill();
      ctx.restore();
      /* marker at the spindle frequency */
      ctx.save();
      ctx.strokeStyle = COL.coral; ctx.globalAlpha = 0.55; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(pf.X(T3.f0), pf.y0); ctx.lineTo(pf.X(T3.f0), pf.y1); ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.font = '10px ' + MONO; ctx.fillStyle = COL['text-dim'];
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('Hz', (pf.x0 + pf.x1) / 2, pf.h - 2);
      ctx.restore();
    }

    /* ---- Hilbert spectrum ---- */
    drawHilbert();

    /* ---- readout ---- */
    const spread = T3.track.max > 0
      ? (T3.track.max - T3.track.min) / ((T3.track.max + T3.track.min) / 2) * 100 : 0;
    $('#t3r1').innerHTML = fmt(S.p3r1, T3.f0.toFixed(1), T3.fAmp.toFixed(3), spread.toFixed(2));
    $('#t3r2').innerHTML = fmt(S.p3r2, T3.peakT.toFixed(2), T3.t0.toFixed(2), Math.abs(T3.peakT - T3.t0).toFixed(2));
    $('#t3r3').textContent = S.p3r3;
  }

  function drawHilbert() {
    const cv = $('#t3Hilbert');
    const p = makePlot(cv, 250, { xMin: 0, xMax: T3.sig.t[T3.sig.n - 1], yMin: 0, yMax: HS.fMax, padL: 44, padB: 32 });
    if (!p) return;
    const g = T3.hs, ctx = p.ctx;

    let vmax = 0;
    for (let i = 0; i < g.grid.length; i++) if (g.grid[i] > vmax) vmax = g.grid[i];
    if (vmax <= 0) vmax = 1;

    const bg = hex2rgb(COL.panel), mid = hex2rgb(COL.cyan), hot = hex2rgb(COL.trace);
    const img = ctx.createImageData(g.nT, g.nF);
    for (let fi = 0; fi < g.nF; fi++) {
      const row = (g.nF - 1 - fi) * g.nT;         /* low frequency at the bottom */
      for (let ti = 0; ti < g.nT; ti++) {
        /* gamma correction, or the weak instantaneous amplitudes vanish */
        const v = Math.pow(g.grid[fi * g.nT + ti] / vmax, 0.62);
        const c = v < 0.5 ? mix(bg, mid, v * 2) : mix(mid, hot, (v - 0.5) * 2);
        const q = (row + ti) * 4;
        img.data[q] = c[0]; img.data[q + 1] = c[1]; img.data[q + 2] = c[2]; img.data[q + 3] = 255;
      }
    }
    const off = document.createElement('canvas');
    off.width = g.nT; off.height = g.nF;
    off.getContext('2d').putImageData(img, 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, p.x0, p.y0, p.x1 - p.x0, p.y1 - p.y0);
    ctx.restore();

    axes(p, { yFmt: v => v.toFixed(0), xFmt: v => v.toFixed(0) });

    /* where the spindle actually is */
    ctx.save();
    ctx.strokeStyle = COL.coral; ctx.globalAlpha = 0.6; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.X(T3.t0), p.y0); ctx.lineTo(p.X(T3.t0), p.y1); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.font = '10px ' + MONO; ctx.fillStyle = COL['text-dim'];
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('t (s)', (p.x0 + p.x1) / 2, p.h - 2);
    ctx.save();
    ctx.restore();
    ctx.restore();
  }

  /* ==========================================================
     tabs, language, wiring
     ========================================================== */
  let activeTab = 1;
  function showTab(n) {
    activeTab = n;
    $$('.tab').forEach(b => b.setAttribute('aria-selected', String(+b.dataset.tab === n)));
    $$('.panel').forEach(pn => { pn.hidden = +pn.dataset.tab !== n; });
    redrawActive();
  }
  function redrawActive() {
    /* a hidden canvas has zero width, so each tab redraws on show */
    if (activeTab === 1) render1();
    else if (activeTab === 2) render2();
    else render3();
  }

  function applyLang() {
    S = I18N.STR[LANG];
    document.documentElement.lang = S.htmlLang;
    $$('[data-i18n]').forEach(e => {
      const v = S[e.dataset.i18n];
      if (typeof v === 'string') e.innerHTML = v;
    });
    $('#langBtn').textContent = S.langBtn;
    $('#langBtn').title = S.langTitle;
    $('#themeBtn').textContent = currentTheme() === 'dark' ? S.themeBtn : S.themeBtnDark;
    $('#t1Next').textContent = T1.done ? S.p1Reset : S.p1Next;

    $$('#t2Stages .btn').forEach(b => { b.textContent = S.stageNames[b.dataset.stage]; });
    $$('.tab').forEach(b => { b.textContent = S['t' + b.dataset.tab]; });

    buildImplList();
    buildRefs();
    redrawActive();
  }

  function buildImplList() {
    $('#implList').innerHTML = S.implList.map(r =>
      '<li><code class="mono">' + r[0] + '</code> — ' + r[1] + '</li>').join('');
  }

  function buildRefs() {
    const groups = [
      { id: 1, title: S.refG1 }, { id: 2, title: S.refG2 },
      { id: 3, title: S.refG3 }, { id: 4, title: S.refG4 }
    ];
    let html = '';
    groups.forEach(g => {
      html += '<p class="ref-group">' + g.title + '</p><div class="refs">';
      I18N.REFS.filter(r => r.group === g.id).forEach(r => {
        const note = r.n ? S.refNotes[r.n - 1] : S.refSupp;
        html += '<div class="ref">' +
          '<div class="n">' + (r.n ? '[' + r.n + ']' : '—') + '</div>' +
          '<div><p>' + r.cite + ' <em>' + r.title + '</em></p>' +
          '<p class="meta">' + r.where + ' DOI: <a href="https://doi.org/' + r.doi +
          '" target="_blank" rel="noopener">' + r.doi + '</a></p>' +
          (note ? '<p class="gloss">' + note + '</p>' : '') +
          '</div></div>';
      });
      html += '</div>';
    });
    $('#refList').innerHTML = html;
  }

  /* ---------- redraw scheduling ---------- */
  let raf = 0;
  function schedule(fn) {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { raf = 0; fn(); });
  }

  function boot() {
    initPrefs();
    readColours();

    heroCompute();
    t1Reset();
    t2Compute();
    t3Compute();

    /* ---- top bar ---- */
    $('#langBtn').addEventListener('click', () => {
      LANG = LANG === 'zh' ? 'en' : 'zh';
      save('emd-lang', LANG);
      applyLang();
    });
    $('#themeBtn').addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      save('emd-theme', next);
      readColours();
      $('#themeBtn').textContent = next === 'dark' ? S.themeBtn : S.themeBtnDark;
      drawHero();
      redrawActive();
    });
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      const onScheme = () => {
        if (document.documentElement.hasAttribute('data-theme')) return;
        readColours();
        $('#themeBtn').textContent = currentTheme() === 'dark' ? S.themeBtn : S.themeBtnDark;
        drawHero(); redrawActive();
      };
      if (mq.addEventListener) mq.addEventListener('change', onScheme);
      else if (mq.addListener) mq.addListener(onScheme);
    }

    /* ---- tabs ---- */
    $$('.tab').forEach(b => b.addEventListener('click', () => showTab(+b.dataset.tab)));

    /* ---- tab 1 ---- */
    $('#t1Next').addEventListener('click', t1Next);
    $('#t1Reset').addEventListener('click', () => { t1Reset(); render1(); });
    const posInput = $('#t1Pos');
    posInput.max = String(T1.sig.n - 1);
    posInput.value = String(T1.pos);
    posInput.addEventListener('input', () => {
      T1.pos = +posInput.value;
      schedule(render1);
    });

    /* ---- tab 2 ---- */
    $$('#t2Stages .btn').forEach(b => b.addEventListener('click', () => {
      T2.stage = b.dataset.stage;
      t2Compute();
      render2();
    }));
    const noiseInput = $('#t2Noise');
    noiseInput.addEventListener('input', () => {
      T2.noise = +noiseInput.value;
      schedule(() => { t2Compute(); render2(); });
    });

    /* ---- tab 3 ---- */
    const tIn = $('#t3Time'), fIn = $('#t3Freq');
    tIn.addEventListener('input', () => {
      T3.t0 = +tIn.value;
      schedule(() => { t3Compute(); render3(); });
    });
    fIn.addEventListener('input', () => {
      T3.f0 = +fIn.value;
      schedule(() => { t3Compute(); render3(); });
    });

    /* ---- resize ---- */
    let rt = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { drawHero(); redrawActive(); }, 120);
    });

    applyLang();
    showTab(1);
    drawHero();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();

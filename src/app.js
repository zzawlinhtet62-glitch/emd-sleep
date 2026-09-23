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
    const q = (location.search.match(/[?&]lang=(zh|en)/) || [])[1];
    if (q) LANG = q;
    try {
      /* The language is not remembered at all. Storing it — in
         localStorage or even sessionStorage — meant that a single
         click on EN could make the site look permanently English on
         a later visit, which is never what was wanted. Every load
         starts in Chinese; ?lang=en is honoured so an English
         version can still be linked to. Old stored values are
         cleared so they cannot resurface. */
      localStorage.removeItem('emd-lang');
      localStorage.removeItem('emd-lang-v2');
      sessionStorage.removeItem('emd-lang');
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

  /* A column of stacked traces: signal on top, then the IMFs.
     Used by chapters 04, 05 and 07.                            */
  function drawStack(host, rows, t) {
    host.innerHTML = rows.map((r, k) =>
      '<div class="imf-row' + (r.isSignal ? ' is-signal' : '') + '">' +
      '<div class="imf-meta">' + (r.meta || '') + '</div>' +
      '<canvas data-row="' + k + '" aria-hidden="true"></canvas></div>').join('');
    const tmax = t[t.length - 1];
    $$('canvas', host).forEach((cv, k) => {
      const r = rows[k];
      const rg = span([r.data], 0.15);
      const p = makePlot(cv, r.isSignal ? 74 : 58, {
        xMin: 0, xMax: tmax, yMin: rg.yMin, yMax: rg.yMax,
        padL: 44, padR: 8, padT: 6, padB: k === rows.length - 1 ? 18 : 6
      });
      if (!p) return;
      axes(p, { yTicks: [0], yFmt: () => '0', xFmt: v => v.toFixed(0), xLabels: k === rows.length - 1 });
      series(p, r.data, t, r.colour || COL.trace, r.isSignal ? 1.5 : 1.2, null, r.isSignal ? 1 : 0.78);
    });
  }

  /* ==========================================================
     HERO STRIP — a page of polysomnograph paper
     ========================================================== */
  /* Motion is opt-in and restrained: the strip scrolls because a
     polysomnograph really does, and nothing else moves unless the
     reader asks. Everything here honours prefers-reduced-motion
     and stops while the tab is hidden.                          */
  const MOTION = {
    reduced: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  const HERO = { rows: [], scale: [], period: 0, raf: 0, t0: 0, offset: 0 };
  const HERO_SPEED = 60;          /* samples per second: the 10 s window is
                                     replaced every ~17 s, one loop is ~137 s */

  function heroCompute() {
    const sig = SIGNALS.heroSignal();
    const P = sig.period;
    const dec = EMD.emd(sig.y, 4);
    const src = [sig.y].concat(dec.imfs, [dec.residue]);
    /* Keep only the middle period. It is free of the end effects at
       the buffer edges, and because the input repeats sample for
       sample, wrapping it leaves no visible seam: the step across
       the wrap stays inside the 95th percentile of the ordinary
       sample-to-sample steps of every row. The period is long
       enough, and its content varied enough, that the trace does
       not read as a loop: slow waves wax and wane, spindles and
       K-complexes come and go. */
    HERO.rows = src.map(r => {
      const out = new Float64Array(P);
      for (let i = 0; i < P; i++) out[i] = r[P + i];
      return out;
    });
    /* Scale each row by its 97th percentile rather than its maximum.
       A single K-complex reaches 70 µV and would otherwise flatten
       everything else into a straight line; chart paper clips the
       rare large deflection instead, and so do we. */
    HERO.scale = HERO.rows.map(r => {
      const mag = Array.prototype.map.call(r, Math.abs).sort((a, b) => a - b);
      const p97 = mag[Math.floor(mag.length * 0.97)] || mag[mag.length - 1] || 1;
      return p97;
    });
    HERO.period = P;
  }

  function drawHero(offset) {
    const cv = $('#heroCanvas');
    const c = ctxOf(cv, cv.clientWidth < 560 ? 220 : 300);
    if (!c) return;
    offset = offset || 0;
    const ctx = c.ctx, P = HERO.period, rows = HERO.rows, nR = rows.length;
    if (!nR) return;
    const padL = 8, padR = 8;
    const rowH = c.h / nR;
    const width = Math.max(1, c.w - padL - padR);
    const visible = Math.min(P, 1024);           /* about 10 s on screen */
    const step = visible / width;

    /* chart-paper ruling; the vertical rules travel with the paper */
    ctx.save();
    ctx.strokeStyle = COL.haze; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
    for (let k = 1; k < nR; k++) {
      const y = Math.round(k * rowH) + 0.5;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(c.w - padR, y); ctx.stroke();
    }
    ctx.globalAlpha = 0.22;
    const gridSamples = visible / 10;
    for (let g = Math.ceil(offset / gridSamples) * gridSamples; g < offset + visible; g += gridSamples) {
      const x = Math.round(padL + (g - offset) / step) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.h); ctx.stroke();
    }
    ctx.restore();

    const limit = rowH * 0.46;
    rows.forEach((r, k) => {
      const mid = k * rowH + rowH / 2;
      const sc = (rowH * 0.34) / (HERO.scale[k] || 1);
      ctx.save();
      ctx.strokeStyle = COL.trace;
      ctx.globalAlpha = k === 0 ? 1 : 0.6;
      ctx.lineWidth = k === 0 ? 1.5 : 1.1;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let px = 0; px <= width; px++) {
        const idx = Math.floor(offset + px * step) % P;
        let d = r[idx] * sc;
        if (d > limit) d = limit; else if (d < -limit) d = -limit;
        const y = mid - d;
        if (px) ctx.lineTo(padL + px, y); else ctx.moveTo(padL + px, y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }

  function heroTick(ts) {
    if (!HERO.t0) HERO.t0 = ts;
    HERO.offset = ((ts - HERO.t0) / 1000 * HERO_SPEED) % HERO.period;
    drawHero(HERO.offset);
    HERO.raf = requestAnimationFrame(heroTick);
  }
  function heroStart() {
    if (MOTION.reduced) { drawHero(HERO.offset); return; }
    if (HERO.raf) return;
    HERO.t0 = 0;
    HERO.raf = requestAnimationFrame(heroTick);
  }
  function heroStop() {
    if (HERO.raf) { cancelAnimationFrame(HERO.raf); HERO.raf = 0; }
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
        '<div class="verdict ' + (c.ok ? 'ok' : 'no') + '">' + verdictText(c) + '</div>';
    } else {
      box.hidden = true;
      box.innerHTML = '';
    }

    render1Table();
  }

  /* Why this round failed, rather than the same sentence every time. */
  function verdictText(c) {
    if (c.ok) return S.verdictOk;
    const why = [];
    if (!c.c1) why.push(fmt(S.whyC1, Math.abs(c.nExt - c.nZero)));
    if (!c.c2) why.push(fmt(S.whyC2, (c.sym * 100).toFixed(1)));
    return fmt(S.verdictNoWhy, T1.round, why.join(S.whyAnd));
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

  /* Chapter 03 can walk itself through the rounds. */
  const T1AUTO = { timer: 0 };
  function t1AutoStop() {
    if (T1AUTO.timer) { clearInterval(T1AUTO.timer); T1AUTO.timer = 0; }
    const b = $('#t1Auto');
    if (b) b.textContent = S.p1Auto;
  }
  function t1AutoToggle() {
    if (T1AUTO.timer) { t1AutoStop(); return; }
    if (T1.done) { t1Reset(); render1(); }
    $('#t1Auto').textContent = S.p1AutoStop;
    T1AUTO.timer = setInterval(() => {
      if (T1.done) { t1AutoStop(); return; }
      t1Next();
    }, 1100);
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
      T2.baseF[T2.stage] = EMD.meanFreq(d.imfs[0], q.fs);
    }
  }

  function render2() {
    $$('#t2Stages .btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.stage === T2.stage)));
    $('#t2StageDesc').textContent = S.stageDesc[T2.stage];
    $('#t2NoiseOut').textContent = T2.noise.toFixed(0) + ' ' + S.p2NoiseUnit;

    const rows = [{ label: S.p2Signal, data: T2.sig.y, isSignal: true }];
    T2.dec.imfs.forEach((c, k) => rows.push({ label: 'IMF' + (k + 1), data: c }));
    rows.push({ label: S.p2Residue, data: T2.dec.residue, isResidue: true });

    rows.forEach(r => {
      if (r.isSignal) {
        r.meta = '<b>' + r.label + '</b>' + EMD.peakAmp(r.data).toFixed(0) + ' µV peak';
      } else if (r.isResidue) {
        r.meta = '<b>' + r.label + '</b>' + EMD.peakAmp(r.data).toFixed(0) + ' µV';
      } else {
        const f = EMD.meanFreq(r.data, T2.sig.fs);
        const band = SIGNALS.bandOf(f);
        r.meta = '<b>' + r.label + '</b>' +
                 f.toFixed(1) + ' Hz · ' + EMD.peakAmp(r.data).toFixed(0) + ' µV<br>' +
                 '<span class="band">' + (S.p2Band[band] || band) + '</span>';
      }
    });
    drawStack($('#t2Rows'), rows, T2.sig.t);
    $('#t2Axis').textContent = 't (s) →  0 … ' + T2.sig.t[T2.sig.n - 1].toFixed(2);

    const f1 = EMD.meanFreq(T2.dec.imfs[0], T2.sig.fs);
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

  /* Chapter 06 can sweep the onset by itself: what happens while
     the spindle moves is the whole argument, and it is easier to
     watch than to read about.                                   */
  const T3SWEEP = { raf: 0, t0: 0 };
  const SWEEP_MIN = 1, SWEEP_MAX = 9.2, SWEEP_PERIOD = 16000;   /* ms, there and back */

  function t3SweepStop() {
    if (T3SWEEP.raf) { cancelAnimationFrame(T3SWEEP.raf); T3SWEEP.raf = 0; }
    const b = $('#t3Sweep');
    if (b) b.textContent = S.p3Sweep;
  }
  function t3SweepTick(ts) {
    if (!T3SWEEP.t0) T3SWEEP.t0 = ts;
    const u = ((ts - T3SWEEP.t0) % SWEEP_PERIOD) / SWEEP_PERIOD;
    const tri = u < 0.5 ? u * 2 : 2 - u * 2;                     /* ping-pong */
    T3.t0 = SWEEP_MIN + (SWEEP_MAX - SWEEP_MIN) * tri;
    $('#t3Time').value = String(T3.t0);
    t3Compute();
    render3();
    T3SWEEP.raf = requestAnimationFrame(t3SweepTick);
  }
  function t3SweepToggle() {
    if (T3SWEEP.raf) { t3SweepStop(); return; }
    $('#t3Sweep').textContent = S.p3SweepStop;
    T3SWEEP.t0 = 0;
    T3SWEEP.raf = requestAnimationFrame(t3SweepTick);
  }

  /* ==========================================================
     CHAPTER 01 — local extrema
     ========================================================== */
  const TX = { f2: 7, a2: 2.5, pos: 96, sig: null, ext: null, nZero: 0 };

  function txCompute() {
    TX.sig = SIGNALS.extremaSignal(TX.f2, TX.a2);
    TX.ext = EMD.findExtrema(TX.sig.y);
    TX.nZero = EMD.countZeroCrossings(TX.sig.y);
    if (TX.pos > TX.sig.n - 2) TX.pos = TX.sig.n - 2;
    if (TX.pos < 1) TX.pos = 1;
  }

  function renderExt() {
    const sig = TX.sig, t = sig.t, y = sig.y, i = TX.pos;
    $('#xFreqOut').textContent = TX.f2.toFixed(1) + ' Hz';
    $('#xAmpOut').textContent = TX.a2.toFixed(1);
    $('#xPosOut').textContent = 'i = ' + i;

    const rg = span([y], 0.14);
    const p = makePlot($('#xMain'), 250, { xMin: t[0], xMax: t[sig.n - 1], yMin: rg.yMin, yMax: rg.yMax });
    if (p) {
      axes(p, { yFmt: v => v.toFixed(0), xFmt: v => v.toFixed(1) });
      const ctx = p.ctx;
      ctx.save();
      ctx.strokeStyle = COL.haze; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x0, Math.round(p.Y(0)) + 0.5); ctx.lineTo(p.x1, Math.round(p.Y(0)) + 0.5); ctx.stroke();
      ctx.restore();
      series(p, y, t, COL.trace, 1.6);
      dots(p, TX.ext.maxI, y, t, COL.coral, true);
      dots(p, TX.ext.minI, y, t, COL.coral, false);
      /* the three samples under test */
      ctx.save();
      ctx.strokeStyle = COL.cyan; ctx.globalAlpha = 0.5; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(p.X(t[i]), p.y0); ctx.lineTo(p.X(t[i]), p.y1); ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = COL.cyan;
      [i - 1, i, i + 1].forEach(k => {
        if (k < 0 || k >= sig.n) return;
        ctx.beginPath(); ctx.arc(p.X(t[k]), p.Y(y[k]), k === i ? 4 : 2.8, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
      TX._plot = p;
    }

    const isMax = i > 0 && i < sig.n - 1 && y[i] > y[i - 1] && y[i] >= y[i + 1];
    const isMin = i > 0 && i < sig.n - 1 && y[i] < y[i - 1] && y[i] <= y[i + 1];
    const verdict = isMax ? S.exIsMax : isMin ? S.exIsMin : S.exIsNone;
    const cls = (isMax || isMin) ? 'ok' : 'no';
    $('#xPanel').innerHTML =
      '<div class="check ' + cls + '">' +
      '<span class="tag">' + fmt(S.exPanelTitle, i) + '</span>' +
      '<span class="mono">' +
        fmt(S.exNb, i - 1, y[i - 1].toFixed(3)) + '　' +
        fmt(S.exNb, i, y[i].toFixed(3)) + '　' +
        fmt(S.exNb, i + 1, y[i + 1].toFixed(3)) +
      '</span>' +
      '<span class="val">' + verdict + '</span></div>';

    const nMax = TX.ext.maxI.length, nMin = TX.ext.minI.length, nExt = nMax + nMin;
    const diff = Math.abs(nExt - TX.nZero);
    $('#xCounts').innerHTML =
      '<div>' + fmt(S.exCount, nMax, nMin, nExt) + '　·　' + fmt(S.exZero, TX.nZero) + '</div>' +
      '<div class="' + (diff <= 1 ? '' : 'hi') + '">' +
      fmt(diff <= 1 ? S.exDiffOk : S.exDiffNo, nExt, TX.nZero, diff) + '</div>';
  }

  /* ==========================================================
     CHAPTER 02 — envelopes and the end effect
     ========================================================== */
  const TE = { mode: 'linear', n: 1008, sig: null, up: null, lo: null, gap: 0, errEdge: 0, errMid: 0 };

  function teCompute() {
    TE.sig = SIGNALS.amSignal(TE.n);
    const prev = EMD.CFG.boundary;
    EMD.CFG.boundary = TE.mode;
    const ex = EMD.findExtrema(TE.sig.y);
    const e = EMD.envelopes(TE.sig.y, ex.maxI, ex.minI);
    EMD.CFG.boundary = prev;
    TE.up = e.up; TE.lo = e.lo;
    TE.lastMax = ex.maxI[ex.maxI.length - 1];
    TE.gap = TE.sig.n - 1 - TE.lastMax;

    const edge = Math.round(TE.sig.n * 0.1);
    let eE = 0, eM = 0;
    for (let i = 0; i < TE.sig.n; i++) {
      const err = Math.abs(TE.up[i] - TE.sig.env[i]) / TE.sig.env[i] * 100;
      if (i < edge || i >= TE.sig.n - edge) eE = Math.max(eE, err); else eM = Math.max(eM, err);
    }
    TE.errEdge = eE; TE.errMid = eM;
  }

  function renderEnv() {
    $$('#eModes .btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === TE.mode)));
    $$('#eModes .btn').forEach(b => { b.textContent = S['envMode' + b.dataset.mode.charAt(0).toUpperCase() + b.dataset.mode.slice(1)]; });
    $('#eCutOut').textContent = TE.n + ' pts';
    $('#eModeDesc').textContent = S['envModeDesc' + TE.mode.charAt(0).toUpperCase() + TE.mode.slice(1)];

    const sig = TE.sig, t = sig.t;
    const rg = span([sig.y, TE.up, TE.lo, sig.env], 0.1);
    const p = makePlot($('#eMain'), 280, { xMin: 0, xMax: t[sig.n - 1], yMin: rg.yMin, yMax: rg.yMax });
    if (p) {
      axes(p, { yFmt: v => v.toFixed(0), xFmt: v => v.toFixed(1) });
      /* shade the extrapolated tail */
      const ctx = p.ctx;
      ctx.save();
      ctx.fillStyle = COL.coral; ctx.globalAlpha = 0.07;
      ctx.fillRect(p.X(t[TE.lastMax]), p.y0, p.x1 - p.X(t[TE.lastMax]), p.y1 - p.y0);
      ctx.restore();
      series(p, TE.up, t, COL.cyan, 1.6);
      series(p, TE.lo, t, COL.cyan, 1.3, [4, 4]);
      series(p, sig.y, t, COL.trace, 1.3, null, 0.85);
      /* truth last, so it stays visible where it coincides with the estimate */
      series(p, sig.env, t, COL.sage, 1.6, [5, 4]);
    }
    $('#eLegend').innerHTML =
      '<span><i style="background:' + COL.trace + '"></i>' + S.legSignal + '</span>' +
      '<span><i style="background:' + COL.cyan + '"></i>' + S.legUp + '</span>' +
      '<span><i style="background:repeating-linear-gradient(90deg,' + COL.cyan + ' 0 4px,transparent 4px 8px)"></i>' + S.legLo + '</span>' +
      '<span><i style="background:repeating-linear-gradient(90deg,' + COL.sage + ' 0 5px,transparent 5px 9px)"></i>' + S.envTruthLeg + '</span>';

    $('#eReadout').innerHTML =
      '<div>' + fmt(S.envGap, TE.lastMax, TE.gap) + '</div>' +
      '<div>' + fmt(S.envErr, TE.errEdge.toFixed(2), TE.errMid.toFixed(2)) + '</div>';
  }

  /* ==========================================================
     CHAPTER 04 — signal lab
     ========================================================== */
  const TL = {
    comps: [{ f: 1.5, a: 5 }, { f: 7, a: 3 }, { f: 18, a: 1.5 }],
    noise: 0, sig: null, dec: null, err: 0
  };

  function tlCompute() {
    TL.sig = SIGNALS.labSignal(TL.comps, TL.noise);
    TL.dec = EMD.emd(TL.sig.y, 6);
    let e = 0;
    for (let i = 0; i < TL.sig.n; i++) {
      let v = TL.dec.residue[i];
      for (let k = 0; k < TL.dec.imfs.length; k++) v += TL.dec.imfs[k][i];
      e = Math.max(e, Math.abs(v - TL.sig.y[i]));
    }
    TL.err = e;
  }

  function renderLab() {
    TL.comps.forEach((c, k) => {
      $('#lF' + k + 'Out').textContent = c.f.toFixed(1) + ' Hz';
      $('#lA' + k + 'Out').textContent = c.a.toFixed(1);
    });
    $('#lNoiseOut').textContent = TL.noise.toFixed(1);

    const rows = [{ label: S.p2Signal, data: TL.sig.y, isSignal: true }];
    TL.dec.imfs.forEach((c, k) => rows.push({ label: 'IMF' + (k + 1), data: c }));
    rows.push({ label: S.p2Residue, data: TL.dec.residue, isResidue: true });
    rows.forEach(r => {
      if (r.isSignal || r.isResidue) {
        r.meta = '<b>' + r.label + '</b>' + EMD.peakAmp(r.data).toFixed(2);
      } else {
        const f = EMD.meanFreq(r.data, TL.sig.fs);
        r.meta = '<b>' + r.label + '</b>' + f.toFixed(2) + ' Hz · ' + EMD.peakAmp(r.data).toFixed(2);
      }
    });
    drawStack($('#lRows'), rows, TL.sig.t);
    $('#lRecon').innerHTML = fmt(S.labRecon, TL.err.toExponential(2), TL.sig.n);
  }

  /* ==========================================================
     CHAPTER 07 — mode mixing and EEMD
     ========================================================== */
  const TM = {
    bursts: 3, freq: 12, method: 'eemd', ens: 40, noise: 0.1,
    sig: null, demd: null, deemd: null, rEmd: 0, rEemd: 0
  };

  function tmCompute() {
    TM.sig = SIGNALS.mixingSignal(TM.bursts, TM.freq);
    TM.demd = EMD.emd(TM.sig.y, 6);
    TM.deemd = EMD.eemd(TM.sig.y, { ensemble: TM.ens, noiseRatio: TM.noise, maxImf: 6 });
    const a = 60, b = TM.sig.n - 60;
    TM.rEmd = EMD.correlation(TM.demd.imfs[0], TM.sig.fast, a, b);
    TM.rEemd = EMD.correlation(TM.deemd.imfs[0], TM.sig.fast, a, b);
  }

  function renderMix() {
    $$('#mMethods .btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.method === TM.method)));
    $('#mBurstsOut').textContent = String(TM.bursts);
    $('#mFreqOut').textContent = TM.freq.toFixed(0) + ' Hz';
    $('#mEnsOut').textContent = String(TM.ens);
    $('#mNoiseOut').textContent = TM.noise.toFixed(2) + ' σ';
    $('#mEemdControls').hidden = TM.method !== 'eemd';

    const dec = TM.method === 'eemd' ? TM.deemd : TM.demd;
    const rows = [
      { label: S.p2Signal, data: TM.sig.y, isSignal: true },
      { label: S.mixTrue, data: TM.sig.fast, colour: COL.sage }
    ];
    dec.imfs.forEach((c, k) => rows.push({ label: 'IMF' + (k + 1), data: c }));
    rows.push({ label: S.p2Residue, data: dec.residue, isResidue: true });
    rows.forEach((r, k) => {
      if (k === 1) { r.meta = '<b>' + r.label + '</b>' + TM.freq.toFixed(0) + ' Hz'; return; }
      if (r.isSignal || r.isResidue) { r.meta = '<b>' + r.label + '</b>' + EMD.peakAmp(r.data).toFixed(2); return; }
      const f = EMD.meanFreq(r.data, TM.sig.fs);
      r.meta = '<b>' + r.label + '</b>' + f.toFixed(2) + ' Hz · ' + EMD.peakAmp(r.data).toFixed(2);
    });
    drawStack($('#mRows'), rows, TM.sig.t);

    $('#mReadout').innerHTML =
      '<div>' + S.mixCorrTitle + '</div>' +
      '<div>' + fmt(S.mixCorrEmd, TM.rEmd.toFixed(4)) + '</div>' +
      '<div>' + fmt(S.mixCorrEemd, TM.ens, TM.noise.toFixed(2), TM.rEemd.toFixed(4)) + '</div>';
  }

  /* ==========================================================
     CHAPTER 08 — the papers
     ========================================================== */
  const TP = { open: 0 };

  function renderPaper() {
    const byRef = {};
    I18N.REFS.forEach(r => { if (r.n) byRef[r.n] = r; });
    $('#pCards').innerHTML = S.papers.map((c, k) => {
      const r = byRef[c.ref] || {};
      const isOpen = TP.open === k;
      return '<div class="paper' + (isOpen ? ' is-open' : '') + '">' +
        '<button class="paper-head" type="button" data-card="' + k + '" aria-expanded="' + isOpen + '">' +
          '<span class="n">[' + c.ref + ']</span>' +
          '<span class="ph"><b>' + c.head + '</b><span class="cite">' + (r.cite || '') + '</span></span>' +
          '<span class="tog">' + (isOpen ? '−' : '+') + '</span>' +
        '</button>' +
        '<div class="paper-body"' + (isOpen ? '' : ' hidden') + '>' +
          '<dl>' +
            '<dt>' + (LANG === 'zh' ? '問題' : 'Question') + '</dt><dd>' + c.task + '</dd>' +
            '<dt>' + (LANG === 'zh' ? '做法' : 'Method') + '</dt><dd>' + c.method + '</dd>' +
            '<dt>' + (LANG === 'zh' ? '結果' : 'Result') + '</dt><dd>' + c.result + '</dd>' +
            '<dt>' + (LANG === 'zh' ? '重點' : 'The point') + '</dt><dd>' + c.point + '</dd>' +
          '</dl>' +
          (r.doi ? '<p class="meta">' + r.where + ' DOI: <a href="https://doi.org/' + r.doi +
                   '" target="_blank" rel="noopener">' + r.doi + '</a></p>' : '') +
        '</div></div>';
    }).join('');

    $$('#pCards .paper-head').forEach(b => b.addEventListener('click', () => {
      const k = +b.dataset.card;
      TP.open = TP.open === k ? -1 : k;
      renderPaper();
    }));

    $('#pTable').innerHTML =
      '<table><thead><tr><th>' + S.thDataset + '</th><th>' + S.thFour + '</th><th>' + S.thFive + '</th></tr></thead><tbody>' +
      S.paperTable.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>').join('') +
      '</tbody></table>';
  }

  /* ==========================================================
     tabs, language, wiring
     ========================================================== */
  const RENDER = {
    ext: renderExt, env: renderEnv, sift: render1, lab: renderLab,
    stage: render2, spec: render3, mix: renderMix, paper: renderPaper
  };
  let activeTab = 'sift';
  function showTab(k) {
    if (k !== 'sift') t1AutoStop();
    if (k !== 'spec') t3SweepStop();
    activeTab = k;
    $$('.tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === k)));
    $$('.panel').forEach(pn => { pn.hidden = pn.dataset.tab !== k; });
    redrawActive();
  }
  function redrawActive() {
    /* a hidden canvas has zero width, so each chapter redraws on show */
    const f = RENDER[activeTab];
    if (f) f();
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
    $('#t1Auto').textContent = T1AUTO.timer ? S.p1AutoStop : S.p1Auto;
    $('#t3Sweep').textContent = T3SWEEP.raf ? S.p3SweepStop : S.p3Sweep;
    $('#themeBtn').textContent = currentTheme() === 'dark' ? S.themeBtn : S.themeBtnDark;
    $('#t1Next').textContent = T1.done ? S.p1Reset : S.p1Next;

    $$('#t2Stages .btn').forEach(b => { b.textContent = S.stageNames[b.dataset.stage]; });
    $$('.tab').forEach(b => { b.textContent = S['tab_' + b.dataset.tab]; });

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
    txCompute();
    teCompute();
    t1Reset();
    tlCompute();
    t2Compute();
    t3Compute();
    tmCompute();

    /* ---- top bar ---- */
    $('#langBtn').addEventListener('click', () => {
      LANG = LANG === 'zh' ? 'en' : 'zh';
      /* deliberately not stored: see initPrefs */
      applyLang();
    });
    $('#themeBtn').addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      save('emd-theme', next);
      readColours();
      $('#themeBtn').textContent = next === 'dark' ? S.themeBtn : S.themeBtnDark;
      drawHero(HERO.offset);
      redrawActive();
    });
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      const onScheme = () => {
        if (document.documentElement.hasAttribute('data-theme')) return;
        readColours();
        $('#themeBtn').textContent = currentTheme() === 'dark' ? S.themeBtn : S.themeBtnDark;
        drawHero(HERO.offset); redrawActive();
      };
      if (mq.addEventListener) mq.addEventListener('change', onScheme);
      else if (mq.addListener) mq.addListener(onScheme);
    }

    /* ---- tabs ---- */
    $$('.tab').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

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

    /* ---- chapter 01: local extrema ---- */
    const xF = $('#xFreq'), xA = $('#xAmp'), xP = $('#xPos');
    xP.max = String(SIGNALS.extremaSignal(7, 2).n - 2);
    xF.addEventListener('input', () => { TX.f2 = +xF.value; schedule(() => { txCompute(); renderExt(); }); });
    xA.addEventListener('input', () => { TX.a2 = +xA.value; schedule(() => { txCompute(); renderExt(); }); });
    xP.addEventListener('input', () => { TX.pos = +xP.value; schedule(renderExt); });
    $('#xMain').addEventListener('click', ev => {
      const p = TX._plot;
      if (!p) return;
      const r = ev.currentTarget.getBoundingClientRect();
      const x = ev.clientX - r.left;
      const frac = (x - p.x0) / (p.x1 - p.x0);
      const i = Math.max(1, Math.min(TX.sig.n - 2, Math.round(frac * (TX.sig.n - 1))));
      TX.pos = i; xP.value = String(i);
      renderExt();
    });

    /* ---- chapter 02: envelopes and ends ---- */
    $$('#eModes .btn').forEach(b => b.addEventListener('click', () => {
      TE.mode = b.dataset.mode;
      teCompute(); renderEnv();
    }));
    const eCut = $('#eCut');
    eCut.addEventListener('input', () => {
      TE.n = +eCut.value;
      schedule(() => { teCompute(); renderEnv(); });
    });

    /* ---- chapter 04: signal lab ---- */
    for (let k = 0; k < 3; k++) {
      const fIn = $('#lF' + k), aIn = $('#lA' + k);
      fIn.addEventListener('input', () => { TL.comps[k].f = +fIn.value; schedule(() => { tlCompute(); renderLab(); }); });
      aIn.addEventListener('input', () => { TL.comps[k].a = +aIn.value; schedule(() => { tlCompute(); renderLab(); }); });
    }
    const lN = $('#lNoise');
    lN.addEventListener('input', () => { TL.noise = +lN.value; schedule(() => { tlCompute(); renderLab(); }); });
    const PRESETS = {
      two:   [{ f: 1.5, a: 5 }, { f: 7, a: 3 }, { f: 18, a: 1.5 }],
      close: [{ f: 4, a: 4 }, { f: 5, a: 4 }, { f: 16, a: 1 }],
      slow:  [{ f: 0.8, a: 6 }, { f: 2, a: 2 }, { f: 13, a: 2.5 }]
    };
    $$('#lPresets .btn').forEach(b => b.addEventListener('click', () => {
      TL.comps = PRESETS[b.dataset.preset].map(c => ({ f: c.f, a: c.a }));
      TL.comps.forEach((c, k) => { $('#lF' + k).value = String(c.f); $('#lA' + k).value = String(c.a); });
      tlCompute(); renderLab();
    }));

    /* ---- chapter 07: mode mixing and EEMD ---- */
    $$('#mMethods .btn').forEach(b => b.addEventListener('click', () => {
      TM.method = b.dataset.method;
      renderMix();
    }));
    const mB = $('#mBursts'), mF = $('#mFreq'), mE = $('#mEns'), mN = $('#mNoise');
    mB.addEventListener('input', () => { TM.bursts = +mB.value; schedule(() => { tmCompute(); renderMix(); }); });
    mF.addEventListener('input', () => { TM.freq = +mF.value; schedule(() => { tmCompute(); renderMix(); }); });
    mE.addEventListener('input', () => { TM.ens = +mE.value; schedule(() => { tmCompute(); renderMix(); }); });
    mN.addEventListener('input', () => { TM.noise = +mN.value; schedule(() => { tmCompute(); renderMix(); }); });

    /* ---- the self-running demos ---- */
    $('#t1Auto').addEventListener('click', t1AutoToggle);
    $('#t3Sweep').addEventListener('click', t3SweepToggle);

    /* nothing animates while nobody is looking */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { heroStop(); t1AutoStop(); t3SweepStop(); }
      else heroStart();
    });

    /* ---- resize ---- */
    let rt = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { drawHero(HERO.offset); redrawActive(); }, 120);
    });

    applyLang();
    showTab('sift');
    heroStart();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();

/* Jumbo Ventures hero scene: procedural Tufts landscape on a canvas. */
(function () {
  function buildScene(canvas) {
    var comp = { _accent: (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '').trim() || '#4270A8' };
    var W = 1440, H = 1000;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    var ctx = canvas.getContext('2d');
    if (!ctx) return { stop: function () {} };
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    /* ---------- helpers ---------- */
    var s0 = 20260927;
    function rnd() { s0 |= 0; s0 = (s0 + 0x6D2B79F5) | 0; var t = Math.imul(s0 ^ (s0 >>> 15), 1 | s0); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function easeOut(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
    function easeInOut(t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function hex(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0]; }
    function shade(h, a) { var c = hex(h), m = a > 0 ? 255 : 0, k = Math.abs(a); return 'rgb(' + c.map(function (v) { return Math.round(v + (m - v) * k); }).join(',') + ')'; }
    function rgba(h, a) { var c = hex(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
    function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
    var grad = []; for (var gi = 0; gi < 512; gi++) grad.push(rnd() * 2 - 1);
    function noise(x) { var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(grad[i & 511], grad[(i + 1) & 511], u); }
    function fbm(x) { return noise(x) * 0.6 + noise(x * 2.1 + 13) * 0.3 + noise(x * 4.3 + 71) * 0.1; }
    function cr(p0, p1, p2, p3, t) { var t2 = t * t, t3 = t2 * t; return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); }
    function ridge(keys, amp, freq, off) {
      var n = keys.length;
      return function (x) {
        var i = 0;
        while (i < n - 2 && x > keys[i + 1][0]) i++;
        var a = keys[i], b = keys[i + 1];
        var t = clamp((x - a[0]) / (b[0] - a[0]), 0, 1);
        var p0 = keys[Math.max(0, i - 1)][1], p3 = keys[Math.min(n - 1, i + 2)][1];
        return cr(p0, a[1], b[1], p3, t) + fbm(x * freq + off) * amp;
      };
    }
    function layer(top, bottom) {
      var c = document.createElement('canvas');
      c.width = Math.round(W * dpr); c.height = Math.ceil((bottom - top) * dpr);
      var x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, -top * dpr);
      return { c: c, x: x, top: top, h: bottom - top };
    }
    function bz(p, u) { var v = 1 - u; return { x: v * v * v * p[0][0] + 3 * v * v * u * p[1][0] + 3 * v * u * u * p[2][0] + u * u * u * p[3][0], y: v * v * v * p[0][1] + 3 * v * v * u * p[1][1] + 3 * v * u * u * p[2][1] + u * u * u * p[3][1] }; }

    /* ---------- painters ---------- */
    function hillPath(x, f, x0, x1) { x.beginPath(); x.moveTo(x0, H + 20); for (var X = x0; X <= x1; X += 3) x.lineTo(X, f(X)); x.lineTo(x1, f(x1)); x.lineTo(x1, H + 20); x.closePath(); }
    function paintHill(L, f, x0, x1, pal, o) {
      var x = L.x, minY = 1e9, X;
      for (X = x0; X <= x1; X += 6) minY = Math.min(minY, f(X));
      x.save(); hillPath(x, f, x0, x1);
      x.shadowColor = 'rgba(46,60,34,' + o.shadow + ')'; x.shadowBlur = o.blur; x.shadowOffsetY = -3;
      x.fillStyle = pal.base; x.fill(); x.restore();
      x.save(); hillPath(x, f, x0, x1); x.clip();
      var g = x.createLinearGradient(0, minY, 0, minY + o.depth);
      g.addColorStop(0, pal.top); g.addColorStop(1, pal.bottom);
      x.fillStyle = g; x.fillRect(x0 - 5, minY - 5, x1 - x0 + 10, H - minY + 30);
      for (X = x0; X < x1; X += 2) {
        var y = f(X), s = (f(X + 8) - f(X - 8)) / 16, lit = clamp(-s * 2.2, -1, 1);
        var col = lit > 0 ? [255, 248, 222, lit * 0.42] : [36, 58, 30, -lit * 0.26];
        var gg = x.createLinearGradient(0, y, 0, y + o.band);
        gg.addColorStop(0, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + col[3] + ')');
        gg.addColorStop(1, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
        x.fillStyle = gg; x.fillRect(X, y - 1, 2.4, o.band);
      }
      var rg = x.createRadialGradient(170, minY - 60, 20, 170, minY - 60, 950);
      rg.addColorStop(0, 'rgba(255,238,196,0.22)'); rg.addColorStop(1, 'rgba(255,238,196,0)');
      x.fillStyle = rg; x.fillRect(x0, minY - 10, x1 - x0, H - minY + 20);
      for (var k = 0; k < o.tex; k++) {
        var px = x0 + rnd() * (x1 - x0), py = f(px) + 2 + rnd() * (H - f(px));
        x.strokeStyle = rgba(pick(pal.tex), 0.2 + rnd() * 0.22); x.lineWidth = 1;
        x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 1.5, py - 1.5 - rnd() * 2.5); x.stroke();
      }
      x.restore();
      x.save(); x.beginPath();
      for (X = x0; X <= x1; X += 3) { if (X === x0) x.moveTo(X, f(X) + 0.8); else x.lineTo(X, f(X) + 0.8); }
      x.strokeStyle = 'rgba(255,252,236,0.55)'; x.lineWidth = 1.4; x.stroke(); x.restore();
    }
    function haze(L, a0, a1, y0, y1) {
      var x = L.x; x.save(); x.globalCompositeOperation = 'source-atop';
      var g = x.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, 'rgba(238,240,230,' + a0 + ')'); g.addColorStop(1, 'rgba(238,240,230,' + a1 + ')');
      x.fillStyle = g; x.fillRect(0, L.top, W, L.h); x.restore();
    }
    function sphere(x, cx, cy, r, col) {
      var g = x.createRadialGradient(cx - r * 0.4, cy - r * 0.45, r * 0.1, cx, cy, r * 1.05);
      g.addColorStop(0, shade(col, 0.3)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.3));
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    }
    var greens = ['#7FA65A', '#6E9A50', '#8DB263', '#5F8C48'];
    var autumn = ['#E0A14A', '#D4773A', '#C95B3C', '#E8C25A'];
    function treeCol(p) { return rnd() < p ? pick(autumn) : pick(greens); }
    function tree(x, cx, by, s, col) {
      x.fillStyle = 'rgba(40,56,30,0.18)'; x.beginPath(); x.ellipse(cx + 9 * s, by + 1, 14 * s, 3.4 * s, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#6E5A45'; x.fillRect(cx - 1.4 * s, by - 10 * s, 2.8 * s, 11 * s);
      sphere(x, cx - 6 * s, by - 15 * s, 7.5 * s, col);
      sphere(x, cx + 6 * s, by - 14 * s, 7.5 * s, col);
      sphere(x, cx, by - 21 * s, 10 * s, col);
      sphere(x, cx - 1 * s, by - 29 * s, 7 * s, col);
    }
    function pine(x, cx, by, s, col) {
      x.fillStyle = 'rgba(40,56,30,0.16)'; x.beginPath(); x.ellipse(cx + 8 * s, by + 1, 11 * s, 3 * s, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#5E4B3A'; x.fillRect(cx - 1.2 * s, by - 6 * s, 2.4 * s, 7 * s);
      for (var i = 0; i < 3; i++) {
        var yb = by - 4 * s - i * 9 * s, w = (12 - i * 3) * s, h = 16 * s;
        x.fillStyle = shade(col, 0.12); x.beginPath(); x.moveTo(cx - w, yb); x.lineTo(cx, yb - h); x.lineTo(cx, yb); x.closePath(); x.fill();
        x.fillStyle = shade(col, -0.14); x.beginPath(); x.moveTo(cx, yb); x.lineTo(cx, yb - h); x.lineTo(cx + w, yb); x.closePath(); x.fill();
      }
    }
    function box(x, l, t, w, h, col) {
      var g = x.createLinearGradient(l, 0, l + w, 0);
      g.addColorStop(0, shade(col, 0.12)); g.addColorStop(1, shade(col, -0.1));
      x.fillStyle = g; x.fillRect(l, t, w, h);
      var v = x.createLinearGradient(0, t + h - 10, 0, t + h);
      v.addColorStop(0, 'rgba(40,40,30,0)'); v.addColorStop(1, 'rgba(40,40,30,0.16)');
      x.fillStyle = v; x.fillRect(l, t + h - 10, w, 10);
    }
    function castShadow(x, l, w, base, h) {
      x.fillStyle = 'rgba(40,58,30,0.16)'; x.beginPath();
      x.moveTo(l + w * 0.3, base); x.lineTo(l + w, base); x.lineTo(l + w + h * 0.45, base + 6); x.lineTo(l + w * 0.3 + h * 0.45, base + 6);
      x.closePath(); x.fill();
    }
    function gable(x, l, r, base, apex, col) {
      var m = (l + r) / 2;
      x.fillStyle = shade(col, 0.14); x.beginPath(); x.moveTo(l, base); x.lineTo(m, apex); x.lineTo(m, base); x.closePath(); x.fill();
      x.fillStyle = shade(col, -0.1); x.beginPath(); x.moveTo(m, base); x.lineTo(m, apex); x.lineTo(r, base); x.closePath(); x.fill();
    }
    function win(x, l, t, w, h, arch) {
      var g = x.createLinearGradient(0, t, 0, t + h);
      g.addColorStop(0, '#56686F'); g.addColorStop(1, '#2A383E');
      x.fillStyle = g; x.beginPath();
      if (arch) { x.moveTo(l, t + h); x.lineTo(l, t + w / 2); x.arc(l + w / 2, t + w / 2, w / 2, Math.PI, 0); x.lineTo(l + w, t + h); }
      else x.rect(l, t, w, h);
      x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.22)'; x.fillRect(l + 1, t + (arch ? w / 2 : 1), Math.max(1, w * 0.3), h * 0.4);
    }
    function strokeBz(x, p, w, col) {
      x.beginPath(); x.moveTo(p[0][0], p[0][1]); x.bezierCurveTo(p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]);
      x.lineWidth = w; x.strokeStyle = col; x.lineCap = 'round'; x.stroke();
    }

    /* ---------- skyline + river bank ---------- */
    var LS = layer(630, 862);
    (function () {
      var x = LS.x;
      x.fillStyle = '#C6CEBA'; x.fillRect(860, 845, W - 860, 6);
      x.fillStyle = 'rgba(255,255,245,0.5)'; x.fillRect(860, 845, W - 860, 1);
      var B = [[1004, 20, 40], [1026, 26, 62], [1056, 18, 52], [1076, 30, 88], [1110, 22, 104], [1136, 38, 146, 'glass'], [1178, 20, 96], [1200, 32, 176, 'tower'], [1236, 26, 118], [1266, 20, 76], [1290, 34, 60], [1328, 22, 46], [1352, 30, 34], [1386, 24, 24]];
      B.forEach(function (b) {
        var l = b[0], w = b[1], h = b[2], t = 848 - h;
        var col = b[3] === 'glass' ? '#A9BDCC' : b[3] === 'tower' ? '#B3C0C9' : pick(['#BAC6CE', '#C3CBCD', '#B5C1C9']);
        box(x, l, t, w, h, col);
        x.fillStyle = 'rgba(255,255,255,0.16)';
        for (var yy = t + 5; yy < 846; yy += 6) x.fillRect(l + 2, yy, w - 4, 1);
        if (b[3] === 'glass') {
          var g = x.createLinearGradient(0, t, 0, t + h);
          g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.5, 'rgba(255,255,255,0)');
          x.fillStyle = g; x.fillRect(l, t, w, h);
        }
        if (b[3] === 'tower') {
          box(x, l + 6, t - 8, w - 12, 8, col);
          x.fillStyle = '#9FAEB8'; x.fillRect(l + w / 2 - 0.8, t - 26, 1.6, 18);
        }
      });
      haze(LS, 0.12, 0.42, 650, 860);
    })();
    var towerTop = { x: 1216, y: 848 - 176 - 26 };
    var R = document.createElement('canvas');
    R.width = Math.round(W * dpr); R.height = Math.ceil(100 * dpr);
    (function () {
      var rx = R.getContext('2d');
      rx.save(); rx.scale(1, -1);
      rx.drawImage(LS.c, 0, 0, LS.c.width, LS.c.height, 0, -Math.round(218 * dpr), LS.c.width, LS.c.height);
      rx.restore();
      rx.globalCompositeOperation = 'destination-in';
      var g = rx.createLinearGradient(0, 0, 0, R.height);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      rx.fillStyle = g; rx.fillRect(0, 0, R.width, R.height);
    })();

    /* ---------- far hills ---------- */
    var fF = ridge([[-20, 878], [140, 832], [330, 812], [520, 826], [680, 850], [820, 880], [940, 915], [1040, 960], [1100, 1010]], 3, 0.01, 90);
    var LF = layer(770, H);
    paintHill(LF, fF, -20, 1100, { base: '#C9D5B2', top: '#D2DCBD', bottom: '#B9C8A0', tex: ['#BFCDA6', '#D6E0C4', '#B3C49A'] }, { shadow: 0.1, blur: 20, depth: 160, band: 40, tex: 1500 });
    (function () {
      var items = [];
      for (var i = 0; i < 44; i++) { var X = -10 + rnd() * 1000; items.push([X, fF(X) + 2 + rnd() * 16, 0.42 + rnd() * 0.2]); }
      items.sort(function (a, b) { return a[1] - b[1]; });
      items.forEach(function (it) { if (rnd() < 0.2) pine(LF.x, it[0], it[1], it[2], '#5F8C48'); else tree(LF.x, it[0], it[1], it[2], treeCol(0.35)); });
      haze(LF, 0.28, 0.4, 800, 1000);
    })();

    /* ---------- Medford side, across the river ---------- */
    var fM = ridge([[700, 1010], [800, 968], [900, 934], [1040, 918], [1200, 912], [1340, 915], [1460, 920]], 2.5, 0.015, 40);
    var LM = layer(870, H);
    paintHill(LM, fM, 700, 1470, { base: '#B9CC9A', top: '#C6D6A9', bottom: '#A0B985', tex: ['#AFC48F', '#CADAAF', '#9DB57F'] }, { shadow: 0.14, blur: 22, depth: 90, band: 34, tex: 1800 });
    (function () {
      var x = LM.x, items = [];
      for (var X = 930; X < 1450; X += 18 + rnd() * 10) items.push([X, fM(X) + 4 + rnd() * 22, rnd() < 0.55 ? 'h' : 't']);
      items.sort(function (a, b) { return a[1] - b[1]; });
      items.forEach(function (it) {
        var cx = it[0], by = it[1], s = 0.8 + (by - 910) * 0.006;
        if (it[2] === 't') { tree(x, cx, by, s * 0.7, treeCol(0.4)); return; }
        var w = (14 + rnd() * 8) * s, h = (12 + rnd() * 8) * s;
        var col = pick(['#E2D5BC', '#BFCAD0', '#D7B9A0', '#C9876B', '#AFBFAA', '#E8DDC9']);
        castShadow(x, cx - w / 2, w, by, h);
        box(x, cx - w / 2, by - h, w, h, col);
        gable(x, cx - w / 2 - 2, cx + w / 2 + 2, by - h + 1, by - h - 9 * s, pick(['#6F6A68', '#7A5E50', '#5F6B70']));
        win(x, cx - w / 4 - 1.5, by - h + 4 * s, 3 * s, 4 * s, false);
        win(x, cx + w / 4 - 1.5, by - h + 4 * s, 3 * s, 4 * s, false);
      });
      haze(LM, 0.12, 0.18, 900, 1000);
    })();

    /* ---------- Walnut Hill: campus ---------- */
    var fW = ridge([[-20, 902], [100, 862], [220, 820], [330, 797], [450, 787], [560, 791], [660, 812], [780, 850], [880, 892], [960, 948], [1040, 1010], [1200, 1040]], 3, 0.012, 5);
    var LW = layer(610, H);
    paintHill(LW, fW, -20, 1060, { base: '#AFC98A', top: '#C0D69A', bottom: '#8DAD6A', tex: ['#9DBB78', '#C6DAA2', '#86A765', '#B2C98C'] }, { shadow: 0.22, blur: 28, depth: 220, band: 60, tex: 5000 });
    var bBase = fW(469) + 8;
    var walkPath = [[470, bBase + 2], [560, bBase + 50], [690, bBase + 72], [840, fW(840) + 44]];
    var tL = 318, tW = 32, tB = fW(334) + 12, tT = tB - 118;
    var routeStart = { x: tL + tW + 10, y: tT + 10 };
    (function () {
      var c = LW.x;
      strokeBz(c, walkPath, 7, 'rgba(120,110,80,0.18)'); strokeBz(c, walkPath, 5, '#E8DFC7');
      var chapelPath = [[470, bBase + 2], [420, bBase + 26], [340, bBase + 26], [300, fW(300) + 14]];
      strokeBz(c, chapelPath, 6, 'rgba(120,110,80,0.16)'); strokeBz(c, chapelPath, 4, '#E8DFC7');

      [[292, -4, 1.6], [430, -2, 1.8], [505, -3, 1.8], [610, -4, 1.8]].forEach(function (b) { tree(c, b[0], fW(b[0]) + b[1], b[2], treeCol(0.35)); });

      /* small brick hall, left slope */
      var sL = 150, sW = 58, sB = fW(179) + 8, sT = sB - 30;
      castShadow(c, sL, sW, sB, 30); box(c, sL, sT, sW, 30, '#C07A5E');
      c.fillStyle = '#7A6C66'; c.fillRect(sL + 40, sT - 18, 6, 12);
      gable(c, sL - 3, sL + sW + 3, sT + 1, sT - 14, '#6F6A68');
      for (var i = 0; i < 4; i++) win(c, sL + 7 + i * 13, sT + 9, 6, 10, false);

      /* Goddard Chapel */
      var nL = 252, nW = 68, nB = fW(286) + 10, nT = nB - 52;
      castShadow(c, nL, nW, nB, 52); box(c, nL, nT, nW, nB - nT, '#C9B79C');
      gable(c, nL - 5, nL + nW + 5, nT + 2, nT - 24, '#7D7466');
      win(c, 262, nT + 14, 8, 20, true); win(c, 280, nT + 14, 8, 20, true); win(c, 298, nT + 14, 8, 20, true);
      castShadow(c, tL, tW, tB, 150); box(c, tL, tT, tW, tB - tT, '#C2AE90');
      c.fillStyle = 'rgba(90,70,50,0.08)'; for (var yy = tT + 6; yy < tB; yy += 7) c.fillRect(tL, yy, tW, 1);
      c.fillStyle = shade('#C2AE90', 0.2); c.fillRect(tL - 2, tT, tW + 4, 4);
      win(c, tL + 11, tT + 12, 10, 22, true); win(c, tL + 12, tT + 50, 8, 16, true);
      c.fillStyle = '#A1917A'; c.beginPath(); c.moveTo(tL - 3, tT); c.lineTo(tL + tW / 2, tT - 46); c.lineTo(tL + tW / 2, tT); c.closePath(); c.fill();
      c.fillStyle = '#7A6B57'; c.beginPath(); c.moveTo(tL + tW / 2, tT); c.lineTo(tL + tW / 2, tT - 46); c.lineTo(tL + tW + 3, tT); c.closePath(); c.fill();
      c.strokeStyle = '#6B5E4D'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(tL + tW / 2, tT - 46); c.lineTo(tL + tW / 2, tT - 54); c.stroke();

      /* Ballou Hall */
      var bL = 404, bW = 130, bT = bBase - 56, cX = bL + bW / 2;
      castShadow(c, bL, bW, bBase, 56); box(c, bL, bT, bW, 56, '#EEE4CF');
      var rg = c.createLinearGradient(bL, 0, bL + bW, 0); rg.addColorStop(0, shade('#8E7863', 0.14)); rg.addColorStop(1, shade('#8E7863', -0.12));
      c.fillStyle = rg; c.beginPath(); c.moveTo(bL - 6, bT + 2); c.lineTo(bL + 18, bT - 16); c.lineTo(bL + bW - 18, bT - 16); c.lineTo(bL + bW + 6, bT + 2); c.closePath(); c.fill();
      c.fillStyle = '#F7F1E4'; c.fillRect(bL - 3, bT, bW + 6, 3);
      box(c, cX - 10, bT - 34, 20, 20, '#F4EEE2'); win(c, cX - 4, bT - 30, 8, 12, true);
      var dg = c.createRadialGradient(cX - 4, bT - 42, 1, cX, bT - 36, 13); dg.addColorStop(0, '#B5C2B8'); dg.addColorStop(1, '#6F8078');
      c.fillStyle = dg; c.beginPath(); c.ellipse(cX, bT - 34, 11, 12, 0, Math.PI, 0); c.closePath(); c.fill();
      c.strokeStyle = '#6F8078'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cX, bT - 46); c.lineTo(cX, bT - 54); c.stroke();
      [bL + 10, bL + 26, bL + 42, bL + 79, bL + 95, bL + 111].forEach(function (wx) {
        [bT + 10, bT + 32].forEach(function (wy) { win(c, wx, wy, 9, 13, false); c.strokeStyle = '#FBF7EE'; c.lineWidth = 1; c.strokeRect(wx - 0.5, wy - 0.5, 10, 14); });
      });
      c.fillStyle = '#E4DCCB'; c.fillRect(cX - 26, bBase - 3, 52, 4);
      c.fillStyle = '#4A3F36'; c.fillRect(cX - 4, bBase - 16, 8, 13);
      c.fillStyle = '#F6EFE0'; c.beginPath(); c.moveTo(cX - 23, bT + 14); c.lineTo(cX, bT + 2); c.lineTo(cX + 23, bT + 14); c.closePath(); c.fill();
      c.fillStyle = 'rgba(120,100,80,0.18)'; c.fillRect(cX - 23, bT + 14, 46, 2);
      [cX - 19, cX - 10, cX + 5, cX + 14].forEach(function (px) {
        var cg = c.createLinearGradient(px, 0, px + 5, 0); cg.addColorStop(0, '#FFFFFF'); cg.addColorStop(1, '#D9D0BE');
        c.fillStyle = cg; c.fillRect(px, bT + 16, 5, bBase - bT - 19);
      });

      /* brick hall */
      var rL = 564, rW = 84, rB = fW(606) + 10, rT = rB - 44;
      castShadow(c, rL, rW, rB, 44); box(c, rL, rT, rW, 44, '#B8674C');
      c.fillStyle = 'rgba(80,30,20,0.08)'; for (var by2 = rT + 3; by2 < rB; by2 += 4) c.fillRect(rL, by2, rW, 1);
      gable(c, rL - 4, rL + rW + 4, rT + 1, rT - 18, '#6F6A68');
      for (var ci = 0; ci < 5; ci++) { win(c, rL + 8 + ci * 15, rT + 8, 8, 11, false); win(c, rL + 8 + ci * 15, rT + 25, 8, 11, false); }

      /* Jumbo */
      var jX = 712, jB = fW(712) + 4, e = '#6E5C49';
      castShadow(c, jX - 16, 32, jB, 30); box(c, jX - 15, jB - 12, 30, 12, '#D8D0C2');
      c.fillStyle = shade(e, -0.1); [jX - 11, jX - 5, jX + 3, jX + 8].forEach(function (lx) { c.fillRect(lx, jB - 21, 4, 9); });
      c.save(); c.translate(jX - 1, jB - 24); c.scale(1.5, 1); sphere(c, 0, 0, 9, e); c.restore();
      c.strokeStyle = shade(e, -0.1); c.lineWidth = 1.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(jX - 14, jB - 26); c.quadraticCurveTo(jX - 18, jB - 23, jX - 17, jB - 19); c.stroke();
      sphere(c, jX + 13, jB - 29, 7, e);
      c.fillStyle = shade(e, -0.18); c.beginPath(); c.ellipse(jX + 9, jB - 29, 4.2, 6.5, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = e; c.lineWidth = 3.2; c.beginPath(); c.moveTo(jX + 18, jB - 27); c.quadraticCurveTo(jX + 24, jB - 20, jX + 19, jB - 13); c.stroke();
      c.strokeStyle = '#F3ECDD'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(jX + 16, jB - 24); c.quadraticCurveTo(jX + 20, jB - 22, jX + 21, jB - 25); c.stroke();
      c.fillStyle = '#2A221B'; c.beginPath(); c.arc(jX + 15, jB - 31, 0.9, 0, Math.PI * 2); c.fill();

      /* front trees */
      var ft = [[70, 6, 1], [112, 4, 1.05], [232, 3, 0.95], [378, 2, 1.05], [549, 3, 0.9], [660, 4, 1], [748, 5, 1.05], [790, 4, 1], [832, 6, 1.1], [872, 5, 1], [912, 6, 1.08], [952, 8, 1.1], [80, 60, 1.3], [180, 50, 1.25], [300, 42, 1.2], [520, 46, 1.25], [640, 52, 1.3]];
      ft.sort(function (a, b) { return (fW(a[0]) + a[1]) - (fW(b[0]) + b[1]); });
      ft.forEach(function (f) { var gy = fW(f[0]) + f[1]; if (rnd() < 0.16) pine(c, f[0], gy, f[2], pick(['#5F8C48', '#557F42'])); else tree(c, f[0], gy, f[2], treeCol(0.38)); });
    })();

    /* ---------- foreground: track + station ---------- */
    var fN = ridge([[-20, 955], [200, 944], [420, 950], [620, 964], [800, 968], [980, 958], [1200, 948], [1460, 942]], 1.5, 0.02, 200);
    var LN = layer(890, H);
    paintHill(LN, fN, -20, 1470, { base: '#A5BF7B', top: '#B3CB88', bottom: '#8DAA63', tex: ['#97B26E', '#BCD193', '#86A25E'] }, { shadow: 0.2, blur: 26, depth: 50, band: 26, tex: 2500 });
    (function () {
      var c = LN.x;
      [[-10, 250], [340, 540], [1100, 1460]].forEach(function (rg) {
        for (var X = rg[0]; X < rg[1]; X += 11 + rnd() * 6) {
          var r = 6 + rnd() * 5, gy = fN(X) + 3;
          c.fillStyle = 'rgba(40,56,30,0.16)'; c.beginPath(); c.ellipse(X + 5, gy + 1, r * 1.3, 2.4, 0, 0, Math.PI * 2); c.fill();
          sphere(c, X, gy - r * 0.6, r, treeCol(0.35));
        }
      });
      [200, 600, 1240].forEach(function (X) {
        var gy = fN(X) + 8;
        c.fillStyle = '#3F4744'; c.fillRect(X - 1, gy - 40, 2, 40);
        c.fillStyle = '#3F4744'; c.fillRect(X - 4, gy - 44, 8, 5);
        c.fillStyle = '#F5E6BD'; c.fillRect(X - 3, gy - 40, 6, 2);
      });
      c.fillStyle = '#D6CFC0'; c.fillRect(828, 966, 244, 12);
      c.fillStyle = '#EAE5D9'; c.fillRect(828, 966, 244, 2);
      c.fillStyle = '#E2C35C'; c.fillRect(828, 976, 244, 1.5);
      [850, 950, 1050].forEach(function (X) { c.fillStyle = '#5E6A66'; c.fillRect(X - 1.5, 926, 3, 42); });
      var cg = c.createLinearGradient(0, 918, 0, 928); cg.addColorStop(0, '#F1EEE7'); cg.addColorStop(1, '#C9C3B6');
      c.fillStyle = cg; c.fillRect(834, 918, 232, 9);
      c.fillStyle = 'rgba(40,40,30,0.18)'; c.fillRect(834, 927, 232, 2);
      c.strokeStyle = '#5E6A66'; c.lineWidth = 1; c.beginPath(); c.moveTo(914, 927); c.lineTo(914, 936); c.moveTo(986, 927); c.lineTo(986, 936); c.stroke();
      box(c, 902, 936, 96, 16, '#2E6B45');
      var bg = c.createLinearGradient(0, 978, 0, 993); bg.addColorStop(0, '#B7AE9B'); bg.addColorStop(1, '#948B7A');
      c.fillStyle = bg; c.fillRect(-20, 978, W + 40, 15);
      for (var k = 0; k < 1400; k++) { c.fillStyle = 'rgba(' + (90 + Math.floor(rnd() * 80)) + ',' + (85 + Math.floor(rnd() * 70)) + ',' + (70 + Math.floor(rnd() * 60)) + ',0.5)'; c.fillRect(rnd() * W, 979 + rnd() * 13, 1.2, 1.2); }
      for (var X = -20; X < W + 20; X += 9) { c.fillStyle = '#6D6253'; c.fillRect(X, 983, 5.5, 4.5); }
      c.fillStyle = '#9A9892'; c.fillRect(-20, 981.6, W + 40, 1.8);
      c.fillStyle = '#5E5C57'; c.fillRect(-20, 985.8, W + 40, 1.8);
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(-20, 981.6, W + 40, 0.6);
      var poles = [90, 330, 570, 1150, 1390];
      poles.forEach(function (X) { c.fillStyle = '#6B7470'; c.fillRect(X - 1.1, 928, 2.2, 55); c.fillRect(X - 1, 932, 14, 1.4); });
      var sup = [-20, 90, 330, 570, 860, 1040, 1150, 1390, W + 20];
      c.strokeStyle = '#5E6563'; c.lineWidth = 0.9; c.beginPath();
      for (var s = 0; s < sup.length - 1; s++) {
        var a = sup[s], b = sup[s + 1], sag = 1.5 + (b - a) * 0.008;
        for (var u = 0; u <= 1.0001; u += 0.05) { var px = lerp(a, b, u), py = 934 + sag * Math.sin(Math.PI * u); if (s === 0 && u === 0) c.moveTo(px, py); else c.lineTo(px, py); }
      }
      c.stroke();
    })();

    /* ---------- sprites ---------- */
    var CS = document.createElement('canvas'); CS.width = Math.round(240 * dpr); CS.height = Math.round(90 * dpr);
    (function () {
      var c = CS.getContext('2d'); c.scale(dpr, dpr);
      [[60, 58, 26], [95, 44, 34], [135, 50, 30], [170, 60, 22], [40, 66, 16], [110, 66, 26], [150, 68, 20]].forEach(function (p) {
        var g = c.createRadialGradient(p[0] - p[2] * 0.3, p[1] - p[2] * 0.4, p[2] * 0.1, p[0], p[1], p[2]);
        g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#F1ECE1');
        c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], p[2], 0, Math.PI * 2); c.fill();
      });
      c.globalCompositeOperation = 'destination-out'; c.fillRect(0, 74, 240, 20);
      c.globalCompositeOperation = 'source-atop';
      var sg = c.createLinearGradient(0, 48, 0, 74); sg.addColorStop(0, 'rgba(205,198,182,0)'); sg.addColorStop(1, 'rgba(205,198,182,0.55)');
      c.fillStyle = sg; c.fillRect(0, 0, 240, 90);
    })();
    var clouds = [{ x: 500, y: 128, s: 0.9, v: 5, a: 0.9 }, { x: 1040, y: 196, s: 0.8, v: 3.5, a: 0.85 }, { x: 1250, y: 116, s: 0.6, v: 6, a: 0.8 }, { x: 60, y: 360, s: 0.7, v: 4, a: 0.8 }, { x: 700, y: 676, s: 1.6, v: 2.5, a: 0.55 }, { x: 250, y: 690, s: 1.2, v: 3, a: 0.45 }];
    var shimmer = []; for (var si = 0; si < 34; si++) shimmer.push([880 + rnd() * 560, 852 + rnd() * 60, 6 + rnd() * 18, rnd() * 6.28]);
    var NS = document.createElement('canvas'); NS.width = 160; NS.height = 160;
    (function () {
      var c = NS.getContext('2d'), img = c.createImageData(160, 160);
      for (var i = 0; i < img.data.length; i += 4) { var v = Math.floor(rnd() * 255); img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255; }
      c.putImageData(img, 0, 0);
    })();
    var grain = ctx.createPattern(NS, 'repeat');
    var walkers = [{ k: 0.1, v: 0.010, c: '#C4553A', h: '#E6C4A2' }, { k: 0.55, v: 0.007, c: '#2F63B0', h: '#8D5E42' }, { k: 0.9, v: 0.012, c: '#E3B04B', h: '#E6C4A2' }, { k: 1.4, v: 0.008, c: '#3A4352', h: '#B98A66' }, { k: 1.75, v: 0.009, c: '#7D4E8A', h: '#E6C4A2' }];

    /* ---------- per-frame ---------- */
    function trainX(t) {
      if (t < 1.6) return -400;
      var C = 26, tt = (t - 1.6) % C, stop = 856;
      if (tt < 9) { var u = tt / 9; return lerp(-260, stop, 1 - (1 - u) * (1 - u)); }
      if (tt < 12) return stop;
      if (tt < 21) { var v = (tt - 12) / 9; return lerp(stop, 1760, v * v); }
      return 1800;
    }
    function car(l, oy, front) {
      var w = 98, top = 955 + oy, bot = 979 + oy, rF = front ? 10 : 3, ext = front ? 2 : 0;
      ctx.fillStyle = 'rgba(30,40,30,0.22)'; ctx.beginPath(); ctx.ellipse(l + w / 2, 983.5 + oy, w / 2 + 4, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2F3533'; ctx.fillRect(l + 8, bot - 1, 18, 5); ctx.fillRect(l + w - 26, bot - 1, 18, 5);
      ctx.fillStyle = '#C9CCC6'; ctx.fillRect(l + 30, top - 3, 30, 3);
      ctx.save(); ctx.beginPath();
      ctx.moveTo(l + 3, top); ctx.lineTo(l + w - rF, top); ctx.quadraticCurveTo(l + w + ext, top, l + w + ext, top + rF);
      ctx.lineTo(l + w + ext, bot); ctx.lineTo(l, bot); ctx.lineTo(l, top + 3); ctx.quadraticCurveTo(l, top, l + 3, top); ctx.closePath();
      var g = ctx.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, '#F3F4F0'); g.addColorStop(0.16, '#E2E5DF'); g.addColorStop(0.17, '#45905C'); g.addColorStop(0.7, '#2F7547'); g.addColorStop(1, '#245C38');
      ctx.fillStyle = g; ctx.fill(); ctx.clip();
      ctx.fillStyle = '#F1F2EC'; ctx.fillRect(l, top + 17, w + 4, 2.2);
      for (var i = 0; i < 6; i++) {
        var wx = l + 6 + i * 15;
        var gg = ctx.createLinearGradient(0, top + 6, 0, top + 14); gg.addColorStop(0, '#6A7E85'); gg.addColorStop(1, '#26343A');
        ctx.fillStyle = gg; ctx.fillRect(wx, top + 6, 10, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(wx + 2, top + 14); ctx.lineTo(wx + 6, top + 6); ctx.lineTo(wx + 8, top + 6); ctx.lineTo(wx + 4, top + 14); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 0.8; ctx.strokeRect(l + 36.5, top + 4.5, 9, bot - top - 5); ctx.strokeRect(l + 66.5, top + 4.5, 9, bot - top - 5);
      if (front) {
        ctx.fillStyle = '#26343A'; ctx.beginPath(); ctx.moveTo(l + w - 9, top + 4); ctx.lineTo(l + w + ext, top + 9); ctx.lineTo(l + w + ext, top + 15); ctx.lineTo(l + w - 9, top + 15); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      if (front) {
        var hg = ctx.createRadialGradient(l + w + 2, bot - 5, 0, l + w + 2, bot - 5, 10); hg.addColorStop(0, 'rgba(255,232,168,0.7)'); hg.addColorStop(1, 'rgba(255,232,168,0)');
        ctx.fillStyle = hg; ctx.fillRect(l + w - 8, bot - 15, 20, 20);
        ctx.fillStyle = '#FFE8A8'; ctx.beginPath(); ctx.arc(l + w + 1, bot - 5, 1.8, 0, Math.PI * 2); ctx.fill();
      }
    }
    function drawTrain(x0, oy) {
      if (x0 < -330 || x0 > W + 20) return;
      car(x0, oy, false);
      ctx.fillStyle = '#3A403D'; ctx.fillRect(x0 + 98, 958 + oy, 4, 20);
      car(x0 + 102, oy, true);
      var px = x0 + 50, py = 955 + oy;
      ctx.strokeStyle = '#40464A'; ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.moveTo(px - 8, py - 1); ctx.lineTo(px + 2, py - 10); ctx.lineTo(px - 4, py - 19); ctx.moveTo(px - 11, py - 19.5); ctx.lineTo(px + 5, py - 19.5); ctx.stroke();
    }
    function drawLayer(L, p) { if (p <= 0) return; ctx.globalAlpha = p; ctx.drawImage(L.c, 0, L.top + (1 - p) * 70, W, L.h); ctx.globalAlpha = 1; }
    var P = [[routeStart.x, routeStart.y], [560, 612], [1010, 612], [towerTop.x, towerTop.y]];

    function draw(t) {
      var accent = comp._accent || '#4270A8';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      var sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#F7F3EA'); sky.addColorStop(0.55, '#F6F2E9'); sky.addColorStop(0.82, '#EEF0E7'); sky.addColorStop(1, '#E6ECE4');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);


      var cp = easeOut((t - 0.2) / 1.6);
      clouds.forEach(function (c) {
        var cx = ((c.x + t * c.v + 300) % (W + 600)) - 300;
        ctx.globalAlpha = cp * c.a; ctx.drawImage(CS, cx, c.y, 144 * c.s, 54 * c.s);
      });
      ctx.globalAlpha = easeOut((t - 1) / 1);
      ctx.strokeStyle = '#56606B'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
      for (var b = 0; b < 3; b++) {
        var bx = ((60 + t * 20 + b * 46) % (W + 200)) - 100, by = 312 + b * 16 + Math.sin(t * 0.6 + b) * 6, fl = Math.sin(t * 7 + b * 1.3) * 3;
        ctx.beginPath(); ctx.moveTo(bx - 6, by); ctx.quadraticCurveTo(bx - 3, by - 2 - fl, bx, by); ctx.quadraticCurveTo(bx + 3, by - 2 - fl, bx + 6, by); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      var pw = easeOut((t - 0.3) / 1.2), ps = easeOut((t - 0.45) / 1.5);
      ctx.globalAlpha = pw;
      var wg = ctx.createLinearGradient(0, 846, 0, H); wg.addColorStop(0, '#D0DEE0'); wg.addColorStop(1, '#BACED2');
      ctx.fillStyle = wg; ctx.fillRect(560, 846, W - 560, H - 846);
      ctx.globalAlpha = ps * 0.3;
      for (var d = 0; d < 80; d += 2) {
        var dx = Math.sin(d * 0.35 + t * 1.6) * (0.6 + d * 0.03);
        ctx.drawImage(R, 0, d * dpr, R.width, 2 * dpr, dx, 849 + d, W, 2);
      }
      shimmer.forEach(function (s) {
        var a = 0.4 * pw * (0.5 + 0.5 * Math.sin(t * 1.8 + s[3]));
        var xx = 880 + ((s[0] - 880 + t * 6) % 560);
        ctx.globalAlpha = a; ctx.fillStyle = '#FFFFFA'; ctx.fillRect(xx, s[1], s[2], 1);
      });
      ctx.globalAlpha = 1;

      drawLayer(LS, ps);
      drawLayer(LF, easeOut((t - 0.35) / 1.5));
      drawLayer(LM, easeOut((t - 0.55) / 1.5));
      var pW = easeOut((t - 0.6) / 1.6), oyW = (1 - pW) * 70;
      drawLayer(LW, pW);

      ctx.globalAlpha = pW;
      walkers.forEach(function (w, i) {
        var m = (w.k + t * w.v) % 2, u = m < 1 ? m : 2 - m, q = bz(walkPath, u), y = q.y + oyW, step = Math.sin(t * 6 + i) * 1.2;
        ctx.fillStyle = 'rgba(40,56,30,0.2)'; ctx.beginPath(); ctx.ellipse(q.x + 2, y + 0.5, 3, 1, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3B3A36'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q.x - 0.5, y - 3); ctx.lineTo(q.x - 0.5 + step, y); ctx.moveTo(q.x + 0.5, y - 3); ctx.lineTo(q.x + 0.5 - step, y); ctx.stroke();
        ctx.fillStyle = w.c; ctx.fillRect(q.x - 1.5, y - 8, 3, 5.5);
        ctx.fillStyle = w.h; ctx.beginPath(); ctx.arc(q.x, y - 9.6, 1.6, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      var bOn = t > 2.6 && !(t > 2.72 && t < 2.84) && !(t > 2.92 && t < 2.98);
      if (bOn || t > 3) {
        var bx = 714, byy = fW(712) - 60 + oyW + Math.sin(t * 1.4) * 2.2, bp = 1 + Math.sin(t * 2.2) * 0.08;
        ctx.globalAlpha = pW;
        var bgl = ctx.createRadialGradient(bx, byy, 2, bx, byy, 30 * bp);
        bgl.addColorStop(0, 'rgba(251,224,122,0.75)'); bgl.addColorStop(1, 'rgba(251,224,122,0)');
        ctx.fillStyle = bgl; ctx.fillRect(bx - 34, byy - 34, 68, 68);
        var bgg = ctx.createRadialGradient(bx - 2.5, byy - 3, 1, bx, byy, 8);
        bgg.addColorStop(0, '#FFFBEA'); bgg.addColorStop(1, '#FBE07A');
        ctx.fillStyle = bgg; ctx.beginPath(); ctx.arc(bx, byy, 7.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(bx - 4, byy + 4); ctx.lineTo(bx - 3, byy + 10); ctx.lineTo(bx + 3, byy + 10); ctx.lineTo(bx + 4, byy + 4); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#E0B93A'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(bx - 2, byy + 5); ctx.lineTo(bx - 1.5, byy - 1); ctx.moveTo(bx + 2, byy + 5); ctx.lineTo(bx + 1.5, byy - 1); ctx.stroke();
        ctx.fillStyle = '#8A8F96'; ctx.fillRect(bx - 3.2, byy + 10, 6.4, 4.5);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bx - 3.2, byy + 11, 6.4, 1);
        ctx.globalAlpha = 1;
      }

      var pN = easeOut((t - 0.85) / 1.5), oyN = (1 - pN) * 70;
      drawLayer(LN, pN);
      ctx.globalAlpha = pN;
      ctx.font = '600 10px "Geist", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF'; ctx.fillText('Medford/Tufts', 950, 944.5 + oyN);
      drawTrain(trainX(t), oyN);
      ctx.globalAlpha = 1;

      var rp = easeInOut((t - 2.0) / 1.4);
      if (rp > 0) {
        ctx.save();
        ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.setLineDash([6, 8]); ctx.lineDashOffset = -t * 18;
        ctx.beginPath();
        for (var k = 0; k <= 70; k++) { var q = bz(P, rp * k / 70); if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }
        ctx.stroke(); ctx.restore();
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(P[0][0], P[0][1], 4.5, 0, Math.PI * 2); ctx.fill();
        if (rp >= 1) { ctx.beginPath(); ctx.arc(P[3][0], P[3][1], 4.5, 0, Math.PI * 2); ctx.fill(); }
        var la = easeOut((t - 2.8) / 0.8);
        if (la > 0) {
          ctx.globalAlpha = la; ctx.fillStyle = '#5B6473'; ctx.font = '600 12px "Geist", system-ui, sans-serif'; ctx.textBaseline = 'alphabetic';
          try { ctx.letterSpacing = '1.4px'; } catch (err) {}
          var lbl = function (txt, x, y, align) {
            var w = ctx.measureText(txt).width, lx = align === 'right' ? x - w : x;
            ctx.fillStyle = 'rgba(246,243,236,0.88)';
            ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(lx - 7, y - 13, w + 14, 20, 10); else ctx.rect(lx - 7, y - 13, w + 14, 20); ctx.fill();
            ctx.fillStyle = '#5B6473'; ctx.textAlign = align; ctx.fillText(txt, x, y);
          };
          lbl('THE HILL', tL - 12, P[0][1] + 4, 'right');
          lbl('BOSTON', P[3][0] + 14, P[3][1] + 5, 'left');
          try { ctx.letterSpacing = '0px'; } catch (err) {}
          ctx.globalAlpha = 1;
        }
        if (t > 3.4) {
          var u = easeInOut(((t - 3.4) % 5.5) / 4.5), q2 = bz(P, u);
          ctx.fillStyle = rgba(accent, 0.18); ctx.beginPath(); ctx.arc(q2.x, q2.y, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#F6F3EC'; ctx.beginPath(); ctx.arc(q2.x, q2.y, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(q2.x, q2.y, 4.5, 0, Math.PI * 2); ctx.fill();
        }
      }

      if (grain) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.06;
        ctx.fillStyle = grain; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }

    var raf = 0, start = performance.now(), stopped = false;
    function frame(now) {
      if (stopped) return;
      draw((now - start) / 1000);
      raf = requestAnimationFrame(frame);
    }
    if (reduce) {
      draw(12.6);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!stopped) draw(12.6); });
    } else {
      raf = requestAnimationFrame(frame);
    }
    return { stop: function () { stopped = true; cancelAnimationFrame(raf); } };
  
  }
  window.JVScene = buildScene;
})();

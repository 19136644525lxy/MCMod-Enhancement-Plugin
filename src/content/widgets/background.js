/**
 * 首页背景预设（方案 A：全部程序化生成，不引入任何图片资源）
 *
 * 5 套预设：
 *   mist   晨雾 —— 沿用原来的三层 radial-gradient，纯 CSS
 *   aurora 极光 —— Canvas 2D 画几条缓慢漂移的色带
 *   pixel  像素夜空 —— Canvas 按 16×16 像素格铺星点
 *   grass  草方块 —— Canvas 生成 32×32 草方块纹理平铺
 *   stars  星空 —— 纯 CSS 径向渐变点
 *
 * 只画背景，不碰任何内容节点；canvas 层 fixed 在内容下面。
 */
(function () {
  window.MP = window.MP || {};

  var LAYER_ID = 'mp-bg-layer';
  var raf = null;
  var frameTimer = null;
  var current = 'mist';
  var canvas = null;
  var ctx = null;
  var customImg = null;   // 用户上传的图片（Image 对象）
  var intensity = 45;     // 自定义背景的遮罩强度 0-100

  var PRESETS = {
    mist: { label: '晨雾' },
    aurora: { label: '极光' },
    pixel: { label: '像素夜空' },
    grass: { label: '草方块' },
    stars: { label: '星空' },
    custom: { label: '自定义' }
  };

  function isDark() {
    var t = document.documentElement.dataset.mpTheme;
    if (t === 'dark') return true;
    if (t === 'light') return false;
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  }

  function reduceMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function ensureLayer() {
    var el = document.getElementById(LAYER_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = LAYER_ID;
    el.className = 'mp-bg-layer';
    document.body.insertBefore(el, document.body.firstChild);
    return el;
  }

  function ensureCanvas(layer) {
    if (canvas && canvas.parentNode === layer) return canvas;
    canvas = document.createElement('canvas');
    canvas.id = 'mp-bg-canvas';
    canvas.className = 'mp-bg-canvas';
    layer.appendChild(canvas);
    ctx = canvas.getContext('2d');
    return canvas;
  }

  function sizeCanvas() {
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    return { w: w, h: h };
  }

  // 固定种子的伪随机，保证同一台机器每次刷新星点位置一致
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* ---------------- 极光 ---------------- */

  var auroraBands = [
    { hue: [31, 209, 165], x: 0.18, y: 0.32, r: 0.52, speed: 0.11, phase: 0 },
    { hue: [43, 108, 255], x: 0.62, y: 0.24, r: 0.46, speed: 0.07, phase: 2.1 },
    { hue: [180, 76, 255], x: 0.44, y: 0.62, r: 0.58, speed: 0.05, phase: 4.3 }
  ];

  function paintAurora(t) {
    if (!ctx) return;
    var dim = sizeCanvas();
    if (!dim) return;
    var w = dim.w;
    var h = dim.h;
    var dark = isDark();
    var base = dark ? [13, 14, 18] : [245, 244, 241];
    var strength = dark ? 0.5 : 0.32;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgb(' + base.join(',') + ')';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < auroraBands.length; i++) {
      var b = auroraBands[i];
      var px = (b.x + Math.sin(t * b.speed + b.phase) * 0.16) * w;
      var py = (b.y + Math.cos(t * b.speed * 0.8 + b.phase) * 0.12) * h;
      var rr = b.r * Math.max(w, h) * (0.85 + Math.sin(t * b.speed * 1.7 + b.phase) * 0.15);
      var g = ctx.createRadialGradient(px, py, 0, px, py, rr);
      var c = b.hue;
      g.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + strength + ')');
      g.addColorStop(0.55, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (strength * 0.32) + ')');
      g.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, rr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------------- 像素夜空 ---------------- */

  function paintPixel() {
    if (!ctx) return;
    var dim = sizeCanvas();
    if (!dim) return;
    var w = dim.w;
    var h = dim.h;
    var dark = isDark();
    var cell = Math.max(10, Math.round(w / 96));   // 按屏宽定格子大小
    var cols = Math.ceil(w / cell);
    var rows = Math.ceil(h / cell);
    var rand = rng(20261112);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = dark ? '#0b0d14' : '#eef0f5';
    ctx.fillRect(0, 0, w, h);

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var r = rand();
        if (r > 0.055) continue;
        var a = dark ? 0.25 + r * 9 : 0.18 + r * 6;
        var tint = rand();
        if (tint > 0.82) {
          ctx.fillStyle = dark ? 'rgba(140,196,255,' + Math.min(a, 0.9) + ')' : 'rgba(70,110,190,' + Math.min(a, 0.6) + ')';
        } else if (tint > 0.66) {
          ctx.fillStyle = dark ? 'rgba(255,236,176,' + Math.min(a, 0.85) + ')' : 'rgba(196,150,60,' + Math.min(a, 0.5) + ')';
        } else {
          ctx.fillStyle = dark ? 'rgba(255,255,255,' + Math.min(a, 0.8) + ')' : 'rgba(120,130,150,' + Math.min(a, 0.45) + ')';
        }
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }

  /* ---------------- 草方块 ---------------- */

  function grassTile(rand, dark) {
    // 32×32 的草方块：上 9 行草绿、下 23 行泥土
    var tile = document.createElement('canvas');
    tile.width = 32;
    tile.height = 32;
    var c = tile.getContext('2d');
    var grass = dark ? [58, 122, 52] : [106, 168, 79];
    var grassTop = dark ? [72, 148, 62] : [124, 190, 92];
    var dirt = dark ? [78, 58, 40] : [134, 96, 67];
    var dirtDark = dark ? [58, 42, 29] : [110, 78, 54];

    for (var y = 0; y < 32; y++) {
      for (var x = 0; x < 32; x++) {
        var n = rand();
        var col;
        if (y < 9) col = n > 0.72 ? grassTop : grass;
        else col = n > 0.7 ? dirtDark : dirt;
        c.fillStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
        c.fillRect(x, y, 1, 1);
      }
    }
    return tile;
  }

  function paintGrass() {
    if (!ctx) return;
    var dim = sizeCanvas();
    if (!dim) return;
    var w = dim.w;
    var h = dim.h;
    var dark = isDark();
    var rand = rng(77123);
    var tile = grassTile(rand, dark);
    var scale = Math.max(2, Math.round(w / 320));

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = dark ? '#14120e' : '#f3efe6';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    var pat = ctx.createPattern(tile, 'repeat');
    if (!pat) return;
    ctx.save();
    ctx.scale(scale, scale);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, Math.ceil(w / scale), Math.ceil(h / scale));
    ctx.restore();
    // 压一层薄雾，避免纹理太抢眼影响卡片可读性
    ctx.fillStyle = dark ? 'rgba(12,11,9,0.62)' : 'rgba(247,244,238,0.68)';
    ctx.fillRect(0, 0, w, h);
  }

  /* ---------------- 星空 ---------------- */

  function paintStars() {
    if (!ctx) return;
    var dim = sizeCanvas();
    if (!dim) return;
    var w = dim.w;
    var h = dim.h;
    var dark = isDark();
    var rand = rng(31415926);

    ctx.clearRect(0, 0, w, h);
    var g = ctx.createLinearGradient(0, 0, 0, h);
    if (dark) {
      g.addColorStop(0, '#0a0d16');
      g.addColorStop(1, '#151022');
    } else {
      g.addColorStop(0, '#f6f7fb');
      g.addColorStop(1, '#eef0f7');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    var count = Math.round((w * h) / 9000);
    for (var i = 0; i < count; i++) {
      var x = rand() * w;
      var y = rand() * h;
      var r = rand();
      var size = r > 0.97 ? 2.4 : r > 0.88 ? 1.6 : 1;
      var a = dark ? 0.2 + rand() * 0.7 : 0.12 + rand() * 0.35;
      ctx.fillStyle = dark
        ? 'rgba(255,255,255,' + a.toFixed(2) + ')'
        : 'rgba(92,108,140,' + a.toFixed(2) + ')';
      ctx.fillRect(Math.round(x), Math.round(y), size, size);
    }
  }

  /* ---------------- 自定义图片 ---------------- */

  // 图片本身放 IndexedDB：dataURL 动辄 1MB 以上，chrome.storage 的同步配额放不下，
  // 而且同步区每次写入都会广播给所有标签页，没必要。
  function db() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open('mp-bg', 1);
      req.onupgradeneeded = function () {
        var d = req.result;
        if (!d.objectStoreNames.contains('images')) d.createObjectStore('images');
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idbGet(key) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var r = d.transaction('images', 'readonly').objectStore('images').get(key);
        r.onsuccess = function () { res(r.result || null); };
        r.onerror = function () { rej(r.error); };
      });
    });
  }

  function idbPut(key, val) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var tx = d.transaction('images', 'readwrite');
        tx.objectStore('images').put(val, key);
        tx.oncomplete = function () { res(true); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }

  function idbDel(key) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var tx = d.transaction('images', 'readwrite');
        tx.objectStore('images').delete(key);
        tx.oncomplete = function () { res(true); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }

  function loadImage(src) {
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () { res(img); };
      img.onerror = function () { rej(new Error('image decode failed')); };
      img.src = src;
    });
  }

  function paintCustom() {
    if (!ctx || !customImg) return;
    var dim = sizeCanvas();
    if (!dim) return;
    var w = dim.w;
    var h = dim.h;
    var dark = isDark();

    var iw = customImg.naturalWidth || customImg.width || 1;
    var ih = customImg.naturalHeight || customImg.height || 1;
    var scale = Math.max(w / iw, h / ih);
    var dw = iw * scale;
    var dh = ih * scale;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(customImg, (w - dw) / 2, (h - dh) / 2, dw, dh);

    // 遮罩：不压的话花哨图片会把毛玻璃卡片的对比度吃掉
    var a = Math.max(0, Math.min(0.85, (Number(intensity) || 0) / 100));
    ctx.fillStyle = dark ? 'rgba(9,10,14,' + a + ')' : 'rgba(248,246,241,' + a + ')';
    ctx.fillRect(0, 0, w, h);

    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, dark ? 'rgba(9,10,14,' + (a * 0.55) + ')' : 'rgba(248,246,241,' + (a * 0.55) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  /* ---------------- 调度 ---------------- */

  function stopLoop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
    if (frameTimer) {
      clearInterval(frameTimer);
      frameTimer = null;
    }
  }

  function paintStatic() {
    if (current === 'aurora') {
      paintAurora(0);
    } else if (current === 'pixel') {
      paintPixel();
    } else if (current === 'grass') {
      paintGrass();
    } else if (current === 'stars') {
      paintStars();
    } else if (current === 'custom') {
      paintCustom();
    }
  }

  function startLoop() {
    stopLoop();
    if (current !== 'aurora' || reduceMotion()) return;
    // 极光不需要 60fps，12fps 已经足够顺滑，省电也省 GPU
    var last = 0;
    var start = performance.now();
    frameTimer = setInterval(function () {
      if (document.hidden) return;
      var now = performance.now();
      if (now - last < 80) return;
      last = now;
      paintAurora((now - start) / 1000);
    }, 80);
  }

  function apply(mode) {
    mode = PRESETS[mode] ? mode : 'mist';
    var body = document.body;
    if (!body) return;

    var layer = ensureLayer();
    var changed = !!body.dataset.mpBg && body.dataset.mpBg !== mode;

    function commit() {
      current = mode;
      body.dataset.mpBg = mode;
      stopLoop();

      if (mode === 'mist') {
        // 晨雾是纯 CSS 渐变，不需要 canvas
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        canvas = null;
        ctx = null;
        layer.style.opacity = '';
        return;
      }

      ensureCanvas(layer);
      paintStatic();
      startLoop();
      layer.style.opacity = '1';
    }

    function run() {
      if (mode !== 'custom') {
        commit();
        return;
      }
      // 自定义图要先从 IndexedDB 取出来才能画
      idbGet('custom').then(function (src) {
        if (!src) {
          mode = 'mist';
          commit();
          return;
        }
        return loadImage(src).then(function (img) {
          customImg = img;
          commit();
        });
      }).catch(function () {
        mode = 'mist';
        commit();
      });
    }

    // 切换时先把旧底图淡出，画好新底图再淡入，避免硬切
    if (changed) {
      layer.style.opacity = '0';
      setTimeout(run, 160);
    } else {
      run();
    }
  }

  function refresh() {
    if (current === 'mist') return;
    paintStatic();
    startLoop();
  }

  function destroy() {
    stopLoop();
    var layer = document.getElementById(LAYER_ID);
    if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
    canvas = null;
    ctx = null;
    if (document.body) delete document.body.dataset.mpBg;
  }

  window.addEventListener('resize', function () {
    if (current === 'mist') return;
    paintStatic();
  });

  MP.background = {
    PRESETS: PRESETS,
    apply: apply,
    refresh: refresh,
    destroy: destroy,
    current: function () { return current; },

    // 强度：0 完全不压暗，100 几乎盖住（上限仍留 15% 让图隐约可见）
    setIntensity: function (v) {
      intensity = Math.max(0, Math.min(100, Number(v) || 0));
      if (current === 'custom') paintStatic();
    },
    getIntensity: function () { return intensity; },

    // 保存用户选的原图：先用 canvas 压到 1920 宽、JPEG 0.82，再进 IndexedDB
    saveImage: function (fileOrDataUrl) {
      return Promise.resolve().then(function () {
        if (typeof fileOrDataUrl === 'string') return compress(fileOrDataUrl);
        return readFile(fileOrDataUrl).then(compress);
      }).then(function (dataUrl) {
        return idbPut('custom', dataUrl).then(function () {
          return loadImage(dataUrl).then(function (img) {
            customImg = img;
            if (current === 'custom') paintStatic();
            return dataUrl;
          });
        });
      });
    },

    removeImage: function () {
      return idbDel('custom').then(function () {
        customImg = null;
        if (current === 'custom') apply('mist');
        return true;
      });
    },

    hasImage: function () {
      return idbGet('custom').then(function (v) { return !!v; });
    },

    preview: function () {
      return idbGet('custom');
    }
  };

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result || '')); };
      fr.onerror = function () { reject(fr.error); };
      fr.readAsDataURL(file);
    });
  }

  function compress(src) {
    return loadImage(src).then(function (img) {
      var maxW = 1920;
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      if (w > maxW) {
        h = Math.round(h * maxW / w);
        w = maxW;
      }
      var c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      var cx = c.getContext('2d');
      if (!cx) return src;
      cx.drawImage(img, 0, 0, w, h);
      try {
        return c.toDataURL('image/jpeg', 0.82);
      } catch (e) {
        return src;
      }
    });
  }
})();

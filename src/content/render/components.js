/**
 * 通用 UI 组件（原型阶段用 h() 手写，结构与 Preact 组件对应）
 */
window.MP = window.MP || {};

MP.ui = (function () {
  const { h } = MP.dom;

  function chip(label, opts) {
    const o = opts || {};
    return h(o.href ? 'a' : 'span', {
      class: 'mp-chip' + (o.active ? ' is-active' : '') + (o.muted ? ' is-muted' : ''),
      href: o.href || undefined,
      onclick: o.onclick
    }, label, o.count != null ? h('span', { class: 'mp-chip-count' }, o.count) : null);
  }

  function button(label, opts) {
    const o = opts || {};
    return h('button', {
      class: 'mp-btn' + (o.variant ? ' mp-btn--' + o.variant : ''),
      onclick: o.onclick,
      type: o.type || 'button',
      title: o.title || undefined
    }, label);
  }

  function skeleton(lines) {
    const n = lines || 3;
    return h('div', { class: 'mp-skeleton' },
      Array.from({ length: n }, () => h('div', { class: 'mp-skeleton-line' }))
    );
  }

  function empty(text, hint) {
    return h('div', { class: 'mp-empty' },
      h('div', { class: 'mp-empty-title' }, text),
      hint ? h('div', { class: 'mp-empty-hint' }, hint) : null
    );
  }

  function toolbar(left, right) {
    return h('div', { class: 'mp-toolbar' },
      h('div', { class: 'mp-toolbar-left' }, left),
      h('div', { class: 'mp-toolbar-right' }, right)
    );
  }

  function card(children, opts) {
    const o = opts || {};
    return h(o.href ? 'a' : 'div', {
      class: 'mp-card' + (o.class ? ' ' + o.class : ''),
      href: o.href || undefined,
      target: o.href ? '_blank' : undefined,
      rel: o.href ? 'noopener' : undefined
    }, children);
  }

  /* 星星是 MARGIN 原组件里的那段 SVG，3142 字符，原样保留 */
  const STARS = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 144 55\" fill=\"none\"><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" fill=\"currentColor\" d=\"M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688ZM31 23.3545C32.1114 23.2995 33.0551 22.8503 33.8313 22.0069C34.6075 21.1635 34.9956 20.1642 34.9956 19C34.9956 20.1642 35.3837 21.1635 36.1599 22.0069C36.9361 22.8503 37.8798 23.2903 39 23.3545C38.2679 23.3911 37.5976 23.602 36.9802 24.0053C36.3716 24.3995 35.8864 24.9312 35.5248 25.5913C35.172 26.2513 34.9956 26.9572 34.9956 27.7273C34.9956 26.563 34.6075 25.5546 33.8313 24.7112C33.0551 23.8587 32.1114 23.4095 31 23.3545ZM0 36.3545C1.11136 36.2995 2.05513 35.8503 2.83131 35.0069C3.6075 34.1635 3.99559 33.1642 3.99559 32C3.99559 33.1642 4.38368 34.1635 5.15987 35.0069C5.93605 35.8503 6.87982 36.2903 8 36.3545C7.26792 36.3911 6.59757 36.602 5.98015 37.0053C5.37155 37.3995 4.88644 37.9312 4.52481 38.5913C4.172 39.2513 3.99559 39.9572 3.99559 40.7273C3.99559 39.563 3.6075 38.5546 2.83131 37.7112C2.05513 36.8587 1.11136 36.4095 0 36.3545ZM56.8313 24.0069C56.0551 24.8503 55.1114 25.2995 54 25.3545C55.1114 25.4095 56.0551 25.8587 56.8313 26.7112C57.6075 27.5546 57.9956 28.563 57.9956 29.7273C57.9956 28.9572 58.172 28.2513 58.5248 27.5913C58.8864 26.9312 59.3716 26.3995 59.9802 26.0053C60.5976 25.602 61.2679 25.3911 62 25.3545C60.8798 25.2903 59.9361 24.8503 59.1599 24.0069C58.3837 23.1635 57.9956 22.1642 57.9956 21C57.9956 22.1642 57.6075 23.1635 56.8313 24.0069ZM81 25.3545C82.1114 25.2995 83.0551 24.8503 83.8313 24.0069C84.6075 23.1635 84.9956 22.1642 84.9956 21C84.9956 22.1642 85.3837 23.1635 86.1599 24.0069C86.9361 24.8503 87.8798 25.2903 89 25.3545C88.2679 25.3911 87.5976 25.602 86.9802 26.0053C86.3716 26.3995 85.8864 26.9312 85.5248 27.5913C85.172 28.2513 84.9956 28.9572 84.9956 29.7273C84.9956 28.563 84.6075 27.5546 83.8313 26.7112C83.0551 25.8587 82.1114 25.4095 81 25.3545ZM136 36.3545C137.111 36.2995 138.055 35.8503 138.831 35.0069C139.607 34.1635 139.996 33.1642 139.996 32C139.996 33.1642 140.384 34.1635 141.16 35.0069C141.936 35.8503 142.88 36.2903 144 36.3545C143.268 36.3911 142.598 36.602 141.98 37.0053C141.372 37.3995 140.886 37.9312 140.525 38.5913C140.172 39.2513 139.996 39.9572 139.996 40.7273C139.996 39.563 139.607 38.5546 138.831 37.7112C138.055 36.8587 137.111 36.4095 136 36.3545ZM101.831 49.0069C101.055 49.8503 100.111 50.2995 99 50.3545C100.111 50.4095 101.055 50.8587 101.831 51.7112C102.607 52.5546 102.996 53.563 102.996 54.7273C102.996 53.9572 103.172 53.2513 103.525 52.5913C103.886 51.9312 104.372 51.3995 104.98 51.0053C105.598 50.602 106.268 50.3911 107 50.3545C105.88 50.2903 104.936 49.8503 104.16 49.0069C103.384 48.1635 102.996 47.1642 102.996 46C102.996 47.1642 102.607 48.1635 101.831 49.0069Z\"/></svg>";

  function paintSwitch(btn, dark) {
    btn.dataset.state = dark ? 'dark' : 'light';
    btn.setAttribute('aria-checked', dark ? 'true' : 'false');
    var label = dark ? '切换到浅色' : '切换到深色';
    btn.title = label;
    btn.setAttribute('aria-label', label);
  }

  /** 日/夜胶囊开关：白天是云 + 太阳，夜里是星星 + 月亮 */
  function dayNight(opts) {
    var o = opts || {};
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mp-ts' + (o.class ? ' ' + o.class : '');
    btn.setAttribute('role', 'switch');
    btn.innerHTML = '<span class="mp-ts-c" aria-hidden="true">'
      + '<span class="mp-ts-clouds"></span>'
      + '<span class="mp-ts-stars">' + STARS + '</span>'
      + '<span class="mp-ts-circle"><span class="mp-ts-sm"><span class="mp-ts-moon">'
      + '<span class="mp-ts-spot"></span><span class="mp-ts-spot"></span><span class="mp-ts-spot"></span>'
      + '</span></span></span></span>';
    paintSwitch(btn, !!o.dark);
    // 首次挂载不播放过渡，避免从 light 闪到 dark。
    // requestAnimationFrame 在 jsdom / 老环境可能不存在，退化成 setTimeout。
    var raf = window.requestAnimationFrame
      ? function (fn) { window.requestAnimationFrame(fn); }
      : function (fn) { setTimeout(fn, 16); };
    btn.classList.add('mp-ts-still');
    raf(function () {
      raf(function () { btn.classList.remove('mp-ts-still'); });
    });
    btn.addEventListener('click', function () {
      var next = btn.dataset.state !== 'dark';
      paintSwitch(btn, next);
      if (o.onChange) o.onChange(next, btn);
    });
    return btn;
  }

  /* 回到顶部：固定在右下角，滚过一屏后出现。
     和「增强/原始」浮动条分两层摆（浮动条 bottom:84px），互不遮挡。 */
  var topBtn = null;
  function toTop() {
    if (topBtn && document.body.contains(topBtn)) return topBtn;
    topBtn = h('button', {
      id: 'mp-to-top',
      class: 'mp-to-top',
      type: 'button',
      title: '回到顶部',
      'aria-label': '回到顶部'
    }, h('svg', {
      viewBox: '0 0 24 24',
      width: 16,
      height: 16,
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2.2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    },
      h('path', { d: 'M12 19V5' }),
      h('path', { d: 'M5 12l7-7 7 7' })
    ));
    topBtn.addEventListener('click', function () {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    });
    document.body.appendChild(topBtn);
    var onScroll = function () {
      if (window.scrollY > 360) topBtn.classList.add('is-on');
      else topBtn.classList.remove('is-on');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return topBtn;
  }

  return { chip, button, skeleton, empty, toolbar, card, dayNight, paintSwitch, toTop };
})();

/**
 * 启动过渡层：document_start 注入，先盖住页面，等增强视图挂载完再淡出。
 * 目的：页面加载与重绘期间给一个明确的「正在处理」信号，减少反复刷新。
 * 独立于其它模块，不依赖任何外部 CSS，避免样式未到位时闪烁。
 */
(function () {
  'use strict';

  var MP = (window.MP = window.MP || {});
  var HOST_OK = /(^|\.)(www|search)\.mcmod\.cn$/i.test(location.hostname);

  if (!HOST_OK) {
    // 不重绘的子域（bbs / play）不显示过渡层，但保留同名空接口
    MP.splash = { done: function () {}, show: function () {} };
    return;
  }

  var HOST_ID = 'mp-splash';
  var MAX_MS = 6000;
  var timer = null;
  var host = null;

  var CSS = [
    '#mp-splash{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;',
    'background:radial-gradient(900px 500px at 20% 0%,rgba(87,185,138,.16),transparent 60%),',
    'radial-gradient(800px 500px at 90% 10%,rgba(214,168,96,.14),transparent 55%),#f3f1ec;',
    'opacity:1;transition:opacity .45s ease,visibility .45s ease;font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif}',
    '#mp-splash.mp-splash-dark{background:radial-gradient(900px 500px at 20% 0%,rgba(87,185,138,.14),transparent 60%),',
    'radial-gradient(800px 500px at 90% 10%,rgba(196,140,60,.12),transparent 55%),#14130f}',
    '#mp-splash.mp-splash-out{opacity:0;visibility:hidden}',
    '.mp-splash-box{display:flex;flex-direction:column;align-items:center;gap:18px}',
    '.mp-splash-mark{width:64px;height:64px;border-radius:18px;display:grid;place-items:center;',
    'background:#2f6f4f;color:#fff;font-size:22px;font-weight:700;letter-spacing:.02em;',
    'box-shadow:0 12px 30px rgba(47,111,79,.28);animation:mp-splash-pulse 1.6s ease-in-out infinite}',
    '.mp-splash-dark .mp-splash-mark{background:#57b98a;color:#12211a;box-shadow:0 12px 30px rgba(87,185,138,.25)}',
    '.mp-splash-text{font-size:13px;letter-spacing:.08em;color:#8b8478}',
    '.mp-splash-dark .mp-splash-text{color:#8d867a}',
    '.mp-splash-bar{width:168px;height:3px;border-radius:99px;overflow:hidden;background:rgba(120,110,100,.18)}',
    '.mp-splash-bar i{display:block;width:40%;height:100%;border-radius:99px;background:#2f6f4f;animation:mp-splash-slide 1.15s cubic-bezier(.4,0,.2,1) infinite}',
    '.mp-splash-dark .mp-splash-bar i{background:#57b98a}',
    '@keyframes mp-splash-pulse{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-4px) scale(1.03)}}',
    '@keyframes mp-splash-slide{0%{transform:translateX(-110%)}100%{transform:translateX(330%)}}',
    '@media (prefers-reduced-motion:reduce){#mp-splash,.mp-splash-mark,.mp-splash-bar i{animation:none!important;transition:none!important}}'
  ].join('');

  function dark() {
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  }

  function build() {
    var style = document.createElement('style');
    style.id = 'mp-splash-style';
    style.textContent = CSS;

    var node = document.createElement('div');
    node.id = HOST_ID;
    if (dark()) node.className = 'mp-splash-dark';
    node.innerHTML =
      '<div class="mp-splash-box">' +
      '<div class="mp-splash-mark">MC</div>' +
      '<div class="mp-splash-text">正在准备增强视图</div>' +
      '<div class="mp-splash-bar"><i></i></div>' +
      '</div>';

    var root = document.head || document.documentElement;
    root.appendChild(style);
    (document.body || document.documentElement).appendChild(node);
    return node;
  }

  function done() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (!host) return;
    host.classList.add('mp-splash-out');
    var el = host;
    host = null;
    setTimeout(function () {
      if (el && el.parentNode) el.parentNode.removeChild(el);
      var s = document.getElementById('mp-splash-style');
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }, 480);
  }

  function show() {
    if (host) return;
    host = build();
    // 兜底：任何异常都不该让页面被遮罩长期占住
    timer = setTimeout(done, MAX_MS);
  }

  // 立即显示；若设置里已关闭插件，则立刻收起
  try {
    show();
    if (window.chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get({ enabled: true }, function (s) {
        if (s && s.enabled === false) done();
      });
    }
  } catch (e) {
    done();
  }

  MP.splash = { done: done, show: show };
})();

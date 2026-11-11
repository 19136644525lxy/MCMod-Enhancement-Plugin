/**
 * 启动过渡层：document_start 注入，先盖住页面，等增强视图挂载完再淡出。
 * 目的：页面加载与重绘期间给一个明确的「正在处理」信号，减少反复刷新。
 * 独立于其它模块，不依赖任何外部 CSS，避免样式未到位时闪烁。
 *
 * 视觉：圆角方块里的线稿「方块小人」（草叶 + 方形头 + 会眨的眼睛），
 * 外加 conic-gradient 光环与细进度条；深浅色跟随系统。
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
  var MIN_MS = 1100;
  var shownAt = 0;
  var timer = null;
  var host = null;

  var CSS = [
    '#mp-splash{--s-bg:#f3f1ec;--s-ink:#1d1b18;--s-sub:#8b8478;--s-accent:#2f6f4f;--s-bar:rgba(120,110,100,.16);',
    'position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow:hidden;',
    'background:radial-gradient(900px 500px at 20% 0%,rgba(139,195,74,.16),transparent 60%),',
    'radial-gradient(800px 500px at 90% 10%,rgba(99,179,216,.16),transparent 55%),var(--s-bg);',
    'opacity:1;transition:opacity .62s cubic-bezier(.16,1,.3,1),transform .62s cubic-bezier(.16,1,.3,1);font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif}',
    '#mp-splash.mp-splash-dark{--s-bg:#14130f;--s-ink:#f2efe9;--s-sub:#8d867a;--s-accent:#57b98a;--s-bar:rgba(255,255,255,.12)}',
    '@media (prefers-color-scheme:dark){#mp-splash{--s-bg:#14130f;--s-ink:#f2efe9;--s-sub:#8d867a;--s-accent:#57b98a;--s-bar:rgba(255,255,255,.12)}}',
    '#mp-splash.mp-splash-out{opacity:0;transform:scale(1.03);pointer-events:none}',

    '.mp-splash-glow{position:absolute;width:560px;height:560px;border-radius:50%;opacity:.7;',
    'background:conic-gradient(from 0deg,rgba(139,195,74,.30),rgba(99,179,216,.18),rgba(214,168,96,.22),rgba(139,195,74,.30));',
    'filter:blur(56px);animation:mp-splash-spin 9s linear infinite}',

    '.mp-splash-box{position:relative;display:flex;flex-direction:column;align-items:center;gap:20px;z-index:1}',

    // 圆角方块容器（毛玻璃）+ 中央线稿角色，参考 B 站加载页的「TV 小人」
    '.mp-splash-orb{position:relative;width:132px;height:132px;border-radius:34px;display:grid;place-items:center;',
    'background:linear-gradient(160deg,rgba(46,44,40,.94),rgba(22,20,17,.97));',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 0 -1px 0 rgba(0,0,0,.42),0 22px 48px rgba(40,30,20,.30);',
    'animation:mp-orb-in .82s cubic-bezier(.3,1.5,.5,1) both}',
    '#mp-splash.mp-splash-dark .mp-splash-orb{background:linear-gradient(160deg,rgba(255,255,255,.13),rgba(255,255,255,.05));',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.22),inset 0 -1px 0 rgba(0,0,0,.3),0 22px 48px rgba(0,0,0,.5)}',
    '.mp-splash-orb::after{content:"";position:absolute;inset:-13px;border-radius:46px;padding:1.5px;',
    'background:conic-gradient(from 0deg,transparent 0deg,var(--s-accent) 90deg,transparent 200deg,transparent 360deg);',
    '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
    '-webkit-mask-composite:xor;mask-composite:exclude;animation:mp-splash-spin 2.8s linear infinite}',

    '.mp-splash-face{width:78px;height:78px;display:block;animation:mp-splash-bob 3.6s ease-in-out infinite}',
    '.mp-splash-eye{transform-box:fill-box;transform-origin:center;animation:mp-splash-blink 4.4s infinite}',

    '.mp-splash-name{font-size:30px;font-weight:700;letter-spacing:.02em;color:var(--s-ink);line-height:1}',
    '.mp-splash-name i{display:inline-block;font-style:normal;animation:mp-splash-char .58s cubic-bezier(.16,1,.3,1) both}',
    '.mp-splash-name i:nth-child(2){animation-delay:.07s}',
    '.mp-splash-tag{font-size:12.5px;letter-spacing:.18em;color:var(--s-sub);animation:mp-splash-fade .8s .15s ease both}',
    '.mp-splash-bar{width:172px;height:2px;border-radius:99px;overflow:hidden;background:var(--s-bar);animation:mp-splash-fade .8s .2s ease both}',
    '.mp-splash-bar i{display:block;width:100%;height:100%;border-radius:99px;transform-origin:left center;',
    'background:linear-gradient(90deg,transparent,var(--s-accent),transparent);animation:mp-splash-slide 1.35s cubic-bezier(.4,0,.2,1) infinite}',

    '@keyframes mp-splash-spin{to{transform:rotate(360deg)}}',
    '@keyframes mp-splash-rise{from{opacity:0;transform:translateY(10px) scale(.92)}to{opacity:1;transform:none}}',
    '@keyframes mp-orb-in{0%{opacity:0;transform:scale(.5) rotate(-14deg)}65%{opacity:1;transform:scale(1.06) rotate(3deg)}to{opacity:1;transform:none}}',
    '@keyframes mp-splash-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}',
    '@keyframes mp-splash-blink{0%,90%,100%{transform:scaleY(1)}93%,96%{transform:scaleY(.1)}}',
    '@keyframes mp-splash-char{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}',
    '@keyframes mp-splash-fade{from{opacity:0}to{opacity:1}}',
    '@keyframes mp-splash-slide{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}',

    '@media (prefers-reduced-motion:reduce){#mp-splash,.mp-splash-glow,.mp-splash-orb,.mp-splash-face,.mp-splash-eye,.mp-splash-name i,.mp-splash-tag,.mp-splash-bar,.mp-splash-bar i,.mp-splash-orb::after{animation:none!important;transition:none!important}}'
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

    var face =
      '<svg class="mp-splash-face" viewBox="0 0 100 100" fill="none" aria-hidden="true">' +
        '<path d="M34 25 C29 15 33 8 42 6" stroke="#7fc46c" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M66 25 C71 15 67 8 58 6" stroke="#7fc46c" stroke-width="5" stroke-linecap="round"/>' +
        '<rect x="16" y="26" width="68" height="52" rx="15" stroke="#fff" stroke-width="6"/>' +
        '<rect class="mp-splash-eye" x="34" y="42" width="9" height="15" rx="4.5" fill="#fff"/>' +
        '<rect class="mp-splash-eye" x="57" y="42" width="9" height="15" rx="4.5" fill="#fff"/>' +
      '</svg>';

    node.innerHTML =
      '<div class="mp-splash-glow"></div>' +
      '<div class="mp-splash-box">' +
        '<div class="mp-splash-orb">' + face + '</div>' +
        '<div class="mp-splash-name"><i>百</i><i>科</i></div>' +
        '<div class="mp-splash-tag">正在准备增强视图</div>' +
        '<div class="mp-splash-bar"><i></i></div>' +
      '</div>';

    var root = document.head || document.documentElement;
    root.appendChild(style);
    (document.body || document.documentElement).appendChild(node);
    return node;
  }

  function done(force) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (!host) return;
    // 最短显示时长：logo 弹入 + 光环旋转至少走完一轮，避免「一闪而过」
    // force=true 用于「插件已禁用」等必须立刻消失的场景
    var left = force ? 0 : MIN_MS - (Date.now() - shownAt);
    if (left > 0) {
      timer = setTimeout(finish, left);
      return;
    }
    finish();
  }

  function finish() {
    if (!host) return;
    var el = host;
    host = null;
    el.classList.add('mp-splash-out');
    setTimeout(function () {
      if (el && el.parentNode) el.parentNode.removeChild(el);
      var s = document.getElementById('mp-splash-style');
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }, 640);
  }

  function show() {
    if (host) return;
    host = build();
    shownAt = Date.now();
    // 兜底：任何异常都不该让页面被遮罩长期占住
    timer = setTimeout(done, MAX_MS);
  }

  // 立即显示；若设置里已关闭插件，则立刻收起
  try {
    show();
    if (window.chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get({ enabled: true }, function (s) {
        if (s && s.enabled === false) done(true);
      });
    }
  } catch (e) {
    done();
  }

  MP.splash = { done: done, show: show };
})();

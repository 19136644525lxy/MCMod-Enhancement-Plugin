/**
 * 主题与样式注入。
 * 样式表通过 web_accessible_resources 暴露，运行时按需 <link> 注入，卸载时移除。
 */
window.MP = window.MP || {};

MP.theme = (function () {
  const INJECTED = new Map(); // href -> link
  const CORE_CSS = ['styles/tokens.css', 'styles/base.css'];

  function inject(href) {
    if (INJECTED.has(href)) return INJECTED.get(href);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL(href);
    link.dataset.mpStyle = href;
    document.documentElement.appendChild(link);
    INJECTED.set(href, link);
    return link;
  }

  function injectCore() {
    CORE_CSS.forEach(inject);
  }

  function remove(href) {
    const link = INJECTED.get(href);
    if (link) {
      link.remove();
      INJECTED.delete(href);
    }
  }

  function apply(settings) {
    const mode = (settings && settings.theme) || 'auto';
    const root = document.documentElement;
    const next = mode === 'auto' ? '' : mode;
    const cur = root.dataset.mpTheme || '';
    const compact = (settings && settings.compact) ? '1' : '0';

    if (next === cur) {
      root.dataset.mpCompact = compact;
      return;
    }

    // 主题色是「变量 + 渐变 + backdrop-filter」一起变的。
    // 这些属性里渐变和 blur 不能插值，如果让 background-color 单独过渡 300ms，
    // 中间那几帧就是「深色渐变 + 浅色底」——也就是用户看到的半暗半白。
    // 所以切换这两帧里把过渡全停掉，直接换色，换完再恢复。
    root.classList.add('mp-theme-switching');
    if (!next) delete root.dataset.mpTheme;
    else root.dataset.mpTheme = next;
    root.dataset.mpCompact = compact;

    const raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
    raf(function () {
      raf(function () {
        root.classList.remove('mp-theme-switching');
      });
    });
  }

  function cycle() {
    const order = ['auto', 'light', 'dark'];
    const cur = document.documentElement.dataset.mpTheme || 'auto';
    const next = order[(order.indexOf(cur) + 1) % order.length];
    apply({ theme: next });
    return next;
  }

  return { inject, injectCore, remove, apply, cycle };
})();

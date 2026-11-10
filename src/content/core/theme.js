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
    if (mode === 'auto') delete root.dataset.mpTheme;
    else root.dataset.mpTheme = mode;
    root.dataset.mpCompact = (settings && settings.compact) ? '1' : '0';
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

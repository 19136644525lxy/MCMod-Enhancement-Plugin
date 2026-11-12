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

  /**
   * 切换主题只需要翻 data-mp-theme。
   * 背景的底色和三团光斑都是 @property 注册过的 <color> 变量
   * （--mp-bg-base / --mp-spot-a|b|c，见 styles/tokens.css），
   * 翻 class 时它们会自己按 .34s 平滑插值，不会出现「渐变已变暗、底色还亮着」的中间态。
   */
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

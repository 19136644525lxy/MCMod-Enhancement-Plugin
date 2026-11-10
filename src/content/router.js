/**
 * 内容脚本入口：按站点分发、绑定快捷键、响应设置变化。
 */
window.MP = window.MP || {};
MP.router = (function () {
  const { h, ready } = MP.dom;
  let settings = null;
  let debugEl = null;

  function isSearchHost() {
    return /(^|\.)search\.mcmod\.cn$/i.test(location.hostname);
  }

  function tryMountSearch(retry) {
    if (!isSearchHost()) return;
    const list = document.querySelector('.search-result-list');
    if (list) {
      MP.pages.search.mount(settings);
      return;
    }
    if (retry === false) return;
    const mo = new MutationObserver(() => {
      if (document.querySelector('.search-result-list')) {
        mo.disconnect();
        MP.pages.search.mount(settings);
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 4000);
  }

  function bindKeys() {
    document.addEventListener(
      'keydown',
      (e) => {
        const mod = e.ctrlKey || e.metaKey;
        if (mod && !e.altKey && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          e.stopPropagation();
          MP.palette.toggle(settings);
          return;
        }
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          toggleDebug();
        }
      },
      true
    );
  }

  /* ---------------- 调试面板 ---------------- */

  function exportSnapshot() {
    const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const path = location.pathname === '/' ? 'home' : location.pathname.replace(/[\\/]+/g, '_').replace(/^_|_$/g, '');
    a.href = url;
    a.download = `${location.hostname}_${path || 'page'}.html`;
    a.style.display = 'none';
    document.documentElement.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function debugRow(label, value) {
    return h('div', { class: 'mp-debug-row' },
      h('span', { class: 'mp-debug-label' }, label),
      h('span', { class: 'mp-debug-value' }, String(value))
    );
  }

  function toggleDebug() {
    if (debugEl) {
      debugEl.remove();
      debugEl = null;
      return;
    }
    const data = isSearchHost() ? MP.extract.search(document) : null;

    const panel = h('div', { class: 'mp-debug mp-root' },
      h('div', { class: 'mp-debug-head' },
        h('strong', null, 'MC百科增强 · 调试'),
        MP.ui.button('关闭', { variant: 'ghost', onclick: toggleDebug })
      ),
      debugRow('页面', location.href),
      debugRow('设置', JSON.stringify(settings)),
      debugRow('样式', document.querySelectorAll('link[data-mp-style]').length + ' 个'),
      debugRow(
        '首页增强',
        MP.pages.home && MP.pages.home.isHome()
          ? document.querySelectorAll('.mp-grid').length + ' 个网格 / ' + document.querySelectorAll('.mp-block').length + ' 个板块'
          : '—'
      ),
      data ? debugRow('搜索结果', data.ok ? `${data.count} 条` : '抽取失败：' + data.error) : null,
      data && data.ok
        ? h('pre', { class: 'mp-debug-pre' }, JSON.stringify(data.items.slice(0, 3), (k, v) => (k === 'raw' ? undefined : v), 2))
        : null,
      h('div', { class: 'mp-debug-actions' },
        isSearchHost() ? MP.ui.button('重新重绘', { onclick: () => MP.pages.search.mount(settings) }) : null,
        isSearchHost() ? MP.ui.button('恢复原始视图', { onclick: () => MP.pages.search.restore(document.querySelector('.search-result-list')) }) : null,
        MP.ui.button('切换主题', { onclick: () => { MP.theme.cycle(); } }),
        MP.ui.button('导出页面 HTML', { variant: 'ghost', onclick: exportSnapshot })
      )
    );
    document.documentElement.appendChild(panel);
    debugEl = panel;
  }

  /* ---------------- 生命周期 ---------------- */

  function applySettings(next) {
    settings = Object.assign({}, settings, next);
    MP.theme.apply(settings);
    if (!settings.enabled) {
      document.querySelectorAll('link[data-mp-style]').forEach((l) => l.remove());
    } else {
      MP.theme.injectCore();
    }
  }

  function boot() {
    MP.store.getSync().then((s) => {
      settings = s;
      if (!s.enabled) return;
      MP.theme.injectCore();
      MP.theme.apply(s);
      bindKeys();
      if (MP.pages.home) MP.pages.home.mount(s);
      tryMountSearch();
    });

    MP.store.onChange(applySettings);
  }

  ready(boot);

  return { boot, toggleDebug, tryMountSearch };
})();

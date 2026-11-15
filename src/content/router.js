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

  function isHomePage() {
    if (location.hostname !== 'www.mcmod.cn') return false;
    const p = location.pathname;
    return p === '/' || p === '/index.html' || p === '/index.php';
  }

  function bindKeys() {
    document.addEventListener(
      'keydown',
      (e) => {
        const mod = e.ctrlKey || e.metaKey;
        if (mod && !e.altKey && e.key.toLowerCase() === 'k') {
          // 命令面板只在首页启用：它要拿首页的模组卡和搜索框上下文，
          // 在物品页/个人中心这类页面上开出来也搜不出有用的东西。
          if (!isHomePage()) return;
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

  /* ---------------- 结构重绘页面分发 ---------------- */

  const PAGE_MODULES = ['item', 'klass', 'modpack', 'modlist', 'category', 'post'];

  function currentPageModule() {
    for (const key of PAGE_MODULES) {
      const mod = MP.pages && MP.pages[key];
      if (mod && typeof mod.match === 'function' && mod.match()) return key;
    }
    return null;
  }

  // 四页（item / klass / modpack / category）都已定稿，统一走自绘视图，
  // 不再有「结构重绘」开关；哪些页能挂载由 PAGE_MODULES 决定。

  /** 把当前页恢复成原站视图。各页的 unmount 自己负责撤宿主 / 解除隐藏 / 收外壳。 */
  function restoreCurrentPage() {
    const key = currentPageModule();
    if (!key) return false;
    const mod = MP.pages && MP.pages[key];
    try {
      if (mod && typeof mod.unmount === 'function') {
        mod.unmount();
        return true;
      }
    } catch (e) {
      console.warn('[MCMod+] 恢复原始视图失败', key, e);
    }
    return false;
  }

  function tryMountPage() {
    const key = currentPageModule();
    if (!key) return false;
    return MP.pages[key].mount(settings) !== false;
  }

  function restyleAll() {
    tryMountPage();
  }

  function homeActive() {
    return !!(document.getElementById('mp-home-host') && document.body.classList.contains('mp-home-mode'));
  }

  /* ---------------- 调试面板 ---------------- */

  function exportSnapshot() {
    const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const path = location.pathname === '/' ? 'home' : location.pathname.replace(/[\\/]+/g, '_').replace(/^_|_$/g, '');
    // 路径本身可能已带 .html，避免出现 .html.html
    const base = path ? path.replace(/\.html?$/i, '') : 'page';
    a.href = url;
    a.download = `${location.hostname}_${base}.html`;
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
    const pageKey = currentPageModule();
    const netRow = debugRow('网络请求', '…');

    const panel = h('div', { class: 'mp-debug mp-root' },
      h('div', { class: 'mp-debug-head' },
        h('strong', null, 'MC百科增强 · 调试'),
        MP.ui.button('关闭', { variant: 'ghost', onclick: toggleDebug })
      ),
      debugRow('页面', location.href),
      debugRow('设置', JSON.stringify(settings)),
      debugRow('样式', document.querySelectorAll('link[data-mp-style]').length + ' 个'),
      debugRow('页面重绘（四类页）', pageKey ? pageKey + ' 页已接管' : '此页未接管'),
      debugRow('首页排版', homeActive() ? '已重绘（毛玻璃）' : '未接管'),
      netRow,
      data ? debugRow('搜索结果', data.ok ? `${data.count} 条` : '抽取失败：' + data.error) : null,
      data && data.ok
        ? h('pre', { class: 'mp-debug-pre' }, JSON.stringify(data.items.slice(0, 3), (k, v) => (k === 'raw' ? undefined : v), 2))
        : null,
      h('div', { class: 'mp-debug-actions' },
        pageKey ? MP.ui.button('重新重绘', { onclick: () => { restoreCurrentPage(); tryMountPage(); } }) : null,
        pageKey ? MP.ui.button('恢复原始视图', { onclick: () => restoreCurrentPage() }) : null,
        isSearchHost() ? MP.ui.button('重新重绘', { onclick: () => MP.pages.search.mount(settings) }) : null,
        isSearchHost() ? MP.ui.button('恢复原始视图', { onclick: () => MP.pages.search.restore(document.querySelector('.search-result-list')) }) : null,
        MP.ui.button('切换主题', { onclick: () => { MP.theme.cycle(); } }),
        MP.ui.button('导出页面 HTML', { variant: 'ghost', onclick: exportSnapshot })
      )
    );
    document.documentElement.appendChild(panel);
    debugEl = panel;

    try {
      chrome.runtime.sendMessage({ type: 'mp:stats' }, (res) => {
        if (chrome.runtime.lastError || !res || !res.ok) return;
        const v = netRow.querySelector('.mp-debug-value');
        if (v) v.textContent = `${res.fetched} 次（拦截 ${res.blocked}）`;
      });
    } catch (e) {
      /* 拿不到统计不影响面板 */
    }
  }

  /* ---------------- 生命周期 ---------------- */

  function applySettings(next) {
    settings = Object.assign({}, settings, next);
    MP.theme.apply(settings);
    if (!settings.enabled) {
      document.querySelectorAll('link[data-mp-style]').forEach((l) => l.remove());
      try { if (MP.pages.home && MP.pages.home.unmount) MP.pages.home.unmount(); } catch (e) { /* ignore */ }
      try { restoreCurrentPage(); } catch (e) { /* ignore */ }
    } else {
      MP.theme.injectCore();
      try {
        restyleAll();
      } catch (e) { console.warn('[MCMod+] 重绘失败', e); }
    }
  }

  // 跨页/跨标签页同步：主题、紧凑、背景这些设置在 chrome.storage.sync 里，
  // 任一页面改动后，其它已打开的页面要立刻跟着变，而不是等下次刷新。
  function subscribeSettings() {
    try {
      MP.store.onChange(function (changes) {
        var keys = ['theme', 'compact', 'bgPreset', 'bgIntensity'];
        var hit = keys.some(function (k) { return Object.prototype.hasOwnProperty.call(changes, k); });
        if (!hit) return;
        MP.store.getSync().then(function (next) {
          settings = next;
          try { MP.theme.apply(next); } catch (e) { /* ignore */ }
          try { syncThemeSwitches(next); } catch (e) { /* ignore */ }
          if (MP.background && (changes.bgPreset || changes.bgIntensity)) {
            try {
              if (next.bgIntensity != null) MP.background.setIntensity(next.bgIntensity);
              MP.background.apply(next.bgPreset || 'mist');
            } catch (e) { /* ignore */ }
          }
        }).catch(function () { /* ignore */ });
      });
    } catch (e) { /* ignore */ }
  }

  function prefersDark() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (e) { return false; }
  }

  function syncThemeSwitches(settings) {
    if (!MP.ui || !MP.ui.paintSwitch) return;
    var theme = (settings && settings.theme) || 'auto';
    var dark = theme === 'dark' || (theme === 'auto' && prefersDark());
    var nodes = document.querySelectorAll('.mp-theme-switch, .mp-topbar-daynight, #mp-daynight');
    for (var i = 0; i < nodes.length; i++) {
      try { MP.ui.paintSwitch(nodes[i], dark); } catch (e) { /* ignore */ }
    }
  }

  function syncOnFocus() {
    try {
      window.addEventListener('focus', function () {
        MP.store.getSync().then(function (next) {
          settings = next;
          try { MP.theme.apply(next); } catch (e) { /* ignore */ }
          try { syncThemeSwitches(next); } catch (e) { /* ignore */ }
        }).catch(function () { /* ignore */ });
      });
    } catch (e) { /* ignore */ }
  }

  function boot() {
    subscribeSettings();
    syncOnFocus();
    MP.store.getSync().then((s) => {
      settings = s;
      if (!s.enabled) {
        try { MP.splash.done(); } catch (e) { /* ignore */ }
        return;
      }
      // 任一模块出错都不应影响其余模块与页面本身
      try { MP.theme.injectCore(); } catch (e) { console.warn('[MCMod+] 样式注入失败', e); }
      try { MP.theme.apply(s); } catch (e) { console.warn('[MCMod+] 主题应用失败', e); }
      try { bindKeys(); } catch (e) { console.warn('[MCMod+] 快捷键绑定失败', e); }
      try { if (MP.pages.home) MP.pages.home.mount(s); } catch (e) { console.warn('[MCMod+] 首页模块失败', e); }
      try { tryMountSearch(); } catch (e) { console.warn('[MCMod+] 搜索页模块失败', e); }
      try { tryMountPage(); } catch (e) { console.warn('[MCMod+] 页面重绘失败', e); }
      try { if (MP.pages.center && MP.pages.center.mount(s)) { /* 个人中心 */ } } catch (e) { console.warn('[MCMod+] 个人中心模块失败', e); }
      try { MP.splash.done(); } catch (e) { /* ignore */ }
    }).catch((e) => {
      console.warn('[MCMod+] 设置读取失败', e);
      try { MP.splash.done(); } catch (err) { /* ignore */ }
    });

    MP.store.onChange(applySettings);
  }

  ready(boot);

  return { boot, toggleDebug, tryMountSearch, tryMountPage, currentPageModule };
})();

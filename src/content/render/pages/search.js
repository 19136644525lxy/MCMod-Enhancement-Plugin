/**
 * 搜索页结构重绘
 *
 * 接管范围：整块内容区（`.common-frame .center`）。
 * 保留：顶栏（换皮）、面包屑 `.common-nav`、页脚（换皮）。
 *
 * 与首页/个人中心一样走「抽 → 渲 → 挂」三层：
 *   MP.extract.search(document) 出数据 → 这里拼 DOM → 插到 .center 原来位置，
 *   原 .center 加 mp-origin-hidden 藏起来；「原始视图」随时换回来。
 */
window.MP = window.MP || {};
MP.pages = MP.pages || {};

MP.pages.search = (function () {
  const { h, clear, highlight } = MP.dom;

  let host = null;
  let hostAnchor = null; // 被隐藏的 .center

  function isDarkNow() {
    const t = document.documentElement.dataset.mpTheme;
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function gearSvg() {
    return h('svg', {
      class: 'mp-fab-gear',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.8',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true'
    },
      h('path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }),
      h('circle', { cx: '12', cy: '12', r: '3' })
    );
  }

  /** 顶栏的设置齿轮，和首页 / 个人主页保持同一个入口。 */
  function ensureGear() {
    const right = document.querySelector('.header-container .header-right') ||
      document.querySelector('.top-main .info') ||
      document.querySelector('.header-right');
    if (!right || document.getElementById('mp-search-gear')) return;
    const btn = h('button', {
      class: 'mp-gear-btn',
      type: 'button',
      title: '插件设置',
      'aria-label': '插件设置',
      onclick: function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (MP.settingsPanel) MP.settingsPanel.toggle();
      }
    }, gearSvg());
    btn.id = 'mp-search-gear';
    right.appendChild(btn);
  }
  function ensureDayNight() {
    // 搜索页顶栏和 wiki 页不完全一致：优先右边的工具区，退到 .info 再退到 body
    const right = document.querySelector('.header-container .header-right') ||
      document.querySelector('.top-main .info') ||
      document.querySelector('.header-right');
    if (!right || document.getElementById('mp-daynight')) return;
    if (!MP.ui || !MP.ui.dayNight) return;
    try {
      const el = MP.ui.dayNight({
        dark: isDarkNow(),
        class: 'mp-topbar-daynight',
        onChange: function (next) {
          MP.theme.apply({ theme: next ? 'dark' : 'light' });
          MP.store.setSync({ theme: next ? 'dark' : 'light' }).catch(function () {});
        }
      });
      el.id = 'mp-daynight';
      right.appendChild(el);
    } catch (e) {
      console.warn('[MCMod+] 搜索页日夜开关注入失败', e);
    }
  }

  /** 换皮：注入样式、挂 body 标记、接上背景与日夜开关。不碰 DOM 结构。 */
  function paintSkin(settings) {
    // day-night.css 是滑块本体，缺了它日夜开关会退化成一颗裸 button
    ['styles/pages/search.css', 'styles/background.css', 'styles/day-night.css', 'styles/mp-toggle.css']
      .forEach(function (href) {
        try { MP.theme.inject(href); } catch (e) { console.warn('[MCMod+] 样式注入失败', href, e); }
      });
    document.body.classList.add('mp-search-mode');
    try {
      MP.background.setIntensity((settings && settings.bgIntensity) || 45);
      MP.background.apply((settings && settings.bgPreset) || 'mist');
    } catch (e) {
      console.warn('[MCMod+] 搜索页背景注入失败', e);
    }
    try {
      ensureGear();
    } catch (e) {
      console.warn('[MCMod+] 搜索页设置按钮注入失败', e);
    }
    try {
      ensureDayNight();
    } catch (e) {
      console.warn('[MCMod+] 搜索页日夜开关注入失败', e);
    }
  }

  // ---------- 渲染 ----------

  function searchForm(data) {
    const form = data.form || { action: 'https://search.mcmod.cn/s', method: 'get', key: data.keyword, mold: '0' };
    const input = h('input', {
      class: 'mp-search-input',
      type: 'text',
      name: 'key',
      value: form.key || data.keyword || '',
      maxlength: '255',
      placeholder: '搜模组、资料、教程…',
      autocomplete: 'off',
      'aria-label': '搜索关键词'
    });
    const mold = h('input', { type: 'hidden', name: 'mold', value: form.mold || '0' });
    const submit = h('button', { class: 'mp-search-submit', type: 'submit' }, '搜索');

    const simple = h('button', {
      class: 'mp-mold' + (form.mold !== '1' ? ' is-on' : ''),
      type: 'button',
      onclick: function () {
        mold.value = '0';
        simple.classList.add('is-on');
        deep.classList.remove('is-on');
      }
    }, '简单搜索');
    const deep = h('button', {
      class: 'mp-mold' + (form.mold === '1' ? ' is-on' : ''),
      type: 'button',
      onclick: function () {
        mold.value = '1';
        deep.classList.add('is-on');
        simple.classList.remove('is-on');
      }
    }, '复杂搜索');

    return h('div', { class: 'mp-searchbar' },
      h('form', { class: 'mp-search-form', action: form.action, method: form.method, role: 'search' },
        input, mold, submit
      ),
      h('div', { class: 'mp-molds' }, simple, deep)
    );
  }

  function tabBar(data) {
    const tabs = (data.tabs || []).filter((t) => !t.external);
    if (!tabs.length) return null;
    return h('nav', { class: 'mp-seg', 'aria-label': '结果分类' },
      tabs.map(function (t) {
        return h('a', {
          class: 'mp-seg-item' + (t.active ? ' is-on' : ''),
          href: t.href
        },
          h('span', { class: 'mp-seg-label' }, t.label),
          t.count != null ? h('span', { class: 'mp-seg-count' }, String(t.count)) : null
        );
      })
    );
  }

  function resultCard(item, kw) {
    const title = h('span', { class: 'mp-r-title' });
    title.appendChild(highlight(item.title, kw));

    const snippet = h('div', { class: 'mp-r-snippet' });
    snippet.appendChild(highlight(item.snippet, kw));

    const foot = (item.foot || [])
      .filter((f) => !/快照|时间/.test(f.label))
      .map((f) => h('span', { class: 'mp-r-foot-item' }, f.label ? f.label + '：' + f.value : f.value));

    return h('a', { class: 'mp-r-card', href: item.href },
      h('div', { class: 'mp-r-head' },
        h('span', { class: 'mp-r-type' + (item.color ? ' ' + item.color : '') }, item.type),
        title
      ),
      snippet,
      foot.length || item.snapshot
        ? h('div', { class: 'mp-r-foot' },
            foot,
            item.snapshot ? h('span', { class: 'mp-r-foot-item' }, '快照 ' + item.snapshot) : null
          )
        : null
    );
  }

  function pager(data) {
    const p = data.pages;
    if (!p || !p.items.length) return null;
    return h('nav', { class: 'mp-pager', 'aria-label': '分页' },
      p.items.map(function (it) {
        return h('a', {
          class: 'mp-pager-item' + (it.active ? ' is-on' : ''),
          href: it.href
        }, it.label);
      })
    );
  }

  function build(data, onRestore) {
    const kw = data.keyword || '';
    const stats = data.stats || {};

    const hero = h('header', { class: 'mp-s-hero mp-glass' },
      h('span', { class: 'mp-s-eyebrow' }, 'MC百科 · 全站搜索'),
      h('h1', { class: 'mp-s-title' },
        kw ? ['「', h('em', null, kw), '」的搜索结果'] : '全站搜索'
      ),
      searchForm(data),
      tabBar(data)
    );

    const meta = h('div', { class: 'mp-s-meta' },
      h('span', { class: 'mp-s-stat' },
        stats.total
          ? '找到约 ' + stats.total + ' 条结果' + (stats.pages > 1 ? '，共约 ' + stats.pages + ' 页' : '')
          : (data.totalText || '共 ' + data.count + ' 条结果')
      ),
      stats.ms ? h('span', { class: 'mp-s-ms' }, '耗时 ' + stats.ms + ' ms') : null
    );

    const list = h('div', { class: 'mp-s-list' });
    if (data.items.length) {
      data.items.forEach(function (item) { list.appendChild(resultCard(item, kw)); });
    } else {
      list.appendChild(MP.ui.empty('没有匹配的结果', '换个关键词，或在命令面板（Ctrl+K）里试试模组检索'));
    }

    return h('div', { id: 'mp-search-host', class: 'mp-search-page' },
      hero, meta, list, pager(data) || ''
    );
  }

  /* ---------------- 右侧抽屉（增强 / 原始 / 设置） ---------------- */

  var fabEl = null;

  function syncFab() {
    if (!fabEl) return;
    var on = !!document.getElementById('mp-search-host');
    Array.prototype.forEach.call(fabEl.querySelectorAll('.mp-fab[data-act]'), function (b) {
      var isEnhance = b.getAttribute('data-act') === 'enhance';
      b.classList.toggle('is-on', isEnhance === on);
    });
  }

  function chevronSvg() {
    return h('svg', { class: 'mp-fab-chevron', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' },
      h('path', { d: 'M15 18l-6-6 6-6' })
    );
  }

  function ensureFab(settings) {
    if (fabEl && document.body.contains(fabEl)) {
      syncFab();
      return fabEl;
    }

    function act(name) {
      var label = name === 'enhance' ? '增强' : name === 'original' ? '原始' : gearSvg();
      var cls = 'mp-fab' + (name === 'settings' ? ' mp-fab-icon' : '');
      return h('button', {
        class: cls,
        type: 'button',
        'data-act': name,
        title: name === 'settings' ? '插件设置' : label,
        onclick: function () {
          if (name === 'original') {
            MP.pages.search.unmount();
          } else if (name === 'enhance') {
            var mountIt = function (st) {
              MP.pages.search.mount(st || settings || {});
              syncFab();
            };
            if (MP.store && MP.store.getSync) {
              MP.store.getSync().then(mountIt).catch(function () { mountIt(settings); });
            } else {
              mountIt(settings);
            }
          } else if (MP.settingsPanel) {
            MP.settingsPanel.toggle();
          }
          syncFab();
        }
      }, label);
    }

    var handle = h('button', {
      class: 'mp-fab-handle',
      type: 'button',
      title: '插件菜单',
      'aria-label': '插件菜单',
      onclick: function (e) {
        e.preventDefault();
        e.stopPropagation();
        fabEl.classList.toggle('is-open');
      }
    }, chevronSvg());

    fabEl = h('div', { id: 'mp-search-fab', class: 'mp-fab-bar' }, handle,
      h('div', { class: 'mp-fab-sheet' }, act('enhance'), act('original'), act('settings'))
    );

    document.addEventListener('click', function (e) {
      if (fabEl && fabEl.classList.contains('is-open') && !fabEl.contains(e.target)) {
        fabEl.classList.remove('is-open');
      }
    });

    document.body.appendChild(fabEl);
    syncFab();
    return fabEl;
  }
  // ---------- 挂载 / 还原 ----------

  function unmount() {
    if (host && host.parentNode) host.parentNode.removeChild(host);
    if (hostAnchor) hostAnchor.classList.remove('mp-origin-hidden');
    host = null;
    hostAnchor = null;
    const old = document.querySelector('.mp-s-list');
    if (old) old.remove();
    try { syncFab(); } catch (e) { /* ignore */ }
    return true;
  }

  function mount(settings) {
    if (!settings || !settings.enabled) return false;

    paintSkin(settings);

    if (!settings.redrawSearch) return false;

    if (host) return true;

    const anchor = document.querySelector('.common-frame .center');
    if (!anchor) return false;

    const data = MP.extract.search(document);
    if (!data.ok) {
      console.warn('[MCMod+] 搜索结果抽取失败，回退原生视图', data);
      return false;
    }

    hostAnchor = anchor;
    host = build(data, function () { unmount(); });
    anchor.parentNode.insertBefore(host, anchor);
    anchor.classList.add('mp-origin-hidden');
    try { ensureFab(settings); } catch (e) { console.warn('[MCMod+] 搜索页抽屉注入失败', e); }
    return true;
  }

  return { mount, unmount, restore: unmount };
})();

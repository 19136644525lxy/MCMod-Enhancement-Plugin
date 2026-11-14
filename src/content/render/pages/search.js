/**
 * 搜索页重绘（A 类 + B 类混合）
 * - 只接管 `.search-result-list` 内部的结果区
 * - 分页、页头、筛选表单保持原生
 * - 提供"恢复原始视图"按钮，随时回滚
 */
window.MP = window.MP || {};
MP.pages = MP.pages || {};

MP.pages.search = (function () {
  const { h, clear, highlight } = MP.dom;

  let backup = null; // {html}

  const FILTERS = [
    { id: '', label: '全部' },
    { id: '1', label: '模组' },
    { id: '2', label: '整合包' },
    { id: '3', label: '资料' },
    { id: '4', label: '教程' },
    { id: '5', label: '作者' },
    { id: '6', label: '用户' },
    { id: '7', label: '社群' }
  ];

  function filterHref(id) {
    const p = new URLSearchParams(location.search);
    if (id) p.set('filter', id);
    else p.delete('filter');
    p.delete('page');
    return location.pathname + '?' + p.toString();
  }

  function currentFilter() {
    return new URLSearchParams(location.search).get('filter') || '';
  }

  function keyword() {
    return new URLSearchParams(location.search).get('key') || '';
  }

  function renderCard(item, kw) {
    const title = h('span', { class: 'mp-card-title' });
    title.appendChild(highlight(item.title, kw));

    const snippet = h('div', { class: 'mp-card-snippet' });
    snippet.appendChild(highlight(item.snippet, kw));

    const footParts = [];
    if (item.foot.length) {
      item.foot.forEach((f) => {
        if (/快照|时间/.test(f.label)) return;
        footParts.push(h('span', { class: 'mp-foot-item' }, f.label ? f.label + '：' + f.value : f.value));
      });
    }
    if (item.snapshot) footParts.push(h('span', { class: 'mp-foot-item' }, '快照 ' + item.snapshot));

    return h('a', { class: 'mp-card mp-search-card', href: item.href },
      h('div', { class: 'mp-card-head' },
        h('span', { class: 'mp-card-type' }, item.type),
        title
      ),
      snippet,
      footParts.length ? h('div', { class: 'mp-card-foot' }, footParts) : null
    );
  }

  function renderToolbar(data, onRestore) {
    const chips = FILTERS.map((f) =>
      MP.ui.chip(f.label, {
        href: filterHref(f.id),
        active: currentFilter() === f.id
      })
    );

    const summary = h('div', { class: 'mp-search-summary' });
    summary.appendChild(
      h('span', null, data.totalText || `找到 ${data.count} 条结果`)
    );

    return h('div', { class: 'mp-toolbar mp-search-toolbar' },
      h('div', { class: 'mp-toolbar-left' }, chips),
      h('div', { class: 'mp-toolbar-right' },
        summary,
        MP.ui.button('原始视图', { variant: 'ghost', onclick: onRestore, title: '恢复 MC百科 原生列表' })
      )
    );
  }

  function restore(list) {
    if (!backup || !list) return;
    list.innerHTML = backup.html;
    list.classList.remove('mp-root', 'mp-search-list');
    delete list.dataset.mpRedrawn;
    backup = null;
  }

  function isDarkNow() {
    const t = document.documentElement.dataset.mpTheme;
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function ensureDayNight() {
    const right = document.querySelector('.header-container .header-right');
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
    try {
      MP.theme.inject('styles/pages/search.css');
    } catch (e) {
      console.warn('[MCMod+] 搜索页样式注入失败', e);
    }
    document.body.classList.add('mp-search-mode');
    try {
      MP.theme.inject('styles/background.css');
      MP.background.setIntensity((settings && settings.bgIntensity) || 45);
      MP.background.apply((settings && settings.bgPreset) || 'mist');
    } catch (e) {
      console.warn('[MCMod+] 搜索页背景注入失败', e);
    }
    try {
      ensureDayNight();
    } catch (e) {
      console.warn('[MCMod+] 搜索页日夜开关注入失败', e);
    }
  }

  function mount(settings) {
    if (!settings || !settings.enabled) return false;

    paintSkin(settings);

    if (!settings.redrawSearch) return false;

    const list = document.querySelector('.search-result-list');
    if (!list) return false;
    if (list.dataset.mpRedrawn === '1') return true;

    const data = MP.extract.search(document);
    if (!data.ok) {
      console.warn('[MCMod+] 搜索结果抽取失败，回退原生视图', data);
      return false;
    }

    backup = { html: list.innerHTML };
    clear(list);
    list.dataset.mpRedrawn = '1';
    list.classList.add('mp-root', 'mp-search-list');

    // 工具栏挂在 .search-result 内、列表之前，避免被 clear 掉
    const host = list.parentElement || list;
    const oldBar = host.querySelector('.mp-search-toolbar');
    if (oldBar) oldBar.remove();
    const bar = renderToolbar(data, () => {
      restore(list);
      const b = host.querySelector('.mp-search-toolbar');
      if (b) b.remove();
    });
    host.insertBefore(bar, list);

    const kw = keyword();
    data.items.forEach((item) => list.appendChild(renderCard(item, kw)));

    if (!data.items.length) {
      list.appendChild(MP.ui.empty('没有匹配的结果', '换一个关键词，或在命令面板中试试结构检索'));
    }

    return true;
  }

  return { mount, restore, FILTERS };
})();

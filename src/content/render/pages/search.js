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
      stats.ms ? h('span', { class: 'mp-s-ms' }, '耗时 ' + stats.ms + ' ms') : null,
      h('button', { class: 'mp-s-original', type: 'button', onclick: onRestore }, '原始视图')
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

  // ---------- 挂载 / 还原 ----------

  function unmount() {
    if (host && host.parentNode) host.parentNode.removeChild(host);
    if (hostAnchor) hostAnchor.classList.remove('mp-origin-hidden');
    host = null;
    hostAnchor = null;
    const old = document.querySelector('.mp-s-list');
    if (old) old.remove();
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
    return true;
  }

  return { mount, unmount, restore: unmount };
})();

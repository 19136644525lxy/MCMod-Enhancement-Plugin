/**
 * 页面外壳：所有"结构重绘"页面共用。
 * 职责：建造标题区 / 双栏骨架、隐藏原生区块、提供「增强 ↔ 原始」切换。
 * 原则：只隐藏原生 DOM，不删除；写操作（编辑/评论/评分）永远留给原生页面。
 */
window.MP = window.MP || {};

MP.shell = (function () {
  const { h, clear } = MP.dom;

  let mountedPage = null;
  let hiddenEls = [];
  let remountFn = null;
  let toolbarEl = null;

  function injectPageCss(name) {
    MP.theme.inject('styles/pages/' + name + '.css');
  }

  /** 标题区 + 双栏正文 */
  function build(cfg) {
    const head = h('header', { class: 'mp-head' },
      cfg.crumbs && cfg.crumbs.length
        ? h('nav', { class: 'mp-crumbs', 'aria-label': '面包屑' },
            cfg.crumbs.map((c, i) => h('span', { class: 'mp-crumb' + (i === cfg.crumbs.length - 1 ? ' is-current' : '') }, c)))
        : null,
      h('div', { class: 'mp-head-row' },
        cfg.icon ? h('img', { class: 'mp-head-icon', src: cfg.icon, alt: '', loading: 'lazy' }) : null,
        h('div', { class: 'mp-head-text' },
          h('h1', { class: 'mp-head-title' }, cfg.title || ''),
          cfg.subtitle ? h('div', { class: 'mp-head-sub' }, cfg.subtitle) : null,
          cfg.badges && cfg.badges.length ? h('div', { class: 'mp-badges' }, cfg.badges) : null
        ),
        cfg.actions ? h('div', { class: 'mp-head-actions' }, cfg.actions) : null
      )
    );

    return h('div', { id: 'mp-page', class: 'mp-page mp-page--' + (cfg.kind || 'generic') },
      head,
      h('div', { class: 'mp-body' },
        h('main', { class: 'mp-main' }, cfg.main || null),
        cfg.side ? h('aside', { class: 'mp-side' }, cfg.side) : null
      )
    );
  }

  /** 卡片：标题 + 内容（页面面板，类名 mp-panel 避免与搜索页 .mp-card 冲突） */
  function card(title, body, opts) {
    const o = opts || {};
    return h('section', { class: 'mp-panel' + (o.class ? ' ' + o.class : '') },
      title ? h('div', { class: 'mp-panel-head' },
        h('h2', { class: 'mp-panel-title' }, title),
        o.aside || null
      ) : null,
      h('div', { class: 'mp-panel-body' }, body)
    );
  }

  /** 键值网格 */
  function kv(pairs) {
    return h('dl', { class: 'mp-kv' },
      pairs.filter((p) => p && p.value !== '' && p.value != null).map((p) =>
        h('div', { class: 'mp-kv-row' },
          h('dt', { class: 'mp-kv-key' }, p.key),
          h('dd', { class: 'mp-kv-val' }, p.value)
        )
      )
    );
  }

  /** 图标网格（相关物品 / 贡献者） */
  function iconGrid(list, cls) {
    return h('div', { class: 'mp-icon-grid' + (cls ? ' ' + cls : '') },
      list.map((it) => h(it.href ? 'a' : 'span', {
        class: 'mp-icon-cell',
        href: it.href || undefined,
        target: it.href ? '_blank' : undefined,
        rel: it.href ? 'noopener' : undefined,
        title: it.label
      },
        it.icon ? h('img', { class: 'mp-icon-img', src: it.icon, alt: '', loading: 'lazy' }) : null,
        h('span', { class: 'mp-icon-label' }, it.label)
      ))
    );
  }

  function ensureToolbar() {
    if (toolbarEl && document.body.contains(toolbarEl)) return toolbarEl;
    toolbarEl = h('div', { id: 'mp-toolbar-host', class: 'mp-float-bar' },
      h('button', { class: 'mp-float-btn', type: 'button', onclick: () => toggleView(false) }, '增强'),
      h('button', { class: 'mp-float-btn', type: 'button', onclick: () => toggleView(true) }, '原始'),
      h('button', { class: 'mp-float-btn', type: 'button', title: '打开设置', onclick: () => {
        try { chrome.runtime.sendMessage({ type: 'mp:openOptions' }); } catch (e) { /* ignore */ }
      } }, '设置')
    );
    document.body.appendChild(toolbarEl);
    return toolbarEl;
  }

  function syncToolbar(isOriginal) {
    if (!toolbarEl) return;
    const btns = toolbarEl.querySelectorAll('.mp-float-btn');
    if (btns[0]) btns[0].classList.toggle('is-active', !isOriginal);
    if (btns[1]) btns[1].classList.toggle('is-active', isOriginal);
  }

  function restore() {
    if (mountedPage) {
      const host = document.getElementById('mp-page-host');
      if (host) clear(host);
      mountedPage = null;
    }
    hiddenEls.forEach((el) => el.classList.remove('mp-origin-hidden'));
    hiddenEls = [];
  }

  /**
   * @param {Element} page shell.build() 的产物
   * @param {string[]} hideSelectors 需要隐藏的原生区块
   * @param {Function} remount 供「恢复增强视图」调用
   */
  function mount(page, hideSelectors, remount, anchorEl) {
    restore();
    ensureToolbar();

    (hideSelectors || []).forEach((sel) => {
      const list = typeof sel === 'string' ? document.querySelectorAll(sel) : [sel];
      Array.prototype.forEach.call(list, (el) => {
        if (!el || !el.classList) return;
        el.classList.add('mp-origin-hidden');
        hiddenEls.push(el);
      });
    });

    const anchor = anchorEl ||
      document.querySelector('.common-center') ||
      document.querySelector('.center') ||
      document.body.firstElementChild;

    let host = document.getElementById('mp-page-host');
    if (!host) {
      host = h('div', { id: 'mp-page-host', class: 'mp-page-host' });
      anchor.parentNode.insertBefore(host, anchor);
    }
    clear(host);
    host.appendChild(page);

    mountedPage = page;
    remountFn = remount || null;
    syncToolbar(false);
  }

  function toggleView(toOriginal) {
    if (toOriginal) {
      restore();
      syncToolbar(true);
      return;
    }
    if (typeof remountFn === 'function') remountFn();
    syncToolbar(false);
  }

  function isOriginalView() {
    return !mountedPage;
  }

  return { build, card, kv, iconGrid, mount, restore, toggleView, isOriginalView, injectPageCss, syncToolbar };
})();

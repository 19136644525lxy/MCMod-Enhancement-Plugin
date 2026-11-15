/**
 * 检索页重绘：/modpack.html（整合包检索）与 /modlist.html（模组检索）
 *
 * 两页 DOM 完全同构：`.modlist-frame` > `.modlist-filter-frame` + `HR` +
 * `.modlist-list-frame` + `UL.pagination`，卡片都是 `.modlist-block`。
 * 所以一套渲染、一套样式，用 LIST_PAGES 区分文案与宿主 id。
 *
 * 保留 .modlist-filter-frame（筛选是 GET 表单 + onclick 跳转，属站点行为），
 * 只隐藏列表与它外面的分页/分隔线，在原位置插入自绘的卡片网格 + 分页。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag, attrs) {
    return MP.dom.h.apply(null, [tag, attrs].concat(Array.prototype.slice.call(arguments, 2)));
  }

  var LIST_PAGES = {
    modpack: {
      key: 'modpack',
      label: '整合包',
      noun: '整合包',
      match: /^\/modpack\.html$/i,
      hostId: 'mp-modpack-host',
      fabId: 'mp-modpack-fab'
    },
    modlist: {
      key: 'modlist',
      label: '模组',
      noun: '模组',
      match: /^\/modlist\.html$/i,
      hostId: 'mp-modlist-host',
      fabId: 'mp-modlist-fab'
    }
  };

  var hidden = [];
  var chrome = null;
  var fab = null;
  var mountedKey = '';

  /** 当前页面配置（两个检索页共用一套实现） */
  function pageCfg() {
    var path = (window.location && window.location.pathname) || '';
    return LIST_PAGES.modlist.match.test(path) ? LIST_PAGES.modlist : LIST_PAGES.modpack;
  }

  /* ---------------- 渲染 ---------------- */

  function card(it) {
    var inner = [
      h('div', { class: 'mp-mp-cover' },
        it.cover
          ? h('img', { src: it.cover, alt: '', loading: 'lazy' })
          : h('span', { class: 'mp-mp-ph' }, (it.title || '?').slice(0, 1))
      ),
      h('div', { class: 'mp-mp-body' },
        h('div', { class: 'mp-mp-name' }, it.title || '未命名'),
        it.ename ? h('div', { class: 'mp-mp-en' }, it.ename) : null,
        it.intro ? h('p', { class: 'mp-mp-intro' }, it.intro) : null
      )
    ];

    return it.href
      ? h('a', { class: 'mp-mp-card mp-glass', href: it.href, target: '_blank', rel: 'noopener' }, inner)
      : h('div', { class: 'mp-mp-card mp-glass' }, inner);
  }

  function pager(p) {
    if (!p || !p.pages || !p.pages.length) return null;
    return h('nav', { class: 'mp-pager', 'aria-label': '分页' },
      p.pages.map(function (it) {
        var cls = 'mp-page-item' + (it.active ? ' is-on' : '');
        if (!it.href) return h('span', { class: cls }, it.label);
        return h('a', { class: cls, href: it.href }, it.label);
      })
    );
  }

  /** 面包屑：复用 wiki.css 的 .mp-wiki-crumbs（相邻 .mp-wiki-crumb 自动补 / 分隔符） */
  function crumbsBar(list) {
    if (!list || !list.length) return null;
    return h('nav', { class: 'mp-wiki-crumbs' },
      list.map(function (c) {
        var cls = 'mp-wiki-crumb' + (c.current ? ' is-here' : '');
        return c.href
          ? h('a', { class: cls, href: c.href }, c.label)
          : h('span', { class: cls }, c.label);
      })
    );
  }

  function build(d, cfg) {
    var total = d.cards.length;
    var heroSub = d.pager && d.pager.info ? d.pager.info : ('本页 ' + total + ' 个');

    return h('div', { id: cfg.hostId, class: 'mp-wiki-page mp-modpack-page' },
      crumbsBar(d.crumbs),
      h('header', { class: 'mp-hero mp-glass' },
        h('div', { class: 'mp-hero-main' },
          h('h1', { class: 'mp-hero-title' }, cfg.label),
          h('p', { class: 'mp-hero-sub' }, heroSub),
          h('div', { class: 'mp-hero-stats' },
            h('span', { class: 'mp-hero-stat' }, h('b', null, total), '本页收录')
          )
        )
      ),
      total
        ? h('div', { class: 'mp-mp-grid' }, d.cards.map(card))
        : h('div', { class: 'mp-panel mp-glass' },
          h('div', { class: 'mp-panel-body' },
            h('p', { class: 'mp-muted' }, '这一页没有' + cfg.noun + '，换个筛选条件或翻页看看。'))),
      pager(d.pager)
    );
  }

  /* ---------------- 挂载 ---------------- */

  function isEnhanced() {
    return !!document.getElementById(pageCfg().hostId);
  }

  /**
   * 需要隐藏的原站节点。
   * 分页和分隔线是 .modlist-frame 的直接子级、并不在 .modlist-list-frame 里面，
   * 只藏列表会留下一条白底分页（「当前 1 / 48 页…」被挤断的就是它）。
   */
  function hideTargets() {
    var out = [];
    var list = document.querySelector('.modlist-list-frame');
    var frame = document.querySelector('.modlist-frame');
    var nav = document.querySelector('.common-center > .common-nav');
    if (list) out.push(list);
    if (nav) out.push(nav);
    if (frame) {
      Array.prototype.forEach.call(frame.children, function (el) {
        if (el.tagName === 'HR' || (el.matches && el.matches('ul.pagination'))) out.push(el);
      });
    }
    return out;
  }

  function mount(settings) {
    var cfg = pageCfg();
    if (isEnhanced()) return true;

    var d = MP.extract.modpack(document, cfg.key);
    if (!d || !d.ok) {
      console.warn('[MCMod+] ' + cfg.label + '检索页抽取失败', d && d.reason);
      return false;
    }

    var list = document.querySelector('.modlist-list-frame');
    var frame = document.querySelector('.modlist-frame');
    var anchor = list || frame;
    if (!anchor) return false;

    chrome = MP.pageChrome.attach({
      mode: 'mp-wiki-mode',
      css: ['styles/pages/wiki.css', 'styles/pages/modpack.css'],
      settings: settings || {}
    });

    hidden = hideTargets();
    hidden.forEach(function (el) { el.classList.add('mp-origin-hidden'); });

    // 插在列表原来的位置：筛选条在上、卡片网格在下，和原站顺序一致
    anchor.parentNode.insertBefore(build(d, cfg), anchor);
    mountedKey = cfg.key;

    fab = MP.pageChrome.fab({
      id: cfg.fabId,
      isEnhanced: isEnhanced,
      onEnhance: function () {
        MP.store.getSync().then(function (s) {
          mount(s || settings || {});
        }).catch(function () {
          mount(settings || {});
        });
      },
      onOriginal: function () {
        unmount();
      }
    });

    return true;
  }

  function unmount() {
    var cfg = LIST_PAGES[mountedKey] || pageCfg();
    var host = document.getElementById(cfg.hostId);
    if (host) host.remove();

    hidden.forEach(function (el) { el.classList.remove('mp-origin-hidden'); });
    hidden = [];
    mountedKey = '';

    if (chrome) { chrome.restore(); chrome = null; }

    try { MP.background.destroy(); } catch (e) { /* 背景可能本来就没起 */ }

    if (fab) { fab.sync(); fab = null; }
  }

  MP.pages = MP.pages || {};
  Object.keys(LIST_PAGES).forEach(function (key) {
    var cfg = LIST_PAGES[key];
    MP.pages[key] = {
      match: function (url) {
        return cfg.match.test((url || window.location).pathname || '');
      },
      mount: mount,
      unmount: unmount,
      isActive: isEnhanced
    };
  });
})();

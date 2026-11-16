/**
 * 实用工具页重绘：/tools/
 *
 * 原站是「标题 + 一张静态卡片列表」，没有筛选、没有分页、没有评论，
 * 所以这里是全站最简单的接管：隐藏原生标题与列表，在原位置插入自绘的
 * hero + 卡片网格，其余（面包屑、页脚）沿用 wiki 的公共样式。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag, attrs) {
    return MP.dom.h.apply(null, [tag, attrs].concat(Array.prototype.slice.call(arguments, 2)));
  }

  var HOST_ID = 'mp-tools-host';
  var FAB_ID = 'mp-tools-fab';
  var PAGE_MATCH = /^\/tools\/?$/i;

  var hidden = [];
  var chrome = null;
  var fab = null;

  /* ---------------- 渲染 ---------------- */

  function card(it) {
    var inner = [
      h('span', { class: 'mp-tool-ico' },
        it.icon
          ? h('img', { src: it.icon, alt: '', loading: 'lazy' })
          : h('b', null, (it.label || '?').slice(0, 1))
      ),
      h('span', { class: 'mp-tool-body' },
        h('span', { class: 'mp-tool-name' }, it.label || '未命名'),
        it.desc ? h('span', { class: 'mp-tool-desc' }, it.desc) : null
      ),
      h('span', { class: 'mp-tool-go', 'aria-hidden': 'true' }, '→')
    ];

    var attrs = { class: 'mp-tool-card mp-glass' };
    if (it.href) {
      attrs.href = it.href;
      if (it.external) {
        attrs.target = '_blank';
        attrs.rel = 'noopener';
      }
    }
    return it.href ? h('a', attrs, inner) : h('div', attrs, inner);
  }

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

  function build(d) {
    var total = d.items.length;
    return h('div', { id: HOST_ID, class: 'mp-wiki-page mp-tools-page' },
      crumbsBar(d.crumbs),
      h('header', { class: 'mp-hero mp-glass' },
        h('div', { class: 'mp-hero-main' },
          h('h1', { class: 'mp-hero-title' }, d.title || '实用工具'),
          h('p', { class: 'mp-hero-sub' }, '整合包、指令、成就、黄历……挑一个顺手的用。'),
          h('div', { class: 'mp-hero-stats' },
            h('span', { class: 'mp-hero-stat' }, h('b', null, total), '个工具')
          )
        )
      ),
      total
        ? h('div', { class: 'mp-tool-grid' }, d.items.map(card))
        : h('div', { class: 'mp-panel mp-glass' },
          h('div', { class: 'mp-panel-body' },
            h('p', { class: 'mp-muted' }, '这一页没有工具。')))
    );
  }

  /* ---------------- 挂载 ---------------- */

  function isEnhanced() {
    return !!document.getElementById(HOST_ID);
  }

  function hideTargets() {
    var out = [];
    var nav = document.querySelector('.common-center > .common-nav');
    var title = document.querySelector('.tools-frame > .tools-title');
    var list = document.querySelector('.tools-list');
    if (nav) out.push(nav);
    if (title) out.push(title);
    if (list) out.push(list);
    return out;
  }

  function mount(settings) {
    if (isEnhanced()) return true;

    var d = MP.extract.tools(document);
    if (!d || !d.ok) {
      console.warn('[MCMod+] 实用工具页抽取失败', d && d.reason);
      return false;
    }

    var list = document.querySelector('.tools-list');
    var anchor = list || document.querySelector('.tools-frame');
    if (!anchor) return false;

    chrome = MP.pageChrome.attach({
      mode: 'mp-wiki-mode',
      css: ['styles/pages/wiki.css', 'styles/pages/tools.css'],
      settings: settings || {}
    });

    hidden = hideTargets();
    hidden.forEach(function (el) { el.classList.add('mp-origin-hidden'); });

    anchor.parentNode.insertBefore(build(d), anchor);

    fab = MP.pageChrome.fab({
      id: FAB_ID,
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
    var host = document.getElementById(HOST_ID);
    if (host) host.remove();

    hidden.forEach(function (el) { el.classList.remove('mp-origin-hidden'); });
    hidden = [];

    if (chrome) { chrome.restore(); chrome = null; }

    try { MP.background.destroy(); } catch (e) { /* 背景可能本来就没起 */ }

    if (fab) { fab.sync(); fab = null; }
  }

  MP.pages = MP.pages || {};
  MP.pages.tools = {
    match: function (url) {
      return PAGE_MATCH.test((url || window.location).pathname || '');
    },
    mount: mount,
    unmount: unmount,
    isActive: isEnhanced
  };
})();

/**
 * 教程列表页重绘：/post/
 *
 * 原站是一张 6 列的表格 + 两组筛选 + 分页。表格在窄屏下会横向滚动，
 * 所以这里换成「行卡片」：左边标题 + 关联模组，右边作者 / 协议 / 热度 / 时间。
 * 筛选是 GET 链接（属于站点行为），保留原样只换皮。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag, attrs) {
    return MP.dom.h.apply(null, [tag, attrs].concat(Array.prototype.slice.call(arguments, 2)));
  }

  var HOST_ID = 'mp-postlist-host';
  var FAB_ID = 'mp-postlist-fab';
  var PAGE_MATCH = /^\/post\/$/i;

  var hidden = [];
  var chrome = null;
  var fab = null;

  /* ---------------- 渲染 ---------------- */

  function row(it) {
    var main = [
      it.href
        ? h('a', { class: 'mp-pl-title', href: it.href, target: '_blank', rel: 'noopener' }, it.title)
        : h('span', { class: 'mp-pl-title' }, it.title)
    ];
    if (it.mod) {
      main.push(h('div', { class: 'mp-pl-mod' },
        '关联 ',
        it.modHref
          ? h('a', { href: it.modHref, target: '_blank', rel: 'noopener' }, it.mod)
          : h('span', null, it.mod),
        it.modExtra ? h('span', { class: 'mp-pl-more' }, it.modExtra) : null
      ));
    }

    return h('li', { class: 'mp-pl-item' },
      h('div', { class: 'mp-pl-main' }, main),
      h('div', { class: 'mp-pl-meta' },
        it.author
          ? (it.authorHref
            ? h('a', { class: 'mp-pl-author', href: it.authorHref, target: '_blank', rel: 'noopener' }, it.author)
            : h('span', { class: 'mp-pl-author' }, it.author))
          : null,
        it.license ? h('span', { class: 'mp-pl-tag' }, it.license) : null,
        it.heat ? h('span', { class: 'mp-pl-heat' }, it.heat) : null,
        it.time
          ? h('time', { class: 'mp-pl-time', datetime: it.timeTitle || undefined, title: it.timeTitle || undefined }, it.time)
          : null
      )
    );
  }

  function pager(p) {
    if (!p || !p.pages || !p.pages.length) return null;
    return h('nav', { class: 'mp-pager', 'aria-label': '分页' },
      p.pages.map(function (it) {
        var cls = 'mp-page-item' + (it.active ? ' is-on' : '');
        return it.href
          ? h('a', { class: cls, href: it.href }, it.label)
          : h('span', { class: cls }, it.label);
      })
    );
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
    return h('div', { id: HOST_ID, class: 'mp-wiki-page mp-postlist-page' },
      crumbsBar(d.crumbs),
      h('header', { class: 'mp-hero mp-glass' },
        h('div', { class: 'mp-hero-main' },
          h('h1', { class: 'mp-hero-title' }, d.title || '教程列表'),
          h('p', { class: 'mp-hero-sub' }, '发布至 MC百科 的教程，可按权限与排序筛选。'),
          h('div', { class: 'mp-hero-stats' },
            h('span', { class: 'mp-hero-stat' }, h('b', null, total), '条本页教程')
          )
        ),
        h('div', { class: 'mp-hero-actions' },
          h('a', { class: 'mp-action', href: '/post/add/', target: '_blank', rel: 'noopener' }, '写新教程')
        )
      ),
      total
        ? h('ol', { class: 'mp-pl-list' }, d.items.map(row))
        : h('div', { class: 'mp-panel mp-glass' },
          h('div', { class: 'mp-panel-body' },
            h('p', { class: 'mp-muted' }, '这一页没有教程。'))),
      pager(d.pager)
    );
  }

  /* ---------------- 挂载 ---------------- */

  function isEnhanced() {
    return !!document.getElementById(HOST_ID);
  }

  function hideTargets() {
    var out = [];
    var mbx = document.querySelector('.center > .main > .mbx');
    var block = document.querySelector('.center > .main > .class_block');
    var pages = document.querySelector('.center > .main > .pages_system');
    if (mbx) out.push(mbx);
    if (block) out.push(block);
    if (pages) out.push(pages);
    return out;
  }

  function mount(settings) {
    if (isEnhanced()) return true;

    var d = MP.extract.postList(document);
    if (!d || !d.ok) {
      console.warn('[MCMod+] 教程列表抽取失败', d && d.reason);
      return false;
    }

    var block = document.querySelector('.center > .main > .class_block');
    var anchor = block || document.querySelector('.center > .main');
    if (!anchor) return false;

    chrome = MP.pageChrome.attach({
      mode: 'mp-wiki-mode',
      css: ['styles/pages/wiki.css', 'styles/pages/post-list.css'],
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
  MP.pages['post-list'] = {
    match: function (url) {
      return PAGE_MATCH.test((url || window.location).pathname || '');
    },
    mount: mount,
    unmount: unmount,
    isActive: isEnhanced
  };
})();

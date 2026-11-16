/**
 * 历史编辑记录页重绘：/history.html
 *
 * 保留 .history-list-head（「选择条件」按钮会打开原站 modal，modal 里的表单
 * 提交后会带参数跳回本页，属于站点行为，不接管），只把下方那串 100 条
 * 纯文本记录换成时间轴。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag, attrs) {
    return MP.dom.h.apply(null, [tag, attrs].concat(Array.prototype.slice.call(arguments, 2)));
  }

  var HOST_ID = 'mp-history-host';
  var FAB_ID = 'mp-history-fab';
  var PAGE_MATCH = /^\/history\.html$/i;

  var hidden = [];
  var chrome = null;
  var fab = null;

  /* ---------------- 渲染 ---------------- */

  function item(it) {
    return h('li', { class: 'mp-hist-item' },
      h('span', { class: 'mp-hist-dot', 'aria-hidden': 'true' }),
      h('div', { class: 'mp-hist-body' },
        h('div', { class: 'mp-hist-text' }, MP.dom.safeHtml(it.html)),
        h('div', { class: 'mp-hist-meta' },
          it.user
            ? h('a', { class: 'mp-hist-user', href: it.userHref, target: '_blank', rel: 'noopener' }, it.user)
            : null,
          it.time ? h('time', { class: 'mp-hist-time', datetime: it.time }, it.time) : null,
          it.rel ? h('span', { class: 'mp-hist-rel' }, it.rel) : null
        )
      )
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
    var sub = d.badge ? '按时间倒序，' + d.badge : '按时间倒序，最近 ' + total + ' 条';

    return h('div', { id: HOST_ID, class: 'mp-wiki-page mp-history-page' },
      crumbsBar(d.crumbs),
      h('header', { class: 'mp-hero mp-glass' },
        h('div', { class: 'mp-hero-main' },
          h('h1', { class: 'mp-hero-title' }, '历史编辑记录'),
          h('p', { class: 'mp-hero-sub' }, sub),
          h('div', { class: 'mp-hero-stats' },
            h('span', { class: 'mp-hero-stat' }, h('b', null, total), '条记录')
          )
        )
      ),
      total
        ? h('ol', { class: 'mp-hist-list' }, d.items.map(item))
        : h('div', { class: 'mp-panel mp-glass' },
          h('div', { class: 'mp-panel-body' },
            h('p', { class: 'mp-muted' }, '这段时间没有编辑记录。')))
    );
  }

  /* ---------------- 挂载 ---------------- */

  function isEnhanced() {
    return !!document.getElementById(HOST_ID);
  }

  function hideTargets() {
    var out = [];
    var nav = document.querySelector('.common-center > .common-nav');
    var list = document.querySelector('.history-list');
    if (nav) out.push(nav);
    if (list) out.push(list);
    return out;
  }

  function mount(settings) {
    if (isEnhanced()) return true;

    var d = MP.extract.history(document);
    if (!d || !d.ok) {
      console.warn('[MCMod+] 历史编辑记录抽取失败', d && d.reason);
      return false;
    }

    var list = document.querySelector('.history-list');
    var anchor = list || document.querySelector('.history-frame');
    if (!anchor) return false;

    chrome = MP.pageChrome.attach({
      mode: 'mp-wiki-mode',
      css: ['styles/pages/wiki.css', 'styles/pages/history.css'],
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
  MP.pages.history = {
    match: function (url) {
      return PAGE_MATCH.test((url || window.location).pathname || '');
    },
    mount: mount,
    unmount: unmount,
    isActive: isEnhanced
  };
})();

/**
 * 教程页重绘：/post/{id}.html
 *
 * 保留原生的 .center > .left（侧栏统计/相关教程）与 .common-comment-block（评论带站点 JS），
 * 只隐藏面包屑导航与重复的标题行，正文保留原 DOM 换皮，hero 插在 .post-row 之前。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag, attrs) {
    return MP.dom.h.apply(null, [tag, attrs].concat(Array.prototype.slice.call(arguments, 2)));
  }

  var HOST_ID = 'mp-post-host';
  var hidden = [];
  var chrome = null;
  var fab = null;

  /* ---------------- 渲染 ---------------- */

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

  /** 侧栏统计里挑几个值得放进 hero 的（其余留在原生侧栏） */
  function heroStats(list) {
    var pick = [];
    (list || []).forEach(function (s) {
      if (/浏览量|创建日期|最后编辑|教程权限/.test(s.key)) {
        pick.push(h('span', { class: 'mp-hero-stat' },
          h('i', null, s.key), h('b', null, s.value)));
      }
    });
    return pick.length ? h('div', { class: 'mp-hero-stats' }, pick) : null;
  }

  function applyHeroActions(host, d) {
    if (!d.tools || !d.tools.length) return;
    var box = host.querySelector('.mp-hero-actions');
    if (!box) return;
    d.tools.forEach(function (t) {
      box.appendChild(h('a', {
        class: 'mp-action',
        href: t.href,
        target: '_blank',
        rel: 'noopener',
        title: t.label
      }, t.label));
    });
  }

  function build(d) {
    var host = h('div', { id: HOST_ID, class: 'mp-wiki-page mp-post-page' },
      crumbsBar(d.crumbs),
      h('header', { class: 'mp-hero mp-glass' },
        h('div', { class: 'mp-hero-main' },
          h('div', { class: 'mp-hero-cats' }, h('span', { class: 'mp-chip' }, '教程')),
          h('h1', { class: 'mp-hero-title' }, d.title || '未命名教程'),
          heroStats(d.stats),
          h('div', { class: 'mp-hero-actions' })
        )
      )
    );
    applyHeroActions(host, d);
    return host;
  }

  /* ---------------- 挂载 ---------------- */

  function isEnhanced() {
    return !!document.getElementById(HOST_ID);
  }

  function hideTargets() {
    var out = [];
    var nav = document.querySelector('.common-center > .common-nav');
    var name = document.querySelector('.post-row > .postname');
    if (nav) out.push(nav);
    if (name) out.push(name);
    return out;
  }

  function mount(settings) {
    if (isEnhanced()) return true;

    var d = MP.extract.post(document);
    if (!d || !d.ok) {
      console.warn('[MCMod+] 教程页抽取失败', d && d.reason);
      return false;
    }

    var row = document.querySelector('.post-row');
    if (!row) return false;

    chrome = MP.pageChrome.attach({
      mode: 'mp-wiki-mode',
      css: ['styles/pages/wiki.css', 'styles/pages/post.css'],
      settings: settings || {}
    });
    document.body.classList.add('mp-post-mode');

    hidden = hideTargets();
    hidden.forEach(function (el) { el.classList.add('mp-origin-hidden'); });

    row.parentNode.insertBefore(build(d), row);

    // 正文与评论保留原生 DOM，只加类换皮
    var body = document.querySelector('.post-row > .post-content');
    if (body) body.classList.add('mp-post-body', 'mp-glass');
    var cmt = document.querySelector('.common-comment-block');
    if (cmt) cmt.classList.add('mp-post-comment');

    fab = MP.pageChrome.fab({
      id: 'mp-post-fab',
      isEnhanced: isEnhanced,
      onEnhance: function () {
        MP.store.getSync().then(function (s) {
          mount(s || settings || {});
        }).catch(function () {
          mount(settings || {});
        });
      },
      onOriginal: function () {
        MP.pages.post.unmount();
      }
    });

    return true;
  }

  function unmount() {
    var host = document.getElementById(HOST_ID);
    if (host) host.remove();

    hidden.forEach(function (el) { el.classList.remove('mp-origin-hidden'); });
    hidden = [];

    Array.prototype.forEach.call(
      document.querySelectorAll('.mp-post-body, .mp-post-comment'),
      function (el) { el.classList.remove('mp-post-body', 'mp-post-comment', 'mp-glass'); }
    );
    document.body.classList.remove('mp-post-mode');

    if (chrome) { chrome.restore(); chrome = null; }

    try { MP.background.destroy(); } catch (e) { /* 背景可能本来就没起 */ }

    if (fab) { fab.sync(); fab = null; }
  }

  MP.pages = MP.pages || {};
  MP.pages.post = {
    match: function (url) {
      return /^\/post\/\d+\.html$/i.test((url || window.location).pathname || '');
    },
    mount: mount,
    unmount: unmount,
    isActive: isEnhanced
  };
})();

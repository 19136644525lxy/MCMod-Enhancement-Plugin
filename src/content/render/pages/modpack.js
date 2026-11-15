/**
 * 整合包检索页重绘：/modpack.html
 *
 * 保留 .modlist-filter-frame（筛选条是 GET 表单 + onclick 跳转，属站点行为），
 * 只隐藏 .modlist-list-frame，在原位置插入自绘的卡片网格 + 分页。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag, attrs) {
    return MP.dom.h.apply(null, [tag, attrs].concat(Array.prototype.slice.call(arguments, 2)));
  }

  var HOST_ID = 'mp-modpack-host';
  var hidden = [];
  var chrome = null;
  var fab = null;

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

  function build(d) {
    var total = d.cards.length;
    var heroSub = d.pager && d.pager.info ? d.pager.info : ('本页 ' + total + ' 个');

    return h('div', { id: HOST_ID, class: 'mp-wiki-page mp-modpack-page' },
      h('header', { class: 'mp-hero mp-glass' },
        h('div', { class: 'mp-hero-main' },
          h('h1', { class: 'mp-hero-title' }, '整合包'),
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
            h('p', { class: 'mp-muted' }, '这一页没有整合包，换个筛选条件或翻页看看。'))),
      pager(d.pager)
    );
  }

  /* ---------------- 挂载 ---------------- */

  function isEnhanced() {
    return !!document.getElementById(HOST_ID);
  }

  function mount(settings) {
    if (isEnhanced()) return true;

    var d = MP.extract.modpack(document);
    if (!d || !d.ok) {
      console.warn('[MCMod+] 整合包页抽取失败', d && d.reason);
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

    hidden = [];
    if (list) {
      list.classList.add('mp-origin-hidden');
      hidden.push(list);
    }

    // 插在列表原来的位置：筛选条在上、卡片网格在下，和原站顺序一致
    anchor.parentNode.insertBefore(build(d), anchor);

    fab = MP.pageChrome.fab({
      id: 'mp-modpack-fab',
      isEnhanced: isEnhanced,
      onEnhance: function () {
        MP.store.getSync().then(function (s) {
          mount(s || settings || {});
        }).catch(function () {
          mount(settings || {});
        });
      },
      onOriginal: function () {
        MP.pages.modpack.unmount();
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
  MP.pages.modpack = {
    match: function (url) {
      return /^\/modpack\.html$/i.test((url || window.location).pathname || '');
    },
    mount: mount,
    unmount: unmount,
    isActive: isEnhanced
  };
})();

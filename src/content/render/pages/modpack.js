/**
 * 整合包检索页重绘：/modpack.html
 * 保留原生筛选条（.modlist-filter-frame），只重绘卡片列表与分页。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag, attrs) { return MP.dom.h.apply(null, [tag, attrs].concat(Array.prototype.slice.call(arguments, 2))); }

  function cardEl(c) {
    return h('a', { class: 'mp-modpack-card', href: c.href || undefined, target: '_blank', rel: 'noopener', title: c.title },
      h('div', { class: 'mp-modpack-cover' },
        c.cover
          ? h('img', { src: c.cover, alt: c.title, loading: 'lazy' })
          : h('div', { class: 'mp-modpack-cover-empty' }, '无封面')
      ),
      h('div', { class: 'mp-modpack-info' },
        h('div', { class: 'mp-modpack-name' }, c.title || '未命名'),
        c.ename ? h('div', { class: 'mp-modpack-ename' }, c.ename) : null,
        c.intro ? h('div', { class: 'mp-modpack-intro' }, c.intro) : null
      )
    );
  }

  function pagerEl(p) {
    if (!p || (!p.pages.length && !p.info)) return null;
    return h('div', { class: 'mp-pager' },
      p.pages.map(function (pg) {
        return h('a', { class: 'mp-page-btn' + (pg.active ? ' is-active' : ''), href: pg.href || undefined }, pg.label);
      }),
      p.info ? h('span', { class: 'mp-pager-info' }, p.info) : null
    );
  }

  function render(d) {
    var main = [];
    var cards = d.cards.length
      ? h('div', { class: 'mp-modpack-grid' }, d.cards.map(cardEl))
      : MP.ui.empty('这一页没有整合包', '试试切换分类或版本筛选');
    main.push(MP.shell.card('整合包列表', cards, {
      aside: h('span', { class: 'mp-pager-info' }, d.cards.length + ' 个条目 / 页')
    }));
    var pager = pagerEl(d.pager);
    if (pager) main.push(pager);

    return MP.shell.build({
      kind: 'modpack',
      title: '整合包检索',
      subtitle: d.pager && d.pager.info ? d.pager.info : '',
      crumbs: [],
      main: main,
      side: null
    });
  }

  MP.pages = MP.pages || {};
  MP.pages.modpack = {
    match: function (url) {
      return /^\/modpack\.html$/i.test((url || location).pathname || '');
    },
    mount: function (settings) {
      var list = document.querySelector('.modlist-list-frame');
      if (!list) return false;
      var d = MP.extract.modpack(document);
      if (!d || !d.ok) {
        console.warn('[MCMod+] 整合包页抽取失败', d && d.reason);
        return false;
      }
      MP.theme.inject('styles/pages/pages.css');
      var page = render(d);
      MP.shell.mount(page, ['.modlist-list-frame'], function () {
        MP.pages.modpack.mount(settings);
      }, list);
      return true;
    }
  };
})();

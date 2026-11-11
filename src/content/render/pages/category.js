/**
 * 分类页重绘：/class/category/{cat}-{page}.html（旧模板）
 * 保留原生「模组元素列表」（第一个 .class_block），只重绘模组卡列表与分页。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag, attrs) { return MP.dom.h.apply(null, [tag, attrs].concat(Array.prototype.slice.call(arguments, 2))); }

  var RANK_TITLE = { day: '日榜', week: '周榜', moon: '月榜' };

  /** 榜单条目文本自带序号（如「1 某模组」），去掉以免和渲染的序号重复 */
  function stripIndex(label) {
    return String(label || '').replace(/^\s*\d+\s*/, '').trim();
  }

  function statOf(mod, kind) {
    var s = (mod.stats || []).filter(function (x) { return x.kind === kind; })[0];
    return s ? s.value : '';
  }

  function cardEl(mod) {
    return h('div', { class: 'mp-cate-card' },
      h('div', { class: 'mp-cate-cover' },
        mod.cover ? h('img', { src: mod.cover, alt: mod.title, loading: 'lazy' }) : null
      ),
      h('div', { class: 'mp-cate-body' },
        h('a', { class: 'mp-cate-name', href: mod.href || undefined, target: '_blank', rel: 'noopener' }, mod.title || '未命名'),
        h('div', { class: 'mp-cate-stats' },
          h('span', null, h('span', { class: 'mp-cate-stat-label' }, '浏览'), h('span', { class: 'mp-cate-stat-num' }, statOf(mod, 'num') || '0')),
          h('span', null, h('span', { class: 'mp-cate-stat-label' }, '推荐'), h('span', { class: 'mp-cate-stat-num' }, statOf(mod, 'push') || '0')),
          h('span', null, h('span', { class: 'mp-cate-stat-label' }, '收藏'), h('span', { class: 'mp-cate-stat-num' }, statOf(mod, 'like') || '0'))
        ),
        mod.items && mod.items.length
          ? h('div', { class: 'mp-cate-items' }, mod.items.slice(0, 8).map(function (it) {
              return h('a', { class: 'mp-cate-item', href: it.href || undefined, target: '_blank', rel: 'noopener', title: it.label },
                it.icon ? h('img', { src: it.icon, alt: '', loading: 'lazy' }) : null);
            }))
          : null
      )
    );
  }

  function rankingEl(ranking) {
    return ranking.map(function (g) {
      return MP.shell.card(RANK_TITLE[g.title] || g.title, h('ol', { class: 'mp-rank-list' }, g.list.map(function (it, i) {
        return h('li', { class: 'mp-rank-item' },
          h('span', { class: 'mp-rank-index' + (i < 3 ? ' is-top' : '') }, i + 1),
          h('a', { class: 'mp-rank-name', href: it.href || undefined, target: '_blank', rel: 'noopener', title: stripIndex(it.label) }, stripIndex(it.label))
        );
      })));
    });
  }

  function pagerEl(pager) {
    if (!pager || !pager.length) return null;
    return h('div', { class: 'mp-pager' }, pager.map(function (pg) {
      return h('a', { class: 'mp-page-btn' + (pg.active ? ' is-active' : ''), href: pg.href || undefined }, pg.label);
    }));
  }

  function render(d) {
    var modBlock = (d.blocks || []).filter(function (b) { return b.mods && b.mods.length; })[0];
    var main = [];
    var side = rankingEl(d.ranking || []);

    if (modBlock && modBlock.mods.length) {
      main.push(MP.shell.card(modBlock.title || '模组列表', h('div', { class: 'mp-cate-grid' },
        modBlock.mods.map(cardEl)
      ), {
        aside: h('span', { class: 'mp-pager-info' }, modBlock.mods.length + ' 个')
      }));
      var pager = pagerEl(d.pager);
      if (pager) main.push(pager);
    } else {
      main.push(MP.shell.card('模组列表', MP.ui.empty('这一页没有模组', '试试切换分类或翻页')));
    }

    return MP.shell.build({
      kind: 'category',
      title: (d.crumbs || []).length ? d.crumbs[d.crumbs.length - 1] : '分类检索',
      crumbs: d.crumbs,
      main: main,
      side: side.length ? side : null
    });
  }

  MP.pages = MP.pages || {};
  MP.pages.category = {
    match: function (url) {
      return /^\/class\/category\/\d+-\d+\.html$/i.test((url || location).pathname || '');
    },
    mount: function (settings) {
      var mainEl = document.querySelector('.center > .main') || document.querySelector('.main');
      if (!mainEl) return false;

      var d = MP.extract.category(document);
      if (!d || !d.ok) {
        console.warn('[MCMod+] 分类页抽取失败', d && d.reason);
        return false;
      }

      // 定位「模组列表」区块（含 .list > .frame 的那个 .class_block）
      var modBlockEl = null;
      Array.prototype.forEach.call(mainEl.querySelectorAll(':scope > .class_block'), function (b) {
        if (!modBlockEl && b.querySelector('.list > .frame')) modBlockEl = b;
      });
      var pagesEl = mainEl.querySelector(':scope > .pages_system');

      var hide = [];
      if (modBlockEl) hide.push(modBlockEl);
      if (pagesEl) hide.push(pagesEl);

      MP.theme.inject('styles/pages/pages.css');
      var page = render(d);
      MP.shell.mount(page, hide, function () {
        MP.pages.category.mount(settings);
      }, pagesEl || modBlockEl || mainEl);
      return true;
    }
  };
})();

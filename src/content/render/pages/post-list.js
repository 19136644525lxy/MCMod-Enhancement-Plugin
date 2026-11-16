/**
 * 教程列表页重绘：/post/
 *
 * 原站是一张 6 列的表格 + 两组筛选 + 分页。表格在窄屏下会横向滚动，
 * 所以这里换成「列对齐的紧凑列表」：标题（两行）+ 关联模组占左侧一大列，
 * 右侧依次是作者 / 协议 / 热度 / 时间，桌面端按网格对齐，可纵向扫读。
 *
 * 筛选条（教程权限 / 排序）是纯 GET 链接，属于站点行为，**保留原生 DOM**
 * 只换皮——藏掉它会连带丢失 filter/order 参数与选中态。
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

  function headRow() {
    return h('div', { class: 'mp-pl-head', 'aria-hidden': 'true' },
      h('span', { class: 'mp-pl-h-main' }, '教程'),
      h('span', { class: 'mp-pl-head-meta' },
        h('span', { class: 'mp-pl-h-author' }, '作者'),
        h('span', { class: 'mp-pl-h-license' }, '协议'),
        h('span', { class: 'mp-pl-h-heat' }, '热度'),
        h('span', { class: 'mp-pl-h-time' }, '时间')
      )
    );
  }

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

    // 每个格子都渲染出来（哪怕是空的），否则网格列会错位
    return h('li', { class: 'mp-pl-item' },
      h('div', { class: 'mp-pl-main' }, main),
      h('div', { class: 'mp-pl-meta' },
        h('span', { class: 'mp-pl-author' },
          it.authorHref
            ? h('a', { href: it.authorHref, target: '_blank', rel: 'noopener' }, it.author)
            : (it.author || '')),
        h('span', { class: 'mp-pl-license', title: it.licenseTitle || undefined }, it.license || ''),
        h('span', { class: 'mp-pl-heat', title: it.heatRaw || undefined }, it.heat || ''),
        h('span', { class: 'mp-pl-time' },
          h('time', {
            class: 'mp-pl-time-main',
            datetime: it.timeEditedTitle || undefined,
            title: it.timeEditedTitle || undefined
          }, it.timeEdited || it.time || ''),
          it.timePublished
            ? h('span', { class: 'mp-pl-time-sub', title: it.timePublishedTitle || undefined },
              '发布 ' + it.timePublished)
            : null
        )
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

  function pageInfo(p, perPage) {
    if (!p || !p.total) return null;
    return h('div', { class: 'mp-pl-pageinfo' },
      '第 ', h('b', null, p.current || 1), ' / ', h('b', null, p.total), ' 页',
      perPage ? h('span', { class: 'mp-pl-perpage' }, ' · 每页 ' + perPage + ' 条') : null
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
    var pg = d.pager || {};
    return h('div', { id: HOST_ID, class: 'mp-wiki-page mp-postlist-page' },
      crumbsBar(d.crumbs),
      h('header', { class: 'mp-hero mp-glass' },
        h('div', { class: 'mp-hero-main' },
          h('h1', { class: 'mp-hero-title' }, d.title || '教程列表'),
          h('p', { class: 'mp-hero-sub' },
            d.desc || '发布至 MC百科 的教程，可在下方自定义筛选 / 排序。'),
          h('div', { class: 'mp-hero-stats' },
            h('span', { class: 'mp-hero-stat' }, h('b', null, total), ' 条本页'),
            pg.total ? h('span', { class: 'mp-hero-stat' }, '共 ', h('b', null, pg.total), ' 页') : null
          )
        ),
        h('div', { class: 'mp-hero-actions' },
          h('a', { class: 'mp-action', href: '/post/add/', target: '_blank', rel: 'noopener' }, '写新教程')
        )
      ),
      total
        ? h('div', { class: 'mp-pl-table' },
          headRow(),
          h('ol', { class: 'mp-pl-list' }, d.items.map(row)))
        : h('div', { class: 'mp-panel mp-glass' },
          h('div', { class: 'mp-panel-body' },
            h('p', { class: 'mp-muted' }, '这一页没有教程。'))),
      pager(d.pager),
      pageInfo(d.pager, total)
    );
  }

  /* ---------------- 挂载 ---------------- */

  function isEnhanced() {
    return !!document.getElementById(HOST_ID);
  }

  /**
   * 只藏「标题块 + 表格 + 分页」，`.class_block` 里的 `.menu`（筛选条）必须留着：
   * 藏掉整块会把教程权限 / 排序一起吞了。
   */
  function hideTargets() {
    var out = [];
    var mbx = document.querySelector('.center > .main > .mbx');
    var title = document.querySelector('.center > .main > .class_block .left > .title');
    var table = document.querySelector('.center > .main > .class_block table.mcmodCommonTable');
    var pages = document.querySelector('.center > .main > .pages_system');
    if (mbx) out.push(mbx);
    if (title) out.push(title);
    if (table) out.push(table);
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
    if (!block) return false;

    chrome = MP.pageChrome.attach({
      mode: 'mp-wiki-mode',
      css: ['styles/pages/wiki.css', 'styles/pages/post-list.css'],
      settings: settings || {}
    });

    hidden = hideTargets();
    hidden.forEach(function (el) { el.classList.add('mp-origin-hidden'); });

    // 插在 .class_block 之后，这样顺序是 hero → 筛选条 → 列表 → 分页
    block.parentNode.insertBefore(build(d), block.nextSibling);

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

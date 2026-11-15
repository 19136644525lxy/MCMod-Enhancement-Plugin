/**
 * 分类页重绘：/class/category/{cat}-{page}.html（旧模板）
 *
 * 原站结构：div.center > div.main > [.mbx + .class_block(模组元素列表) + 广告 + .class_block(模组列表) + .pages_system]
 * 保留第一个 .class_block（元素分类，带展开行为），隐藏面包屑、第二个 .class_block 与分页，
 * 自己画 hero + 卡片网格 + 日周月榜 + 分页。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag, attrs) {
    return MP.dom.h.apply(null, [tag, attrs].concat(Array.prototype.slice.call(arguments, 2)));
  }

  var HOST_ID = 'mp-category-host';
  var hidden = [];
  var chrome = null;
  var fab = null;

  var RANK_TITLE = { day: '今日', week: '本周', moon: '本月' };

  /** 原站榜单 li 的文本自带「1.」这类序号，页面上再排一次会重号。 */
  function stripIndex(s) {
    return String(s || '').replace(/^\s*\d+\s*[.、．]\s*/, '').trim();
  }

  /* ---------------- 渲染 ---------------- */

  function statOf(mod) {
    var map = { num: '浏览', push: '推荐', like: '收藏' };
    var out = [];
    (mod.stats || []).forEach(function (s) {
      var label = map[s.kind];
      if (!label || !s.value) return;
      out.push(h('span', { class: 'mp-hero-stat' }, h('b', null, s.value), label));
    });
    return out;
  }

  function modCard(mod) {
    var inner = [
      h('div', { class: 'mp-ct-cover' },
        mod.cover
          ? h('img', { src: mod.cover, alt: '', loading: 'lazy' })
          : h('span', { class: 'mp-ct-ph' }, (mod.title || '?').slice(0, 1))
      ),
      h('div', { class: 'mp-ct-body' },
        h('div', { class: 'mp-ct-name' }, mod.title || '未命名'),
        h('div', { class: 'mp-ct-stats' }, statOf(mod)),
        (mod.items && mod.items.length)
          ? h('div', { class: 'mp-icon-list is-compact' },
            mod.items.slice(0, 12).map(function (it) {
              return h('a', {
                class: 'mp-icon-item',
                href: it.href || undefined,
                title: it.label,
                target: it.href ? '_blank' : undefined,
                rel: it.href ? 'noopener' : undefined
              }, it.icon
                ? h('img', { class: 'mp-icon-img', src: it.icon, alt: '', loading: 'lazy' })
                : h('span', { class: 'mp-icon-ph' }, (it.label || '?').slice(0, 1)));
            }))
          : null
      )
    ];

    return mod.href
      ? h('a', { class: 'mp-ct-card mp-glass', href: mod.href, target: '_blank', rel: 'noopener' }, inner)
      : h('div', { class: 'mp-ct-card mp-glass' }, inner);
  }

  function rankCard(rank) {
    return h('section', { class: 'mp-ct-rank mp-glass' },
      h('h3', { class: 'mp-ct-rank-title' }, RANK_TITLE[rank.title] || rank.title, '排行'),
      h('ol', { class: 'mp-ct-rank-list' },
        (rank.list || []).map(function (it, i) {
          return h('li', null,
            h('span', { class: 'mp-ct-rank-no' }, String(i + 1)),
            it.href
              ? h('a', { href: it.href, target: '_blank', rel: 'noopener' }, stripIndex(it.label))
              : h('span', null, stripIndex(it.label))
          );
        }))
    );
  }

  function pager(list) {
    if (!list || !list.length) return null;
    return h('nav', { class: 'mp-pager', 'aria-label': '分页' },
      list.map(function (it) {
        var cls = 'mp-page-item' + (it.active ? ' is-on' : '');
        if (!it.href) return h('span', { class: cls }, it.label);
        return h('a', { class: cls, href: it.href }, it.label);
      })
    );
  }

  function build(d, pageTitle) {
    var modBlock = null;
    for (var i = 0; i < d.blocks.length; i++) {
      if (d.blocks[i].mods && d.blocks[i].mods.length) { modBlock = d.blocks[i]; break; }
    }
    var mods = modBlock ? modBlock.mods : [];

    var crumbs = (d.crumbs || []).length
      ? h('nav', { class: 'mp-wiki-crumbs', 'aria-label': '面包屑' },
        d.crumbs.map(function (t, i, arr) {
          return h('span', { class: 'mp-wiki-crumb' + (i === arr.length - 1 ? ' is-here' : '') }, t);
        }))
      : null;

    var ranking = d.ranking || [];

    return h('div', { id: HOST_ID, class: 'mp-wiki-page mp-category-page' },
      h('header', { class: 'mp-hero mp-glass' },
        h('div', { class: 'mp-hero-main' },
          crumbs,
          h('h1', { class: 'mp-hero-title' }, (modBlock && modBlock.title) || pageTitle || '分类'),
          modBlock && modBlock.desc ? h('p', { class: 'mp-hero-sub' }, modBlock.desc) : null,
          h('div', { class: 'mp-hero-stats' },
            h('span', { class: 'mp-hero-stat' }, h('b', null, mods.length), '本页模组')
          )
        )
      ),
      mods.length
        ? h('div', { class: 'mp-ct-grid' }, mods.map(modCard))
        : h('div', { class: 'mp-panel mp-glass' },
          h('div', { class: 'mp-panel-body' },
            h('p', { class: 'mp-muted' }, '这一页没有模组，换个分类或翻页看看。'))),
      ranking.length ? h('div', { class: 'mp-ct-ranks' }, ranking.map(rankCard)) : null,
      pager(d.pager)
    );
  }

  /* ---------------- 挂载 ---------------- */

  function isEnhanced() {
    return !!document.getElementById(HOST_ID);
  }

  function mount(settings) {
    if (isEnhanced()) return true;

    var d = MP.extract.category(document);
    if (!d || !d.ok) {
      console.warn('[MCMod+] 分类页抽取失败', d && d.reason);
      return false;
    }

    var main = document.querySelector('.center > .main') || document.querySelector('.main');
    if (!main) return false;

    chrome = MP.pageChrome.attach({
      mode: 'mp-wiki-mode',
      css: ['styles/pages/wiki.css', 'styles/pages/category.css'],
      settings: settings || {}
    });

    hidden = [];

    // 面包屑自绘
    var mbx = main.querySelector(':scope > .mbx');
    if (mbx) { mbx.classList.add('mp-origin-hidden'); hidden.push(mbx); }

    // 第一个 .class_block 是「模组元素」分类列表，带展开行为，保留；
    // 其余 .class_block 是模组列表，换成自绘卡片。
    var blocks = main.querySelectorAll(':scope > .class_block');
    for (var i = 1; i < blocks.length; i++) {
      blocks[i].classList.add('mp-origin-hidden');
      hidden.push(blocks[i]);
    }

    var pages = main.querySelector(':scope > .pages_system');
    if (pages) { pages.classList.add('mp-origin-hidden'); hidden.push(pages); }

    main.appendChild(build(d));

    fab = MP.pageChrome.fab({
      id: 'mp-category-fab',
      isEnhanced: isEnhanced,
      onEnhance: function () {
        MP.store.getSync().then(function (s) {
          mount(s || settings || {});
        }).catch(function () {
          mount(settings || {});
        });
      },
      onOriginal: function () {
        MP.pages.category.unmount();
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
  MP.pages.category = {
    match: function (url) {
      return /^\/class\/category\/\d+-\d+\.html$/i.test((url || window.location).pathname || '');
    },
    mount: mount,
    unmount: unmount,
    isActive: isEnhanced
  };
})();

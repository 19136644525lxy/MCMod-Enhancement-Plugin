/**
 * 模组页重绘：/class/{id}.html
 *
 * 保留原站两块「带行为」的区域，其余自绘：
 *   - .center > .left        侧栏（投票 / 属性评比 / 更新日志 / 管理组），里面有站点 JS 的投票交互
 *   - .class-menu-page + .class-menu-main   Mod介绍 / Mod下载 tab，切换靠站点 JS
 *
 * 隐藏的只有：导航条、标题区、分类+信息区、侧栏封面（封面挪到 hero 里更好看）。
 * 只加 display:none，DOM 还在，切回「原始」能完整恢复。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag, attrs) {
    return MP.dom.h.apply(null, [tag, attrs].concat(Array.prototype.slice.call(arguments, 2)));
  }

  var HIDE_SEL = [
    '.common-center > .common-nav',
    '.class-text > .class-title',
    // .class-info（支持平台 / 运作方式 / 标签 / 链接）在这一层里面，
    // 隐藏它父级就够了 —— 页面里没有别的地方用到 .class-info。
    '.class-text > .class-text-top',
    '.class-text > .comment-ad',
    '.center > .left .class-cover-image'
  ].join(', ');

  var HOST_ID = 'mp-klass-host';
  var hidden = [];
  var chrome = null;
  var fab = null;

  /* ---------------- 小组件 ---------------- */

  function panel(title, body, aside) {
    if (aside && aside.aside) aside = aside.aside;
    return h('section', { class: 'mp-panel mp-glass' },
      h('header', { class: 'mp-panel-head' },
        h('h2', { class: 'mp-panel-title' }, title),
        aside || null
      ),
      h('div', { class: 'mp-panel-body' }, body)
    );
  }

  function kv(rows) {
    var kids = [];
    rows.forEach(function (r) {
      kids.push(h('dt', null, r.key));
      kids.push(h('dd', null, r.value || '—'));
    });
    return h('dl', { class: 'mp-kv' }, kids);
  }

  function chipOf(it) {
    var tag = it.href ? 'a' : 'span';
    return h(tag, {
      class: 'mp-chip',
      href: it.href || undefined,
      target: it.href ? '_blank' : undefined,
      rel: it.href ? 'noopener' : undefined,
      title: it.title || it.label
    }, h('span', { class: 'mp-chip-label' }, it.label));
  }

  /** 相关链接：原站是 <svg><use href="#common-icon-xxx">，直接把那段源码挂进去。 */
  function linkChip(it) {
    var kids = [];
    if (it.svg) {
      var ico = h('span', { class: 'mp-link-ico', 'aria-hidden': 'true' });
      ico.innerHTML = it.svg;
      kids.push(ico);
    }
    kids.push(h('span', { class: 'mp-link-label' }, it.label));
    return h('a', {
      class: 'mp-link',
      href: it.href || undefined,
      target: '_blank',
      rel: 'noopener noreferrer',
      title: it.label
    }, kids);
  }

  function badgeOf(b) {
    var cls = 'mp-chip';
    if (b.tone === 'ok') cls += ' is-ok';
    else if (b.tone === 'info') cls += ' is-info';
    return h('span', { class: cls, title: b.title || undefined }, b.label);
  }

  /** 从页面里找编辑 / 历史入口，找不到就不显示，不硬造链接。 */
  function actionsOf(root) {
    var out = [];
    var seen = {};
    var sels = ['a[href*="/class/edit/"]', 'a[href*="/class/history/"]'];
    sels.forEach(function (sel) {
      var a = root.querySelector(sel);
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || seen[href]) return;
      seen[href] = true;
      out.push({ label: (MP.dom.text(a) || '').trim() || '编辑', href: MP.dom.absUrl(href) });
    });
    return out;
  }

  /* ---------------- 渲染 ---------------- */

  function build(d, root) {
    var crumbs = (d.crumbs || []).length
      ? h('nav', { class: 'mp-wiki-crumbs', 'aria-label': '面包屑' },
        d.crumbs.map(function (t, i, arr) {
          return h('span', { class: 'mp-wiki-crumb' + (i === arr.length - 1 ? ' is-here' : '') }, t);
        }))
      : null;

    var stats = (d.stats || []).map(function (s) {
      return h('span', { class: 'mp-hero-stat' }, h('b', null, s.count || '0'), s.label);
    });

    var actions = actionsOf(root);

    var hero = h('header', { class: 'mp-hero mp-glass' },
      d.cover ? h('div', { class: 'mp-hero-cover' }, h('img', { src: d.cover, alt: '', loading: 'lazy' })) : null,
      h('div', { class: 'mp-hero-main' },
        crumbs,
        h('h1', { class: 'mp-hero-title' }, d.title || '模组'),
        (d.badges || []).length ? h('div', { class: 'mp-hero-badges' }, d.badges.map(badgeOf)) : null,
        (d.categories || []).length
          ? h('div', { class: 'mp-hero-cats mp-chips' }, d.categories.map(chipOf))
          : null,
        stats.length ? h('div', { class: 'mp-hero-stats' }, stats) : null,
        actions.length
          ? h('div', { class: 'mp-hero-actions' },
            actions.map(function (a) {
              return h('a', { class: 'mp-action', href: a.href, target: '_blank', rel: 'noopener' }, a.label);
            }))
          : null
      )
    );

    var main = [];
    if (d.info && d.info.length) main.push(panel('基本信息', kv(d.info)));
    if (d.tags && d.tags.length) {
      main.push(panel('标签', h('div', { class: 'mp-chips' }, d.tags.map(chipOf)), {
        aside: h('span', { class: 'mp-panel-aside' }, d.tags.length + ' 个')
      }));
    }
    if (d.links && d.links.length) {
      main.push(panel('相关链接', h('div', { class: 'mp-chips' }, d.links.map(linkChip))));
    }
    if (!main.length) {
      main.push(panel('暂无数据', h('p', { class: 'mp-muted' }, '没从页面里解析到模组信息，可以切回「原始」看原站页面。')));
    }

    return h('div', { id: HOST_ID, class: 'mp-wiki-page mp-klass-page' }, hero, main);
  }

  /* ---------------- 挂载 ---------------- */

  function isEnhanced() {
    return !!document.getElementById(HOST_ID);
  }

  function mount(settings) {
    if (isEnhanced()) return true;

    var d = MP.extract.klass(document);
    if (!d || !d.ok) {
      console.warn('[MCMod+] 模组页抽取失败', d && d.reason);
      return false;
    }

    var root = document.querySelector('.class-text') || document.querySelector('.center');
    if (!root) return false;

    chrome = MP.pageChrome.attach({
      mode: 'mp-wiki-mode',
      css: ['styles/pages/wiki.css', 'styles/pages/klass.css', 'styles/lightbox.css'],
      settings: settings || {}
    });

    hidden = [];
    Array.prototype.forEach.call(document.querySelectorAll(HIDE_SEL), function (el) {
      el.classList.add('mp-origin-hidden');
      hidden.push(el);
    });

    // 插在 .class-text 最前面：后面紧跟原站的 tab 区（Mod介绍 / Mod下载），
    // 这样简介和下载入口还在，只是标题区换成了自绘的 hero + 面板。
    root.insertBefore(build(d, root), root.firstChild);

    try { if (MP.lightbox) MP.lightbox.bind(); } catch (e) { /* 灯箱是增强项，失败不影响主体 */ }

    fab = MP.pageChrome.fab({
      id: 'mp-klass-fab',
      isEnhanced: isEnhanced,
      onEnhance: function () {
        MP.store.getSync().then(function (s) {
          mount(s || settings || {});
        }).catch(function () {
          mount(settings || {});
        });
      },
      onOriginal: function () {
        MP.pages.klass.unmount();
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

    try { if (MP.lightbox) MP.lightbox.unbind(); } catch (e) { /* 同上 */ }
    try { MP.background.destroy(); } catch (e) { /* 背景可能本来就没起 */ }

    if (fab) { fab.sync(); fab = null; }
  }

  MP.pages = MP.pages || {};
  MP.pages.klass = {
    match: function (url) {
      return /^\/class\/\d+\.html$/i.test((url || window.location).pathname || '');
    },
    mount: mount,
    unmount: unmount,
    isActive: isEnhanced
  };
})();

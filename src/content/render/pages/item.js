/**
 * 物品页重绘：/item/{id}.html
 *
 * 策略：完全隐藏原生内容区（.common-nav / .center / .right），自己画整页。
 * 不做 adopt —— 之前把 .center > .left 搬进侧栏时，依赖父级的站点 CSS 全失效，
 * 页面直接散架。这里只加 display:none，DOM 还在，切回「原始」能完整恢复。
 *
 * 只读展示；编辑 / 评论 / 收藏等写操作全留在原生页面。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag) {
    return MP.dom.h.apply(null, [tag].concat(Array.prototype.slice.call(arguments, 1)));
  }

  var HIDE_SEL = '.common-center > .common-nav, .right > .item-row';
  var HOST_ID = 'mp-item-host';
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

  function chip(it, opts) {
    opts = opts || {};
    var tag = it.href ? 'a' : 'span';
    return h(tag, {
      class: 'mp-chip' + (opts.out ? ' is-out' : ''),
      href: it.href || undefined,
      target: it.href ? '_blank' : undefined,
      rel: it.href ? 'noopener' : undefined,
      title: it.title || it.label
    },
      h('span', { class: 'mp-chip-label' }, it.title || it.label),
      it.count > 1 ? h('span', { class: 'mp-chip-count' }, '×' + it.count) : null
    );
  }

  function craft(c) {
    var mats = c.materials.map(function (m) { return chip(m); });
    var outs = c.outputs.map(function (m) { return chip(m, { out: true }); });
    return h('div', { class: 'mp-craft' },
      c.source ? h('div', { class: 'mp-craft-src' }, h('span', null, '使用'), h('b', null, c.source)) : null,
      h('div', { class: 'mp-craft-row' },
        h('div', { class: 'mp-craft-col' },
          h('span', { class: 'mp-craft-label' }, '材料'),
          h('div', { class: 'mp-chips' }, mats.length ? mats : h('span', { class: 'mp-muted' }, '—'))
        ),
        h('div', { class: 'mp-craft-arrow', 'aria-hidden': 'true' }, '→'),
        h('div', { class: 'mp-craft-col' },
          h('span', { class: 'mp-craft-label' }, '产物'),
          h('div', { class: 'mp-chips' }, outs.length ? outs : h('span', { class: 'mp-muted' }, '—'))
        )
      ),
      c.remarks ? h('p', { class: 'mp-craft-note' }, c.remarks) : null
    );
  }

  function iconList(list, opts) {
    opts = opts || {};
    return h('div', { class: 'mp-icon-list' + (opts.round ? ' is-round' : '') },
      list.map(function (it) {
        return h('a', {
          class: 'mp-icon-item',
          href: it.href || undefined,
          target: it.href ? '_blank' : undefined,
          rel: it.href ? 'noopener' : undefined,
          title: it.label
        },
          it.icon
            ? h('img', { class: 'mp-icon-img', src: it.icon, alt: '', loading: 'lazy' })
            : h('span', { class: 'mp-icon-ph' }, (it.label || '?').slice(0, 1)),
          h('span', { class: 'mp-icon-name' }, it.label)
        );
      })
    );
  }

  function giveBar(give) {
    var btn = h('button', { class: 'mp-copy', type: 'button' }, '复制');
    btn.addEventListener('click', function () {
      var done = function () {
        btn.textContent = '已复制';
        btn.classList.add('is-done');
        setTimeout(function () {
          btn.textContent = '复制';
          btn.classList.remove('is-done');
        }, 1500);
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(give).then(done, done);
          return;
        }
        var ta = document.createElement('textarea');
        ta.value = give;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        done();
      } catch (e) { done(); }
    });
    return h('div', { class: 'mp-give' },
      h('span', { class: 'mp-give-label' }, '物品命令'),
      h('code', { class: 'mp-give-code' }, give),
      btn
    );
  }

  /* ---------------- 渲染 ---------------- */

  function build(d) {
    var crumbs = h('nav', { class: 'mp-i-crumbs', 'aria-label': '面包屑' },
      (d.crumbs || []).map(function (t, i, arr) {
        return h('span', { class: 'mp-i-crumb' + (i === arr.length - 1 ? ' is-here' : '') }, t);
      })
    );

    var stats = [];
    if (d.views) stats.push(h('span', { class: 'mp-i-stat' }, h('b', null, d.views), '浏览'));
    if (d.recommend) stats.push(h('span', { class: 'mp-i-stat' }, h('b', null, d.recommend), '推荐'));
    if (d.like) stats.push(h('span', { class: 'mp-i-stat' }, h('b', null, d.like), '收藏'));

    var hero = h('header', { class: 'mp-i-hero mp-glass' },
      crumbs,
      h('div', { class: 'mp-i-head' },
        h('div', { class: 'mp-i-icon' },
          d.icon ? h('img', { src: d.icon, alt: d.nameZh || d.title }) : null
        ),
        h('div', { class: 'mp-i-names' },
          h('h1', { class: 'mp-i-title' }, d.nameZh || d.title),
          d.nameEn ? h('p', { class: 'mp-i-en' }, d.nameEn) : null,
          d.jump ? h('p', { class: 'mp-i-jump' }, d.jump) : null
        ),
        stats.length ? h('div', { class: 'mp-i-stats' }, stats) : null
      ),
      (d.actions && d.actions.length)
        ? h('div', { class: 'mp-i-actions' },
            d.actions.map(function (a) {
              return h('a', { class: 'mp-i-action', href: a.href, target: '_blank', rel: 'noopener' }, a.label);
            })
          )
        : null,
      d.give ? giveBar(d.give) : null
    );

    var main = [];
    if (d.desc) {
      // 原站正文自己带一个「简介」小标题，面板头已经有了，去掉避免重复
      var frag = MP.dom.safeHtml(d.desc);
      var first = frag.firstElementChild;
      if (first && /^(简介|介绍)$/.test((first.textContent || '').trim())) first.remove();
      main.push(panel('简介', h('div', { class: 'mp-prose' }, frag)));
    }
    if (d.data.length) main.push(panel('基本信息', kv(d.data)));
    if (d.crafts.length) {
      main.push(panel('合成表', h('div', { class: 'mp-craft-list' }, d.crafts.map(craft)), {
        aside: h('span', { class: 'mp-panel-aside' }, d.crafts.length + ' 个配方')
      }));
    }
    if (d.dict.length) {
      main.push(panel('矿物词典', h('div', { class: 'mp-chips' },
        d.dict.map(function (it) { return chip({ label: it.label, title: it.label, href: it.href }); })
      ), { aside: h('span', { class: 'mp-panel-aside' }, d.dict.length + ' 项') }));
    }
    if (!main.length) {
      main.push(panel('暂无内容', h('p', { class: 'mp-muted' }, '没从页面里解析到物品数据，可以切回「原始」看原站页面。')));
    }

    return h('div', { id: HOST_ID, class: 'mp-item-page' },
      hero,
      h('div', { class: 'mp-i-body' },
        h('div', { class: 'mp-i-main' }, main)
      )
    );
  }

  /* ---------------- 挂载 ---------------- */

  function isEnhanced() {
    return !!document.getElementById(HOST_ID);
  }

  function mount(settings) {
    if (isEnhanced()) return true;

    var d = MP.extract.item(document);
    if (!d || !d.ok) {
      console.warn('[MCMod+] 物品页抽取失败', d && d.reason);
      return false;
    }

    var anchor = document.querySelector('.common-center');
    if (!anchor) return false;

    chrome = MP.pageChrome.attach({
      mode: 'mp-item-mode',
      css: ['styles/pages/item.css', 'styles/lightbox.css'],
      settings: settings || {}
    });

    hidden = [];
    Array.prototype.forEach.call(document.querySelectorAll(HIDE_SEL), function (el) {
      el.classList.add('mp-origin-hidden');
      hidden.push(el);
    });

    // 插在 .right 里，而不是 .common-center 的直接子级：
    // .common-center 现在是两列网格（左列原生侧栏 / 右列重绘内容），
    // 宿主如果直接挂在 .common-center 下会多出一列把布局挤散。
    var rightBox = anchor.querySelector(':scope > .right') || anchor;
    rightBox.insertBefore(build(d), rightBox.firstChild);

    try { if (MP.lightbox) MP.lightbox.bind(); } catch (e) { /* 灯箱是增强项，失败不影响主体 */ }

    fab = MP.pageChrome.fab({
      id: 'mp-item-fab',
      isEnhanced: isEnhanced,
      onEnhance: function () {
        MP.store.getSync().then(function (s) {
          mount(s || settings || {});
        }).catch(function () {
          mount(settings || {});
        });
      },
      onOriginal: function () {
        MP.pages.item.unmount();
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
  MP.pages.item = {
    match: function (url) {
      return /^\/item\/\d+\.html$/i.test((url || window.location).pathname || '');
    },
    mount: mount,
    unmount: unmount,
    isActive: isEnhanced
  };
})();

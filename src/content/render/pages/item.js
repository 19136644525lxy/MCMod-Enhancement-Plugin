/**
 * 物品页重绘：/item/{id}.html
 * 只读展示；编辑/评论/收藏等写操作全部保留在原生页面（切回「原始」即可）。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag, attrs) { return MP.dom.h.apply(null, [tag, attrs].concat(Array.prototype.slice.call(arguments, 2))); }
  var T = function (el) { return MP.dom.text(el); };

  function commandCopy(give) {
    var code = give.replace(/^\/give\s+@p\s+/, '');
    var btn = h('button', { class: 'mp-mini-btn', type: 'button', title: '复制物品命令' }, '复制');
    btn.addEventListener('click', function () {
      var done = function () { btn.textContent = '已复制'; setTimeout(function () { btn.textContent = '复制'; }, 1500); };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(give).then(done, done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = give;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          done();
        }
      } catch (e) { done(); }
    });
    return h('div', { class: 'mp-give' },
      h('span', { class: 'mp-give-label' }, '物品命令'),
      h('code', { class: 'mp-give-code', title: code }, give),
      btn
    );
  }

  function craftBlock(craft) {
    var mat = craft.materials.length
      ? h('div', { class: 'mp-craft-items' }, craft.materials.map(function (m) {
          return h(m.href ? 'a' : 'span', { class: 'mp-item-chip', href: m.href || undefined, target: m.href ? '_blank' : undefined, rel: 'noopener' },
            m.title, m.count > 1 ? h('span', { class: 'mp-item-count' }, '×' + m.count) : null);
        }))
      : h('span', { class: 'mp-craft-remark' }, '（无材料信息）');
    var out = craft.outputs.length
      ? h('div', { class: 'mp-craft-items' }, craft.outputs.map(function (m) {
          return h(m.href ? 'a' : 'span', { class: 'mp-item-chip is-out', href: m.href || undefined, target: m.href ? '_blank' : undefined, rel: 'noopener' },
            m.title, m.count > 1 ? h('span', { class: 'mp-item-count' }, '×' + m.count) : null);
        }))
      : h('span', { class: 'mp-craft-remark' }, '（无产物信息）');
    return h('div', { class: 'mp-craft' },
      craft.source ? h('div', { class: 'mp-craft-source' }, '使用：' + craft.source) : null,
      h('div', { class: 'mp-craft-flow' },
        h('div', { class: 'mp-craft-side' }, h('div', { class: 'mp-craft-label' }, '材料'), mat),
        h('div', { class: 'mp-craft-arrow' }, '→'),
        h('div', { class: 'mp-craft-side' }, h('div', { class: 'mp-craft-label' }, '产物'), out)
      ),
      craft.remarks ? h('div', { class: 'mp-craft-remark' }, craft.remarks) : null
    );
  }

  function render(d) {
    var main = [];
    var side = [];

    var badges = [];
    if (d.jump) badges.push(MP.ui.chip(d.jump, { muted: true }));
    if (d.views) side.push(MP.shell.card('浏览数据', h('div', { class: 'mp-stats' },
      h('div', { class: 'mp-stat' }, h('div', { class: 'mp-stat-num' }, d.views), h('div', { class: 'mp-stat-label' }, '浏览量')),
      d.recommend ? h('div', { class: 'mp-stat' }, h('div', { class: 'mp-stat-num' }, d.recommend), h('div', { class: 'mp-stat-label' }, '推荐')) : null,
      d.like ? h('div', { class: 'mp-stat' }, h('div', { class: 'mp-stat-num' }, d.like), h('div', { class: 'mp-stat-label' }, '收藏')) : null
    )));

    if (d.data.length) {
      main.push(MP.shell.card('基本信息', MP.shell.kv(d.data)));
    }

    if (d.give) main.push(MP.shell.card('获取方式', commandCopy(d.give)));

    if (d.crafts.length) {
      main.push(MP.shell.card('合成表', h('div', null, d.crafts.map(craftBlock)), {
        aside: h('span', { class: 'mp-pager-info' }, d.crafts.length + ' 个配方')
      }));
    }

    if (d.dict.length) {
      main.push(MP.shell.card('矿物词典', h('div', { class: 'mp-chips' }, d.dict.map(function (it) {
        return MP.ui.chip(it.label, { href: it.href });
      }))));
    }

    if (d.related.length) {
      main.push(MP.shell.card('相关物品', h('div', null, d.related.map(function (g) {
        return h('div', null,
          h('div', { class: 'mp-craft-label' }, g.title),
          MP.shell.iconGrid(g.list)
        );
      }))));
    }

    if (!main.length) main.push(MP.shell.card('暂无数据', MP.ui.empty('未从页面解析到内容', '可切换到「原始」查看原站页面')));

    if (!side.length) side = null;

    var page = MP.shell.build({
      kind: 'item',
      title: d.nameZh || d.title,
      subtitle: d.nameEn || '',
      icon: d.icon,
      crumbs: d.crumbs,
      badges: badges,
      actions: MP.ui.button('原始视图（编辑 / 评论）', { variant: 'ghost', onclick: function () { MP.shell.toggleView(true); } }),
      main: main,
      side: side
    });

    return page;
  }

  MP.pages = MP.pages || {};
  MP.pages.item = {
    match: function (url) {
      return /^\/item\/\d+\.html$/i.test((url || location).pathname || '');
    },
    mount: function (settings) {
      var d = MP.extract.item(document);
      if (!d || !d.ok) {
        console.warn('[MCMod+] 物品页抽取失败', d && d.reason);
        return false;
      }
      MP.theme.inject('styles/pages/pages.css');
      var page = render(d);
      MP.shell.mount(page, ['.common-center > .common-nav', '.center', '.right'], function () {
        MP.pages.item.mount(settings);
      }, document.querySelector('.common-center'));
      return true;
    }
  };
})();

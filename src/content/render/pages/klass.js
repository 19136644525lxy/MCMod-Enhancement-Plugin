/**
 * 模组页重绘：/class/{id}.html
 * 介绍正文来自站点富文本，经 safeHtml() 清洗后挂载（去 script、内联事件与 javascript: 链接）。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag, attrs) { return MP.dom.h.apply(null, [tag, attrs].concat(Array.prototype.slice.call(arguments, 2))); }

  function badgeChip(b) {
    return h('span', { class: 'mp-chip' + (b.tone === 'ok' ? ' is-ok' : b.tone === 'info' ? ' is-info' : ''), title: b.title || undefined }, b.label);
  }

  function render(d) {
    var main = [];
    var side = [];

    if (d.introHtml) {
      var prose = h('div', { class: 'mp-prose' });
      MP.dom.append(prose, [MP.dom.safeHtml(d.introHtml)]);
      main.push(MP.shell.card('模组介绍', prose, {
        aside: d.tabs && d.tabs.length > 1
          ? h('span', { class: 'mp-pager-info' }, '共 ' + d.tabs.length + ' 个标签页')
          : null
      }));
    }

    if (d.info.length) main.push(MP.shell.card('基本信息', MP.shell.kv(d.info)));

    if (d.categories.length) {
      main.push(MP.shell.card('分类', h('div', { class: 'mp-chips' }, d.categories.map(function (c) {
        return MP.ui.chip(c.label, { href: c.href });
      }))));
    }

    if (d.tags.length) {
      main.push(MP.shell.card('标签', h('div', { class: 'mp-chips' }, d.tags.map(function (t) {
        return MP.ui.chip(t.label, { href: t.href });
      }))));
    }

    if (d.links.length) {
      main.push(MP.shell.card('相关链接', h('div', { class: 'mp-chips' }, d.links.map(function (l) {
        return MP.ui.chip(l.label, { href: l.href });
      }))));
    }

    if (!main.length) main.push(MP.shell.card('暂无数据', MP.ui.empty('未从页面解析到内容', '可切换到「原始」查看原站页面')));

    if (d.stats.length) {
      side.push(MP.shell.card('互动数据', h('div', { class: 'mp-stats' }, d.stats.map(function (s) {
        return h('div', { class: 'mp-stat' },
          h('div', { class: 'mp-stat-num' }, s.count || '0'),
          h('div', { class: 'mp-stat-label' }, s.label)
        );
      }))));
    }

    if (d.votes.length) {
      side.push(MP.shell.card('评分', h('div', { class: 'mp-chips' }, d.votes.map(function (v) {
        return h('span', { class: 'mp-chip is-muted' }, v);
      }))));
    }

    if (d.logs.length) {
      side.push(MP.shell.card('更新日志', h('ul', { class: 'mp-plain-list' }, d.logs.map(function (l) {
        return h('li', null, l);
      }))));
    }

    d.groups.forEach(function (g) {
      side.push(MP.shell.card(g.title, MP.shell.iconGrid(g.list, 'is-avatar')));
    });

    return MP.shell.build({
      kind: 'klass',
      title: d.title || '模组',
      subtitle: '',
      icon: d.cover,
      crumbs: d.crumbs,
      badges: d.badges.map(badgeChip),
      main: main,
      side: side.length ? side : null
    });
  }

  MP.pages = MP.pages || {};
  MP.pages.klass = {
    match: function (url) {
      return /^\/class\/\d+\.html$/i.test((url || location).pathname || '');
    },
    mount: function (settings) {
      var d = MP.extract.klass(document);
      if (!d || !d.ok) {
        console.warn('[MCMod+] 模组页抽取失败', d && d.reason);
        return false;
      }
      MP.theme.inject('styles/pages/pages.css');
      var page = render(d);
      MP.shell.mount(page, ['.common-center > .common-nav', '.center'], function () {
        MP.pages.klass.mount(settings);
      }, document.querySelector('.common-center'));
      return true;
    }
  };
})();

/**
 * 实用工具页抽取器：/tools/
 *
 * 原站结构（2026-11-16 实测）：
 *   .common-center > .common-nav + .col-lg-12.center.tools-frame
 *     > .tools-title（「Minecraft工具」）
 *     > ul.tools-list > li[data-id] > a[target=_blank][href=/tools/xxx/]
 *         > i > img
 *         > span.block > p.title + p.content
 *
 * 页面是静态列表，没有筛选也没有分页，所以抽取器只负责把 6～8 张卡片读出来。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function T(el) { return el ? MP.dom.text(el) : ''; }
  function A(href) { return href ? MP.dom.absUrl(href) : ''; }

  /** 面包屑：与 modpack 抽取器同一套规则（li.line 是分隔符，最后一项纯文本） */
  function crumbs(doc) {
    var out = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.common-nav li'), function (li) {
      if (li.classList.contains('line')) return;
      var a = li.querySelector('a');
      var label = T(li);
      if (!label && a && a.classList.contains('home')) label = '首页';
      if (!label) return;
      out.push({
        label: label,
        href: a ? A(a.getAttribute('href')) : '',
        current: !a
      });
    });
    return out;
  }

  MP.extract = MP.extract || {};
  MP.extract.tools = function (doc) {
    var list = doc.querySelector('.tools-list');
    if (!list) return { ok: false, reason: 'no-tools-list' };

    var items = [];
    Array.prototype.forEach.call(list.children, function (li) {
      if (li.tagName !== 'LI') return;
      var a = li.querySelector('a');
      if (!a) return;

      var img = a.querySelector('i img');
      var title = T(a.querySelector('.title'));
      var desc = T(a.querySelector('.content'));
      if (!title) return;

      items.push({
        label: title,
        desc: desc,
        href: A(a.getAttribute('href')),
        icon: img ? A(img.getAttribute('src')) : '',
        external: (a.getAttribute('target') || '') === '_blank'
      });
    });

    return {
      ok: true,
      kind: 'tools',
      title: T(doc.querySelector('.tools-title')) || '实用工具',
      items: items,
      crumbs: crumbs(doc)
    };
  };
})();

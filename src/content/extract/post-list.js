/**
 * 教程列表页抽取器：/post/
 *
 * 原站结构（2026-11-16 实测，旧模板）：
 *   div.center > div.main
 *     > div.mbx（面包屑）
 *     > div.class_block[style="width:100%"] > div.left
 *         > div.title > div.icon.post（「教程列表」）+ div.text（说明 + [写新教程]）
 *         > div.list
 *             > div.menu > div.block ×2（教程权限 / 排序，都是 GET 链接）
 *             > table.mcmodCommonTable > thead(th ×6) + tbody > tr ×20
 *     > div.pages_system > a.Pbtn_on | a.Pbtn[href]
 *
 * 表格列固定为：教程标题 / 关联MOD / 教程作者 / 声明协议 / 教程热度 / 最后编辑发布时间。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function T(el) { return el ? MP.dom.text(el) : ''; }
  function A(href) { return href ? MP.dom.absUrl(href) : ''; }

  function crumbs(doc) {
    var out = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.mbx li, .mbx .item, .common-nav li'), function (li) {
      if (li.classList.contains('line')) return;
      var a = li.querySelector('a');
      var label = T(li);
      if (!label) return;
      out.push({ label: label, href: a ? A(a.getAttribute('href')) : '', current: !a });
    });
    // 去重（.mbx 有时嵌套）
    var seen = {};
    return out.filter(function (c) {
      var key = c.label + '|' + c.href;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function filters(doc) {
    var out = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.main > .class_block .menu > .block'), function (block) {
      var title = T(block.querySelector('.tit')).replace(/[:：]\s*$/, '');
      var items = [];
      Array.prototype.forEach.call(block.querySelectorAll('li'), function (li) {
        var a = li.querySelector('a');
        var span = li.querySelector('span');
        items.push({
          label: T(li),
          href: a ? A(a.getAttribute('href')) : '',
          active: !!span
        });
      });
      if (title) out.push({ title: title, items: items });
    });
    return out;
  }

  function pager(doc) {
    var pages = [];
    var seen = {};
    Array.prototype.forEach.call(doc.querySelectorAll('.pages_system a'), function (a) {
      var label = T(a);
      var href = A(a.getAttribute('href'));
      var key = label + '|' + href;
      if (!label || seen[key]) return;
      seen[key] = true;
      pages.push({ label: label, href: href, active: !href && a.classList.contains('Pbtn_on') });
    });
    return { pages: pages };
  }

  MP.extract = MP.extract || {};
  MP.extract.postList = function (doc) {
    var table = doc.querySelector('.main > .class_block table.mcmodCommonTable');
    if (!table) return { ok: false, reason: 'no-post-table' };

    var items = [];
    Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function (tr) {
      var tds = tr.querySelectorAll('td');
      if (tds.length < 6) return;

      var titleA = tds[0].querySelector('a');
      var title = T(titleA) || T(tds[0]);
      if (!title) return;

      var modA = tds[1].querySelector('a');
      var modText = T(tds[1]);
      var modExtra = modA ? modText.replace(T(modA), '').trim() : '';

      var authorA = tds[2].querySelector('a');
      var timeEl = tds[5].querySelector('span');

      items.push({
        title: title,
        href: titleA ? A(titleA.getAttribute('href')) : '',
        mod: modA ? T(modA) : '',
        modHref: modA ? A(modA.getAttribute('href')) : '',
        modExtra: modExtra,
        author: T(authorA) || T(tds[2]),
        authorHref: authorA ? A(authorA.getAttribute('href')) : '',
        license: T(tds[3]),
        heat: T(tds[4]),
        time: timeEl ? T(timeEl) : T(tds[5]),
        timeTitle: timeEl ? (timeEl.getAttribute('title') || '') : ''
      });
    });

    return {
      ok: true,
      kind: 'post-list',
      title: T(doc.querySelector('.main > .class_block .title .icon')) || '教程列表',
      desc: T(doc.querySelector('.main > .class_block .title .text')),
      items: items,
      filters: filters(doc),
      pager: pager(doc),
      crumbs: crumbs(doc)
    };
  };
})();

/**
 * 教程页抽取器：/post/{id}.html
 *
 * 教程页与模组页同构：`.center > .left + .right`，右栏是 `.post-row` + 评论。
 * 正文 `.post-content > .text` 是站点富文本，直接保留原 DOM（换皮），
 * 这里只抽标题、操作入口、元信息和面包屑。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function T(el) { return el ? MP.dom.text(el) : ''; }
  function A(href) { return href ? MP.dom.absUrl(href) : ''; }

  /** 面包屑：.common-nav li，li.line 是分隔符 */
  function crumbs(doc) {
    var out = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.common-nav li'), function (li) {
      if (li.classList.contains('line')) return;
      var a = li.querySelector('a');
      var label = T(li);
      if (!label && a && a.classList.contains('home')) label = '首页';
      if (!label) return;
      out.push({ label: label, href: a ? A(a.getAttribute('href')) : '', current: !a });
    });
    return out;
  }

  /** 侧栏 ul.common-rowlist-2 是纯文本 li（「浏览量：48489」），按冒号切成 key/value */
  function stats(doc) {
    var out = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.center > .left .common-rowlist-2 li'), function (li) {
      var text = T(li).replace(/\s+/g, ' ').trim();
      if (!text) return;
      var i = text.indexOf(':');
      var j = text.indexOf('：');
      if (i < 0 && j < 0) {
        out.push({ key: '', value: text });
        return;
      }
      var at = i < 0 ? j : (j < 0 ? i : Math.min(i, j));
      out.push({ key: text.slice(0, at).trim(), value: text.slice(at + 1).trim() });
    });
    return out;
  }

  function tools(doc) {
    var out = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.post-row .postname .tool a'), function (a) {
      var label = T(a);
      if (!label) return;
      out.push({ label: label, href: A(a.getAttribute('href')) });
    });
    return out;
  }

  MP.extract = MP.extract || {};
  MP.extract.post = function (doc) {
    var row = doc.querySelector('.post-row');
    if (!row) return { ok: false, reason: 'no-post-row' };

    var bodyEl = row.querySelector('.post-content .text') || row.querySelector('.post-content');
    var nameEl = row.querySelector('.postname .name');

    return {
      ok: true,
      kind: 'post',
      title: T(nameEl).replace(/\s+/g, ' ').trim(),
      tools: tools(doc),
      stats: stats(doc),
      contentHtml: bodyEl ? bodyEl.innerHTML : '',
      crumbs: crumbs(doc)
    };
  };
})();

/**
 * 整合包检索页抽取器：/modpack.html
 * 结构与 /modlist.html 同源但容器不同：.modlist-block 卡片（cover / title / intro）
 */
(function () {
  'use strict';
  var MP = window.MP;

  function T(el) { return el ? MP.dom.text(el) : ''; }
  function A(href) { return href ? MP.dom.absUrl(href) : ''; }
  function iconOf(img) { return img ? A(img.getAttribute('src')) : ''; }

  /** 站点用 onclick="window.location='/modpack.html?category=1'" 而非 href */
  function linkOf(el) {
    if (!el) return '';
    var href = el.getAttribute('href');
    if (href && !/^javascript:/i.test(href)) return A(href);
    var onclick = el.getAttribute('onclick') || '';
    var m = onclick.match(/['"]((?:\/|https?:\/\/)[^'"]+)['"]/);
    return m ? A(m[1]) : '';
  }

  /** 面包屑：.common-nav li 里 li.line 是分隔符，最后一项是纯文本当前页 */
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

  function filters(doc) {
    var out = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.modlist-filter-block'), function (block) {
      var title = T(block.querySelector('.title')).replace(/[:：]\s*$/, '');
      var items = [];
      Array.prototype.forEach.call(block.querySelectorAll('ul > li.main'), function (li) {
        var a = li.querySelector('a');
        var active = li.classList.contains('active') || (a && /active/.test(a.className));
        items.push({ label: T(li), href: linkOf(a || li), active: active });
      });
      if (title) out.push({ title: title, items: items });
    });
    return out;
  }

  function pager(doc) {
    var info = '';
    Array.prototype.forEach.call(doc.querySelectorAll('.modlist-pages-block, .pagination'), function (el) {
      var s = el.querySelector('span');
      if (s) info = T(s);
    });
    var pages = [];
    var seen = {};
    Array.prototype.forEach.call(doc.querySelectorAll('.pagination .page-item'), function (li) {
      var a = li.querySelector('a');
      var label = T(li);
      var href = a ? A(a.getAttribute('href')) : '';
      var key = label + '|' + href;
      if (seen[key]) return;
      seen[key] = true;
      pages.push({
        label: label,
        href: href,
        active: li.classList.contains('active')
      });
    });
    var loc = (doc.defaultView && doc.defaultView.location && doc.defaultView.location.href) || '';
    return { info: info, pages: pages, url: loc };
  }

  MP.extract = MP.extract || {};
  MP.extract.modpack = function (doc) {
    var frame = doc.querySelector('.modlist-frame');
    if (!frame) return { ok: false, reason: 'no-modlist-frame' };

    var cards = [];
    Array.prototype.forEach.call(frame.querySelectorAll('.modlist-block'), function (block) {
      var coverA = block.querySelector('.cover a');
      var nameA = block.querySelector('.title .name a');
      var enameEl = block.querySelector('.title .ename');
      var introEl = block.querySelector('.intro-content');
      var img = block.querySelector('.cover img');
      var href = (coverA && A(coverA.getAttribute('href'))) || (nameA && A(nameA.getAttribute('href'))) || '';
      cards.push({
        title: T(block.querySelector('.title .name')),
        ename: T(enameEl).replace(/^\s*&nbsp;?/, '').trim(),
        intro: T(introEl),
        cover: iconOf(img),
        href: href
      });
    });

    var p = pager(doc);
    return {
      ok: true,
      kind: 'modpack',
      url: p.url,
      crumbs: crumbs(doc),
      cards: cards,
      filters: filters(doc),
      pager: p
    };
  };

  MP.extract.pager = pager;
})();

/**
 * 分类页抽取器：/class/category/{cat}-{page}.html（旧模板）
 * 结构：div.center > div.main > [.mbx + .class_block(元素列表) + 广告 + .class_block(模组列表) + .pages_system]
 * 模组卡：.left .list > .frame > .block(封面/名称/统计) + .items(物品图标)
 */
(function () {
  'use strict';
  var MP = window.MP;

  function T(el) { return el ? MP.dom.text(el) : ''; }
  function A(href) { return href ? MP.dom.absUrl(href) : ''; }
  function iconOf(img) { return img ? A(img.getAttribute('src')) : ''; }

  MP.extract = MP.extract || {};
  MP.extract.category = function (doc) {
    var main = doc.querySelector('.center > .main') || doc.querySelector('.main');
    if (!main) return { ok: false, reason: 'no-main' };

    var blocks = [];
    Array.prototype.forEach.call(main.querySelectorAll('.class_block'), function (block) {
      var left = block.querySelector('.left');
      if (!left) return;
      var titleEl = left.querySelector('.title');
      var iconEl = titleEl ? titleEl.querySelector('.icon') : null;
      var iconCls = iconEl ? (iconEl.className || '').replace(/\bicon\b/, '').trim() : '';
      var descEl = titleEl ? titleEl.querySelector('.text') : null;

      var mods = [];
      Array.prototype.forEach.call(left.querySelectorAll('.list > .frame'), function (frame) {
        var blockEl = frame.querySelector('.block');
        var linkEl = blockEl ? blockEl.querySelector('a') : null;
        var imgEl = blockEl ? blockEl.querySelector('img.img') : null;
        var nameEl = blockEl ? blockEl.querySelector('.info > .name.t a, .info > .name.t') : null;
        var statEl = blockEl ? blockEl.querySelector('.info > .info') : null;
        var stats = [];
        Array.prototype.forEach.call(statEl ? statEl.querySelectorAll('.num, .push, .like') : [], function (el) {
          var label = (el.className || '').split(/\s+/)[0];
          stats.push({ kind: label, value: T(el) });
        });
        var items = [];
        Array.prototype.forEach.call(frame.querySelectorAll('.items li.item_hover'), function (li) {
          var a = li.querySelector('a');
          var img = li.querySelector('img');
          items.push({ label: (li.querySelector('.hover .t1') ? T(li.querySelector('.hover .t1')) : T(li)), href: a ? A(a.getAttribute('href')) : '', icon: iconOf(img) });
        });
        mods.push({
          title: T(nameEl),
          href: linkEl ? A(linkEl.getAttribute('href')) : '',
          cover: iconOf(imgEl),
          stats: stats,
          items: items
        });
      });

      // 元素分类面板（.class_category 里的 ul > li）
      var elements = [];
      Array.prototype.forEach.call(left.querySelectorAll('.class_category ul'), function (ul) {
        var a = ul.querySelector('a');
        var li = ul.querySelector('li');
        if (!li) return;
        elements.push({
          label: (li.getAttribute('title') || '').slice(0, 0) || '',
          cls: li.className || '',
          href: a ? A(a.getAttribute('href')) : '',
          title: li.getAttribute('title') || ''
        });
      });

      blocks.push({
        title: T(titleEl).replace(descEl ? T(descEl) : '', '').trim(),
        icon: iconCls,
        desc: T(descEl),
        mods: mods,
        elements: elements
      });
    });

    var ranking = [];
    Array.prototype.forEach.call(main.querySelectorAll('.right'), function (right) {
      if (!right.querySelector('ul#day, ul#week, ul#moon')) return;
      Array.prototype.forEach.call(right.querySelectorAll('ul[id]'), function (ul) {
        var list = [];
        Array.prototype.forEach.call(ul.querySelectorAll('li.no1'), function (li) {
          var a = li.querySelector('a');
          list.push({ label: T(li), href: a ? A(a.getAttribute('href')) : '' });
        });
        ranking.push({ title: ul.id, list: list });
      });
    });

    var crumbs = [];
    Array.prototype.forEach.call(main.querySelectorAll('.mbx .item'), function (el) {
      var t = T(el);
      if (t) crumbs.push(t);
    });

    var pager = [];
    Array.prototype.forEach.call(main.querySelectorAll('.pages_system a'), function (a) {
      pager.push({ label: T(a), href: A(a.getAttribute('href')), active: /Pbtn_on/.test(a.className) });
    });

    var loc = (doc.defaultView && doc.defaultView.location && doc.defaultView.location.href) || '';

    return {
      ok: true,
      kind: 'category',
      url: loc,
      blocks: blocks,
      ranking: ranking,
      crumbs: crumbs,
      pager: pager
    };
  };
})();

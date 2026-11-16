/**
 * 历史编辑记录页抽取器：/history.html
 *
 * 原站结构（2026-11-16 实测）：
 *   .common-center > .common-nav + .col-lg-12.center.history-frame
 *     > .history-list-head > fieldset > legend + .history-search-area
 *         （「选择条件」按钮 + .badge「最近100条」）
 *     > .history-list > .history-list-frame > ul > li ×100
 *
 * 每条 li 是「一段自由文本 + 若干 <a> + span.time」，没有稳定的字段类名，
 * 所以这里保留 innerHTML（去掉 .time 后）交给渲染层用 safeHtml 处理，
 * 只额外抽出「操作者」和「时间」两个结构化字段供排版使用。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function T(el) { return el ? MP.dom.text(el) : ''; }
  function A(href) { return href ? MP.dom.absUrl(href) : ''; }

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

  /** "2026-11-16 13:02:59 (2分前)" → { time: "2026-11-16 13:02:59", rel: "2分前" } */
  function splitTime(text) {
    var m = (text || '').match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s*(?:[(（]([^)）]*)[)）])?/);
    if (!m) return { time: (text || '').trim(), rel: '' };
    return { time: m[1], rel: m[2] || '' };
  }

  MP.extract = MP.extract || {};
  MP.extract.history = function (doc) {
    var list = doc.querySelector('.history-list');
    if (!list) return { ok: false, reason: 'no-history-list' };

    var items = [];
    Array.prototype.forEach.call(list.querySelectorAll('li'), function (li) {
      var clone = li.cloneNode(true);
      var timeEl = clone.querySelector('.time');
      var rawTime = timeEl ? T(timeEl) : '';
      if (timeEl && timeEl.parentNode) timeEl.parentNode.removeChild(timeEl);

      var userA = li.querySelector('a[href*="center.mcmod.cn"]');

      var body = T(clone).replace(/\s+/g, ' ').trim();
      if (!body) return;

      var t = splitTime(rawTime);
      items.push({
        html: clone.innerHTML,
        text: body,
        user: userA ? T(userA) : '',
        userHref: userA ? A(userA.getAttribute('href')) : '',
        time: t.time,
        rel: t.rel
      });
    });

    var badge = T(doc.querySelector('.history-search-area .badge'));

    return {
      ok: true,
      kind: 'history',
      badge: badge,
      items: items,
      crumbs: crumbs(doc)
    };
  };
})();

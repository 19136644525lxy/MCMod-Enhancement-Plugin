/**
 * 物品页抽取器：/item/{id}.html
 * 结构依据：output/pages-deep.txt 与 snippets.txt（2026-11-11 真实快照）
 */
(function () {
  'use strict';
  var MP = window.MP;

  function T(el) { return el ? MP.dom.text(el) : ''; }
  function A(href) { return href ? MP.dom.absUrl(href) : ''; }

  function pair(text) {
    var m = String(text || '').match(/^([^：:]{1,14})\s*[：:]\s*(.*)$/);
    return m ? { key: m[1].trim(), value: m[2].trim() } : null;
  }

  /** 属性表：每个 <tr> 的第一格形如「资料分类：资源」 */
  function kvRows(table) {
    var out = [];
    if (!table) return out;
    Array.prototype.forEach.call(table.querySelectorAll('tr'), function (tr) {
      var cells = tr.querySelectorAll('td');
      if (!cells.length) return;
      var p = pair(T(cells[0]));
      if (!p) return;
      var value = p.value || (cells[1] ? T(cells[1]) : '');
      if (!p.key) return;
      out.push({ key: p.key, value: value });
    });
    return out;
  }

  /** 取纯文本，只剔除「编辑/删除」这类操作按钮，保留内容链接 */
  function cleanText(el) {
    if (!el) return '';
    var clone = el.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('a, button'), function (b) {
      var t = T(b);
      if (/^(编辑|删除|添加|管理|移动|上移|下移)$/.test(t) || /\bbtn\b|\btool\b/i.test(b.className || '')) {
        b.remove();
      }
    });
    return T(clone);
  }

  /** 合成表：材料统计列 → 材料 / 输出 / 使用方式 / 备注 */
  function parseCraft(table) {
    var craft = { source: '', materials: [], outputs: [], remarks: '' };
    var count = table.querySelector('td.item-table-count');
    if (count) {
      var mode = 'material';
      Array.prototype.forEach.call(count.querySelectorAll('p'), function (p) {
        var t = T(p);
        if (!t) return;
        if (t === '↓' || t === '↓ ') { mode = 'output'; return; }
        if (/^\[使用/.test(t)) {
          var a0 = p.querySelector('a');
          craft.source = T(a0) || t.replace(/^\[使用[:：]?\s*/, '').replace(/\]$/, '');
          return;
        }
        var a = p.querySelector('a');
        var num = (t.match(/\*\s*([\d.]+)/) || [])[1] || '1';
        var title = t.replace(/\s*\*\s*[\d.]+\s*$/, '').trim();
        var entry = { title: title, href: a ? A(a.getAttribute('href')) : '', count: Number(num) || 1 };
        if (mode === 'output') craft.outputs.push(entry);
        else craft.materials.push(entry);
      });
    }
    var rem = table.querySelector('td.item-table-remarks');
    craft.remarks = rem ? cleanText(rem) : '';
    return craft;
  }

  function iconOf(img) {
    return img ? A(img.getAttribute('src')) : '';
  }

  MP.extract = MP.extract || {};
  MP.extract.item = function (doc) {
    var main = doc.querySelector('.right .item-row .maintext') || doc.querySelector('.item-row .maintext');
    if (!main) return { ok: false, reason: 'no-maintext' };

    var nameEl = main.querySelector('.itemname .name');
    var full = T(nameEl);
    var m = full.match(/^(.*?)\s*[（(]([^（）()]*)[）)]\s*$/);
    var nameZh = m ? m[1].trim() : full;
    var nameEn = m ? m[2].trim() : '';

    var bigImg = main.querySelector('.item-data img');
    var giveEl = main.querySelector('.item-give');

    var dict = [];
    Array.prototype.forEach.call(main.querySelectorAll('.item-dict a'), function (a) {
      dict.push({ label: T(a), href: A(a.getAttribute('href')) });
    });

    var jumpEl = main.querySelector('.item-jump');
    var jump = jumpEl ? T(jumpEl) : '';

    var data = [];
    Array.prototype.forEach.call(main.querySelectorAll('.item-info-table table'), function (tb) {
      if (tb.classList.contains('hidden')) return;
      data = data.concat(kvRows(tb));
    });

    var crafts = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.item-table-frame table.item-table-block, table.item-table-block'), function (tb) {
      crafts.push(parseCraft(tb));
    });

    var views = '';
    var stats = doc.querySelector('.center > .left > .common-rowlist-2');
    if (stats) {
      var first = stats.querySelector('li');
      if (first) views = T(first).replace(/^浏览量[：:]\s*/, '');
    }

    var related = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.center > .left .common-imglist-block'), function (block) {
      var titleEl = block.querySelector('.title');
      var title = T(titleEl).replace(/更多$/, '').trim();
      var list = [];
      Array.prototype.forEach.call(block.querySelectorAll('.common-imglist li'), function (li) {
        var a = li.querySelector('a');
        var img = li.querySelector('img');
        list.push({ label: T(li), href: a ? A(a.getAttribute('href')) : '', icon: iconOf(img) });
      });
      if (list.length && title) related.push({ title: title, list: list });
    });

    var fuc = doc.querySelector('.common-fuc-group');
    var nums = fuc ? fuc.querySelectorAll('.nums') : [];
    var recommend = nums[0] ? T(nums[0]) : '';
    var like = nums[1] ? T(nums[1]) : '';

    var crumbs = [];
    var seenCrumb = {};
    Array.prototype.forEach.call(doc.querySelectorAll('.common-nav li > a.item, .common-nav li > div.item'), function (el) {
      var t = T(el).trim();
      if (!t || /暂无核心元素/.test(t) || seenCrumb[t]) return;
      seenCrumb[t] = true;
      crumbs.push(t);
    });

    var loc = (doc.defaultView && doc.defaultView.location && doc.defaultView.location.href) || '';

    return {
      ok: true,
      kind: 'item',
      url: loc,
      title: full,
      nameZh: nameZh,
      nameEn: nameEn,
      icon: iconOf(bigImg),
      give: giveEl ? T(giveEl).replace(/^物品命令[：:]\s*/, '') : '',
      dict: dict,
      jump: jump,
      data: data,
      crafts: crafts,
      related: related,
      views: views,
      recommend: recommend,
      like: like,
      crumbs: crumbs
    };
  };
})();

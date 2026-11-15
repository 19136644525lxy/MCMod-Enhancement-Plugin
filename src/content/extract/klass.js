/**
 * 模组页抽取器：/class/{id}.html
 * 侧栏（.center > .left）：封面、投票、评比、更新日志、管理组、编辑组、贡献者
 * 主栏（.center > .right）：标题、状态、分类、信息、标签、相关链接、tab、简介
 */
(function () {
  'use strict';
  var MP = window.MP;

  function T(el) { return el ? MP.dom.text(el) : ''; }
  function A(href) { return href ? MP.dom.absUrl(href) : ''; }
  function iconOf(img) { return img ? A(img.getAttribute('src')) : ''; }

  function splitKV(text) {
    var m = String(text || '').match(/^([^：:]{2,10})\s*[：:]\s*([\s\S]*)$/);
    if (!m) return null;
    var value = m[2].replace(/显示更多成员|收起|展开/g, '').replace(/\s{2,}/g, ' ').trim();
    var key = m[1].trim();
    if (key === '支持的MC版本') {
      var summary = summarizeVersions(value);
      return { key: key, value: summary || value, raw: value };
    }
    return { key: key, value: value };
  }

  /** 「NeoForge (共 12 个版本):1.21.x(12)1.21.1…」→「NeoForge 12 个 · Forge 5 个」 */
  function summarizeVersions(v) {
    var out = [];
    var re = /([A-Za-z][A-Za-z0-9]*)\s*\(\s*共\s*(\d+)\s*个版本\s*\)/g;
    var m;
    while ((m = re.exec(v))) out.push(m[1] + ' ' + m[2] + ' 个');
    return out.length ? out.join(' · ') : '';
  }

  MP.extract = MP.extract || {};
  MP.extract.klass = function (doc) {
    var text = doc.querySelector('.class-text');
    if (!text) return { ok: false, reason: 'no-class-text' };

    var h3 = text.querySelector('.class-title h3');
    var title = T(h3);

    var badges = [];
    Array.prototype.forEach.call(text.querySelectorAll('.class-official-group > div'), function (d) {
      var cls = d.className || '';
      var tone = 'neutral';
      if (/status-1|活跃/.test(cls + T(d))) tone = 'ok';
      if (/source-1|开源/.test(cls + T(d))) tone = 'info';
      badges.push({ label: T(d), tone: tone, title: d.getAttribute('data-original-title') || '' });
    });

    var coverImg = doc.querySelector('.center > .left .class-cover-image img') ||
      doc.querySelector('.class-cover-image img');
    var cover = iconOf(coverImg);

    var categories = [];
    Array.prototype.forEach.call(text.querySelectorAll('.common-class-category li'), function (li) {
      var a = li.querySelector('a');
      var color = '';
      if (a) {
        var st = a.getAttribute('style') || '';
        var cm = st.match(/background-color\s*:\s*([^;]+)/);
        if (cm) color = cm[1].trim();
      }
      categories.push({
        label: T(li) || T(a),
        href: a ? A(a.getAttribute('href')) : '',
        color: color,
        title: a ? (a.getAttribute('data-original-title') || '') : ''
      });
    });

    var info = [];
    var infoEl = text.querySelector('.class-info');
    if (infoEl) {
      Array.prototype.forEach.call(infoEl.querySelectorAll(':scope > .class-info-left > ul > li'), function (li) {
        if (li.classList.contains('tag')) return;
        var kv = splitKV(T(li));
        if (kv) info.push(kv);
      });
    }

    var tags = [];
    Array.prototype.forEach.call(infoEl ? infoEl.querySelectorAll('.tag a') : [], function (a) {
      tags.push({ label: T(a).replace(/^#?\s*/, ''), href: A(a.getAttribute('href')) });
    });

    var links = [];
    Array.prototype.forEach.call(infoEl ? infoEl.querySelectorAll('.common-link-frame a') : [], function (a) {
      // 原站的相关链接图标是内联 <svg><use href="#common-icon-xxx">，不是 <img>。
      // 但外层 <svg> 没有 viewBox，而 symbol 的 viewBox 是 0 0 1024 1024，
      // 直接引用会按 1024 用户单位画进 18px 的框里，只剩中间一条（看起来像竖条）。
      // 所以这里把 symbol 的路径抠出来，拼成带 viewBox 的完整 svg 再渲染。
      var svgEl = a.querySelector('svg');
      var svg = '';
      if (svgEl) {
        var useEl = svgEl.querySelector('use');
        var href = useEl
          ? (useEl.getAttribute('xlink:href') || useEl.getAttribute('href') || '')
          : '';
        var symId = href.replace(/^#/, '');
        var sym = symId ? doc.getElementById(symId) : null;
        if (sym) {
          svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' +
            (sym.getAttribute('viewBox') || '0 0 24 24') +
            '" preserveAspectRatio="xMidYMid meet" fill="currentColor" aria-hidden="true">' +
            sym.innerHTML + '</svg>';
        } else {
          svg = svgEl.outerHTML;
        }
      }
      links.push({
        label: a.getAttribute('data-original-title') || T(a),
        href: a.getAttribute('href') || '',
        icon: a.querySelector('img') ? iconOf(a.querySelector('img')) : '',
        svg: svg
      });
    });

    var introHtml = '';
    var introNode = doc.querySelector('.class-menu-main li[data-id="1"]');
    if (introNode) introHtml = introNode.innerHTML;

    var tabs = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.class-menu-page .page-li'), function (li) {
      tabs.push({ label: T(li), id: li.getAttribute('data-id') || '' });
    });

    var votes = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.class-card .text-block span'), function (s) {
      votes.push(T(s));
    });

    var logs = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.common-rowlist.log li'), function (li) {
      var t = T(li);
      if (t && !/^暂无/.test(t)) logs.push(t);
    });

    var groups = [];
    Array.prototype.forEach.call(doc.querySelectorAll('.center > .left .common-imglist-block'), function (block) {
      var titleEl = block.querySelector('.title');
      var name = T(titleEl).replace(/更多$/, '').replace(/申请$/, '').trim();
      var list = [];
      Array.prototype.forEach.call(block.querySelectorAll('.common-imglist li'), function (li) {
        var a = li.querySelector('a');
        var img = li.querySelector('img');
        list.push({ label: T(li), href: a ? A(a.getAttribute('href')) : '', icon: iconOf(img) });
      });
      if (name && list.length) groups.push({ title: name, list: list });
    });

    var fuc = doc.querySelector('.common-fuc-group');
    var nums = fuc ? fuc.querySelectorAll('.nums') : [];
    var stats = [];
    Array.prototype.forEach.call(fuc ? fuc.querySelectorAll('li') : [], function (li, i) {
      var label = T(li.querySelector('.action span') || li);
      var num = nums[i] ? T(nums[i]) : '';
      if (label) stats.push({ label: label, count: num });
    });

    var crumbs = [];
    var crumbEls = doc.querySelectorAll('.common-nav li');
    var seenCrumb = {};
    Array.prototype.forEach.call(crumbEls, function (el) {
      if (el.querySelector('li')) return; // 只取最内层
      var t = T(el).trim();
      if (!t || t === '>' || /^首页$/.test(t) || t.length >= 60) return;
      if (seenCrumb[t]) return;
      seenCrumb[t] = true;
      crumbs.push(t);
    });

    var loc = (doc.defaultView && doc.defaultView.location && doc.defaultView.location.href) || '';

    return {
      ok: true,
      kind: 'klass',
      url: loc,
      title: title,
      badges: badges,
      cover: cover,
      categories: categories,
      info: info,
      tags: tags,
      links: links,
      introHtml: introHtml,
      tabs: tabs,
      votes: votes,
      logs: logs,
      groups: groups,
      stats: stats,
      crumbs: crumbs
    };
  };
})();

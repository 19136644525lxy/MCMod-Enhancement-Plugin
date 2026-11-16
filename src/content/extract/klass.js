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

  function splitKV(text, el) {
    var m = String(text || '').match(/^([^：:]{2,10})\s*[：:]\s*([\s\S]*)$/);
    if (!m) return null;
    var value = m[2].replace(/显示更多成员|收起|展开/g, '').replace(/\s{2,}/g, ' ').trim();
    var key = m[1].trim();
    if (key === '支持的MC版本') {
      // 纯文本只能拿到「NeoForge (共 12 个版本)」这种计数，具体版本号是链接，
      // 必须回到 DOM 里抓 .platform-block。抓不到就退回摘要文本。
      var versions = el ? parseVersions(el) : [];
      var summary = summarizeVersions(value);
      if (versions.length) return { key: key, value: summary || value, versions: versions };
      return { key: key, value: summary || value, raw: value };
    }
    return { key: key, value: value };
  }

  /**
   * 「支持的MC版本」在原站是一组 platform-block，块内 title / row 交替出现：
   *   .mcver-title   loader 名 + (共 N 个版本)
   *   .mcver-row     > .mcver-dropdown > ul.mcver-menu > li > a.dropdown-item
   * 一个块里可能有多组（NeoForge 后面紧跟 Forge），所以要按顺序切段，
   * 不能只取第一个 title 配所有链接 —— 否则 Forge 的版本会算进 NeoForge。
   */
  function parseVersions(li) {
    var out = [];
    Array.prototype.forEach.call(li.querySelectorAll('.platform-block'), function (block) {
      var cur = null;
      Array.prototype.forEach.call(block.children, function (child) {
        if (child.classList.contains('mcver-title')) {
          var totalEl = child.querySelector('.total');
          cur = {
            loader: T(child).replace(/\([^)]*\)/g, '').replace(/[：:]\s*$/, '').trim() || '版本',
            total: totalEl ? (T(totalEl).match(/\d+/) || [''])[0] : '',
            items: []
          };
          out.push(cur);
          return;
        }
        if (child.classList.contains('mcver-row') && cur) {
          // 两种形态都要收：
          //   版本 ≥ 2 → 折叠菜单，链接是 a.dropdown-item
          //   版本 = 1 → 平铺，链接直接是 a.text-danger（没有 dropdown 结构）
          // 用 href 里必带 mcver= 做兜底匹配，比只认类名稳。
          Array.prototype.forEach.call(
            child.querySelectorAll('a.dropdown-item, a[href*="mcver="]'),
            function (a) {
              var label = T(a).trim();
              var href = A(a.getAttribute('href'));
              if (label && href && href.indexOf('mcver=') > -1) cur.items.push({ label: label, href: href });
            }
          );
        }
      });
    });
    return out.filter(function (g) { return g.items.length > 0; });
  }

  /** 「NeoForge (共 12 个版本):1.21.x(12)1.21.1…」→「NeoForge 12 个 · Forge 5 个」 */
  function summarizeVersions(v) {
    var out = [];
    var re = /([A-Za-z][A-Za-z0-9]*)\s*\(\s*共\s*(\d+)\s*个版本\s*\)/g;
    var m;
    while ((m = re.exec(v))) out.push(m[1] + ' ' + m[2] + ' 个');
    return out.length ? out.join(' · ') : '';
  }

  /**
   * 「制作团队 / 作者」那条 li 不能按文本切：成员是
   *   <li><span class="avatar"><a><img></a></span>
   *       <span class="member"><span class="name"><a>名字</a></span>
   *                       <span class="position">职责</span></span></li>
   * 直接取 textContent 会得到「名字职责名字职责」连写，必须回 DOM 拆字段。
   */
  function parseMembers(li) {
    var out = [];
    Array.prototype.forEach.call(li.querySelectorAll('.frame ul > li'), function (item) {
      var nameEl = item.querySelector('.member .name a') || item.querySelector('.member .name');
      var name = T(nameEl).trim();
      if (!name) return;
      var a = item.querySelector('.member .name a') || item.querySelector('.avatar a');
      var img = item.querySelector('.avatar img') || item.querySelector('img');
      var roleEl = item.querySelector('.member .position') || item.querySelector('.position');
      out.push({
        name: name,
        href: a ? A(a.getAttribute('href')) : '',
        avatar: iconOf(img),
        role: T(roleEl).trim()
      });
    });
    return out;
  }

  /** 「整合包制作团队(2)」→ key「制作团队」+ count 2 */
  function teamKey(text) {
    var m = String(text || '').match(/^(?:Mod|模组)?(?:整合包)?(制作团队|作者)\s*[(（]?\s*(\d*)/);
    return { key: (m && m[1]) || '制作团队', count: m && m[2] ? Number(m[2]) : 0 };
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
      // li.main 是「展开全部分类」的图标项：里面只有 <i>，文字为空，
      // data-original-title 放的是整段分类说明（很长）。它既不能当标签文字，
      // 也没有独立的分类含义，直接跳过。
      if (li.classList.contains('main')) return;
      var a = li.querySelector('a');
      var label = (T(li) || T(a)).trim();
      if (!label) return;
      var color = '';
      if (a) {
        var st = a.getAttribute('style') || '';
        var cm = st.match(/background-color\s*:\s*([^;]+)/);
        if (cm) color = cm[1].trim();
      }
      categories.push({
        label: label,
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
        // 团队/作者这条 li 的成员是结构化节点，先按成员拆，拆不到再退回文本切分
        if (li.classList.contains('author')) {
          var members = parseMembers(li);
          if (members.length) {
            var meta = teamKey(T(li));
            info.push({
              key: meta.key || '制作团队',
              count: meta.count || members.length,
              members: members
            });
            return;
          }
        }
        var kv = splitKV(T(li), li);
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

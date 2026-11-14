/**
 * 搜索结果抽取：DOM -> 结构化数据
 * 输入可以是当前页 document，也可以是后台抓取后 DOMParser 出来的远程 document。
 *
 * 真实结构（search.mcmod.cn/s?key=xxx）：
 *   .common-nav > ul > li                面包屑（首页 > 百科搜索 > 关键词）
 *   .search-box > form[action="/s"]      搜索框（input[name=key]、简单/复杂搜索）
 *   .search-menu-mcmod > ul > li > a     分类页签（全部 / 模组 / 整合包 …，带条数）
 *   .search-result > p.info              统计（找到约 N 条结果，共约 M 页）
 *   .search-result-list > .result-item   结果条目
 *   .search-result-pages                 分页（只有一页时整块不存在）
 */
window.MP = window.MP || {};
MP.extract = MP.extract || {};

MP.extract.search = (function () {
  const { text, stripWiki, absUrl } = MP.dom;

  const TYPE_BY_PATH = [
    [/\/class\//, '模组'],
    [/\/modpack\//, '整合包'],
    [/\/item\//, '资料'],
    [/\/post\//, '教程'],
    [/\/user\//, '用户'],
    [/\/bbs\//, '社群'],
    [/^https?:\/\/bbs\./i, '社群'],
    [/^https?:\/\/play\./i, '整合包']
  ];

  function guessType(href, fallback) {
    for (const [re, name] of TYPE_BY_PATH) {
      if (re.test(href || '')) return name;
    }
    return fallback || '页面';
  }

  function parseCategory(node) {
    const cat = node.querySelector('.class-category a');
    if (!cat) return { name: '', color: '' };
    const m = /(?:^|\s)c_(\d+)(?:\s|$)/.exec(cat.className || '');
    return {
      name: text(cat.textContent).replace(/^\[|\]$/g, ''),
      color: m ? 'c_' + m[1] : ''
    };
  }

  function parseFoot(node) {
    const out = [];
    node.querySelectorAll('.foot .info, .foot p, .foot > div').forEach((el) => {
      const t = text(el.textContent);
      if (!t) return;
      const m = /^(.{1,6}?)[：:]\s*(.+)$/.exec(t);
      if (m) out.push({ label: m[1], value: m[2] });
      else out.push({ label: '', value: t });
    });
    if (!out.length) {
      const foot = node.querySelector('.foot');
      const t = foot ? text(foot.textContent) : '';
      if (t) out.push({ label: '', value: t });
    }
    return out;
  }

  function parseItem(node) {
    const head = node.querySelector('.head') || node;
    const anchors = Array.from(head.querySelectorAll('a[href]')).filter(
      (a) => !a.closest('.class-category')
    );
    const titleA = anchors.find((a) => text(a.textContent).length > 1) || anchors[0];
    if (!titleA) return null;

    const href = absUrl(titleA.getAttribute('href'));
    const title = stripWiki(titleA.textContent) || text(titleA.getAttribute('title'));
    if (!title || !href) return null;

    const cat = parseCategory(head);
    const bodyEl = node.querySelector('.body');
    const snippet = stripWiki(bodyEl ? bodyEl.textContent : '');
    const foot = parseFoot(node);
    const snapshot = foot.find((f) => /快照|时间|更新/.test(f.label));

    return {
      title,
      href,
      type: cat.name || guessType(href),
      color: cat.color,
      snippet,
      foot,
      snapshot: snapshot ? snapshot.value : '',
      raw: node
    };
  }

  function parseInfoLine(doc) {
    const p = doc.querySelector('.search-result > p.info') || doc.querySelector('p.info');
    return p ? text(p.textContent) : '';
  }

  function parseStats(doc) {
    const t = parseInfoLine(doc);
    const total = /找到约\s*([\d,]+)\s*条/.exec(t);
    const pages = /共约\s*([\d,]+)\s*页/.exec(t);
    const ms = /耗时[:：]\s*([\d.]+)\s*ms/.exec(t);
    return {
      raw: t,
      total: total ? Number(total[1].replace(/,/g, '')) : 0,
      pages: pages ? Number(pages[1].replace(/,/g, '')) : 0,
      ms: ms ? Number(ms[1]) : 0
    };
  }

  function parseFilter(doc) {
    const active = doc.querySelector('.search-filter .active, .filter-item.active');
    if (active) return text(active.textContent);
    return '';
  }

  /** 分类页签：`.search-menu-mcmod li a`，文案形如「模组 (4)」 */
  function parseTabs(doc) {
    const links = Array.from(doc.querySelectorAll('.search-menu-mcmod li a[href]'));
    return links.map((a) => {
      const li = a.closest('li');
      const raw = text(a.textContent);
      const m = /^(.*?)\s*[（(](\d+)[)）]\s*$/.exec(raw);
      const icon = a.querySelector('i');
      return {
        label: m ? m[1].trim() : raw,
        count: m ? Number(m[2]) : null,
        href: absUrl(a.getAttribute('href')),
        active: !!(li && li.classList.contains('active')),
        icon: icon ? icon.className : '',
        external: /^https?:\/\/play\./i.test(a.getAttribute('href') || '')
      };
    });
  }

  function parseCrumbs(doc) {
    return Array.from(doc.querySelectorAll('.common-nav li')).map((li) => {
      const a = li.querySelector('a[href]');
      const t = text(li.textContent);
      if (!t || t === '>') return null;
      return { label: t, href: a ? absUrl(a.getAttribute('href')) : '' };
    }).filter(Boolean);
  }

  function parseForm(doc) {
    const form = doc.querySelector('.search-box form');
    if (!form) return null;
    const key = form.querySelector('input[name="key"]');
    const mold = form.querySelector('input[name="mold"]:checked');
    return {
      action: absUrl(form.getAttribute('action') || '/s'),
      method: (form.getAttribute('method') || 'get').toLowerCase(),
      key: key ? key.value : '',
      mold: mold ? mold.value : '0'
    };
  }

  function parsePages(doc) {
    const box = doc.querySelector('.search-result-pages');
    if (!box) return null;
    const links = Array.from(box.querySelectorAll('a[href]')).map((a) => ({
      label: text(a.textContent),
      href: absUrl(a.getAttribute('href')),
      active: /(^|\s)(on|active)(\s|$)/.test(a.className || '')
    }));
    const currentEl = box.querySelector('.on, .active');
    return {
      current: currentEl ? text(currentEl.textContent) : '',
      items: links
    };
  }

  return function extractSearch(doc) {
    const root =
      doc.querySelector('.search-result-list') ||
      doc.querySelector('.search-result') ||
      doc.body;
    if (!root) return { ok: false, error: 'NO_ROOT', items: [] };

    const nodes = Array.from(root.querySelectorAll('.result-item'));
    const items = nodes.map(parseItem).filter(Boolean);
    const stats = parseStats(doc);

    return {
      ok: items.length > 0,
      error: items.length ? null : 'NO_ITEMS',
      items,
      count: items.length,
      totalText: parseInfoLine(doc),
      stats,
      filter: parseFilter(doc),
      keyword: new URLSearchParams(location.search).get('key') || '',
      tabs: parseTabs(doc),
      crumbs: parseCrumbs(doc),
      form: parseForm(doc),
      pages: parsePages(doc)
    };
  };
})();

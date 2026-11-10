/**
 * 搜索结果抽取：DOM -> 结构化数据
 * 输入可以是当前页 document，也可以是后台抓取后 DOMParser 出来的远程 document。
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
    // 兜底：结构未知时整体取 .foot 文本
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
    const title = text(titleA.textContent) || text(titleA.getAttribute('title'));
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

  function parseFilter(doc) {
    const active = doc.querySelector('.search-filter .active, .filter-item.active');
    if (active) return text(active.textContent);
    return '';
  }

  return function extractSearch(doc) {
    const root =
      doc.querySelector('.search-result-list') ||
      doc.querySelector('.search-result') ||
      doc.body;
    if (!root) return { ok: false, error: 'NO_ROOT', items: [] };

    const nodes = Array.from(root.querySelectorAll('.result-item'));
    const items = nodes.map(parseItem).filter(Boolean);

    return {
      ok: items.length > 0,
      error: items.length ? null : 'NO_ITEMS',
      items,
      count: items.length,
      totalText: parseInfoLine(doc),
      filter: parseFilter(doc),
      keyword: new URLSearchParams(location.search).get('key') || ''
    };
  };
})();

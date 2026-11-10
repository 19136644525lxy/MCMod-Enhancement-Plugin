/**
 * 模组列表抽取（www.mcmod.cn/modlist.html、modpack.html）
 */
window.MP = window.MP || {};
MP.extract = MP.extract || {};

MP.extract.modlist = (function () {
  const { text, stripWiki, absUrl } = MP.dom;

  function parseCard(node, kind) {
    const link =
      node.querySelector('.name a[href]') ||
      node.querySelector('a[href*="/class/"]') ||
      node.querySelector('a[href*="/modpack/"]');
    if (!link) return null;

    const nameEl = node.querySelector('.name') || link;
    const enEl = node.querySelector('.ename');
    const introEl = node.querySelector('.intro-content') || node.querySelector('.intro');
    const coverEl = node.querySelector('.cover img') || node.querySelector('img.cover');

    const name = text(nameEl.textContent) || text(link.getAttribute('title'));
    if (!name) return null;

    return {
      title: name,
      href: absUrl(link.getAttribute('href')),
      ename: enEl ? text(enEl.textContent) : '',
      type: kind || '模组',
      snippet: stripWiki(introEl ? introEl.textContent : ''),
      cover: coverEl ? absUrl(coverEl.getAttribute('src')) : '',
      foot: []
    };
  }

  return function extractModlist(doc, kind) {
    const nodes = Array.from(doc.querySelectorAll('.item-table-hover'));
    const items = nodes.map((n) => parseCard(n, kind)).filter(Boolean);
    return { ok: items.length > 0, items, count: items.length, error: items.length ? null : 'NO_ITEMS' };
  };
})();

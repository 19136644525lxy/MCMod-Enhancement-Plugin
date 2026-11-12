/**
 * 模组 / 整合包列表抽取（www.mcmod.cn/modlist.html、modpack.html）
 *
 * 真实结构（modlist.html）：
 *   div.modlist-block
 *     div.intro > a.intro-content > span     简介
 *     div.cover > a > img                    封面
 *     div.title > p.name > a                 中文名
 *     div.title > p.ename > a                英文名
 *
 * 注意：页面里还有大量 div.item-table-hover，但那是**物品图标**（链接指向
 * /item/xxxx.html），不是模组卡。早先按 .item-table-hover 解析会得到 0 条，
 * 所以这里优先 .modlist-block，只有在完全没有时才退回旧的卡片选择器。
 */
window.MP = window.MP || {};
MP.extract = MP.extract || {};

MP.extract.modlist = (function () {
  const { text, stripWiki, absUrl } = MP.dom;

  function pickLink(node) {
    return (
      node.querySelector('.title p.name a[href]') ||
      node.querySelector('.name a[href]') ||
      node.querySelector('a[href*="/class/"]') ||
      node.querySelector('a[href*="/modpack/"]')
    );
  }

  function parseCard(node, kind) {
    const link = pickLink(node);
    if (!link) return null;

    const nameEl = node.querySelector('.title p.name') || node.querySelector('.name') || link;
    const enEl = node.querySelector('.title p.ename') || node.querySelector('.ename');
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
    let nodes = Array.from(doc.querySelectorAll('.modlist-block'));
    if (!nodes.length) {
      nodes = Array.from(doc.querySelectorAll('.item-table-hover')).filter((n) => {
        const a = n.querySelector('a[href]');
        if (!a) return false;
        const href = a.getAttribute('href') || '';
        return href.indexOf('/item/') < 0;
      });
    }
    const items = nodes.map((n) => parseCard(n, kind)).filter(Boolean);
    return { ok: items.length > 0, items, count: items.length, error: items.length ? null : 'NO_ITEMS' };
  };
})();

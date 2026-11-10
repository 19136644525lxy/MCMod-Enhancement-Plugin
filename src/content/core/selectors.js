/**
 * 全站选择器集中表。
 * 每个位置给多个候选，按顺序尝试；站点改版时只需改这里。
 */
window.MP = window.MP || {};

MP.selectors = {
  // search.mcmod.cn/s?key=
  search: {
    list: ['.search-result-list'],
    item: ['.result-item'],
    title: ['.head a[href*="/class/"]', '.head a[href*="/item/"]', '.head a'],
    category: ['.class-category a'],
    snippet: ['.body'],
    foot: ['.foot .info'],
    pagination: ['.search-result-pages'],
    info: ['.search-result > p.info']
  },

  // www.mcmod.cn/modlist.html / modpack.html
  modlist: {
    list: ['.mod-list', '.modlist', 'body'],
    item: ['.item-table-hover'],
    name: ['.name'],
    ename: ['.ename'],
    intro: ['.intro'],
    introContent: ['.intro-content'],
    cover: ['.cover img'],
    link: ['.name a', 'a']
  },

  // www.mcmod.cn/item/{id}.html
  item: {
    tables: ['table.TableBlock'],
    title: ['h1', '.item-title'],
    moduleLinks: ['.item-module a', 'a[href*="/class/"]']
  },

  // www.mcmod.cn/class/{id}.html
  klass: {
    posts: ['.post-block'],
    postTitle: ['.info .title a'],
    postCover: ['.cover img'],
    tabs: ['[data-toggle="tab"]', '.nav-tabs a']
  }
};

/** 依次尝试候选选择器 */
MP.q = function (root, list) {
  return MP.dom.pick(root || document, list || []);
};

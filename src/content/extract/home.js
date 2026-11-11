/**
 * 首页抽取：把 www.mcmod.cn 首页的区块解析成结构化数据。
 * 只读 DOM，不修改页面。
 */
window.MP = window.MP || {};
MP.extract = MP.extract || {};

MP.extract.home = (function () {
  'use strict';

  var D = MP.dom;

  function abs(url) {
    if (!url) return '';
    if (/^\/\//.test(url)) return 'https:' + url;
    if (/^https?:/i.test(url)) return url;
    if (/^javascript:/i.test(url)) return '';
    return D.absUrl(url);
  }

  function txt(el) {
    return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  function attr(el, name) {
    return el ? (el.getAttribute(name) || '') : '';
  }

  function imgOf(el) {
    var i = el && (el.tagName === 'IMG' ? el : el.querySelector('img'));
    if (!i) return '';
    return abs(attr(i, 'data-original') || attr(i, 'src'));
  }

  function pick(root, sel) {
    return root ? root.querySelector(sel) : null;
  }

  function all(root, sel) {
    if (!root) return [];
    if (sel.charAt(0) === '>') sel = ':scope ' + sel;
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }

  function map(list, fn) {
    return list.map(fn).filter(function (x) { return x; });
  }

  function cards(frame) {
    return map(all(frame, '.block'), function (b) {
      var a = b.querySelector('a');
      var nameA = b.querySelector('.info .name a');
      var enA = b.querySelector('.enname a');
      return {
        href: abs(attr(a, 'href')),
        title: txt(nameA),
        enname: txt(enA).replace(/^\(|\)$/g, ''),
        cover: imgOf(b),
        mojang: !!b.querySelector('.mojang')
      };
    });
  }

  function parse(doc) {
    var main = pick(doc, '.main');
    if (!main) return { ok: false, reason: 'no .main' };

    var newsLeft = pick(main, '.news_block .left');
    var newsRight = pick(main, '.news_block .right');
    var out = {
      ok: true,
      cards: {
        random: cards(pick(newsLeft, '#indexNew_random')),
        latest: cards(pick(newsLeft, '#indexNew_new')),
        edited: cards(pick(newsLeft, '#indexNew_edit'))
      },
      quick: [],
      stats: [],
      feed: [],
      posts: [],
      topics: [],
      popular: [],
      versions: [],
      tags: [],
      stars: [],
      charts: [],
      comments: [],
      categories: [],
      crumbs: []
    };

    out.quick = map(all(pick(newsRight, '.addArea'), 'a'), function (a) {
      return { href: abs(attr(a, 'href')), label: txt(a), cls: a.className || '' };
    });

    out.stats = map(all(pick(newsRight, '.count'), 'span'), function (s) {
      return { text: txt(s), title: attr(s, 'title') };
    });

    out.feed = all(pick(newsRight, '.editor'), 'li').map(function (li) {
      return li.innerHTML;
    });

    out.posts = map(all(pick(main, '.post_frame .list'), '> li'), function (li) {
      var a = li.querySelector('.postTitle a');
      var score = li.querySelector('.score');
      var mods = map(all(li, '.postText a'), function (m) {
        return { title: txt(m), href: abs(attr(m, 'href')) };
      });
      return {
        title: txt(a),
        href: abs(attr(a, 'href')),
        score: txt(score),
        mods: mods
      };
    });

    out.topics = map(all(pick(main, '.topic_block'), '#day > li'), function (li) {
      var item = li.querySelector('.item');
      var link = li.querySelector('.dec > a');
      var author = li.querySelector('.un');
      var time = li.querySelector('.dec i');
      return {
        title: txt(link),
        href: abs(attr(link, 'href')),
        author: txt(author),
        authorHref: abs(attr(author, 'href')),
        avatar: imgOf(item),
        time: txt(time),
        replies: (txt(li.querySelector('.dec')) || '').match(/回复\((\d+)\)/)
          ? RegExp.$1 : '0'
      };
    });

    out.popular = map(all(pick(main, '.card_block .list'), 'li'), function (li) {
      var a = li.querySelector('.name a') || li.querySelector('.img a');
      return {
        title: txt(a),
        href: abs(attr(a, 'href')),
        cover: imgOf(li),
        text: txt(li.querySelector('.text')),
        percent: txt(li.querySelector('.per'))
      };
    });

    out.versions = map(all(pick(main, '.list_block .menu'), 'li > a'), function (a) {
      return { label: txt(a), ver: attr(a, 'ver'), on: a.className.indexOf('on') !== -1 };
    });

    out.tags = map(all(pick(main, '.tag_block .list'), 'li a'), function (a) {
      var style = attr(a, 'style');
      var size = (style.match(/font-size:\s*(\d+)px/) || [])[1];
      var color = (style.match(/color:\s*([^;]+)/) || [])[1];
      var label = txt(a);
      var m = label.match(/^(.*)\((\d+)\)$/);
      return {
        label: m ? m[1] : label,
        count: m ? m[2] : '',
        href: abs(attr(a, 'href')),
        size: size ? Number(size) : 16,
        color: color || ''
      };
    });

    out.stars = map(all(pick(main, '.star_block'), '#day > li'), function (li) {
      var name = li.querySelector('.name');
      return {
        name: txt(name),
        href: abs(attr(name, 'href')),
        avatar: imgOf(li),
        percent: txt(li.querySelector('.num')),
        title: attr(li.querySelector('.num'), 'title')
      };
    });

    out.charts = map(all(pick(main, '.chart_block'), '.block'), function (b) {
      return {
        menu: txt(b.querySelector('.menu')),
        list: map(all(b, '.list > li'), function (li) {
          var a = li.querySelector('.name a') || li.querySelector('.img a');
          return {
            title: txt(a),
            href: abs(attr(a, 'href')),
            cover: imgOf(li),
            text: txt(li.querySelector('.text'))
          };
        })
      };
    });

    out.comments = map(all(pick(main, '.comment_block'), 'li'), function (li) {
      var a = li.querySelector('a');
      return { text: txt(li), href: abs(attr(a, 'href')) };
    });

    out.categories = map(all(main, '.class_category_block'), function (b) {
      var titleA = pick(b, '.left .title a');
      var ranks = {};
      ['day', 'week', 'moon'].forEach(function (k) {
        ranks[k] = map(all(pick(b, '#' + k), 'li'), function (li) {
          var a = li.querySelector('a');
          return {
            title: txt(a),
            href: abs(attr(a, 'href')),
            cover: imgOf(li),
            percent: txt(li.querySelector('.num'))
          };
        });
      });
      return {
        title: txt(titleA),
        href: abs(attr(titleA, 'href')),
        icon: txt(pick(b, '.left .title .icon')) ? '' : '',
        desc: txt(pick(b, '.left .title .text .t')),
        ranks: ranks
      };
    });

    return out;
  }

  return function (doc) {
    try {
      return parse(doc || document);
    } catch (e) {
      console.warn('[MCMod+] 首页抽取失败', e);
      return { ok: false, reason: e && e.message };
    }
  };
})();

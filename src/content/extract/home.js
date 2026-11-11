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
      nav: [],
      user: null,
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

    /* 顶部导航与用户区 */
    out.nav = map(all(pick(doc, '.top-main .navs'), '.def-nav'), function (n) {
      var a = n.tagName === 'A' ? n : n.querySelector('a');
      var label = txt(a || n).split(/\s+/)[0];
      return {
        label: label,
        href: abs(attr(a, 'href')),
        active: /(^|\s)on(\s|$)/.test(n.className || '')
      };
    });

    out.user = (function () {
      var info = pick(doc, '.top-main .info');
      if (!info) return null;
      var av = info.querySelector('.info-icon img') || info.querySelector('img');
      var nm = pick(info, '.info-icon .name') || pick(info, '.name');
      var profile = info.querySelector('.info-icon a[href*="center.mcmod.cn"]') ||
        info.querySelector('a[href*="center.mcmod.cn"]');
      return {
        name: txt(nm) || '未登录',
        avatar: av ? abs(attr(av, 'src')) : '',
        href: abs(attr(profile, 'href')),
        notice: abs(attr(info.querySelector('a[href*="notice"]'), 'href'))
      };
    })();

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

    out.footer = parseFooter(doc);
    return out;
  }

  // 站内链接有的是 javascript:void(0) + onclick 跳转，这里统一取真实地址。
  function linkHref(a) {
    var h = attr(a, 'href');
    if (h && !/^javascript:/i.test(h) && h !== '#') return abs(h);
    var oc = attr(a, 'onclick');
    var m = oc.match(/window\.open\(\s*['"]([^'"]+)['"]/i) || oc.match(/location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i);
    return m ? abs(m[1]) : '';
  }

  function parseFooter(doc) {
    var out = { cols: [], friends: [], copyright: '', icp: null, police: '', license: null };
    var under = pick(doc, '.under');
    if (!under) return out;

    out.cols = map(all(under, '.un_info > ul.block > li'), function (li) {
      var strong = pick(li, 'strong');
      var items = map(all(li, 'p > a'), function (a) {
        return { label: txt(a), href: linkHref(a) };
      });
      return { title: txt(strong), items: items };
    }).filter(function (c) { return c.title && c.items.length; });

    var links = pick(doc, '.un_links');
    out.friends = map(all(links, 'ul.block > li > a'), function (a) {
      return { title: attr(a, 'title') || txt(a), href: linkHref(a), img: imgOf(a) };
    }).filter(function (f) { return f.title && f.img; });

    var copyright = pick(under, '.copyright');
    if (copyright) {
      out.copyright = txt(copyright).replace(/\s*\[\s*响应时间.*$/,'').trim();
      var icp = copyright.querySelector('a[href*="beian.miit.gov.cn"]');
      if (icp) out.icp = { text: txt(icp), href: attr(icp, 'href') };
      var police = out.copyright.match(/鄂公网安备\s*[\d]+号/);
      out.police = police ? police[0] : '';
    }

    var copyleft = pick(under, '.copyleft');
    if (copyleft) {
      var lic = copyleft.querySelector('a');
      out.license = {
        text: txt(copyleft).replace(/^\[\s*|\s*\]$/g, ''),
        href: lic ? linkHref(lic) : ''
      };
    }

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

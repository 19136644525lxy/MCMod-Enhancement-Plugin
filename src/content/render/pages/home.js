/**
 * 首页重绘：毛玻璃卡片风格，全部区块自绘。
 * 数据来自 MP.extract.home()，链接全部保留原站地址。
 */
(function () {
  'use strict';
  var MP = window.MP;

  function h(tag, attrs) {
    return MP.dom.h.apply(null, [tag, attrs].concat(Array.prototype.slice.call(arguments, 2)));
  }

  function txt(s) { return s == null ? '' : String(s); }

  function a(href, label, cls, extra) {
    return h('a', Object.assign({
      class: cls || '',
      href: href || undefined,
      target: href ? '_blank' : undefined,
      rel: href ? 'noopener' : undefined
    }, extra || {}), label);
  }

  function glass(cls, children) {
    return h('section', { class: 'mp-glass ' + (cls || '') }, children);
  }

  function sectionHead(title, sub, aside) {
    return h('div', { class: 'mp-sec-head' },
      h('div', { class: 'mp-sec-title' },
        h('h2', null, title),
        sub ? h('span', { class: 'mp-sec-sub' }, sub) : null
      ),
      aside || null
    );
  }

  function statPills(stats) {
    return h('div', { class: 'mp-hero-stats' }, stats.map(function (s) {
      return h('span', { class: 'mp-hero-stat' }, s.text);
    }));
  }

  function quickGrid(quick) {
    return h('div', { class: 'mp-quick' }, quick.map(function (q) {
      return a(q.href, q.label, 'mp-quick-item ' + (q.cls || ''));
    }));
  }

  function modCards(list) {
    return h('div', { class: 'mp-mod-grid' }, list.map(function (c) {
      return a(c.href, [
        h('div', { class: 'mp-mod-cover' },
          c.cover ? h('img', { src: c.cover, alt: '', loading: 'lazy' }) : null,
          c.mojang ? h('span', { class: 'mp-mod-badge' }, 'MC') : null
        ),
        h('div', { class: 'mp-mod-meta' },
          h('div', { class: 'mp-mod-name' }, c.title),
          c.enname ? h('div', { class: 'mp-mod-en' }, c.enname) : null
        )
      ], 'mp-mod-card');
    }));
  }

  function tabs(items, renderer) {
    var wrap = h('div', { class: 'mp-tabs' });
    var body = h('div', { class: 'mp-tab-body' });
    items.forEach(function (it, i) {
      var btn = h('button', {
        class: 'mp-tab' + (i === 0 ? ' is-on' : ''),
        type: 'button',
        onclick: function () {
          wrap.querySelectorAll('.mp-tab').forEach(function (b) { b.classList.remove('is-on'); });
          btn.classList.add('is-on');
          MP.dom.clear(body);
          body.appendChild(renderer(it));
        }
      }, it.label);
      wrap.appendChild(btn);
    });
    body.appendChild(renderer(items[0]));
    return h('div', { class: 'mp-tab-wrap' }, wrap, body);
  }

  function feedList(feed) {
    return h('ul', { class: 'mp-feed' }, feed.map(function (html) {
      var li = h('li', { class: 'mp-feed-item' });
      li.appendChild(MP.dom.safeHtml(html));
      return li;
    }));
  }

  function postList(posts) {
    return h('ul', { class: 'mp-post-list' }, posts.map(function (p) {
      return h('li', { class: 'mp-post-item' },
        h('div', { class: 'mp-post-top' },
          a(p.href, p.title, 'mp-post-title'),
          p.score ? h('span', { class: 'mp-post-score' }, p.score) : null
        ),
        p.mods.length
          ? h('div', { class: 'mp-post-mods' }, p.mods.map(function (m) {
              return a(m.href, m.title, 'mp-mini-tag');
            }))
          : null
      );
    }));
  }

  function topicList(topics) {
    return h('ul', { class: 'mp-topic-list' }, topics.map(function (t) {
      return h('li', { class: 'mp-topic-item' },
        h('a', { class: 'mp-topic-avatar', href: t.authorHref || undefined, target: '_blank', rel: 'noopener' },
          t.avatar ? h('img', { src: t.avatar, alt: '', loading: 'lazy' }) : null),
        h('div', { class: 'mp-topic-main' },
          a(t.href, t.title, 'mp-topic-title'),
          h('div', { class: 'mp-topic-meta' },
            h('span', null, '作者 ', a(t.authorHref, t.author, 'mp-topic-author')),
            h('span', null, '回复 ' + t.replies),
            h('span', { class: 'mp-topic-time' }, t.time)
          )
        )
      );
    }));
  }

  function popularList(list) {
    return h('ul', { class: 'mp-rank-list' }, list.map(function (p, i) {
      return h('li', { class: 'mp-rank-item' },
        h('span', { class: 'mp-rank-no' }, String(i + 1)),
        h('a', { class: 'mp-rank-cover', href: p.href || undefined, target: '_blank', rel: 'noopener' },
          p.cover ? h('img', { src: p.cover, alt: '', loading: 'lazy' }) : null),
        h('div', { class: 'mp-rank-main' },
          a(p.href, p.title, 'mp-rank-title'),
          h('div', { class: 'mp-rank-text' }, p.text)
        ),
        p.percent ? h('span', { class: 'mp-rank-pct' }, p.percent) : null
      );
    }));
  }

  function versionCloud(versions) {
    return h('div', { class: 'mp-version-cloud' }, versions.map(function (v) {
      return h('span', { class: 'mp-version-chip' + (v.on ? ' is-on' : '') }, v.label);
    }));
  }

  function tagCloud(tags) {
    return h('div', { class: 'mp-tag-cloud' }, tags.map(function (t) {
      return a(t.href, t.label + (t.count ? ' ' + t.count : ''), 'mp-tag', {
        style: 'font-size:' + Math.min(20, Math.max(13, t.size)) + 'px;' +
          (t.color ? 'color:' + t.color : '')
      });
    }));
  }

  function starList(stars) {
    return h('ul', { class: 'mp-star-list' }, stars.map(function (s, i) {
      return h('li', { class: 'mp-star-item' },
        h('span', { class: 'mp-star-no' }, String(i + 1)),
        h('a', { class: 'mp-star-avatar', href: s.href || undefined, target: '_blank', rel: 'noopener' },
          s.avatar ? h('img', { src: s.avatar, alt: '', loading: 'lazy' }) : null),
        a(s.href, s.name, 'mp-star-name'),
        h('span', { class: 'mp-star-pct', title: s.title || '' }, s.percent)
      );
    }));
  }

  function chartList(chart) {
    return h('div', { class: 'mp-chart' },
      h('div', { class: 'mp-chart-menu' }, chart.menu),
      popularList(chart.list)
    );
  }

  function categoryGrid(cats) {
    return h('div', { class: 'mp-cat-grid' }, cats.map(function (c) {
      return glass('mp-cat-card', [
        h('div', { class: 'mp-cat-head' },
          a(c.href, c.title, 'mp-cat-title'),
          h('span', { class: 'mp-cat-more' }, '进入 →')
        ),
        h('p', { class: 'mp-cat-desc' }, c.desc)
      ]);
    }));
  }

  function render(d) {
    var tabItems = [
      { key: 'random', label: '随便看看' },
      { key: 'latest', label: '最新收录' },
      { key: 'edited', label: '有新动态' }
    ];

    var hero = h('header', { class: 'mp-hero mp-glass' },
      h('div', { class: 'mp-hero-main' },
        h('span', { class: 'mp-eyebrow' }, 'Minecraft 中文 MOD 百科'),
        h('h1', { class: 'mp-hero-title' }, '找到你想要的模组'),
        h('p', { class: 'mp-hero-sub' }, '模组、整合包、教程与资料，一处检索。'),
        statPills(d.stats)
      ),
      quickGrid(d.quick)
    );

    var mods = glass('mp-mods', [
      sectionHead('模组', '共 ' + (d.stats[0] ? d.stats[0].text.replace(/^共\s*/, '') : '') + ' ', null),
      tabs(tabItems, function (it) { return modCards(d.cards[it.key] || []); })
    ]);

    var feed = glass('mp-feed-card', [
      sectionHead('编辑动态', '最近被编辑的条目'),
      feedList(d.feed)
    ]);

    var posts = glass('mp-posts-card', [
      sectionHead('教程', '最近被顶的教程', a('https://www.mcmod.cn/post/', '更多 →', 'mp-sec-more')),
      postList(d.posts)
    ]);

    var topics = glass('mp-topics-card', [
      sectionHead('社群动态', '来自百科社群', a('https://bbs.mcmod.cn/', '论坛 →', 'mp-sec-more')),
      topicList(d.topics)
    ]);

    var popular = glass('mp-popular-card', [
      sectionHead('最受欢迎', '红票占比 50% 以上'),
      popularList(d.popular)
    ]);

    var stars = glass('mp-stars-card', [
      sectionHead('贡献榜', '近期编辑排行', a('https://www.mcmod.cn/rank/', '完整榜单 →', 'mp-sec-more')),
      starList(d.stars)
    ]);

    var versions = glass('mp-versions-card', [
      sectionHead('版本检索', '按 MC 版本找模组', a('https://www.mcmod.cn/modlist.html', '模组检索 →', 'mp-sec-more')),
      versionCloud(d.versions)
    ]);

    var tags = glass('mp-tags-card', [
      sectionHead('热门标签', '被使用最多的标签'),
      tagCloud(d.tags)
    ]);

    var charts = glass('mp-charts-card', [
      sectionHead('评比排行', '按模组评比排序'),
      h('div', { class: 'mp-chart-grid' }, d.charts.map(chartList))
    ]);

    var cats = h('div', { class: 'mp-cat-section' },
      h('div', { class: 'mp-sec-head' },
        h('div', { class: 'mp-sec-title' }, h('h2', null, '按元素浏览'), h('span', { class: 'mp-sec-sub' }, '九大分类，找到同一路数的模组'))
      ),
      categoryGrid(d.categories)
    );

    return h('div', { id: 'mp-home', class: 'mp-home' },
      hero,
      h('div', { class: 'mp-cols mp-cols-2-1' }, mods, feed),
      h('div', { class: 'mp-cols mp-cols-1-1' }, posts, topics),
      h('div', { class: 'mp-cols mp-cols-3' }, popular, versions, stars),
      h('div', { class: 'mp-cols mp-cols-1-1' }, tags, charts),
      cats
    );
  }

  MP.pages = MP.pages || {};

  var mounted = false;

  MP.pages.home = {
    match: function () {
      var host = location.hostname;
      var path = location.pathname;
      return /(^|\.)mcmod\.cn$/i.test(host) && (path === '/' || path === '/index.html' || path === '/index.php');
    },
    mount: function (settings) {
      if (!this.match()) return false;
      if (mounted) return true;
      var d = MP.extract.home(document);
      if (!d || !d.ok) {
        console.warn('[MCMod+] 首页抽取失败', d && d.reason);
        return false;
      }

      MP.theme.inject('styles/pages/home.css');
      document.body.classList.add('mp-home-mode');

      var anchor = document.querySelector('.center > .main') || document.querySelector('.main');
      var host = h('div', { id: 'mp-home-host', class: 'mp-home-host' });
      host.appendChild(render(d));

      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(host, anchor);
        anchor.classList.add('mp-origin-hidden');
      } else {
        document.body.insertBefore(host, document.body.firstChild);
      }

      mounted = true;
      return true;
    },
    unmount: function () {
      var host = document.getElementById('mp-home-host');
      if (host) host.remove();
      var main = document.querySelector('.center > .main');
      if (main) main.classList.remove('mp-origin-hidden');
      document.body.classList.remove('mp-home-mode');
      mounted = false;
    }
  };
})();

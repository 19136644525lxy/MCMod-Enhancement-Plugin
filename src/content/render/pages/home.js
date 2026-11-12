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

  // 原版 MC百科 logo（扩展内置副本，避免每次页面加载再向站点取图）。
  var LOGO = (function () {
    try {
      return (window.chrome && chrome.runtime && chrome.runtime.getURL)
        ? chrome.runtime.getURL('assets/logo.png')
        : '';
    } catch (e) {
      return '';
    }
  })();

  // 只截取原图左侧 278×278 的图标块：容器 36px 时整图放大到 36*800/278 ≈ 104px。
  function brandMarkStyle() {
    if (!LOGO) return '';
    return 'background-image:url("' + LOGO + '");background-size:104px 36px;' +
      'background-position:left center;background-repeat:no-repeat;background-color:transparent;';
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

  // ---- banner 底部的导航条 + 时钟（原站是两条绝对定位的浮层）----
  var clockTimer = null;

  // 苦力怕脸：照官方图标在 16×16 网格上的像素形状画，
  // 眼睛 3×3，嘴是「顶部 4×2 窄条 → 中间 6×2 宽条 → 底部两条 2×2 的腿」。
  function creeperFace() {
    var K = '#101010';
    return h('svg', { viewBox: '0 0 16 16', class: 'mp-creeper-svg', 'aria-hidden': 'true' },
      h('rect', { x: 0, y: 0, width: 16, height: 16, rx: 1.2, fill: '#5cae3c' }),
      h('rect', { x: 3, y: 4, width: 3, height: 3, fill: K }),
      h('rect', { x: 10, y: 4, width: 3, height: 3, fill: K }),
      h('rect', { x: 6, y: 7, width: 4, height: 2, fill: K }),
      h('rect', { x: 5, y: 9, width: 6, height: 2, fill: K }),
      h('rect', { x: 5, y: 11, width: 2, height: 2, fill: K }),
      h('rect', { x: 9, y: 11, width: 2, height: 2, fill: K })
    );
  }

  function bannerBar(b) {
    if (!b) return null;
    return h('div', { class: 'mp-bannerbar', id: 'mp-bannerbar' },
      a(b.randomHref, h('span', { class: 'mp-bb-creeper' }, creeperFace()), 'mp-bb-rand', {
        title: '随机页面（手气不错？）'
      }),
      h('nav', { class: 'mp-bb-nav' }, b.nav.map(function (it) {
        return a(it.href, it.label, 'mp-bb-item' + (it.sv ? ' is-sv' : ''), { target: '_self' });
      })),
      h('form', {
        class: 'mp-bb-search',
        action: b.search.action,
        method: 'get',
        target: '_blank'
      },
        h('input', {
          type: 'search',
          name: b.search.name,
          placeholder: b.search.placeholder,
          autocomplete: 'off'
        }),
        h('button', { type: 'submit', 'aria-label': '搜索' },
          h('svg', { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true' },
            h('circle', { cx: 7, cy: 7, r: 4.2, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6 }),
            h('path', { d: 'M10.3 10.3 L13.5 13.5', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round' })
          )
        )
      )
    );
  }

  // 原站时间组件左边有个 16×16 的像素小钟（images/banner/time/{h}.png），
  // 这里用同一张素材，保持像素锐利。
  var CLOCK_ICON = (function () {
    try {
      return (window.chrome && chrome.runtime && chrome.runtime.getURL)
        ? chrome.runtime.getURL('assets/clock.png')
        : '';
    } catch (e) {
      return '';
    }
  })();

  function startClock(host) {
    var el = h('div', { class: 'mp-clock', id: 'mp-clock', title: '当前时间' });
    if (CLOCK_ICON) {
      el.appendChild(h('i', {
        class: 'mp-clock-ico',
        style: 'background-image:url("' + CLOCK_ICON + '")'
      }));
    }
    var txt = h('span', { class: 'mp-clock-txt' });
    el.appendChild(txt);
    host.appendChild(el);
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function tick() {
      var t = new Date();
      txt.textContent = pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds());
    }
    tick();
    clockTimer = setInterval(tick, 1000);
    return el;
  }

  function stopClock() {
    if (clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  }

  function statPills(stats) {
    return h('div', { class: 'mp-hero-stats' }, stats.map(function (s) {
      return h('span', { class: 'mp-hero-stat' }, s.text);
    }));
  }

  function quickGrid(quick) {
    return h('div', { class: 'mp-quick' }, quick.map(function (q) {
      return a(q.href, [
        h('span', { class: 'mp-quick-icon', 'aria-hidden': 'true' }, iconFor(q.href)),
        h('span', { class: 'mp-quick-label' }, q.label)
      ], 'mp-quick-item ' + (q.cls || ''));
    }));
  }

  /* 快捷入口图标：按目标地址映射，避免依赖原站 CSS 背景图 */
  function iconFor(href) {
    var svg = { class: 'mp-ico', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' };
    function path(d, extra) {
      return h('svg', Object.assign({}, svg, extra || {}), h('path', { d: d }));
    }
    if (/\/class\/add\//.test(href)) return path('M12 5v14M5 12h14');
    if (/\/post\/add\//.test(href)) return path('M4 5h11a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3V5zM8 9h6M8 13h4');
    if (/\/verify\//.test(href)) return path('M20 6 9 17l-5-5');
    if (/\/history\//.test(href)) return path('M12 8v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4');
    if (/\/modpack\/add\//.test(href)) return path('M12 3 3 8l9 5 9-5-9-5zM3 8v8l9 5 9-5V8');
    if (/modlist\.html/.test(href)) return path('M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 21l-4-4');
    if (/oredict\.html/.test(href)) return path('M4 6h7a2 2 0 0 1 2 2v10a2 2 0 0 0-2-2H4V6zM20 6h-7a2 2 0 0 0-2 2v10a2 2 0 0 1 2-2h7V6z');
    if (/worldgen\.html/.test(href)) return path('M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6zM9 3v15M15 6v15');
    return path('M12 5v14M5 12h14');
  }

  function modCards(list, animate) {
    return h('div', { class: 'mp-mod-grid' }, list.map(function (c, i) {
      return a(c.href, [
        h('div', { class: 'mp-mod-cover' },
          c.cover ? h('img', { src: c.cover, alt: '', loading: 'lazy' }) : null,
          c.mojang ? h('span', { class: 'mp-mod-badge' }, 'MC') : null
        ),
        h('div', { class: 'mp-mod-meta' },
          h('div', { class: 'mp-mod-name' }, c.title),
          c.enname ? h('div', { class: 'mp-mod-en' }, c.enname) : null
        )
      ], 'mp-mod-card', animate ? { style: 'animation-delay:' + (i * 26) + 'ms' } : null);
    }));
  }

  // 「我的世界原版」是固定卡片，任何一组轮换里都保持在左上角。
  function isMinecraft(c) {
    var name = (c && c.title || '').trim();
    var en = (c && c.enname || '').trim();
    return /^我的世界原版$/.test(name) || /^minecraft$/i.test(en);
  }

  function pinMinecraft(list) {
    var arr = (list || []).slice();
    for (var i = 0; i < arr.length; i++) {
      if (isMinecraft(arr[i])) {
        var card = arr.splice(i, 1)[0];
        arr.unshift(card);
        break;
      }
    }
    return arr;
  }

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
    }
    return list;
  }

  // 某一组里没有「我的世界原版」时，从随机组借一张补到首位，
  // 保证它不论切哪个 tab、轮换几次都固定在左上角。
  function groupCards(d, key) {
    var list = (d.cards[key] || []).slice();
    if (list.some(isMinecraft)) return pinMinecraft(list);
    var pin = (d.cards.random || []).filter(isMinecraft)[0];
    return pin ? [pin].concat(list.slice(0, 9)) : list;
  }

  function tabs(items, renderer) {
    var wrap = h('div', { class: 'mp-tabs' });
    var body = h('div', { class: 'mp-tab-body' });
    var seq = 0;

    function swap(it) {
      var grid = body.querySelector('.mp-mod-grid');
      if (!grid) {
        MP.dom.clear(body);
        body.appendChild(renderer(it));
        return;
      }
      // 淡出 → 换内容 → stagger 淡入，避免「啪」地整块替换
      var my = ++seq;
      grid.classList.add('is-swap');
      setTimeout(function () {
        if (my !== seq) return;
        MP.dom.clear(body);
        var fresh = renderer(it);
        if (fresh.classList) fresh.classList.add('is-in');
        body.appendChild(fresh);
        if (fresh.classList) setTimeout(function () { fresh.classList.remove('is-in'); }, 560);
      }, 190);
    }

    items.forEach(function (it, i) {
      var btn = h('button', {
        class: 'mp-tab' + (i === 0 ? ' is-on' : ''),
        type: 'button',
        onclick: function () {
          wrap.querySelectorAll('.mp-tab').forEach(function (b) { b.classList.remove('is-on'); });
          btn.classList.add('is-on');
          swap(it);
        }
      }, it.label);
      wrap.appendChild(btn);
    });
    body.appendChild(renderer(items[0]));
    return h('div', { class: 'mp-tab-wrap' }, wrap, body);
  }

  // 原站编辑动态是「滚筒」：固定高度，条目自下而上循环滚动。
  // 这里用 CSS 动画还原：把列表复制一份首尾相接，滚到 -50% 时正好接上。
  function feedList(feed) {
    var items = (feed || []).map(function (html) {
      var li = h('li', { class: 'mp-feed-item' });
      li.appendChild(MP.dom.safeHtml(html));
      return li;
    });
    if (!items.length) return h('div', { class: 'mp-feed-scroll' }, h('p', { class: 'mp-empty' }, '暂无动态'));

    var ul = h('ul', { class: 'mp-feed' }, items);
    var clone = ul.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    return h('div', { class: 'mp-feed-scroll' },
      h('div', { class: 'mp-feed-track' }, ul, clone)
    );
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
      return a(v.href, v.label, 'mp-version-chip' + (v.on ? ' is-on' : ''));
    }));
  }

  function tagCloud(tags) {
    return h('div', { class: 'mp-tag-cloud' }, tags.map(function (t) {
      // 原站用 12~20px 的字号表达热度，排出来大小乱跳；统一 13px，热度靠颜色和数字弱化
      return h('a', {
        class: 'mp-tag',
        href: t.href || undefined,
        target: '_blank',
        rel: 'noopener',
        style: t.color ? 'color:' + t.color : null
      },
        h('span', { class: 'mp-tag-name' }, t.label),
        t.count ? h('span', { class: 'mp-tag-count' }, t.count) : null
      );
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
      // 整张卡都是链接：原站卡片只有标题可点，空白处没反应，体感像「点不动」
      return h('a', {
        class: 'mp-glass mp-cat-card',
        href: c.href || undefined,
        target: '_blank',
        rel: 'noopener'
      },
        h('div', { class: 'mp-cat-head' },
          h('span', { class: 'mp-cat-title' }, c.title),
          h('span', { class: 'mp-cat-more' }, '进入 →')
        ),
        h('p', { class: 'mp-cat-desc' }, c.desc)
      );
    }));
  }

  function isDarkNow() {
    var cur = document.documentElement.dataset.mpTheme;
    if (cur === 'dark') return true;
    if (cur === 'light') return false;
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  }

  function themeSwitch() {
    return MP.ui.dayNight({
      dark: isDarkNow(),
      class: 'mp-theme-switch',
      onChange: function (dark) {
        try {
          var next = dark ? 'dark' : 'light';
          // 不再用全屏遮罩（深→浅看着像"先黑一下再亮"，很怪）。
          // 改成让所有颜色走 CSS transition，主题属性一换，颜色自己平滑过渡。
          MP.theme.apply({ theme: next });
          if (MP.store && MP.store.setSync) {
            var p = MP.store.setSync({ theme: next });
            if (p && p.catch) p.catch(function () {});
          }
        } catch (err) {
          /* 主题切换失败不影响页面 */
        }
      }
    });
  }

  function gearIcon() {
    return h('svg', {
      viewBox: '0 0 24 24',
      class: 'mp-gear',
      'aria-hidden': 'true',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.8',
      'stroke-linecap': 'round'
    },
      h('circle', { cx: 12, cy: 12, r: 3.1 }),
      h('path', { d: 'M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8' })
    );
  }

  function topbar(d) {
    var navItems = (d.nav || []).map(function (n) {
      return a(n.href, n.label, 'mp-nav-item' + (n.active ? ' is-on' : ''));
    });

    var userBlock = d.user
      ? h('div', { class: 'mp-user' },
          d.user.notice
            ? h('a', { class: 'mp-bell', href: d.user.notice, target: '_blank', rel: 'noopener', title: '提醒' },
                h('span', { 'aria-hidden': 'true' }, '◔'))
            : null,
          a(d.user.href, [
            d.user.avatar ? h('img', { src: d.user.avatar, alt: '', loading: 'lazy' }) : null,
            h('span', { class: 'mp-user-name' }, d.user.name)
          ], 'mp-user-link')
        )
      : null;

    return h('header', { class: 'mp-topbar', id: 'mp-home-topbar' },
      h('div', { class: 'mp-topbar-inner' },
        a('https://www.mcmod.cn/', [
          h('span', { class: 'mp-brand-mark', style: brandMarkStyle() }, LOGO ? '' : 'MC'),
          h('span', { class: 'mp-brand-name' }, '百科')
        ], 'mp-brand'),
        h('nav', { class: 'mp-nav' }, navItems),
        h('form', {
          class: 'mp-search',
          action: 'https://search.mcmod.cn/s',
          method: 'get',
          target: '_blank'
        },
          h('input', { name: 'key', type: 'search', placeholder: '搜索 MOD / 资料 / 教程…', autocomplete: 'off' }),
          h('button', { type: 'submit', class: 'mp-search-btn' }, '搜索')
        ),
        themeSwitch(),
        userBlock,
        h('button', {
          class: 'mp-gear-btn',
          type: 'button',
          title: '插件设置',
          'aria-label': '插件设置',
          onclick: function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (MP.settingsPanel) MP.settingsPanel.toggle();
          }
        }, gearIcon())
      )
    );
  }

  // 我的足迹：只有拿到用户 UID 才渲染，未登录直接跳过。
  function uidOf(d) {
    var href = d && d.user && d.user.href;
    if (!href) return '';
    var m = /\/(\d+)\/?$/.exec(String(href));
    return m ? m[1] : '';
  }

  function footprintCard(d) {
    var uid = uidOf(d);
    if (!uid) return null;

    return h('section', { class: 'mp-glass mp-footprint', id: 'mp-fp' },
      h('div', { class: 'mp-fp-head' },
        h('div', { class: 'mp-fp-title' },
          h('h2', null, '我的足迹'),
          h('p', { class: 'mp-fp-note' }, '正在读取编辑记录…')
        ),
        a('https://www.mcmod.cn/history.html?userid=' + uid, '全部记录 →', 'mp-fp-all')
      ),
      h('div', { class: 'mp-fp-body' },
        h('div', { class: 'mp-fp-stats' }),
        h('div', { class: 'mp-fp-chart' },
          h('div', { class: 'mp-fp-months' }),
          h('div', { class: 'mp-fp-heat' })
        ),
        h('ul', { class: 'mp-fp-recent' })
      )
    );
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
      tabs(tabItems, function (it) { return modCards(groupCards(d, it.key)); })
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

    var fp = footprintCard(d);

    return h('div', { id: 'mp-home', class: 'mp-home' },
      hero,
      fp,
      h('div', { class: 'mp-cols mp-cols-2-1' }, mods, feed),
      h('div', { class: 'mp-cols mp-cols-1-1' }, posts, topics),
      h('div', { class: 'mp-cols mp-cols-3' }, popular, versions, stars),
      h('div', { class: 'mp-cols mp-cols-1-1' }, tags, charts),
      cats,
      footer(d)
    );
  }

  // 页脚：原站底部是深色长条 + 图片友链墙，与毛玻璃页面不搭，这里整体重绘。
  // 链接全部指回原站地址，不做任何改写。
  function footer(d) {
    var f = d.footer || {};
    var cols = (f.cols || []).map(function (c) {
      return h('div', { class: 'mp-foot-col' },
        h('h3', null, c.title),
        h('ul', null, c.items.map(function (it) {
          return h('li', null, a(it.href, it.label));
        }))
      );
    });

    var friends = (f.friends || []).map(function (x) {
      return h('a', {
        class: 'mp-friend',
        href: x.href || undefined,
        target: '_blank',
        rel: 'noopener',
        title: x.title
      }, h('img', { src: x.img, alt: x.title, loading: 'lazy' }));
    });

    return h('footer', { class: 'mp-footer' },
      h('div', { class: 'mp-foot-main mp-glass' },
        h('div', { class: 'mp-foot-brand' },
          h('a', { class: 'mp-foot-mark-link', href: 'https://www.mcmod.cn/', target: '_blank', rel: 'noopener' },
            h('span', { class: 'mp-foot-mark', style: brandMarkStyle() }, LOGO ? '' : 'MC'),
            h('span', { class: 'mp-foot-name' }, 'MC百科')
          ),
          h('p', { class: 'mp-foot-slogan' }, 'Minecraft 中文 MOD 百科'),
          h('p', { class: 'mp-foot-desc' }, '收集、整理、分享 Minecraft 模组的中文资料')
        ),
        h('div', { class: 'mp-foot-cols' }, cols)
      ),
      friends.length ? h('div', { class: 'mp-foot-friends' }, friends) : null,
      h('div', { class: 'mp-foot-meta' },
        f.copyright ? h('p', null, f.copyright) : null,
        f.license ? h('p', { class: 'mp-foot-license' },
          f.license.href ? a(f.license.href, f.license.text) : f.license.text) : null
      )
    );
  }

  MP.pages = MP.pages || {};

  var mounted = false;
  var rotTimer = null;
  var rotCtx = null;   // { d, host } —— 供设置面板即时开关轮换
  var ROT_KEYS = ['random', 'latest', 'edited'];

  function setActiveTab(host, idx) {
    var tabs = host.querySelectorAll('.mp-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('is-on', i === idx);
  }

  /**
   * 站点的「随便看看」原本靠 AJAX 定时换一批，会持续打请求。
   * 这里改为纯前端轮换：在已抽取的三组卡片里切换，零网络请求。
   * 鼠标悬停或手动点 tab 后停止，避免和用户操作打架。
   */
  function startRotation(d, host) {
    stopRotation();
    rotCtx = { d: d, host: host };
    var idx = 0;
    var paused = false;

    host.addEventListener('mouseenter', function () { paused = true; });
    host.addEventListener('mouseleave', function () { paused = false; });
    host.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('.mp-tab')) paused = true;
    }, true);

    rotTimer = setInterval(function () {
      if (paused || document.hidden) return;
      var grid = host.querySelector('.mp-tab-body .mp-mod-grid');
      if (!grid) return;
      idx = (idx + 1) % ROT_KEYS.length;
      var list = groupCards(d, ROT_KEYS[idx]);
      // 第一张（我的世界原版）固定，其余打乱，避免它被随机冲掉
      var head = list.slice(0, 1);
      var tail = shuffle(list.slice(1));
      list = head.concat(tail);

      grid.classList.add('is-swap');
      setTimeout(function () {
        if (!grid.isConnected) return;
        MP.dom.clear(grid);
        var fresh = modCards(list, true);
        while (fresh.firstChild) grid.appendChild(fresh.firstChild);
        grid.classList.remove('is-swap');
        grid.classList.add('is-in');
        setTimeout(function () { grid.classList.remove('is-in'); }, 560);
      }, 190);
      setActiveTab(host, idx);
    }, 8000);
  }

  function stopRotation() {
    if (rotTimer) {
      clearInterval(rotTimer);
      rotTimer = null;
    }
  }
  var fabEl = null;

  // 右下角的小悬浮条：增强 / 原始 / 设置。
  // 它不随 mount/unmount 销毁——切回原始视图后还得留在这儿，用户才能再切回来。
  function syncFab() {
    if (!fabEl) return;
    var enhanced = !!document.getElementById('mp-home-host');
    var btns = fabEl.querySelectorAll('.mp-fab');
    if (btns[0]) btns[0].classList.toggle('is-on', enhanced);
    if (btns[1]) btns[1].classList.toggle('is-on', !enhanced);
  }

  function ensureFab(settings) {
    if (fabEl && document.body.contains(fabEl)) {
      syncFab();
      return fabEl;
    }
    fabEl = h('div', { id: 'mp-home-fab', class: 'mp-fab-bar' },
      h('button', {
        class: 'mp-fab',
        type: 'button',
        onclick: function () {
          if (!document.getElementById('mp-home-host')) {
            MP.pages.home.mount(settings || {});
          }
          syncFab();
        }
      }, '增强'),
      h('button', {
        class: 'mp-fab',
        type: 'button',
        onclick: function () {
          if (document.getElementById('mp-home-host')) MP.pages.home.unmount();
          syncFab();
        }
      }, '原始'),
      h('button', {
        class: 'mp-fab mp-fab-icon',
        type: 'button',
        title: '插件设置',
        'aria-label': '插件设置',
        onclick: function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (MP.settingsPanel) MP.settingsPanel.toggle();
        }
      }, gearIcon())
    );
    document.body.appendChild(fabEl);
    syncFab();
    return fabEl;
  }

  MP.pages.home = {
    match: function () {
      var host = location.hostname;
      var path = location.pathname;
      return /(^|\.)mcmod\.cn$/i.test(host) && (path === '/' || path === '/index.html' || path === '/index.php');
    },
    mount: function (settings) {
      if (!this.match()) return false;
      if (mounted) {
        ensureFab(settings);
        return true;
      }
      var d = MP.extract.home(document);
      if (!d || !d.ok) {
        console.warn('[MCMod+] 首页抽取失败', d && d.reason);
        return false;
      }

      // 三组卡片都把「我的世界原版」顶到第一位
      ['random', 'latest', 'edited'].forEach(function (k) {
        if (d.cards && d.cards[k]) d.cards[k] = pinMinecraft(d.cards[k]);
      });

      MP.theme.inject('styles/mp-toggle.css');
      MP.theme.inject('styles/day-night.css');
      MP.theme.inject('styles/pages/home.css');
      document.body.classList.add('mp-home-mode');
      document.documentElement.classList.add('mp-home-root');

      // 顶部导航接管
      var top = document.querySelector('.top-main');
      if (top) top.classList.add('mp-origin-hidden');
      var bar = topbar(d);
      document.body.insertBefore(bar, document.body.firstChild);

      // banner 底部的二级导航 + 右上角时钟接管
      var frameIn = document.querySelector('.banner .frame-in');
      var bbar = bannerBar(d.banner);
      if (frameIn && bbar) {
        frameIn.appendChild(bbar);
        startClock(frameIn);
        ['.banner .m_menu', '.banner .nowTime'].forEach(function (sel) {
          var el = document.querySelector(sel);
          if (el) el.classList.add('mp-origin-hidden');
        });
      }

      var anchor = document.querySelector('.center > .main') || document.querySelector('.main');
      var host = h('div', { id: 'mp-home-host', class: 'mp-home-host' });
      host.appendChild(render(d));

      // 原站页脚是独立的两块，跟着一起隐藏，避免增强视图下面再拖一条异色长条
      ['.un_links', '.under'].forEach(function (sel) {
        var el = document.querySelector(sel);
        if (el) el.classList.add('mp-origin-hidden');
      });

      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(host, anchor);
        anchor.classList.add('mp-origin-hidden');
      } else {
        document.body.insertBefore(host, document.body.firstChild);
      }

      // 揭示动画结束后把 animation 摘掉：
      // 留着 clip-path: inset(0) 会一直挂着一个裁剪合成层，
      // 与卡片上的 backdrop-filter 叠加时，滚动容易出现整屏闪烁。
      host.addEventListener('animationend', function () {
        host.style.animation = 'none';
      }, { once: true });

      if (!settings || settings.homeRotate !== false) startRotation(d, host);

      // 足迹卡异步填充（只发一次请求，6 小时本地缓存）
      var fpHost = document.getElementById('mp-fp');
      if (settings && settings.footprint === false) {
        if (fpHost) {
          var fpCard = fpHost.closest ? fpHost.closest('.mp-glass') : null;
          if (fpCard) fpCard.remove();
        }
      } else if (fpHost && MP.footprint) {
        try { MP.footprint.load(fpHost, uidOf(d)); } catch (e) { console.warn('[MCMod+] 足迹加载失败', e); }
      }

      mounted = true;
      ensureFab(settings);
      return true;
    },
    unmount: function () {
      stopRotation();
      rotCtx = null;
      stopClock();
      var bbar = document.getElementById('mp-bannerbar');
      if (bbar) bbar.remove();
      var clk = document.getElementById('mp-clock');
      if (clk) clk.remove();
      ['.banner .m_menu', '.banner .nowTime'].forEach(function (sel) {
        var el = document.querySelector(sel);
        if (el) el.classList.remove('mp-origin-hidden');
      });
      var bar = document.getElementById('mp-home-topbar');
      if (bar) bar.remove();
      var top = document.querySelector('.top-main');
      if (top) top.classList.remove('mp-origin-hidden');
      var host = document.getElementById('mp-home-host');
      if (host) host.remove();
      var main = document.querySelector('.center > .main');
      if (main) main.classList.remove('mp-origin-hidden');
      ['.un_links', '.under'].forEach(function (sel) {
        var el = document.querySelector(sel);
        if (el) el.classList.remove('mp-origin-hidden');
      });
      document.body.classList.remove('mp-home-mode');
      document.documentElement.classList.remove('mp-home-root');
      mounted = false;
      syncFab();
    },
    // 设置面板里即时开关「随便看看」轮换
    setRotate: function (on) {
      try {
        if (on) {
          if (rotCtx) startRotation(rotCtx.d, rotCtx.host);
        } else {
          stopRotation();
        }
      } catch (e) {
        console.warn('[MCMod+] 轮换开关失败', e);
      }
    }
  };
})();


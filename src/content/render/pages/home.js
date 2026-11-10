/**
 * 首页排版增强（M2）
 *
 * 原则：只改排版，不动功能。
 * - 不修改任何 DOM 结构、不包裹节点、不改写链接/表单
 * - 只给既有容器加 class，由 CSS 接管布局
 * - 目标区域：顶部导航条、新闻区三栏、模组卡网格、九组分类区
 */
window.MP = window.MP || {};
MP.pages = MP.pages || {};

MP.pages.home = (function () {
  function isHome() {
    return (
      /(^|\.)www\.mcmod\.cn$/i.test(location.hostname) &&
      (location.pathname === '/' || location.pathname === '/index.html')
    );
  }

  function add(sel, cls) {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return false;
    el.classList.add(cls);
    return true;
  }

  function mount(settings) {
    if (!settings || !settings.enabled) return false;
    if (!isHome()) return false;
    if (document.documentElement.classList.contains('mp-home-ready')) return true;

    MP.theme.inject('styles/pages/home.css');
    document.documentElement.classList.add('mp-home');

    const stats = { frames: 0, cats: 0, news: false, nav: false };

    // 模组卡区（随便看看 / 最新收录 / 有新动态 三个 tab 面板）
    document.querySelectorAll('.blcok_frame').forEach((f) => {
      f.classList.add('mp-cards');
      stats.frames++;
    });

    // 新闻区：左（精选列表）中（模组卡）右（入口 + 统计 + 动态）
    stats.news = add('.news_block', 'mp-news');
    // 顶部分类导航条
    stats.nav = add('.main > .nav', 'mp-nav');
    // 九组"分类介绍 + 排行榜"
    document.querySelectorAll('.class_category_block').forEach((b) => {
      b.classList.add('mp-cat');
      stats.cats++;
    });
    // 主体：统一区块间距
    add('.main', 'mp-main');

    document.documentElement.classList.add('mp-home-ready');
    console.info(
      '[MCMod+] 首页排版：%d 个卡区，%d 个分类区，新闻区=%s，导航=%s',
      stats.frames,
      stats.cats,
      stats.news,
      stats.nav
    );
    return stats.frames + stats.cats > 0;
  }

  return { mount, isHome };
})();

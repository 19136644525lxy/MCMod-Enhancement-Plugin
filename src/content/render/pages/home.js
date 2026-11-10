/**
 * 首页布局增强（M2 第一步）
 *
 * 说明：首页 HTML 结构尚未做精确采样，因此这一版只做"布局层"改造：
 * 把 `.block` 内的 `.item` 卡片组重排为响应式网格，不改变 DOM 结构、不动任何链接。
 * 拿到真实结构样本后，再升级为完整的结构重绘。
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

  function gridify(block) {
    const items = Array.from(block.querySelectorAll('.item'));
    if (items.length < 4) return false;

    const counts = new Map();
    items.forEach((it) => {
      const p = it.parentElement;
      if (!p) return;
      counts.set(p, (counts.get(p) || 0) + 1);
    });

    let best = null;
    let max = 0;
    counts.forEach((n, p) => {
      if (n > max) {
        max = n;
        best = p;
      }
    });

    if (!best || max < 4) return false;
    best.classList.add('mp-grid');
    best.dataset.mpCount = String(max);
    return true;
  }

  function mount(settings) {
    if (!settings || !settings.enabled) return false;
    if (!isHome()) return false;
    if (document.documentElement.classList.contains('mp-home-ready')) return true;

    MP.theme.inject('styles/pages/home.css');
    document.documentElement.classList.add('mp-home');

    let blocks = 0;
    let grids = 0;

    document.querySelectorAll('.block').forEach((b) => {
      b.classList.add('mp-block');
      blocks++;
      if (gridify(b)) grids++;
    });

    // 没有 .block 时的兜底：直接找成组的 .item
    if (!blocks) {
      const items = Array.from(document.querySelectorAll('.item'));
      const counts = new Map();
      items.forEach((it) => {
        if (!it.parentElement) return;
        counts.set(it.parentElement, (counts.get(it.parentElement) || 0) + 1);
      });
      counts.forEach((n, p) => {
        if (n >= 4) {
          p.classList.add('mp-grid');
          grids++;
        }
      });
    }

    document.documentElement.classList.add('mp-home-ready');
    console.info('[MCMod+] 首页布局增强：%d 个板块，%d 个网格', blocks, grids);
    return blocks > 0 || grids > 0;
  }

  return { mount, isHome };
})();

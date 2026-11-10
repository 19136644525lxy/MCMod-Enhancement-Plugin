/**
 * 首页模块（已停用）
 *
 * v0.1 的排版增强用 CSS Grid 覆盖站点原有的 float + 固定尺寸布局，
 * 与卡片自身的定位规则冲突，导致卡片重叠、错位。
 * 已整体停用，等读完站点原始 CSS 后重新设计。
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

  function mount() {
    return false;
  }

  return { mount, isHome, disabled: true };
})();

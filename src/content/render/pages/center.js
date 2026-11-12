/**
 * 个人中心（center.mcmod.cn）视觉增强
 *
 * 站点是 hash 路由的 SPA：外壳直出，各 tab 的内容由
 *   POST /frame/{Tab}/  返回 HTML 片段后塞进 #center-page-*
 * 所以这里不重绘结构，只给已经渲染出来的区块挂上 mp- 类，
 * 让 center.css 去做视觉层。SPA 每次换内容会重建 DOM，
 * 用 MutationObserver 观察 .tab-content 重新挂类即可。
 */
window.MP = window.MP || {};
MP.pages = MP.pages || {};

MP.pages.center = (function () {
  const { debounce } = MP.dom;

  let mounted = false;
  let observer = null;
  let settingsRef = null;
  let onHash = null;

  const CLASSES = [
    ['.center-frame > .center-header', 'mp-center-header'],
    ['.center-header .user-icon', 'mp-c-avatar'],
    ['.center-header .user-name', 'mp-c-name'],
    ['.center-header .user-sign', 'mp-c-sign'],
    ['.center-header .bbs-link', 'mp-c-bbs'],
    ['.common-menu-area', 'mp-center-tabs'],
    ['.common-menu-page .page-li', 'mp-tab'],
    ['.tab-content', 'mp-tab-body'],
    ['.center-total', 'mp-center-total'],
    ['.center-main', 'mp-center-main'],
    ['.center-block', 'mp-center-block'],
    ['.center-block-head', 'mp-cb-head'],
    ['.center-content.admin-list', 'mp-admin-list'],
    ['.center-content.post-list', 'mp-post-list'],
    ['.center-content.edit-list', 'mp-edit-list'],
    ['.edit-chart-frame', 'mp-chart-frame']
  ];

  function match() {
    if (location.hostname !== 'center.mcmod.cn') return false;
    // 只接管 /<uid>/ 这一种个人主页，其它路径（设置、消息等）不碰
    return /^\/\d+\/?$/.test(location.pathname);
  }

  function mark() {
    document.body.classList.add('mp-center-mode');
    CLASSES.forEach(function (pair) {
      const nodes = document.querySelectorAll(pair[0]);
      for (let i = 0; i < nodes.length; i++) {
        if (!nodes[i].classList.contains(pair[1])) nodes[i].classList.add(pair[1]);
      }
    });
  }

  function mount(settings) {
    if (!match()) return false;
    if (mounted) {
      mark();
      return true;
    }
    settingsRef = settings || {};
    mounted = true;

    try {
      MP.theme.inject('styles/pages/center.css');
    } catch (e) {}

    // 背景：和首页共用同一套（styles/background.css 的选择器同时认
    // body.mp-home-mode 与 body.mp-center-mode）。站点自带的 body 背景图
    // 只在用户没选预设时才会露出来，所以这里不做「有没有背景图」的判断。
    try {
      MP.theme.inject('styles/background.css');
      if (MP.background) {
        if (settingsRef.bgIntensity != null) MP.background.setIntensity(settingsRef.bgIntensity);
        MP.background.apply(settingsRef.bgPreset || 'mist');
      }
    } catch (e) {}

    mark();

    const body = document.querySelector('.tab-content') || document.body;
    if (body && observer) observer.disconnect();
    observer = new MutationObserver(debounce(mark, 120));
    observer.observe(body, { childList: true, subtree: true });

    // SPA 切换 hash 后内容会整块换掉，再补一次
    if (onHash) window.removeEventListener('hashchange', onHash);
    onHash = function () {
      setTimeout(mark, 60);
      setTimeout(mark, 400);
    };
    window.addEventListener('hashchange', onHash);

    return true;
  }

  function unmount() {
    if (!mounted) return false;
    mounted = false;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (onHash) {
      window.removeEventListener('hashchange', onHash);
      onHash = null;
    }
    try {
      if (MP.background) MP.background.destroy();
    } catch (e) {}
    document.body.classList.remove('mp-center-mode');
    CLASSES.forEach(function (pair) {
      const nodes = document.querySelectorAll('.' + pair[1]);
      for (let i = 0; i < nodes.length; i++) nodes[i].classList.remove(pair[1]);
    });
    return true;
  }

  return { match, mount, unmount, mark, isActive: function () { return mounted; } };
})();

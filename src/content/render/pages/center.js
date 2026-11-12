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
  const { debounce, h } = MP.dom;

  let mounted = false;
  let observer = null;
  let settingsRef = null;
  let onHash = null;
  let fabEl = null;

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
    ['.edit-chart-frame', 'mp-chart-frame'],
    // 站点顶栏：只加类换皮，不动结构
    ['.header-container', 'mp-topbar'],
    ['.header-frame', 'mp-topbar-inner'],
    ['.header-menu', 'mp-topbar-menu'],
    ['.header-menu-item', 'mp-topbar-item'],
    ['.header-right', 'mp-topbar-right']
  ];

  function isDark() {
    const forced = document.documentElement.dataset.mpTheme;
    if (forced === 'dark') return true;
    if (forced === 'light') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  // 日夜开关：按用户要求，每个页面都要有，所以做成可插拔的
  function ensureDayNight() {
    if (document.getElementById('mp-daynight')) return;
    if (!MP.ui || !MP.ui.dayNight) return;
    try {
      MP.theme.inject('styles/day-night.css');
    } catch (e) {}
    const sw = MP.ui.dayNight({
      dark: isDark(),
      class: 'mp-topbar-daynight',
      onChange: function (next) {
        try {
          MP.theme.apply({ theme: next ? 'dark' : 'light' });
          MP.store.setSync({ theme: next ? 'dark' : 'light' });
        } catch (e) {}
      }
    });
    sw.id = 'mp-daynight';
    const right = document.querySelector('.header-right');
    const host = document.querySelector('.header-frame');
    // 追加到 .header-right 末尾：它在顶栏最右，紧挨着头像
    if (right) right.appendChild(sw);
    else if (host) host.appendChild(sw);
    else return;
  }

  function match() {
    // 离线预览页是 file:// 协议，content script 本来也跑不到那里，放行不影响线上
    if (location.protocol === 'file:') return true;
    if (location.hostname !== 'center.mcmod.cn') return false;
    // 只接管 /<uid>/ 这一种个人主页，其它路径（设置、消息等）不碰
    return /^\/\d+\/?$/.test(location.pathname);
  }

  // 齿轮：Lucide settings 的路径，和首页顶栏那颗保持一致
  function gearSvg() {
    return h('svg', {
      class: 'mp-fab-gear',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.8',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true'
    },
      h('path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }),
      h('circle', { cx: '12', cy: '12', r: '3' })
    );
  }

  function syncFab() {
    if (!fabEl) return;
    const on = document.body.classList.contains('mp-center-mode');
    const btns = fabEl.querySelectorAll('.mp-fab');
    if (btns[0]) btns[0].classList.toggle('is-on', on);
    if (btns[1]) btns[1].classList.toggle('is-on', !on);
  }

  // 和首页一样：悬浮条不随 unmount 消失，否则点「原始」之后就再也切不回来
  function ensureFab(settings) {
    if (fabEl && document.body.contains(fabEl)) {
      syncFab();
      return fabEl;
    }
    fabEl = h('div', { id: 'mp-center-fab', class: 'mp-fab-bar' },
      h('button', {
        class: 'mp-fab',
        type: 'button',
        onclick: function () {
          if (document.body.classList.contains('mp-center-mode')) {
            syncFab();
            return;
          }
          // 重新读设置，避免用上一次挂载时的旧快照
          MP.store.getSync().then(function (s) {
            MP.pages.center.mount(s || settings || {});
            syncFab();
          }).catch(function () {
            MP.pages.center.mount(settings || {});
            syncFab();
          });
        }
      }, '增强'),
      h('button', {
        class: 'mp-fab',
        type: 'button',
        onclick: function () {
          MP.pages.center.unmount();
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
      }, gearSvg())
    );
    document.body.appendChild(fabEl);
    syncFab();
    return fabEl;
  }

  /* ---------- 留言板图片全屏预览 ----------
     站点自己的预览是「在卡片内部撑开」，图一大就看不全。
     这里在捕获阶段拦掉，换成铺满视口的灯箱。 */
  let onDocClick = null;
  let onEsc = null;

  function ensureLightbox() {
    let box = document.getElementById('mp-lightbox');
    if (box) return box;
    box = h('div', { id: 'mp-lightbox', class: 'mp-lightbox' },
      h('img', { class: 'mp-lightbox-img', alt: '' })
    );
    box.addEventListener('click', closeLightbox);
    document.body.appendChild(box);
    return box;
  }

  function openLightbox(src) {
    const box = ensureLightbox();
    const img = box.querySelector('.mp-lightbox-img');
    if (img) img.setAttribute('src', src);
    box.classList.add('is-open');
  }

  function closeLightbox() {
    const box = document.getElementById('mp-lightbox');
    if (box) box.classList.remove('is-open');
  }

  function bindLightbox() {
    if (onDocClick) document.removeEventListener('click', onDocClick, true);
    onDocClick = function (e) {
      const t = e.target;
      if (!t || t.tagName !== 'IMG') return;
      if (!t.closest || !t.closest('.common-comment-block')) return;
      const src = t.getAttribute('data-original') || t.getAttribute('src');
      if (!src) return;
      e.preventDefault();
      e.stopPropagation();
      openLightbox(src);
    };
    document.addEventListener('click', onDocClick, true);

    if (onEsc) document.removeEventListener('keydown', onEsc);
    onEsc = function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) closeLightbox();
    };
    document.addEventListener('keydown', onEsc);
  }

  function unbindLightbox() {
    if (onDocClick) {
      document.removeEventListener('click', onDocClick, true);
      onDocClick = null;
    }
    if (onEsc) {
      document.removeEventListener('keydown', onEsc);
      onEsc = null;
    }
    const box = document.getElementById('mp-lightbox');
    if (box && box.parentNode) box.parentNode.removeChild(box);
  }

  function mark() {
    document.body.classList.add('mp-center-mode');
    CLASSES.forEach(function (pair) {
      const nodes = document.querySelectorAll(pair[0]);
      for (let i = 0; i < nodes.length; i++) {
        if (!nodes[i].classList.contains(pair[1])) nodes[i].classList.add(pair[1]);
      }
    });
    ensureDayNight();
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

    ensureFab(settingsRef);
    bindLightbox();

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
    unbindLightbox();
    const sw = document.getElementById('mp-daynight');
    if (sw && sw.parentNode) sw.parentNode.removeChild(sw);
    syncFab();
    return true;
  }

  return { match, mount, unmount, mark, isActive: function () { return mounted; } };
})();


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
  // 活跃度：原站是 ECharts 画的，深色主题下是一整块白底。
  // 这里把它藏掉，用 history.html 的真实编辑记录重画一张热力图。
  // 数据与首页「我的足迹」同源，所以两边是一致的。
  var actKey = '';
  var actToken = 0;
  var actBusy = false;

  function activityUrl(uid) {
    return 'https://www.mcmod.cn/history.html?userid=' + uid;
  }

  function collectDays(doc) {
    var out = [];
    var lis = doc.querySelectorAll('.history-list li');
    for (var i = 0; i < lis.length; i++) {
      var t = lis[i].querySelector('.time');
      var txt = t ? (t.textContent || '') : '';
      var m = /(\d{4})-(\d{2})-(\d{2})/.exec(txt);
      if (m) out.push(m[1] + '-' + m[2] + '-' + m[3]);
    }
    return out;
  }

  function paintActivity(host, days, state) {
    state = state || {};
    var counts = {};
    days.forEach(function (d) { counts[d] = (counts[d] || 0) + 1; });

    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var dow = (now.getDay() + 6) % 7; // 周一 = 0
    var end = new Date(now.getTime() - dow * 86400000);

    // 周数按「最早一条记录 -> 今天」算，别再固定 26 周把更早的数据丢掉
    var first = days.slice().sort()[0];
    var weeks = 26;
    if (first) {
      var span = end.getTime() - new Date(first + 'T00:00:00+08:00').getTime();
      weeks = Math.ceil(span / (7 * 86400000)) + 1;
    }
    weeks = Math.max(26, Math.min(180, weeks));

    // 格子尺寸跟着周数和容器宽度走，最小 8px，避免溢出
    var hostW = host.clientWidth || 900;
    var cell = Math.floor((hostW - weeks * 3) / weeks);
    cell = Math.max(8, Math.min(13, cell));

    var cells = [];
    var total = 0;
    var active = 0;
    for (var w = weeks - 1; w >= 0; w--) {
      for (var d = 0; d < 7; d++) {
        var date = new Date(end.getTime() - (w * 7 + (6 - d)) * 86400000);
        var key = date.toISOString().slice(0, 10);
        var n = counts[key] || 0;
        if (n > 0) { total += n; active++; }
        var lv = n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3;
        cells.push('<i class="mp-act-cell" data-lv="' + lv + '" style="--cell:' + cell + 'px" title="' + key + ' · ' + n + ' 次"></i>');
      }
    }

    var status = state.progress
      ? '补全中 ' + state.progress
      : state.note === '全部'
        ? '全部 ' + total + ' 次'
        : total + ' 次';

    ensureTip();

    host.querySelector('.mp-act-body').innerHTML =
      '<div class="mp-act-scroll"><div class="mp-act-grid" style="--cell:' + cell + 'px">' + cells.join('') + '</div></div>' +
      '<div class="mp-act-foot">' +
        '<span>近 ' + weeks + ' 周 · ' + active + ' 天有记录 · ' + status + '</span>' +
        '<span class="mp-act-actions">' +
          '<button class="mp-act-refresh" type="button" title="重新抓取">刷新</button>' +
          '<span class="mp-act-legend"><i data-lv="0"></i><i data-lv="1"></i><i data-lv="2"></i><i data-lv="3"></i><b>多</b></span>' +
        '</span>' +
      '</div>';
  }

  // 悬停提示：格子太小时原生 title 要等一秒，这里自己画一个
  var tipEl = null;

  function ensureTip() {
    if (tipEl && document.body.contains(tipEl)) return tipEl;
    tipEl = document.createElement('div');
    tipEl.className = 'mp-act-tip';
    document.body.appendChild(tipEl);
    return tipEl;
  }

  function moveTip(ev) {
    if (!tipEl || !tipEl.classList.contains('is-on')) return;
    tipEl.style.left = (ev.clientX + 12) + 'px';
    tipEl.style.top = (ev.clientY - 10) + 'px';
  }

  function ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function readCache(key) {
    return new Promise(function (resolve) {
      try {
        chrome.storage.local.get([key], function (o) { resolve(o && o[key]); });
      } catch (e) { resolve(null); }
    });
  }

  function writeCache(key, days, partial) {
    try {
      chrome.storage.local.set({ [key]: { days: days, partial: !!partial, at: Date.now() } });
    } catch (e) {}
  }

  function clearCache(key) {
    try { chrome.storage.local.remove([key]); } catch (e) {}
  }

  // 分段回补：history.html 一次只给 100 条，用 starttime/endtime 按季度往前翻。
  // 间隔 600ms，最多 12 段，连续两段空就停——不会形成高频访问特征。
  function backfill(uid, firstDays, onProgress, done) {
    var earliest = firstDays.slice().sort()[0];
    var all = firstDays.slice();
    var guard = 0;
    var misses = 0;
    var total = 16;

    function step() {
      guard++;
      if (guard > total || misses >= 2 || !earliest) {
        done(all);
        return;
      }
      if (onProgress) onProgress(guard, total, all);

      var end = new Date(earliest + 'T00:00:00+08:00');
      var start = new Date(end.getTime() - 92 * 86400000);
      var s = Math.floor(start.getTime() / 1000);
      var e = Math.floor(end.getTime() / 1000);

      MP.page.fetchDoc('https://www.mcmod.cn/history.html?userid=' + uid + '&starttime=' + s + '&endtime=' + e)
        .then(function (res) {
          if (!res || !res.ok || !res.doc) throw new Error('FETCH_FAILED');
          var got = collectDays(res.doc);
          if (got.length) {
            misses = 0;
            got.forEach(function (d) { if (all.indexOf(d) < 0) all.push(d); });
            var min = got.slice().sort()[0];
            if (min && min < earliest) earliest = min;
          } else {
            misses++;
          }
          setTimeout(step, 600);
        })
        .catch(function () {
          done(all);
        });
    }

    setTimeout(step, 600);
  }

  function ensureActivity() {
    var frame = document.querySelector('.mp-chart-frame');
    if (!frame) return;
    if (!/\/\d+\/?$/.test(location.pathname)) return;

    var uid = (location.pathname.match(/(\d+)/) || [])[1];
    if (!uid) return;

    frame.classList.add('mp-act-origin-titles');

    var obj = frame.querySelector('#center-editchart-obj');
    if (obj) obj.style.display = 'none';

    var host = frame.querySelector('#mp-activity');
    if (!host) {
      host = document.createElement('div');
      host.id = 'mp-activity';
      host.className = 'mp-activity';
      host.innerHTML = '<div class="mp-act-body">载入中…</div>';
      frame.appendChild(host);

      host.addEventListener('mouseover', function (ev) {
        var cell = ev.target && ev.target.closest && ev.target.closest('.mp-act-cell');
        if (!cell) return;
        var tip = ensureTip();
        var bits = (cell.getAttribute('title') || '').split(' · ');
        tip.textContent = bits[0] + (bits[1] ? ' · ' + bits[1] : '');
        tip.classList.add('is-on');
      });

      host.addEventListener('mouseout', function (ev) {
        var cell = ev.target && ev.target.closest && ev.target.closest('.mp-act-cell');
        if (!cell || !tipEl) return;
        tipEl.classList.remove('is-on');
      });

      host.addEventListener('mousemove', moveTip);

      host.addEventListener('click', function (ev) {
        var btn = ev.target && ev.target.closest && ev.target.closest('.mp-act-refresh');
        if (!btn) return;
        ev.preventDefault();
        run(true);
      });
    }

    if (!MP.page || !MP.page.fetchDoc) {
      host.querySelector('.mp-act-body').textContent = '增强视图未就绪';
      return;
    }

    // mark() 会被 MutationObserver 反复调用，这里必须拦住，
    // 否则每调一次 actToken 就 +1，上一轮的请求全部作废，界面永远停在「载入中」
    if (actBusy) return;

    var cacheKey = 'mp:act:' + uid;
    var myToken = ++actToken;

    function run(force) {
      actBusy = true;
      actToken++;
      myToken = actToken;

      function alive() { return myToken === actToken; }

      if (force) clearCache(cacheKey);

      var body = host.querySelector('.mp-act-body');
      body.textContent = '载入中…';

      readCache(cacheKey).then(function (hit) {
        if (!alive()) return null;
        if (hit && hit.days && hit.days.length && !force) {
          paintActivity(host, hit.days, { note: hit.partial ? '' : '全部' });
          return null;
        }
        return MP.page.fetchDoc(activityUrl(uid)).then(function (res) {
          if (!res || !res.ok || !res.doc) throw new Error('FETCH_FAILED');
          var days = collectDays(res.doc);
          if (!alive()) return null;
          paintActivity(host, days, { progress: '0/16' });
          return days;
        });
      }).then(function (first) {
        if (!first || !first.length || !alive()) return;
        backfill(uid, first, function (n, t, acc) {
          if (alive()) paintActivity(host, acc || first, { progress: n + '/' + t });
        }, function (allDays) {
          actBusy = false;
          if (!alive()) return;
          paintActivity(host, allDays, { note: '全部' });
          writeCache(cacheKey, allDays, false);
        });
      }).catch(function () {
        actBusy = false;
        if (myToken === actToken) body.textContent = '活跃度载入失败';
      });
    }

    if (actKey === uid && host.querySelector('.mp-act-grid')) return;
    actKey = uid;
    run(false);
  }

  function ensureGear() {
    var right = document.querySelector('.header-right');
    if (!right) return;
    var btn = document.getElementById('mp-center-gear');
    if (btn && right.contains(btn)) return;
    btn = h('button', {
      id: 'mp-center-gear',
      class: 'mp-gear-btn',
      type: 'button',
      title: '插件设置',
      'aria-label': '插件设置',
      onclick: function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (MP.settingsPanel) MP.settingsPanel.toggle();
      }
    }, gearSvg());
    right.appendChild(btn);
  }

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
        class: 'mp-fab-handle',
        type: 'button',
        title: '视图切换',
        'aria-label': '视图切换',
        onclick: function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (fabEl) fabEl.classList.toggle('is-open');
        }
      }, h('span', { class: 'mp-fab-handle-icon' },
        h('svg', {
          viewBox: '0 0 24 24',
          width: 14,
          height: 14,
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 2.6,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round'
        }, h('path', { d: 'M15 5l-7 7 7 7' })))),
      h('div', { class: 'mp-fab-sheet' },
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
      )
    );
    document.body.appendChild(fabEl);
    // 点抽屉以外的地方收起
    if (!ensureFab._bound) {
      ensureFab._bound = true;
      document.addEventListener('click', function (e) {
        if (fabEl && !fabEl.contains(e.target)) fabEl.classList.remove('is-open');
      });
    }
    syncFab();
    return fabEl;
  }

  /* ---------- 留言板图片全屏预览 ----------
     站点自己的预览是「在卡片内部撑开」，图一大就看不全。
     这里在捕获阶段拦掉，换成铺满视口的灯箱：
     滚轮/按钮缩放、旋转、复位、拖拽平移、多图左右切换。 */
  let onDocClick = null;
  let onEsc = null;
  let lbList = [];
  let lbIdx = 0;
  let lbScale = 1;
  let lbRot = 0;
  let lbX = 0;
  let lbY = 0;
  let lbDrag = null;

  function lbApply() {
    const img = document.querySelector('#mp-lightbox .mp-lightbox-img');
    if (!img) return;
    img.style.transform =
      'translate(' + lbX + 'px,' + lbY + 'px) scale(' + lbScale + ') rotate(' + lbRot + 'deg)';
  }

  function lbReset() {
    lbScale = 1;
    lbRot = 0;
    lbX = 0;
    lbY = 0;
    lbApply();
  }

  function lbShow() {
    const box = document.getElementById('mp-lightbox');
    if (!box) return;
    const img = box.querySelector('.mp-lightbox-img');
    const src = lbList[lbIdx];
    if (img && src) img.setAttribute('src', src);
    const cnt = box.querySelector('.mp-lb-count');
    if (cnt) cnt.textContent = (lbIdx + 1) + ' / ' + lbList.length;
    const nav = box.querySelectorAll('.mp-lb-nav');
    for (let i = 0; i < nav.length; i++) {
      nav[i].classList.toggle('is-hide', lbList.length < 2);
    }
    lbReset();
  }

  function lbStep(d) {
    if (lbList.length < 2) return;
    lbIdx = (lbIdx + d + lbList.length) % lbList.length;
    lbShow();
  }

  function ensureLightbox() {
    let box = document.getElementById('mp-lightbox');
    if (box) return box;
    box = h('div', { id: 'mp-lightbox', class: 'mp-lightbox' },
      h('div', { class: 'mp-lb-tools' },
        h('span', { class: 'mp-lb-count' }),
        h('button', { class: 'mp-lb-btn', type: 'button', 'data-act': 'zoom-out', title: '缩小' }, '−'),
        h('button', { class: 'mp-lb-btn', type: 'button', 'data-act': 'zoom-in', title: '放大' }, '+'),
        h('button', { class: 'mp-lb-btn', type: 'button', 'data-act': 'rotate', title: '旋转 90°' }, '⟳'),
        h('button', { class: 'mp-lb-btn', type: 'button', 'data-act': 'reset', title: '复位' }, '⤢'),
        h('button', { class: 'mp-lb-btn mp-lb-close', type: 'button', 'data-act': 'close', title: '关闭' }, '✕')
      ),
      h('button', { class: 'mp-lb-nav is-prev', type: 'button', 'data-act': 'prev', title: '上一张' }, '‹'),
      h('button', { class: 'mp-lb-nav is-next', type: 'button', 'data-act': 'next', title: '下一张' }, '›'),
      h('img', { class: 'mp-lightbox-img', alt: '' })
    );

    box.addEventListener('click', function (e) {
      const t = e.target;
      const act = t && t.getAttribute ? t.getAttribute('data-act') : null;
      if (act === 'close') { closeLightbox(); return; }
      if (act === 'prev') { lbStep(-1); return; }
      if (act === 'next') { lbStep(1); return; }
      if (act === 'zoom-in') { lbScale = Math.min(6, lbScale + 0.25); lbApply(); return; }
      if (act === 'zoom-out') { lbScale = Math.max(0.2, lbScale - 0.25); lbApply(); return; }
      if (act === 'rotate') { lbRot = (lbRot + 90) % 360; lbApply(); return; }
      if (act === 'reset') { lbReset(); return; }
      if (t === box) closeLightbox();
    });

    box.addEventListener('wheel', function (e) {
      if (!box.classList.contains('is-open')) return;
      e.preventDefault();
      lbScale = Math.max(0.2, Math.min(6, lbScale + (e.deltaY < 0 ? 0.12 : -0.12)));
      lbApply();
    }, { passive: false });

    box.addEventListener('mousedown', function (e) {
      const img = box.querySelector('.mp-lightbox-img');
      if (e.target !== img) return;
      lbDrag = { x: e.clientX - lbX, y: e.clientY - lbY };
      box.classList.add('is-drag');
    });
    box.addEventListener('mousemove', function (e) {
      if (!lbDrag) return;
      lbX = e.clientX - lbDrag.x;
      lbY = e.clientY - lbDrag.y;
      lbApply();
    });
    const endDrag = function () {
      lbDrag = null;
      box.classList.remove('is-drag');
    };
    box.addEventListener('mouseup', endDrag);
    box.addEventListener('mouseleave', endDrag);

    document.body.appendChild(box);
    return box;
  }

  function openLightbox(src, list) {
    const box = ensureLightbox();
    lbList = (list && list.length) ? list.slice() : [src];
    const at = lbList.indexOf(src);
    lbIdx = at >= 0 ? at : 0;
    lbShow();
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
      const block = t.closest('.common-comment-block');
      const imgs = block ? block.querySelectorAll('img') : [];
      const list = [];
      for (let i = 0; i < imgs.length; i++) {
        const s = imgs[i].getAttribute('data-original') || imgs[i].getAttribute('src');
        if (s) list.push(s);
      }
      openLightbox(src, list);
    };
    document.addEventListener('click', onDocClick, true);

    if (onEsc) document.removeEventListener('keydown', onEsc);
    onEsc = function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) closeLightbox();
      else if (e.key === 'ArrowLeft') lbStep(-1);
      else if (e.key === 'ArrowRight') lbStep(1);
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
    ensureGear();
    ensureDayNight();
    try { ensureActivity(); } catch (e) {}
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
    // 恢复原站活跃度图表：我们把它 display:none 了，切回原始视图必须还原，
    // 否则站点自己的 ECharts 永远不出现，只剩一片空白。
    const chartObj = document.getElementById('center-editchart-obj');
    if (chartObj) chartObj.style.display = '';
    const actHost = document.getElementById('mp-activity');
    if (actHost && actHost.parentNode) actHost.parentNode.removeChild(actHost);
    const actTip = document.querySelector('.mp-act-tip');
    if (actTip && actTip.parentNode) actTip.parentNode.removeChild(actTip);
    tipEl = null;
    const chartFrames = document.querySelectorAll('.edit-chart-frame');
    for (let ci = 0; ci < chartFrames.length; ci++) chartFrames[ci].classList.remove('mp-act-origin-titles');
    actKey = '';
    actBusy = false;
    actToken++;

    unbindLightbox();
    const sw = document.getElementById('mp-daynight');
    if (sw && sw.parentNode) sw.parentNode.removeChild(sw);
    syncFab();
    return true;
  }

  return { match, mount, unmount, mark, isActive: function () { return mounted; } };
})();


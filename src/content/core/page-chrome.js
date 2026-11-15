/**
 * 页面外壳：重绘页面共用的「样式注入 + 背景 + 齿轮 + 日夜开关」。
 *
 * 抽自 search.js 的 paintSkin()。之前每个页面各抄一份，改一次样式要改 N 处；
 * 现在页面只负责自己的内容，基础设施一行 attach() 搞定。
 *
 *   const chrome = MP.pageChrome.attach({
 *     mode: 'mp-item-mode',
 *     css: ['styles/pages/item.css'],
 *     settings: settings,
 *   });
 *   // 卸载时
 *   chrome.restore();
 */
(function () {
  'use strict';
  var MP = window.MP;

  // 这三个是所有重绘页面都要的：
  //   background.css  —— 背景层（canvas / 渐变）
  //   day-night.css   —— 日夜开关本体，缺了它滑块退化成裸 button
  //   mp-toggle.css   —— 设置面板里的胶囊开关
  var BASE_CSS = [
    'styles/background.css',
    'styles/day-night.css',
    'styles/mp-toggle.css'
  ];

  /** 顶栏右侧工具区：搜索页 / 个人主页 / wiki 页结构不同，逐个退。 */
  function headerRight() {
    return document.querySelector('.header-container .header-right') ||
      document.querySelector('.top-main .info') ||
      document.querySelector('.header-right');
  }

  function isDarkNow() {
    var v = document.documentElement.dataset.mpTheme;
    if (v === 'dark') return true;
    if (v === 'light') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  /** Lucide settings 的齿轮路径，和首页 / 个人主页用的是同一份。 */
  function gearSvg() {
    return MP.dom.h('svg', {
      viewBox: '0 0 24 24', width: 16, height: 16, fill: 'none',
      stroke: 'currentColor', 'stroke-width': 1.8,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true'
    },
      MP.dom.h('path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }),
      MP.dom.h('circle', { cx: 12, cy: 12, r: 3 })
    );
  }

  function ensureGear() {
    var right = headerRight();
    if (!right || document.getElementById('mp-page-gear')) return;
    var btn = MP.dom.h('button', {
      class: 'mp-gear-btn',
      type: 'button',
      title: '插件设置',
      'aria-label': '插件设置',
      id: 'mp-page-gear',
      onclick: function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (MP.settingsPanel) MP.settingsPanel.toggle();
      }
    }, gearSvg());
    right.appendChild(btn);
  }

  function ensureDayNight() {
    var right = headerRight();
    if (!right || document.getElementById('mp-daynight')) return;
    if (!MP.ui || typeof MP.ui.dayNight !== 'function') return;
    var el = MP.ui.dayNight({
      dark: isDarkNow(),
      class: 'mp-topbar-daynight',
      onChange: function (next) {
        MP.theme.apply({ theme: next ? 'dark' : 'light' });
        MP.store.setSync({ theme: next ? 'dark' : 'light' }).catch(function () {});
      }
    });
    el.id = 'mp-daynight';
    right.appendChild(el);
  }

  function chevronSvg() {
    return MP.dom.h('svg', {
      viewBox: '0 0 24 24', width: 14, height: 14, fill: 'none',
      stroke: 'currentColor', 'stroke-width': 2.2,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true'
    }, MP.dom.h('path', { d: 'M15 6l-6 6 6 6' }));
  }

  /**
   * 右侧贴边抽屉：一个半圆把手 + 展开后的「增强 / 原始 / 设置」。
   * 它不随页面 mount/unmount 销毁 —— 点「原始」时页面没了，抽屉还得留在那儿让人切回来。
   *
   * @param {{id:string, onEnhance:function, onOriginal:function, isEnhanced:function, onSettings?:function}} opts
   */
  function makeFab(opts) {
    var id = opts.id || 'mp-page-fab';
    var el = document.getElementById(id);

    function sync() {
      if (!el) return;
      var on = !!(opts.isEnhanced && opts.isEnhanced());
      Array.prototype.forEach.call(el.querySelectorAll('.mp-fab[data-act]'), function (b) {
        var isEnhance = b.getAttribute('data-act') === 'enhance';
        b.classList.toggle('is-on', isEnhance === on);
      });
    }

    if (!el) {
      el = MP.dom.h('div', { id: id, class: 'mp-fab-bar' },
        MP.dom.h('button', {
          class: 'mp-fab-handle',
          type: 'button',
          title: '增强视图',
          'aria-label': '增强视图',
          onclick: function (e) {
            e.preventDefault();
            e.stopPropagation();
            el.classList.toggle('is-open');
          }
        }, chevronSvg()),
        MP.dom.h('div', { class: 'mp-fab-sheet' },
          MP.dom.h('button', {
            class: 'mp-fab', type: 'button', 'data-act': 'enhance',
            onclick: function () {
              el.classList.remove('is-open');
              try { opts.onEnhance && opts.onEnhance(); } catch (e) { console.warn('[MCMod+] 增强视图切换失败', e); }
              sync();
            }
          }, '增强'),
          MP.dom.h('button', {
            class: 'mp-fab', type: 'button', 'data-act': 'original',
            onclick: function () {
              el.classList.remove('is-open');
              try { opts.onOriginal && opts.onOriginal(); } catch (e) { console.warn('[MCMod+] 原始视图切换失败', e); }
              sync();
            }
          }, '原始'),
          MP.dom.h('button', {
            class: 'mp-fab mp-fab-icon', type: 'button', title: '插件设置', 'aria-label': '插件设置',
            onclick: function (e) {
              e.preventDefault();
              e.stopPropagation();
              el.classList.remove('is-open');
              if (opts.onSettings) opts.onSettings();
              else if (MP.settingsPanel) MP.settingsPanel.toggle();
            }
          }, gearSvg())
        )
      );
      document.body.appendChild(el);

      if (!el._mpOutsideBound) {
        el._mpOutsideBound = true;
        document.addEventListener('click', function (e) {
          if (!el.classList.contains('is-open')) return;
          if (el.contains(e.target)) return;
          el.classList.remove('is-open');
        }, true);
      }
    }

    sync();
    return { sync: sync, el: el };
  }

  MP.pageChrome = {
    /**
     * @param {{mode?:string, css?:string[], settings?:object, gear?:boolean, daynight?:boolean, background?:boolean}} opts
     * @returns {{restore:function}}
     */
    attach: function (opts) {
      opts = opts || {};
      var settings = opts.settings || {};
      var injected = [];

      (opts.css || []).concat(BASE_CSS).forEach(function (href) {
        try { MP.theme.inject(href); injected.push(href); } catch (e) {
          console.warn('[MCMod+] 样式注入失败', href, e);
        }
      });

      if (opts.mode) document.body.classList.add(opts.mode);

      if (opts.background !== false) {
        try {
          MP.background.setIntensity(settings.bgIntensity || 45);
          MP.background.apply(settings.bgPreset || 'mist');
        } catch (e) {
          console.warn('[MCMod+] 背景注入失败', e);
        }
      }

      if (opts.gear !== false) {
        try { ensureGear(); } catch (e) { console.warn('[MCMod+] 齿轮注入失败', e); }
      }

      if (opts.daynight !== false) {
        try { ensureDayNight(); } catch (e) { console.warn('[MCMod+] 日夜开关注入失败', e); }
      }

      return {
        restore: function () {
          if (opts.mode) document.body.classList.remove(opts.mode);
          // 齿轮和日夜开关只在「页面完全没有其他增强视图」时才移除，
          // 否则从 A 页跳到 B 页会把 B 页刚插的按钮拆掉。
          var gear = document.getElementById('mp-page-gear');
          if (gear && !document.querySelector('[class*="mp-"][id$="-host"]')) gear.remove();
          var dn = document.getElementById('mp-daynight');
          if (dn && !document.querySelector('[class*="mp-"][id$="-host"]')) dn.remove();
          injected.forEach(function (href) {
            var link = document.querySelector('link[data-mp-css="' + href + '"]');
            if (link) link.remove();
          });
        }
      };
    },

    isDarkNow: isDarkNow,
    headerRight: headerRight,
    fab: makeFab,
    gearSvg: gearSvg
  };
})();

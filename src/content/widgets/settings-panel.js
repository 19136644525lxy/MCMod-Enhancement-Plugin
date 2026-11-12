/**
 * 首页顶栏的快速设置面板。
 *
 * 点齿轮弹出，所有改动立刻写 chrome.storage.sync。
 * 能就地生效的（主题、紧凑、增强视图）当场生效，
 * 需要重绘页面的项写完后提示「下次打开生效」，不强制刷新——刷新会重新请求站点，
 * 之前就是这么被 WAF 盯上的。
 */
window.MP = window.MP || {};

MP.settingsPanel = (function () {
  'use strict';

  var h = MP.dom.h;
  var panel = null;

  function save(patch) {
    try {
      var p = MP.store.setSync(patch);
      if (p && p.catch) p.catch(function () {});
    } catch (e) {
      /* 存不进去也不影响当前页面 */
    }
  }

  function row(label, desc, control) {
    return h('div', { class: 'mp-sp-row' },
      h('div', { class: 'mp-sp-txt' },
        h('span', { class: 'mp-sp-label' }, label),
        desc ? h('span', { class: 'mp-sp-desc' }, desc) : null),
      control);
  }

  function sw(checked, onChange) {
    var input = h('input', { type: 'checkbox', class: 'mp-toggle mp-toggle-sm' });
    input.checked = !!checked;
    input.addEventListener('change', function () { onChange(input.checked); });
    return h('label', { class: 'mp-sp-switch' }, input);
  }

  function group(title, rows) {
    return h('div', { class: 'mp-sp-group' },
      h('div', { class: 'mp-sp-group-title' }, title),
      rows.filter(Boolean));
  }

  function build(s) {
    var box = h('div', {
      class: 'mp-sp',
      id: 'mp-settings',
      role: 'dialog',
      'aria-label': '插件设置'
    });

    box.appendChild(h('div', { class: 'mp-sp-head' },
      h('span', { class: 'mp-sp-title' }, '插件设置'),
      h('button', {
        class: 'mp-sp-x',
        type: 'button',
        'aria-label': '关闭',
        onclick: function (e) { e.stopPropagation(); close(); }
      }, '×')
    ));

    var body = h('div', { class: 'mp-sp-body' });

    body.appendChild(group('外观', [
      row('紧凑模式', '收紧卡片间距', sw(s.compact, function (v) {
        save({ compact: v });
        try { MP.theme.apply(Object.assign({}, s, { compact: v })); } catch (e) { /* ignore */ }
      }))
    ]));

    body.appendChild(group('功能', [
      row('命令面板', 'Ctrl / ⌘ + K 唤起', sw(s.palette, function (v) {
        save({ palette: v });
      })),
      row('随便看看轮换', '每 8 秒在三个分组间轮换', sw(s.homeRotate, function (v) {
        save({ homeRotate: v });
        try {
          if (MP.pages && MP.pages.home && MP.pages.home.setRotate) MP.pages.home.setRotate(v);
        } catch (e) { /* ignore */ }
      })),
      row('我的足迹', '首页展示最近 100 条编辑', sw(s.footprint, function (v) {
        save({ footprint: v });
      }))
    ]));

    body.appendChild(group('高级', [
      row('搜索页重绘', '重写搜索结果列表', sw(s.redrawSearch, function (v) {
        save({ redrawSearch: v });
      })),
      row('结构重绘（实验）', '物品 / 模组 / 整合包 / 分类页', sw(s.redrawPages, function (v) {
        save({ redrawPages: v });
      }))
    ]));

    box.appendChild(body);

    box.appendChild(h('div', { class: 'mp-sp-foot' },
      h('span', { class: 'mp-sp-hint' }, '需要重绘的项下次打开生效'),
      h('a', {
        class: 'mp-sp-link',
        href: optionsUrl(),
        target: '_blank',
        rel: 'noopener'
      }, '完整设置')
    ));

    // 面板内点击不要冒泡到 document，否则会被「点外面关闭」的逻辑立刻关掉
    box.addEventListener('click', function (e) { e.stopPropagation(); });

    return box;
  }

  function optionsUrl() {
    try {
      if (window.chrome && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL('options/options.html');
      }
    } catch (e) { /* ignore */ }
    return '#';
  }

  function close() {
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
    document.removeEventListener('click', onDocClick, true);
    document.removeEventListener('keydown', onKey, true);
  }

  function onDocClick() {
    close();
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  function open() {
    close();
    try {
      MP.theme.inject('styles/mp-toggle.css');
      MP.theme.inject('styles/day-night.css');
      MP.theme.inject('styles/settings-panel.css');
    } catch (e) {
      /* 样式注入失败不阻塞面板 */
    }
    MP.store.getSync().then(function (s) {
      panel = build(s || MP.store.DEFAULTS || {});
      document.body.appendChild(panel);
      // 延后一帧再挂「点外面关闭」，否则触发这次点击的按钮会立刻把它关掉
      setTimeout(function () {
        document.addEventListener('click', onDocClick, true);
      }, 0);
      document.addEventListener('keydown', onKey, true);
    });
  }

  return {
    open: open,
    close: close,
    isOpen: function () { return !!panel; },
    toggle: function () {
      if (panel) close();
      else open();
    }
  };
})();

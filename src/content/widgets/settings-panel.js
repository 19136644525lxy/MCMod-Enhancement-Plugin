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

  // 控件需要在标题下方占满一整行的场景（比如背景预设的胶囊组）
  function rowBlock(label, desc, control) {
    return h('div', { class: 'mp-sp-row is-block' },
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

  // 单选胶囊：用于背景预设这种「多选一」的项
  function chips(options, value, onChange) {
    var wrap = h('div', { class: 'mp-sp-chips' });
    options.forEach(function (o) {
      var b = h('button', {
        type: 'button',
        class: 'mp-sp-chip' + (o.key === value ? ' is-on' : ''),
        'data-key': o.key,
        title: o.label
      }, o.label);
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var all = wrap.querySelectorAll('.mp-sp-chip');
        for (var i = 0; i < all.length; i++) all[i].classList.toggle('is-on', all[i] === b);
        onChange(o.key);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function buildBgExtra(s) {
    var thumb = h('div', { class: 'mp-sp-bg-thumb' });
    var file = h('input', { type: 'file', accept: 'image/*', class: 'mp-sp-file' });
    var range = h('input', {
      type: 'range', min: '0', max: '100', step: '5', class: 'mp-sp-range',
      'aria-label': '背景遮罩强度'
    });
    range.value = s.bgIntensity == null ? 45 : s.bgIntensity;

    function paintThumb() {
      if (!MP.background) return;
      MP.background.preview().then(function (src) {
        thumb.style.backgroundImage = src ? 'url("' + src + '")' : '';
        thumb.classList.toggle('is-empty', !src);
      }).catch(function () {});
    }
    paintThumb();

    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      if (!MP.background) return;
      MP.background.saveImage(f).then(function () {
        save({ bgPreset: 'custom' });
        MP.background.apply('custom');
        paintThumb();
      }).catch(function (e) {
        console.warn('[MCMod+] 背景图保存失败', e);
      });
      file.value = '';
    });

    range.addEventListener('input', function () {
      var v = Number(range.value);
      if (MP.background) MP.background.setIntensity(v);
      save({ bgIntensity: v });
    });

    var clear = h('button', {
      type: 'button', class: 'mp-sp-mini', onclick: function (e) {
        e.stopPropagation();
        if (!MP.background) return;
        MP.background.removeImage().then(function () {
          save({ bgPreset: 'mist' });
          MP.background.apply('mist');
          paintThumb();
          range.value = 45;
          MP.background.setIntensity(45);
        });
      }
    }, '移除');

    return h('div', { class: 'mp-sp-bg-extra' + (s.bgPreset === 'custom' ? '' : ' is-hide') },
      h('div', { class: 'mp-sp-bg-row' },
        thumb,
        h('label', { class: 'mp-sp-upload' },
          h('span', null, '选择图片'),
          file)
      ),
      h('div', { class: 'mp-sp-bg-row' },
        h('span', { class: 'mp-sp-mini-label' }, '遮罩'),
        range,
        h('span', { class: 'mp-sp-mini-val' }, String(range.value) + '%'),
        clear
      )
    );
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
      })),
      rowBlock('背景', '首页底图，预设全部本地生成，也可用自己的图', h('div', { class: 'mp-sp-bg-wrap' },
        chips([
          { key: 'mist', label: '晨雾' },
          { key: 'aurora', label: '极光' },
          { key: 'pixel', label: '像素夜空' },
          { key: 'grass', label: '草方块' },
          { key: 'stars', label: '星空' },
          { key: 'custom', label: '自定义' }
        ], s.bgPreset || 'mist', function (k) {
          save({ bgPreset: k });
          try {
            if (MP.background) MP.background.apply(k);
          } catch (e) { /* ignore */ }
          var extra = document.querySelector('.mp-sp-bg-extra');
          if (extra) extra.classList.toggle('is-hide', k !== 'custom');
        }),
        buildBgExtra(s)
      ))
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

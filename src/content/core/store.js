/**
 * 设置存储：chrome.storage.sync（跨设备） + local（大体积数据）
 */
window.MP = window.MP || {};

MP.store = (function () {
  const DEFAULTS = {
    enabled: true,
    theme: 'auto',      // auto | light | dark
    compact: false,
    palette: true,      // Cmd+K 命令面板
    homeRotate: true,   // 首页「随便看看」自动轮换
    footprint: true,    // 首页「我的足迹」卡片
    redrawSearch: true, // 搜索页重绘
    redrawPages: false, // 结构重绘（物品/模组/整合包/分类）——实验性，默认关闭
    bgPreset: 'mist',   // 首页背景：mist | aurora | pixel | grass | stars | custom
    bgIntensity: 45,    // 自定义背景的遮罩强度 0-100
    debug: false
  };

  function getSync(keys) {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get(keys || DEFAULTS, (v) => resolve(Object.assign({}, DEFAULTS, v || {})));
      } catch (e) {
        resolve(Object.assign({}, DEFAULTS));
      }
    });
  }

  function setSync(obj) {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.set(obj, () => resolve(true));
      } catch (e) {
        resolve(false);
      }
    });
  }

  function getLocal(key, fallback) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get({ [key]: fallback }, (v) => resolve(v[key]));
      } catch (e) {
        resolve(fallback);
      }
    });
  }

  function setLocal(key, value) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({ [key]: value }, () => resolve(true));
      } catch (e) {
        resolve(false);
      }
    });
  }

  function onChange(cb) {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync') return;
        const next = {};
        for (const [k, v] of Object.entries(changes)) next[k] = v.newValue;
        cb(next);
      });
    } catch (e) { /* 忽略 */ }
  }

  return { DEFAULTS, getSync, setSync, getLocal, setLocal, onChange };
})();

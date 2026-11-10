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
    redrawSearch: true, // 搜索页重绘
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

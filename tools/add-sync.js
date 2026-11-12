const fs = require('fs');
const p = 'src/content/router.js';
let s = fs.readFileSync(p, 'utf8');

if (!s.includes('MP.store.onChange')) {
  const anchor = '  function boot() {\n    MP.store.getSync().then((s) => {';
  if (!s.includes(anchor)) {
    console.error('anchor missing');
    process.exit(1);
  }
  const sub = `  // 跨页/跨标签页同步：主题、紧凑、背景这些设置存在 chrome.storage.sync，
  // 任一页面改动后其它已经打开的页面要立刻跟着变，而不是等下次刷新。
  function subscribeSettings() {
    try {
      MP.store.onChange(function (changes) {
        var keys = ['theme', 'compact', 'bgPreset', 'bgIntensity'];
        var hit = keys.some(function (k) { return Object.prototype.hasOwnProperty.call(changes, k); });
        if (!hit) return;
        MP.store.getSync().then(function (next) {
          settings = next;
          try { MP.theme.apply(next); } catch (e) { /* ignore */ }
          if (MP.background && (changes.bgPreset || changes.bgIntensity)) {
            try {
              if (next.bgIntensity != null) MP.background.setIntensity(next.bgIntensity);
              MP.background.apply(next.bgPreset || 'mist');
            } catch (e) { /* ignore */ }
          }
        }).catch(function () { /* ignore */ });
      });
    } catch (e) { /* ignore */ }
  }

`;
  s = s.replace(anchor, sub + anchor);
  // 在 boot 里、getSync 之前订阅
  s = s.replace('  function boot() {\n    MP.store.getSync()', '  function boot() {\n    subscribeSettings();\n    MP.store.getSync()');
  fs.writeFileSync(p, s, 'utf8');
}

console.log('subscribe inserted:', s.includes('function subscribeSettings'), 'called:', s.includes('    subscribeSettings();'));

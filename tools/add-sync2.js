const fs = require('fs');
const p = 'src/content/router.js';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('function subscribeSettings')) {
  console.log('already there');
  process.exit(0);
}

const helper = `  // 跨页/跨标签页同步：主题、紧凑、背景这些设置在 chrome.storage.sync 里，
  // 任一页面改动后，其它已打开的页面要立刻跟着变，而不是等下次刷新。
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

const bootIdx = s.indexOf('  function boot()');
if (bootIdx === -1) {
  console.error('boot not found');
  process.exit(1);
}
// 在 boot 函数前插入 helper
s = s.slice(0, bootIdx) + helper + s.slice(bootIdx);

// 在 boot 的 getSync 之前调用
const callIdx = s.indexOf('MP.store.getSync()', bootIdx + helper.length);
if (callIdx === -1) {
  console.error('getSync not found');
  process.exit(1);
}
s = s.slice(0, callIdx) + 'subscribeSettings();\r\n    ' + s.slice(callIdx);

fs.writeFileSync(p, s, 'utf8');
console.log('inserted:', s.includes('function subscribeSettings'), 'called:', s.includes('subscribeSettings();'));

const fs = require('fs');
const p = 'src/content/router.js';
let s = fs.readFileSync(p, 'utf8');

// 1) 同步设置后，把页面上的日夜开关 UI 也刷一遍
const marker = "          try { MP.theme.apply(next); } catch (e) { /* ignore */ }";
if (s.includes(marker) && !s.includes('paintSwitch')) {
  const paint = `          try { MP.theme.apply(next); } catch (e) { /* ignore */ }
          try { syncThemeSwitches(next); } catch (e) { /* ignore */ }`;
  s = s.replace(marker, paint);
}

// 2) helper：找到页面上的日夜开关，重画滑块
if (!s.includes('function syncThemeSwitches')) {
  const helper = `  function prefersDark() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (e) { return false; }
  }

  function syncThemeSwitches(settings) {
    if (!MP.ui || !MP.ui.paintSwitch) return;
    var theme = (settings && settings.theme) || 'auto';
    var dark = theme === 'dark' || (theme === 'auto' && prefersDark());
    var nodes = document.querySelectorAll('.mp-theme-switch, .mp-topbar-daynight, #mp-daynight');
    for (var i = 0; i < nodes.length; i++) {
      try { MP.ui.paintSwitch(nodes[i], dark); } catch (e) { /* ignore */ }
    }
  }

`;
  const bootIdx = s.indexOf('  function boot()');
  s = s.slice(0, bootIdx) + helper + s.slice(bootIdx);
}

// 3) 窗口重新获得焦点时兜底读一次设置（防止 onChanged 因浏览器节流漏掉）
if (!s.includes("addEventListener('focus'")) {
  const bootIdx = s.indexOf('  function boot()');
  const hook = `  function syncOnFocus() {
    try {
      window.addEventListener('focus', function () {
        MP.store.getSync().then(function (next) {
          settings = next;
          try { MP.theme.apply(next); } catch (e) { /* ignore */ }
          try { syncThemeSwitches(next); } catch (e) { /* ignore */ }
        }).catch(function () { /* ignore */ });
      });
    } catch (e) { /* ignore */ }
  }

`;
  s = s.slice(0, bootIdx) + hook + s.slice(bootIdx);
  s = s.replace('  function boot() {\r\n    subscribeSettings();', '  function boot() {\r\n    subscribeSettings();\r\n    syncOnFocus();');
  if (!s.includes('syncOnFocus();')) {
    s = s.replace('  function boot() {\n    subscribeSettings();', '  function boot() {\n    subscribeSettings();\n    syncOnFocus();');
  }
}

fs.writeFileSync(p, s, 'utf8');
console.log('paintSwitch:', s.includes('syncThemeSwitches(next)'));
console.log('focus hook:', s.includes('syncOnFocus();'));

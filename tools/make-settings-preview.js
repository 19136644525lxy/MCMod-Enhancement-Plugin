/**
 * 生成设置面板的离线预览：浅色 / 深色并排，方便肉眼检查对比度。
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://www.mcmod.cn/',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
});
const w = dom.window;

const DEFAULTS = {
  enabled: true, theme: 'auto', compact: false, palette: true,
  homeRotate: true, footprint: true, redrawSearch: true, redrawPages: false, debug: false
};

w.MP = {};
w.MP.theme = { inject() {}, apply() {} };
w.MP.store = {
  DEFAULTS,
  getSync: () => Promise.resolve(Object.assign({}, DEFAULTS)),
  setSync: () => Promise.resolve(true)
};
w.MP.pages = { home: { unmount() {}, mount() {}, setRotate() {} } };
w.chrome = {
  runtime: { getURL: (p) => 'chrome-extension://test/' + p },
  storage: { sync: { get(d, cb) { cb(Object.assign({}, DEFAULTS)); }, set(o, cb) { cb && cb(); } } }
};

['src/content/core/dom.js', 'src/content/render/components.js', 'src/content/widgets/settings-panel.js']
  .forEach((f) => w.eval(read(f)));

w.MP.settingsPanel.open();

setTimeout(() => {
  const panel = w.document.getElementById('mp-settings');
  if (!panel) {
    console.error('panel not built');
    process.exit(1);
  }

  const clones = (cls) => {
    const c = panel.cloneNode(true);
    c.removeAttribute('id');
    c.classList.add('mp-sp-static');
    c.classList.add(cls);
    return c.outerHTML;
  };

  const css = [
    read('styles/mp-toggle.css'),
    read('styles/day-night.css'),
    read('styles/settings-panel.css'),
  ].join('\n');

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>设置面板预览</title>
<style>
  body { margin: 0; padding: 32px; background: #f3f1ec; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
  .wrap { display: flex; gap: 32px; align-items: flex-start; justify-content: center; flex-wrap: wrap; }
  .col { display: flex; flex-direction: column; gap: 10px; }
  .col-h { font-size: 12px; color: #6f6a62; letter-spacing: .06em; }
  .sheet { padding: 26px; border-radius: 20px; background: #f3f1ec; }
  .sheet.dark { background: #14130f; }
  .sheet.dark .col-h { color: #9b958c; }
  .mp-sp-static { position: static; animation: none; }
  /* 预览页没有 html[data-mp-theme]，直接给深色列套上同一组变量 */
  .sheet.dark .mp-sp-static {
    --sp-bg: #1c1a17;
    --sp-ink: #ece9e3;
    --sp-sub: #9b958c;
    --sp-line: rgba(255,255,255,.1);
    --sp-hover: rgba(255,255,255,.055);
    --sp-link: #57b98a;
    box-shadow: 0 24px 60px rgba(0,0,0,.55);
  }
  .sheet.dark .mp-toggle {
    background: rgba(255,255,255,.14);
    border-color: rgba(255,255,255,.16);
  }
${css}
</style>
</head>
<body>
<div class="wrap">
  <div class="col">
    <div class="col-h">浅色主题</div>
    <div class="sheet">${clones('is-light')}</div>
  </div>
  <div class="col">
    <div class="col-h">深色主题</div>
    <div class="sheet dark"><div class="force-dark">${clones('is-dark')}</div></div>
  </div>
</div>
</body>
</html>`;

  fs.writeFileSync(path.join(ROOT, 'output/preview-settings.html'), html, 'utf8');
  console.log('written output/preview-settings.html', html.length, 'B');
  w.close();
}, 40);

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const SAMPLE = 'output/search-sample.html';
const OUT = 'output/preview-search.html';

const html = read(SAMPLE);
const dom = new JSDOM(html, { url: 'https://search.mcmod.cn/s?key=minihud', runScripts: 'outside-only' });
const w = dom.window;
const d = w.document;

// 站点脚本会把我们的渲染冲掉，先清掉
d.querySelectorAll('script').forEach((s) => s.remove());

w.chrome = {
  runtime: { getURL: (p) => 'chrome-extension://test/' + p, sendMessage: () => {} },
  storage: {
    sync: { get: (k, cb) => cb({}), set: (o, cb) => cb && cb() },
    local: { get: (k, cb) => cb({}), set: (o, cb) => cb && cb() },
  },
};

w.MP = {
  theme: { inject() {}, apply() {} },
  store: { setSync: () => Promise.resolve(true) },
  background: { apply() {}, setIntensity() {} },
  ui: {
    dayNight: () => d.createElement('span'),
    empty(t) {
      const e = d.createElement('div');
      e.className = 'mp-empty';
      e.textContent = t;
      return e;
    },
  },
};

w.eval(read('src/content/core/dom.js'));
w.eval(read('src/content/extract/search.js'));
w.eval(read('src/content/render/pages/search.js'));
w.MP.pages.search.mount({ enabled: true, redrawSearch: true, bgPreset: 'mist', bgIntensity: 45 });

const siteCss = [
  'https://www.mcmod.cn/static/public/css/top.frame.css',
  'https://www.mcmod.cn/static/public/css/all_text.frame.css',
  'https://www.mcmod.cn/static/public/css/header.frame.css',
  'https://www.mcmod.cn/static/public/css/nprogress.css',
  'https://www.mcmod.cn/static/public/css/sweetalert.css',
  'https://www.mcmod.cn/static/public/css/main.css',
  'https://www.mcmod.cn/static/public/css/pages.css',
];
const linkCss = siteCss.map((u) => '<link rel="stylesheet" href="' + u + '">').join('\n');

const pluginCss = ['styles/tokens.css', 'styles/base.css', 'styles/mp-toggle.css', 'styles/day-night.css', 'styles/background.css', 'styles/pages/search.css']
  .filter((p) => fs.existsSync(path.join(ROOT, p)))
  .map((p) => '<style data-mp="' + p + '">' + read(p) + '</style>')
  .join('\n');

// 页面背景：预览里直接画一个静态渐变，代替 canvas
const previewBg =
  '<style>body.mp-search-mode{background-image:' +
  'radial-gradient(900px 520px at 12% -10%, rgba(120,190,150,.20), transparent 60%),' +
  'radial-gradient(760px 460px at 92% 0%, rgba(120,160,220,.16), transparent 60%),' +
  'radial-gradient(700px 420px at 50% 108%, rgba(220,190,140,.14), transparent 60%);}</style>';

d.body.classList.add('mp-search-mode');

const out =
  '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">' +
  '<title>搜索页预览</title>' + linkCss + pluginCss + previewBg + '</head>' +
  '<body class="' + d.body.className + '">' + d.body.innerHTML +
  '<div style="position:fixed;left:12px;bottom:10px;font:12px/1.6 system-ui;color:#857f75;background:rgba(255,255,255,.82);padding:4px 10px;border-radius:8px;z-index:99999">离线预览 · 仅样式</div>' +
  '</body></html>';

fs.writeFileSync(path.join(ROOT, OUT), out, 'utf8');
console.log('written ' + path.join(ROOT, OUT) + ' (' + out.length + ' B)');

/**
 * 把 boot-splash.js 的样式与 DOM 抽出来，生成一个可直接双击的独立预览页。
 * 运行：$env:NODE_PATH="$env:TEMP\mp-test\node_modules"; node tools/make-splash-preview.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'src/content/boot-splash.js'), 'utf8');

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  url: 'https://www.mcmod.cn/', runScripts: 'outside-only', pretendToBeVisual: true,
});
dom.window.chrome = {
  storage: { sync: { get: (defaults, cb) => cb({ enabled: true }) } },
  runtime: { getURL: (p) => 'chrome-extension://test/' + p },
};
dom.window.eval(SRC);

const doc = dom.window.document;
const styleEl = doc.getElementById('mp-splash-style');
const hostEl = doc.getElementById('mp-splash');
if (!styleEl || !hostEl) {
  console.error('未找到 splash 节点');
  process.exit(1);
}

const fix = (s) => s.replace(/chrome-extension:\/\/test\//g, '../');
const css = fix(styleEl.textContent);
const node = fix(hostEl.outerHTML);

const page = [
  '<!DOCTYPE html>',
  '<html lang="zh-CN">',
  '<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>启动过渡层预览 · MC百科增强</title>',
  '<style>',
  'html,body{height:100%;margin:0;background:#d9d6cf;font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif}',
  '.mp-preview-note{position:fixed;left:16px;bottom:16px;z-index:1;font-size:12px;color:#6b665d}',
  '.mp-preview-replay{position:fixed;right:16px;bottom:16px;z-index:2147483001;padding:9px 16px;border:0;border-radius:999px;',
  'background:#1d1b18;color:#fff;font-size:13px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.18)}',
  '.mp-preview-replay:hover{background:#2f6f4f}',
  '</style>',
  '<style>' + css + '</style>',
  '</head>',
  '<body>',
  node,
  '<div class="mp-preview-note">这是启动过渡层的静态预览（同一份 CSS 与 DOM）</div>',
  '<button class="mp-preview-replay" id="mp-replay">重播动画</button>',
  '<script>',
  'var host = document.getElementById("mp-splash");',
  'var original = host.outerHTML;',
  'document.getElementById("mp-replay").addEventListener("click", function () {',
  '  var old = document.getElementById("mp-splash");',
  '  if (old) old.parentNode.removeChild(old);',
  '  document.body.insertAdjacentHTML("afterbegin", original);',
  '});',
  '</script>',
  '</body>',
  '</html>',
].join('\n');

const out = path.join(ROOT, 'output', 'preview-splash.html');
fs.writeFileSync(out, page, 'utf8');
console.log('written ' + out + ' (' + fs.statSync(out).size + ' B)');

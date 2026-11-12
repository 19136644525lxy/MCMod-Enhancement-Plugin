/**
 * 生成个人中心离线预览：外壳 + AJAX 片段 + 站点 CSS + 我们的增强样式。
 * 运行：node tools/make-center-preview.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let shell = read('output/center-shell.html');

// 1) 把已下载的站点 CSS 内联成 <style>，避免离线打开时一片白
const inlined = [
  ['center.frame.css', 'output/site-css/center.frame.css'],
  ['header.frame.css', 'output/site-css/header.frame.css'],
  ['style.css', 'output/site-css/style.css']
];
inlined.forEach(([name, p]) => {
  if (!fs.existsSync(path.join(ROOT, p))) return;
  const css = read(p);
  const re = new RegExp('<link[^>]*href="[^"]*' + name.replace(/\./g, '\\.') + '[^"]*"[^>]*>', 'g');
  shell = shell.replace(re, '<style data-site="' + name + '">\n' + css + '\n</style>');
});

// 2) 剩下的协议相对地址补上 https:（属性 + 行内 style 里的 url(...)）
shell = shell.replace(/(href|src)="\/\/([^"]+)"/g, '$1="https://$2"');
shell = shell.replace(/url\(\/\//g, 'url(https://');

// 3) 把首页 tab 的内容塞进去（模拟 AJAX 返回）
let frag = read('output/frame-CenterHome.html');
try {
  const j = JSON.parse(frag);
  if (j && typeof j.html === 'string') frag = j.html;
} catch (e) {}

const inject = `
<script>
window.addEventListener('DOMContentLoaded', function () {
  var host = document.getElementById('center-page-home');
  if (host) host.innerHTML = ${JSON.stringify(frag)};
  if (window.MP && window.MP.pages && window.MP.pages.center) {
    window.MP.pages.center.mount({ enabled: true });
  }
});
</script>`;

const extra = `
<style data-mp="tokens">${read('styles/tokens.css')}</style>
<style data-mp="center">${read('styles/pages/center.css')}</style>
${inject}
`;

shell = shell.replace('</body>', extra + '\n</body>');

// 4) 预览标注
const badge = `<div style="position:fixed;left:12px;bottom:12px;z-index:99999;padding:6px 10px;border-radius:9px;background:rgba(20,18,15,.82);color:#fff;font:12px/1.4 system-ui;pointer-events:none;">离线预览 · 个人中心</div>`;
shell = shell.replace('</body>', badge + '\n</body>');

// 5) 让增强脚本能跑：把 center.js + dom.js 内联（离线没有扩展环境）
const boot = `
<script>
${read('src/content/core/dom.js')}
${read('src/content/render/pages/center.js')}
</script>`;
// 注意顺序：上面的 inject 依赖 MP.pages.center，所以脚本要放在 inject 之前
shell = shell.replace('<script>\nwindow.addEventListener(\'DOMContentLoaded\'', boot + '<script>\nwindow.addEventListener(\'DOMContentLoaded\'');

fs.writeFileSync(path.join(ROOT, 'output/preview-center.html'), shell, 'utf8');
console.log('written', path.join(ROOT, 'output/preview-center.html'), Buffer.byteLength(shell), 'bytes');

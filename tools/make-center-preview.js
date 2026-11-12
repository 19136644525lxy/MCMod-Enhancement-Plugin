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

// 外部 HTML 片段里一定带 </script>，直接内联会把宿主脚本提前闭合。
// 统一走 base64，脚本里只出现 ASCII，绝对安全。
const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
const utf8 = 'function (b64) { return decodeURIComponent(escape(atob(b64))); }';

const inject = `
<script>
(function () {
  var decode = ${utf8};
  var host = document.getElementById('center-page-home');
  if (host && !host.querySelector('.center-total')) host.innerHTML = decode('${b64(frag)}');
})();
</script>`;

const extra = `
<style data-mp="tokens">${read('styles/tokens.css')}</style>
<style data-mp="daynight">${read('styles/day-night.css')}</style>
<style data-mp="center">${read('styles/pages/center.css')}</style>
${inject}
`;

shell = shell.replace('</body>', extra + '\n</body>');

// 4) 预览标注
const badge = `<div style="position:fixed;left:12px;bottom:12px;z-index:99999;padding:6px 10px;border-radius:9px;background:rgba(20,18,15,.82);color:#fff;font:12px/1.4 system-ui;pointer-events:none;">离线预览 · 个人中心</div>`;
shell = shell.replace('</body>', badge + '\n</body>');

// 5) 让增强脚本能跑：内联 dom.js + fetch-page.js + center.js，
//    并把 history.html 的真实记录喂给 fetchDoc，让活跃度热力图在预览里也有数据。
const historyB64 = b64(read('output/history-829036.html'));
const boot = `
<script>
window.chrome = window.chrome || {};
window.chrome.runtime = {
  lastError: null,
  getURL: function (p) { return '../' + p; },
  sendMessage: function (msg, cb) {
    var decode = ${utf8};
    var text = (msg && msg.url && msg.url.indexOf('history.html') >= 0) ? decode('${historyB64}') : '';
    setTimeout(function () { if (cb) cb({ ok: !!text, text: text }); }, 0);
  }
};
${read('src/content/core/dom.js')}
${read('src/content/core/fetch-page.js')}
${read('src/content/render/pages/center.js')}
window.setTimeout(function () {
  try { window.MP.pages.center.mount({ enabled: true, bgPreset: 'mist' }); } catch (e) { window.__mpErr = String(e); }
}, 30);
</script>`;

shell = shell.replace('<script>\nwindow.addEventListener(\'DOMContentLoaded\'', boot + '<script>\nwindow.addEventListener(\'DOMContentLoaded\'');

// 兜底：如果上面的锚点没匹配上，直接插到 </body> 前
if (shell.indexOf('window.MP.pages.center.mount') < 0) {
  shell = shell.replace('</body>', boot + '\n</body>');
}

fs.writeFileSync(path.join(ROOT, 'output/preview-center.html'), shell, 'utf8');
console.log('written', path.join(ROOT, 'output/preview-center.html'), Buffer.byteLength(shell), 'bytes');

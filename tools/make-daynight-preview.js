const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles/day-night.css'), 'utf8');
const stars = fs.readFileSync(path.join(root, 'output/stars.svg.txt'), 'utf8').replace(/\s+/g, ' ').trim();

function sw(dark) {
  return `<button type="button" class="mp-ts" role="switch" data-state="${dark ? 'dark' : 'light'}" aria-checked="${dark}">
  <span class="mp-ts-c" aria-hidden="true">
    <span class="mp-ts-clouds"></span>
    <span class="mp-ts-stars">${stars}</span>
    <span class="mp-ts-circle"><span class="mp-ts-sm"><span class="mp-ts-moon">
      <span class="mp-ts-spot"></span><span class="mp-ts-spot"></span><span class="mp-ts-spot"></span>
    </span></span></span>
  </span>
</button>`;
}

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<title>日/夜开关 · 复刻预览</title>
<style>
  ${css}
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; padding: 44px 28px;
    font: 14px/1.6 "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
    background: #f3f1ec; color: #23211d;
    display: flex; flex-direction: column; gap: 26px; align-items: center;
  }
  body.dark { background: #131316; color: #e9e7e2; }
  .stage {
    width: 100%; max-width: 680px; border-radius: 20px; padding: 26px 28px;
    background: rgba(255,255,255,.62); border: 1px solid rgba(255,255,255,.85);
    box-shadow: 0 10px 40px rgba(40,32,24,.08); backdrop-filter: blur(18px);
  }
  body.dark .stage { background: rgba(28,28,32,.72); border-color: rgba(255,255,255,.08); }
  h2 { margin: 0 0 6px; font-size: 15px; }
  p { margin: 0 0 20px; font-size: 12px; opacity: .6; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 16px 0; border-top: 1px solid rgba(0,0,0,.07); }
  body.dark .row { border-top-color: rgba(255,255,255,.08); }
  .row:first-of-type { border-top: 0; }
  .label { font-size: 13px; }
  .desc { font-size: 11.5px; opacity: .55; margin-top: 2px; }
  .zoom { display: flex; gap: 34px; align-items: center; justify-content: center; padding: 22px 0 6px; }
  .zoom .mp-ts { --toggle-size: 26px; }
</style>
</head>
<body>
  <div class="stage">
    <h2>日 / 夜开关</h2>
    <p>点一下试试：白天是浅米色胶囊 + 云 + 粉橙太阳，夜里换成深色胶囊 + 星星 + 带环形坑的月亮</p>
    <div class="row">
      <div><div class="label">外观</div><div class="desc">跟随顶部导航一起切换深色 / 浅色</div></div>
      ${sw(false)}
    </div>
    <div class="row">
      <div><div class="label">主题（夜间态）</div><div class="desc">滑块右移，月亮从右滑入，云沉底，星星上浮</div></div>
      ${sw(true)}
    </div>
  </div>

  <div class="stage">
    <h2>放大观察</h2>
    <p>看月球上的三个坑、太阳的粉橙渐变、云的层叠阴影</p>
    <div class="zoom">
      ${sw(false)}
      ${sw(true)}
    </div>
  </div>

  <script>
    document.querySelectorAll('.mp-ts').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dark = btn.dataset.state !== 'dark';
        btn.dataset.state = dark ? 'dark' : 'light';
        btn.setAttribute('aria-checked', dark ? 'true' : 'false');
        btn.title = dark ? '切换到浅色' : '切换到深色';
      });
    });
  </script>
</body>
</html>`;

const out = path.join(root, 'output/preview-daynight.html');
fs.writeFileSync(out, html, 'utf8');
console.log('written', out, html.length);

/**
 * 生成背景预设预览页：一个全屏 canvas + 几块玻璃卡片 + 5 个切换按钮。
 * 直接复用 src/content/widgets/background.js，保证预览和插件里画的是同一份代码。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const js = fs.readFileSync(path.join(ROOT, 'src/content/widgets/background.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'styles/background.css'), 'utf8');

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>背景预设预览 · MCMod+</title>
<style>
  :root { color-scheme: light; }
  body {
    margin: 0; min-height: 100vh;
    font: 14px/1.6 -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
    background-color: #f3f1ec;
    background-image:
      radial-gradient(900px 520px at 12% -8%, rgba(126, 190, 140, .30), transparent 60%),
      radial-gradient(760px 460px at 88% 4%, rgba(150, 178, 232, .26), transparent 62%),
      radial-gradient(700px 500px at 50% 108%, rgba(226, 196, 152, .22), transparent 64%);
    transition: background-color .3s ease;
  }
  body[data-mp-bg="aurora"] { background-image: none !important; }
  body[data-mp-bg="pixel"] { background-image: none !important; }
  body[data-mp-bg="grass"] { background-image: none !important; }
  body[data-mp-bg="stars"] { background-image: none !important; }
  .stage { position: relative; z-index: 2; max-width: 860px; margin: 0 auto; padding: 64px 24px 96px; }
  h1 { margin: 0 0 6px; font-size: 26px; letter-spacing: -.4px; }
  .sub { margin: 0 0 26px; color: #6d685f; }
  .bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 30px; }
  .bar button {
    padding: 8px 16px; border-radius: 999px; cursor: pointer;
    border: 1px solid rgba(0,0,0,.10); background: rgba(255,255,255,.62);
    color: #33302a; font-size: 13px; transition: all .18s ease;
  }
  .bar button:hover { transform: translateY(-1px); border-color: #2f6f4f; }
  .bar button.on { background: #2f6f4f; border-color: #2f6f4f; color: #fff; }
  .cards { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
  .card {
    padding: 18px; border-radius: 18px;
    background: rgba(255,255,255,.62);
    border: 1px solid rgba(255,255,255,.72);
    box-shadow: 0 10px 40px rgba(40,32,24,.10);
    backdrop-filter: blur(20px) saturate(1.4);
  }
  .card h3 { margin: 0 0 6px; font-size: 15px; }
  .card p { margin: 0; color: #6d685f; font-size: 12.5px; }
  .hint { margin-top: 26px; color: #7d776c; font-size: 12px; }
  [data-mp-bg="pixel"] .card,
  [data-mp-bg="stars"] .card { background: rgba(255,255,255,.74); }
  ${css}
</style></head>
<body>
  <div class="stage">
    <h1>首页背景预设</h1>
    <p class="sub">五套底图都是本地画的，不请求任何图片；极光是唯一会动的，12fps。</p>
    <div class="bar" id="bar"></div>
    <div class="cards">
      <div class="card"><h3>晨雾</h3><p>纯 CSS 渐变，最省事，文字对比度最稳。</p></div>
      <div class="card"><h3>极光</h3><p>canvas 三条色带缓动，滚动时会轻微呼吸。</p></div>
      <div class="card"><h3>像素夜空</h3><p>固定种子，稀疏点亮的方块，像夜间村庄。</p></div>
      <div class="card"><h3>草方块</h3><p>32×32 程序化草皮平铺，压一层薄雾避免太抢眼。</p></div>
      <div class="card"><h3>星空</h3><p>静态星点，均匀分布，深色主题下最明显。</p></div>
    </div>
    <p class="hint">点上面的按钮切换；深色主题请在插件里切，这里只演示浅色。</p>
  </div>
<script>
window.MP = {};
${js}
(function () {
  var order = ['mist', 'aurora', 'pixel', 'grass', 'stars'];
  var bar = document.getElementById('bar');
  function paint(cur) {
    Array.prototype.forEach.call(bar.children, function (b) {
      b.classList.toggle('on', b.dataset.k === cur);
    });
  }
  order.forEach(function (k) {
    var b = document.createElement('button');
    b.dataset.k = k;
    b.textContent = MP.background.PRESETS[k];
    b.onclick = function () { MP.background.apply(k); paint(k); };
    bar.appendChild(b);
  });
  MP.background.apply('mist');
  paint('mist');
})();
</script>
</body></html>`;

const out = path.join(ROOT, 'output/preview-background.html');
fs.writeFileSync(out, html, 'utf8');
console.log('written ' + out + ' (' + Buffer.byteLength(html) + ' B)');

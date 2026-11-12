/**
 * 命令面板 jsdom 测试：猜词、多词搜索、单字放行。
 * 运行：$env:NODE_PATH="$env:TEMP\mp-test\node_modules"; node tools/test-palette.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT = path.join(ROOT, 'output', 'www.mcmod.cn_home.html');
const FILES = [
  'src/content/core/dom.js',
  'src/content/render/components.js',
  'src/content/core/fetch-page.js',
  'src/content/extract/search.js',
  'src/content/extract/modlist.js',
  'src/content/widgets/command-palette.js',
];

const html = fs.readFileSync(SNAPSHOT, 'utf8');
const dom = new JSDOM(html, { url: 'https://www.mcmod.cn/', pretendToBeVisual: true, runScripts: 'outside-only' });
const w = dom.window;

// 假搜索页结果
const SEARCH_HTML = `<!DOCTYPE html><html><body>
<div class="search-result"><div class="search-result-list">
  <div class="result-item">
    <div class="head"><span class="class-category"><a class="c_1">模组</a></span><a href="//www.mcmod.cn/class/1.html">工业时代2</a></div>
    <div class="body">工业 时代 经典模组</div>
    <div class="foot"><div class="info">www.mcmod.cn/class/1.html</div></div>
  </div>
  <div class="result-item">
    <div class="head"><span class="class-category"><a class="c_3">资料</a></span><a href="//www.mcmod.cn/item/2.html">工业 电路板</a></div>
    <div class="body">电路板</div>
    <div class="foot"><div class="info">www.mcmod.cn/item/2.html</div></div>
  </div>
</div></div></body></html>`;

const requested = [];
w.MP = {};
w.MP.theme = { inject() {} };
w.chrome = {
  runtime: {
    getURL: (p) => 'chrome-extension://test/' + p,
    sendMessage(msg, cb) {
      requested.push(msg.url);
      if (msg.url.indexOf('search.mcmod.cn') >= 0) cb({ ok: true, text: SEARCH_HTML, cached: false });
      else cb({ ok: true, text: '<!DOCTYPE html><html><body></body></html>', cached: false });
    }
  }
};
for (const f of FILES) {
  w.eval(fs.readFileSync(path.join(ROOT, f), 'utf8'));
}

let pass = 0;
let fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

// 造几个「猜词」词库来源
['工业时代2', '工业先锋', '工业革命', '机械动力'].forEach((t) => {
  const el = w.document.createElement('span');
  el.className = 'mp-tag-name';
  el.textContent = t;
  w.document.body.appendChild(el);
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log('\n[1] 打开面板');
  w.MP.palette.open({ palette: true });
  const input = w.document.querySelector('.mp-palette-input');
  ok('面板已挂载', !!input);

  console.log('\n[2] 单字搜索放行 + 猜词');
  input.value = '工';
  input.dispatchEvent(new w.Event('input'));
  await sleep(600);
  const chips = w.document.querySelectorAll('.mp-palette-suggest-chip');
  ok('出现猜词 chips', chips.length >= 2, 'got ' + chips.length);
  ok('猜词命中「工业时代2」', Array.from(chips).some((c) => c.textContent === '工业时代2'));
  ok('单字也发起了请求', requested.some((u) => u.indexOf('key=%E5%B7%A5') >= 0), requested.join(' | '));
  ok('单字不打结构化检索', !requested.some((u) => u.indexOf('modlist.html') >= 0));
  ok('有站内搜索分组', !!w.document.querySelector('.mp-palette-group'));

  console.log('\n[3] 多词搜索');
  requested.length = 0;
  input.value = '工业 时代';
  input.dispatchEvent(new w.Event('input'));
  await sleep(600);
  ok('多词按空格拼接', requested.some((u) => u.indexOf('key=%E5%B7%A5%E4%B8%9A%20%E6%97%B6%E4%BB%A3') >= 0), requested[0]);
  ok('多词补结构化检索', requested.some((u) => u.indexOf('modlist.html') >= 0));

  console.log('\n[4] 前缀限定');
  requested.length = 0;
  input.value = 'item:电路板';
  input.dispatchEvent(new w.Event('input'));
  await sleep(600);
  const rows = w.document.querySelectorAll('.mp-palette-item');
  ok('前缀只保留对应类型', rows.length >= 1);
  ok('前缀不发结构化检索', !requested.some((u) => u.indexOf('modlist.html') >= 0));

  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  w.close();
  process.exit(fail ? 1 : 0);
})();

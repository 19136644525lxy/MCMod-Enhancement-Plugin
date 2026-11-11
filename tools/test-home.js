/**
 * 首页重绘 jsdom 冒烟测试：真实快照 + 三个脚本，断言抽取字段与渲染结果。
 * 运行：$env:NODE_PATH="$env:TEMP\mp-test\node_modules"; node tools/test-home.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT = path.join(ROOT, 'output', 'www.mcmod.cn_home.html');
const FILES = [
  'src/content/core/dom.js',
  'src/content/extract/home.js',
  'src/content/render/pages/home.js',
];

const html = fs.readFileSync(SNAPSHOT, 'utf8');
const dom = new JSDOM(html, { url: 'https://www.mcmod.cn/', pretendToBeVisual: true, runScripts: 'outside-only' });
const w = dom.window;

w.MP = {};
w.MP.theme = { inject() {} };
for (const f of FILES) {
  w.eval(fs.readFileSync(path.join(ROOT, f), 'utf8'));
}

let pass = 0;
let fail = 0;
function ok(name, cond, extra) {
  if (cond) {
    pass++;
    console.log('  ✓ ' + name);
  } else {
    fail++;
    console.log('  ✗ ' + name + (extra ? '  → ' + extra : ''));
  }
}

console.log('\n[1] 抽取');
const d = w.MP.extract.home(w.document);
ok('ok 标记', d && d.ok === true);
ok('模组卡 3 组各 10 张', d.cards.random.length === 10 && d.cards.latest.length === 10 && d.cards.edited.length === 10,
  `random=${d.cards.random.length}`);
ok('模组卡字段完整', d.cards.random.every((c) => c.href && c.title));
ok('快捷入口 8 个', d.quick.length === 8, 'got ' + d.quick.length);
ok('统计 3 项', d.stats.length === 3, 'got ' + d.stats.length);
ok('编辑动态 20 条', d.feed.length === 20, 'got ' + d.feed.length);
ok('教程有数据', d.posts.length > 0, 'got ' + d.posts.length);
ok('社群动态有数据', d.topics.length > 0, 'got ' + d.topics.length);
ok('最受欢迎有数据', d.popular.length > 0, 'got ' + d.popular.length);
ok('版本检索有数据', d.versions.length > 0, 'got ' + d.versions.length);
ok('热门标签有数据', d.tags.length > 0, 'got ' + d.tags.length);
ok('贡献榜有数据', d.stars.length > 0, 'got ' + d.stars.length);
ok('评比排行有数据', d.charts.length > 0, 'got ' + d.charts.length);
ok('分类 9 个', d.categories.length === 9, 'got ' + d.categories.length);
ok('封面为绝对地址', d.cards.random.every((c) => !c.cover || /^https?:\/\//.test(c.cover)));

console.log('\n[2] 挂载');
ok('match() 命中首页', w.MP.pages.home.match() === true);
const mounted = w.MP.pages.home.mount({});
ok('mount 返回 true', mounted === true);
const host = w.document.getElementById('mp-home-host');
ok('宿主节点存在', !!host);
ok('body 标记', w.document.body.classList.contains('mp-home-mode'));
const main = w.document.querySelector('.center > .main');
ok('原首页被隐藏', main && main.classList.contains('mp-origin-hidden'));

console.log('\n[3] 渲染结果');
const q = (sel) => w.document.querySelectorAll(sel);
ok('玻璃卡 ≥ 8', q('.mp-glass').length >= 8, 'got ' + q('.mp-glass').length);
ok('页头标题', w.document.querySelector('.mp-hero-title').textContent.includes('找到你想要的模组'));
ok('快捷入口 8', q('.mp-quick-item').length === 8, 'got ' + q('.mp-quick-item').length);
ok('首屏模组卡 10', q('.mp-mod-card').length === 10, 'got ' + q('.mp-mod-card').length);
ok('编辑动态 20', q('.mp-feed-item').length === 20, 'got ' + q('.mp-feed-item').length);
ok('分类卡 9', q('.mp-cat-card').length === 9, 'got ' + q('.mp-cat-card').length);
ok('榜单有行', q('.mp-rank-item').length > 0);
ok('标签有 chip', q('.mp-tag').length > 0);

console.log('\n[4] tab 切换');
const tabs = q('.mp-tab');
ok('三个 tab', tabs.length === 3, 'got ' + tabs.length);
tabs[1].dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
ok('切到最新收录仍有 10 张', q('.mp-mod-card').length === 10, 'got ' + q('.mp-mod-card').length);

console.log('\n[5] 卸载');
w.MP.pages.home.unmount();
ok('宿主已移除', !w.document.getElementById('mp-home-host'));
ok('原首页恢复', !main.classList.contains('mp-origin-hidden'));
ok('body 标记移除', !w.document.body.classList.contains('mp-home-mode'));

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);


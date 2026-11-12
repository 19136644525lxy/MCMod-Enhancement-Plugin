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
  'src/content/core/store.js',
  'src/content/render/components.js',
  'src/content/extract/home.js',
  'src/content/widgets/footprint.js',
  'src/content/widgets/background.js',
  'src/content/widgets/settings-panel.js',
  'src/content/render/pages/home.js',
];

const html = fs.readFileSync(SNAPSHOT, 'utf8');
const dom = new JSDOM(html, { url: 'https://www.mcmod.cn/', pretendToBeVisual: true, runScripts: 'outside-only' });
const w = dom.window;

w.MP = {};
w.MP.theme = { inject() {} };
w.chrome = {
  runtime: { getURL: (p) => 'chrome-extension://test/' + p, sendMessage() {} },
  storage: { local: { get(k, cb) { cb && cb({}); }, set() {} } }
};
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
ok('banner 导航 ≥ 8', !!d.banner && d.banner.nav.length >= 8,
  'got ' + (d.banner ? d.banner.nav.length : 'null'));
ok('banner 随机链接', !!d.banner && /\/rand\//.test(d.banner.randomHref),
  d.banner ? d.banner.randomHref : 'null');
ok('banner 搜索表单', !!d.banner && d.banner.search.name === 'key');
ok('公告 ≥ 3 条', (d.notices || []).length >= 3, 'got ' + (d.notices || []).length);
ok('公告字段完整', (d.notices || []).every((n) => n.title && n.href && /^https?:\/\//.test(n.href)));

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
ok('快捷入口有图标', q('.mp-quick-item svg').length === 8, 'got ' + q('.mp-quick-item svg').length);
ok('首屏模组卡 10', q('.mp-mod-card').length === 10, 'got ' + q('.mp-mod-card').length);
ok('编辑动态滚筒容器', q('.mp-feed-scroll').length === 1);
ok('编辑动态 20+20（复制一份无缝滚动）', q('.mp-feed-item').length === 40, 'got ' + q('.mp-feed-item').length);
ok('副本对读屏隐藏', q('.mp-feed[aria-hidden="true"]').length === 1);
ok('分类卡 9', q('.mp-cat-card').length === 9, 'got ' + q('.mp-cat-card').length);
ok('榜单有行', q('.mp-rank-item').length > 0);
ok('标签有 chip', q('.mp-tag').length > 0);
ok('版本 chip 可点', q('.mp-version-chip').length > 0 &&
  Array.from(q('.mp-version-chip')).every((n) => n.tagName === 'A' && /modlist\.html\?mcver=/.test(n.getAttribute('href'))),
  q('.mp-version-chip')[0] ? q('.mp-version-chip')[0].getAttribute('href') : 'none');
ok('分类卡整卡可点', q('.mp-cat-card').length === 9 &&
  Array.from(q('.mp-cat-card')).every((n) => n.tagName === 'A' && /\/class\/category\//.test(n.getAttribute('href'))));
ok('首卡为我的世界原版', q('.mp-mod-card')[0].textContent.includes('我的世界原版'),
  q('.mp-mod-card')[0].textContent.trim().slice(0, 20));

console.log('\n[3b] 顶栏');
ok('顶栏存在', !!w.document.getElementById('mp-home-topbar'));
ok('顶栏在最前', w.document.body.firstElementChild.id === 'mp-home-topbar');
const top = w.document.querySelector('.top-main');
ok('原顶栏隐藏', !!top && top.classList.contains('mp-origin-hidden'));
ok('导航项 6', q('.mp-nav-item').length === 6, 'got ' + q('.mp-nav-item').length);
ok('导航链接指向原站', Array.from(q('.mp-nav-item')).every((n) => /mcmod\.cn/.test(n.href)));
ok('搜索表单', q('.mp-search input[name="key"]').length === 1);
ok('用户区', q('.mp-user-link').length === 1);
ok('头像存在', q('.mp-user-link img').length === 1);
const mark = w.document.querySelector('.mp-brand-mark');
ok('品牌图标用扩展内 logo', !!mark && /assets\/logo\.png/.test(mark.getAttribute('style') || ''),
  mark ? mark.getAttribute('style') : 'no mark');
ok('设置齿轮存在', q('.mp-gear-btn').length === 1);
ok('齿轮是 SVG', q('.mp-gear-btn svg.mp-gear').length === 1);

console.log('\n[3e] banner 条');
ok('banner 条存在', !!w.document.getElementById('mp-bannerbar'));
ok('banner 导航项 ≥ 8', q('.mp-bb-item').length >= 8, 'got ' + q('.mp-bb-item').length);
ok('banner 搜索表单', q('.mp-bb-search input[name="key"]').length === 1);
ok('苦力怕按钮', q('.mp-bb-rand .mp-creeper-img, .mp-bb-rand svg').length === 1);
ok('时钟存在', !!w.document.getElementById('mp-clock'));
ok('时钟带秒 HH:MM:SS', /^\d{2}:\d{2}:\d{2}$/.test(
  (w.document.getElementById('mp-clock') || {}).textContent || ''),
  (w.document.getElementById('mp-clock') || {}).textContent);
ok('原 m_menu 隐藏', w.document.querySelector('.banner .m_menu').classList.contains('mp-origin-hidden'));
ok('原 nowTime 隐藏', w.document.querySelector('.banner .nowTime').classList.contains('mp-origin-hidden'));

console.log('\n[3c] 页脚');
const foot = w.document.querySelector('.mp-footer');
ok('页脚存在', !!foot);
ok('页脚 4 列', q('.mp-foot-col').length === 4, 'got ' + q('.mp-foot-col').length);
ok('页脚链接可用', Array.from(q('.mp-foot-col a')).every((n) => /^(https?:|mailto:)/.test(n.href)),
  q('.mp-foot-col a')[0] ? q('.mp-foot-col a')[0].href : 'none');
ok('友链 ≥ 10', q('.mp-friend').length >= 10, 'got ' + q('.mp-friend').length);
ok('版权文字', (w.document.querySelector('.mp-foot-meta') || {}).textContent.includes('mcmod.cn'));
ok('原友链墙隐藏', w.document.querySelector('.un_links').classList.contains('mp-origin-hidden'));
ok('原页脚隐藏', w.document.querySelector('.under').classList.contains('mp-origin-hidden'));

console.log('\n[3d] 足迹卡');
const fp = w.document.getElementById('mp-fp');
ok('足迹卡存在', !!fp);
ok('热力图容器', q('.mp-fp-heat').length === 1);
ok('统计容器', q('.mp-fp-stats').length === 1);
const fpAll = w.document.querySelector('.mp-fp-all');
ok('全部记录链接带 userid', !!fpAll && /userid=\d+/.test(fpAll.getAttribute('href')),
  fpAll ? fpAll.getAttribute('href') : 'none');
ok('未登录时的快照也能识别 uid', w.MP.footprint && typeof w.MP.footprint.load === 'function');

console.log('\n[4] tab 切换');
const tabs = q('.mp-tab');
ok('三个 tab', tabs.length === 3, 'got ' + tabs.length);
tabs[1].dispatchEvent(new w.MouseEvent('click', { bubbles: true }));

// tab 切换有 190ms 淡出延时，等它完成再断言
setTimeout(function () {
  ok('切到最新收录仍有 10 张', q('.mp-mod-card').length === 10, 'got ' + q('.mp-mod-card').length);
  ok('切组后首卡仍是我的世界原版', q('.mp-mod-card')[0].textContent.includes('我的世界原版'),
    q('.mp-mod-card')[0].textContent.trim().slice(0, 20));

  console.log('\n[5] 卸载');
  w.MP.pages.home.unmount();
  ok('宿主已移除', !w.document.getElementById('mp-home-host'));
  ok('顶栏已移除', !w.document.getElementById('mp-home-topbar'));
  ok('原友链墙恢复', !w.document.querySelector('.un_links').classList.contains('mp-origin-hidden'));
  ok('原页脚恢复', !w.document.querySelector('.under').classList.contains('mp-origin-hidden'));
  ok('原顶栏恢复', !top.classList.contains('mp-origin-hidden'));
  ok('原首页恢复', !main.classList.contains('mp-origin-hidden'));
  ok('body 标记移除', !w.document.body.classList.contains('mp-home-mode'));

  console.log('\n[6] 悬浮条');
  ok('悬浮条常驻（卸载后还在）', !!w.document.getElementById('mp-home-fab'));
  const fabs = w.document.querySelectorAll('.mp-fab');
  ok('增强 / 原始 / 设置 三个按钮', fabs.length === 3, 'got ' + fabs.length);
  ok('卸载后「原始」高亮', fabs[1].classList.contains('is-on'));
  ok('卸载后「增强」不高亮', !fabs[0].classList.contains('is-on'));

  // 点「增强」应能重新挂载（现在要先从 storage 读一次最新设置，是异步的）
  fabs[0].dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  setTimeout(function () {
    ok('点增强后重新挂载', !!w.document.getElementById('mp-home-host'));
    ok('重新挂载后「增强」高亮', fabs[0].classList.contains('is-on'));

    console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
    process.exit(fail ? 1 : 0);
  }, 120);
}, 320);



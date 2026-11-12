/**
 * 个人中心增强 jsdom 测试：匹配、挂类、卸载。
 * 运行：$env:NODE_PATH="$env:TEMP\mp-test\node_modules"; node tools/test-center.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const FILES = ['src/content/core/dom.js', 'src/content/render/pages/center.js'];

const shell = fs.readFileSync(path.join(ROOT, 'output', 'center-shell.html'), 'utf8');
const dom = new JSDOM(shell, { url: 'https://center.mcmod.cn/829036/', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window;

w.MP = { pages: {}, theme: { inject() {} } };
for (const f of FILES) {
  w.eval(fs.readFileSync(path.join(ROOT, f), 'utf8'));
}

// 把 frame 片段塞进首页 tab，模拟 AJAX 填充
let frag = fs.readFileSync(path.join(ROOT, 'output', 'frame-CenterHome.html'), 'utf8');
try {
  const j = JSON.parse(frag);
  if (j && typeof j.html === 'string') frag = j.html;
} catch (e) {}
const host = w.document.querySelector('#center-page-home');
if (host) host.innerHTML = frag;

let pass = 0;
let fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

console.log('\n[1] 匹配');
ok('match 个人主页', w.MP.pages.center.match() === true);

console.log('\n[2] 挂载');
const mounted = w.MP.pages.center.mount({ enabled: true });
ok('mount 返回 true', mounted === true);
ok('body 带 mp-center-mode', w.document.body.classList.contains('mp-center-mode'));
ok('用户头卡', !!w.document.querySelector('.center-header.mp-center-header'));
ok('tab 容器', !!w.document.querySelector('.common-menu-area.mp-center-tabs'));
const tabs = w.document.querySelectorAll('.mp-center-tabs .mp-tab');
ok('4 个 tab', tabs.length === 4, 'got ' + tabs.length);
const statItems = w.document.querySelectorAll('.mp-center-total > ul > li');
ok('6 项统计', statItems.length === 6, 'got ' + statItems.length);
ok('统计卡文案', statItems.length && statItems[0].querySelector('.title').textContent.trim() === '用户组');
ok('内容块', w.document.querySelectorAll('.mp-center-block').length >= 3,
  'got ' + w.document.querySelectorAll('.mp-center-block').length);
ok('编辑动态列表', !!w.document.querySelector('.mp-edit-list'));
ok('顶栏设置齿轮', !!w.document.querySelector('.header-right #mp-center-gear'));
ok('顶栏齿轮用 mp-gear-btn 样式', !!w.document.querySelector('.header-right .mp-gear-btn'));

console.log('\n[3] 卸载');
w.MP.pages.center.unmount();
ok('mount 标记复位', w.MP.pages.center.isActive() === false);
ok('body 类移除', !w.document.body.classList.contains('mp-center-mode'));
ok('头卡类移除', !w.document.querySelector('.center-header.mp-center-header'));

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
w.close();
process.exit(fail ? 1 : 0);

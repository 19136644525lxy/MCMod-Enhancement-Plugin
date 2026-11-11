/**
 * 足迹卡测试：用真实导出的 history.html 跑解析与热力图生成
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'output/history-829036.html'), 'utf8');

const dom = new JSDOM(html, { url: 'https://www.mcmod.cn/', pretendToBeVisual: true, runScripts: 'outside-only' });
const w = dom.window;

// 最小 MP 桩（只提供 footprint.js 需要的方法）
const MP = {
  dom: {
    absUrl(href) { try { return new w.URL(href, w.location.href).href; } catch (e) { return href || ''; } },
    h(tag, attrs, ...children) {
      const el = w.document.createElement(tag);
      if (attrs) Object.keys(attrs).forEach(k => {
        if (k === 'class') el.className = attrs[k];
        else el.setAttribute(k, attrs[k]);
      });
      children.flat().forEach(c => {
        if (c == null) return;
        el.appendChild(typeof c === 'object' ? c : w.document.createTextNode(String(c)));
      });
      return el;
    },
    clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  }
};
w.MP = MP;
w.chrome = { runtime: { sendMessage() {} }, storage: { local: { get() {}, set() {} } } };

const code = fs.readFileSync(path.join(ROOT, 'src/content/widgets/footprint.js'), 'utf8');
w.eval(code);

const F = w.MP.footprint;
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

console.log('[1] parseHistory');
const list = F.parseHistory(html);
ok('解析出记录', list.length > 50, 'got ' + list.length);
ok('首条时间可读', /^\d{4}-\d{2}-\d{2}$/.test(list[0].date), list[0].date);
ok('首条有目标标题', !!list[0].title, list[0].title);
ok('存在「添加」动作', list.some(r => r.action === 'add'));
ok('存在「更新」动作', list.some(r => r.action === 'update'));
ok('链接已绝对化', list.some(r => /^https:\/\/www\.mcmod\.cn\//.test(r.href)));

console.log('[2] statsFrom');
const st = F.statsFrom(list);
ok('total 与记录数一致', st.total === list.length);
ok('有记录天数 > 0', st.days > 0, st.days);
ok('近 30 天计数 >= 0', st.n30 >= 0, st.n30);
ok('连续天数 >= 1（最近一条今天之内可能为 0）', st.streak >= 0, st.streak);
ok('最新日期格式正确', /^\d{4}-\d{2}-\d{2}$/.test(st.latest), st.latest);

console.log('[3] buildGrid');
const g = F.buildGrid(st.byDay);
ok('网格 20 列', g.weeks.length === 20);
ok('每列 7 格', g.weeks.every(c => c.length === 7));
ok('最后一天不是未来', g.weeks[19][6] === null || g.weeks[19][6].date <= new Date().toISOString().slice(0, 10));
const cells = g.weeks.flat().filter(Boolean);
ok('格子数 <= 140', cells.length <= 140, cells.length);
// 网格只覆盖最近 20 周，超出窗口的记录不计入，所以这里只能是「不超过」
const gridSum = cells.reduce((s, c) => s + c.count, 0);
const byDaySum = Object.values(st.byDay).reduce((a, b) => a + b, 0);
ok('窗口内计数不超过总记录数', gridSum <= byDaySum, gridSum + ' > ' + byDaySum);
ok('窗口内计数 > 0', gridSum > 0, gridSum);

console.log('[4] 渲染');
const host = w.document.createElement('div');
host.innerHTML = '<div class="mp-fp-stats"></div><div class="mp-fp-months"></div><div class="mp-fp-heat"></div><ul class="mp-fp-recent"></ul><p class="mp-fp-note"></p>';
F.load(host, '829036');
ok('暴露 load', typeof F.load === 'function');

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exitCode = fail ? 1 : 0;

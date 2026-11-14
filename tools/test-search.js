/**
 * 搜索页结构重绘测试（jsdom + 真实快照）
 * 用法：$env:NODE_PATH="$env:TEMP\mp-test\node_modules"; node tools/test-search.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const html = read('output/search-sample.html');
const dom = new JSDOM(html, { url: 'https://search.mcmod.cn/s?key=minihud', runScripts: 'outside-only' });
const w = dom.window;
const d = w.document;

w.chrome = {
  runtime: { getURL: (p) => 'chrome-extension://test/' + p, sendMessage: () => {} },
  storage: {
    sync: { get: (k, cb) => cb({}), set: (o, cb) => cb && cb() },
    local: { get: (k, cb) => cb({}), set: (o, cb) => cb && cb() },
  },
  i18n: { getMessage: (k) => k },
};

w.MP = {
  dom: {
    h(tag, attrs, ...kids) {
      const el = d.createElement(tag);
      attrs = attrs || {};
      Object.keys(attrs).forEach((k) => {
        if (k === 'class') el.setAttribute('class', attrs[k]);
        else if (k.startsWith('on') && typeof attrs[k] === 'function') el.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] != null) el.setAttribute(k, attrs[k]);
      });
      kids.flat(9).forEach((c) => {
        if (c == null) return;
        el.appendChild(typeof c === 'string' ? d.createTextNode(c) : c);
      });
      return el;
    },
    clear(el) { while (el.firstChild) el.removeChild(el.firstChild); },
    text(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); },
    stripWiki(s) { return String(s || '').replace(/\[[^\]]*\]/g, '').trim(); },
    absUrl(u) { try { return new URL(u, 'https://search.mcmod.cn').href; } catch (e) { return u || ''; } },
    highlight(text, kw) {
      const frag = d.createDocumentFragment();
      const t = String(text || '');
      if (!kw) { frag.appendChild(d.createTextNode(t)); return frag; }
      const i = t.toLowerCase().indexOf(String(kw).toLowerCase());
      if (i < 0) { frag.appendChild(d.createTextNode(t)); return frag; }
      frag.appendChild(d.createTextNode(t.slice(0, i)));
      const m = d.createElement('mark');
      m.className = 'mp-mark';
      m.textContent = t.slice(i, i + kw.length);
      frag.appendChild(m);
      frag.appendChild(d.createTextNode(t.slice(i + kw.length)));
      return frag;
    },
    pick() { return null; },
    ready(fn) { fn(); },
  },
  theme: { inject() {}, apply() {} },
  store: { setSync: () => Promise.resolve(true) },
  background: { apply() {}, setIntensity() {} },
  ui: {
    empty(t) {
      const e = d.createElement('div');
      e.className = 'mp-empty';
      e.textContent = t;
      return e;
    },
  },
};

w.eval(read('src/content/core/dom.js'));
w.eval(read('src/content/extract/search.js'));
w.eval(read('src/content/render/pages/search.js'));

let pass = 0;
let fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

console.log('[1] 抽取');
const data = w.MP.extract.search(d);
ok('抽取成功', data.ok === true);
ok('结果条数 > 0', data.items.length > 0, 'got ' + data.items.length);
ok('首条有标题', !!(data.items[0] && data.items[0].title), data.items[0] && data.items[0].title);
ok('关键词解析', data.keyword === 'minihud', data.keyword);
ok('统计总数解析', data.stats.total > 0, JSON.stringify(data.stats));
ok('分类页签', data.tabs.length >= 8, 'got ' + data.tabs.length);
ok('「全部」页签为 active', data.tabs[0].active === true);
ok('页签带计数', data.tabs[0].count === 8, String(data.tabs[0].count));
ok('面包屑', data.crumbs.length >= 2, JSON.stringify(data.crumbs.map((c) => c.label)));
ok('搜索表单', !!data.form && data.form.key === 'minihud', JSON.stringify(data.form));

console.log('\n[2] 挂载');
const mounted = w.MP.pages.search.mount({ enabled: true, redrawSearch: true, bgPreset: 'mist', bgIntensity: 45 });
ok('mount 返回 true', mounted === true);
ok('body 有 mp-search-mode', d.body.classList.contains('mp-search-mode'));
ok('宿主已插入', !!d.getElementById('mp-search-host'));
ok('原 .center 已隐藏', d.querySelector('.common-frame .center').classList.contains('mp-origin-hidden'));
ok('卡片数等于结果数', d.querySelectorAll('.mp-r-card').length === data.items.length,
  'got ' + d.querySelectorAll('.mp-r-card').length);
ok('分类胶囊', d.querySelectorAll('.mp-seg-item').length >= 8,
  'got ' + d.querySelectorAll('.mp-seg-item').length);
ok('搜索框回填关键词', d.querySelector('.mp-search-input').value === 'minihud',
  d.querySelector('.mp-search-input').value);
ok('统计文案', !!d.querySelector('.mp-s-stat') && d.querySelector('.mp-s-stat').textContent.length > 4,
  d.querySelector('.mp-s-stat') && d.querySelector('.mp-s-stat').textContent);
ok('搜索词高亮', d.querySelectorAll('.mp-r-card mark').length > 0);
ok('结果卡有类型标签', !!d.querySelector('.mp-r-type'));

console.log('\n[3] 还原');
const btn = d.querySelector('.mp-s-original');
ok('原始视图按钮存在', !!btn);
if (btn) btn.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
ok('宿主已移除', !d.getElementById('mp-search-host'));
ok('原 .center 恢复', !d.querySelector('.common-frame .center').classList.contains('mp-origin-hidden'));

console.log('\n结果：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);

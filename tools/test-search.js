/**
 * 搜索页重绘测试（jsdom + 真实快照）
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

// 最小 chrome 桩
w.chrome = {
  runtime: { getURL: (p) => 'chrome-extension://test/' + p, sendMessage: () => {} },
  storage: {
    sync: { get: (k, cb) => cb({}), set: (o, cb) => cb && cb() },
    local: { get: (k, cb) => cb({}), set: (o, cb) => cb && cb() },
  },
  i18n: { getMessage: (k) => k },
};

// 最小 MP 桩
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
  theme: {
    inject() {},
    apply() {},
  },
  store: { setSync: () => Promise.resolve(true) },
  background: { apply() {}, setIntensity() {} },
  ui: {
    chip(label, opts) {
      const a = d.createElement('a');
      a.className = 'mp-chip' + (opts && opts.active ? ' is-on' : '');
      a.href = (opts && opts.href) || '#';
      a.textContent = label;
      return a;
    },
    button(label, opts) {
      const b = d.createElement('button');
      b.className = 'mp-btn';
      b.textContent = label;
      if (opts && opts.onclick) b.addEventListener('click', opts.onclick);
      return b;
    },
    empty(t) {
      const e = d.createElement('div');
      e.className = 'mp-empty';
      e.textContent = t;
      return e;
    },
  },
};

// 加载抽取器 + 页面脚本
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

console.log('\n[2] 挂载与换皮');
const mounted = w.MP.pages.search.mount({ enabled: true, redrawSearch: true, bgPreset: 'mist', bgIntensity: 45 });
ok('mount 返回 true', mounted === true);
ok('body 有 mp-search-mode', d.body.classList.contains('mp-search-mode'));
ok('卡片已渲染', d.querySelectorAll('.mp-search-card').length === data.items.length,
  'got ' + d.querySelectorAll('.mp-search-card').length);
ok('工具栏存在', !!d.querySelector('.mp-search-toolbar'));
ok('筛选 chip 8 个', d.querySelectorAll('.mp-search-toolbar .mp-chip').length === 8,
  'got ' + d.querySelectorAll('.mp-search-toolbar .mp-chip').length);
ok('当前筛选是「全部」', !!d.querySelector('.mp-search-toolbar .mp-chip.is-on'));
ok('搜索词高亮', d.querySelectorAll('.mp-search-card mark').length > 0);
ok('卡片有类型标签', !!d.querySelector('.mp-search-card .mp-card-type'));

console.log('\n[3] 恢复原始视图');
const btn = Array.from(d.querySelectorAll('.mp-search-toolbar .mp-btn')).find((b) => b.textContent === '原始视图');
ok('原始视图按钮存在', !!btn);
if (btn) btn.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
ok('列表已还原', !d.querySelector('.mp-search-list'));
ok('工具栏已移除', !d.querySelector('.mp-search-toolbar'));

console.log('\n结果：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);

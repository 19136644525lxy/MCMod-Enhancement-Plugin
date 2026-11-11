/**
 * 渲染结果内容检查：打印各页面重绘后的关键文本，人工核对质量。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, 'output');

const SCRIPTS = [
  'src/content/core/dom.js',
  'src/content/core/store.js',
  'src/content/core/selectors.js',
  'src/content/core/theme.js',
  'src/content/core/fetch-page.js',
  'src/content/render/components.js',
  'src/content/extract/search.js',
  'src/content/extract/modlist.js',
  'src/content/extract/item.js',
  'src/content/extract/klass.js',
  'src/content/extract/modpack.js',
  'src/content/extract/category.js',
  'src/content/render/page-shell.js',
  'src/content/render/pages/item.js',
  'src/content/render/pages/klass.js',
  'src/content/render/pages/modpack.js',
  'src/content/render/pages/category.js',
];

const CASES = [
  ['item', 'www.mcmod.cn_item_462367.html.html', 'https://www.mcmod.cn/item/462367.html'],
  ['klass', 'www.mcmod.cn_class_17140.html.html', 'https://www.mcmod.cn/class/17140.html'],
  ['modpack', 'www.mcmod.cn_modpack.html.html', 'https://www.mcmod.cn/modpack.html'],
  ['category', 'www.mcmod.cn_class_category_1-1.html.html', 'https://www.mcmod.cn/class/category/1-1.html'],
];

for (const [key, file, url] of CASES) {
  const dom = new JSDOM(fs.readFileSync(path.join(OUT, file), 'utf8'), {
    url, runScripts: 'outside-only', pretendToBeVisual: true,
  });
  dom.window.chrome = {
    runtime: { getURL: (p) => 'chrome-extension://test/' + p, sendMessage: () => {}, openOptionsPage: () => {} },
    storage: { sync: { get: (cb) => cb({}), set: () => {} }, local: { get: (cb) => cb({}), set: () => {} } },
  };
  for (const rel of SCRIPTS) dom.window.eval(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  dom.window.MP.pages[key].mount(null);
  const doc = dom.window.document;

  const t = (sel) => {
    const el = doc.querySelector(sel);
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : '(无)';
  };
  console.log('\n========== ' + key + ' ==========');
  console.log('标题: ' + t('.mp-head-title'));
  console.log('副标题: ' + t('.mp-head-sub'));
  console.log('面包屑: ' + t('.mp-crumbs'));
  console.log('面板数: ' + doc.querySelectorAll('.mp-panel').length
    + ' | 面板标题: ' + Array.from(doc.querySelectorAll('.mp-panel-title')).map((e) => e.textContent.trim()).join(' / '));
  console.log('kv 行: ' + Array.from(doc.querySelectorAll('.mp-kv-row')).slice(0, 12).map((r) => r.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
  console.log('craft: ' + doc.querySelectorAll('.mp-craft').length + ' | 首条: ' + t('.mp-craft'));
  console.log('卡片: ' + doc.querySelectorAll('.mp-modpack-card, .mp-cate-card').length);
  console.log('首卡文本: ' + t('.mp-modpack-card, .mp-cate-card'));
  console.log('排行: ' + doc.querySelectorAll('.mp-rank-item').length + ' | 首条: ' + t('.mp-rank-item'));
  console.log('分页: ' + t('.mp-pager'));
  console.log('富文本长度: ' + (doc.querySelector('.mp-prose') ? doc.querySelector('.mp-prose').textContent.length : 0));
  console.log('悬浮条: ' + t('.mp-float-bar'));
  console.log('隐藏原生块: ' + Array.from(doc.querySelectorAll('.mp-origin-hidden')).map((e) => e.tagName + '.' + (e.className || '').split(' ')[0]).join(', '));
}


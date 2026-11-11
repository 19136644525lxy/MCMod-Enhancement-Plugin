/**
 * 渲染层 jsdom 冒烟测试：用四个真实快照驱动 M3 页面重绘。
 * 运行：$env:NODE_PATH="$env:TEMP\mp-test\node_modules"; node tools/test-render.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, 'output');

const CASES = [
  {
    key: 'item',
    file: 'www.mcmod.cn_item_462367.html.html',
    url: 'https://www.mcmod.cn/item/462367.html',
    asserts: [
      ['.mp-page--item', 1, '页面外壳'],
      ['.mp-head-title', 1, '标题'],
      ['.mp-craft', '>0', '合成表'],
      ['.mp-give', 1, '物品命令'],
      ['.mp-panel', '>0', '面板'],
      ['.mp-native-zone', '>0', '原生侧栏搬入'],
    ],
    text: ['.mp-head-title', '深层煤矿石'],
  },
  {
    key: 'klass',
    file: 'www.mcmod.cn_class_17140.html.html',
    url: 'https://www.mcmod.cn/class/17140.html',
    asserts: [
      ['.mp-page--klass', 1, '页面外壳'],
      ['.mp-head-title', 1, '标题'],
      ['.mp-native-zone', '>0', '原生侧栏搬入'],
      ['.mp-panel', '>0', '面板'],
    ],
    text: ['.mp-head-title', 'Hydrological'],
  },
  {
    key: 'modpack',
    file: 'www.mcmod.cn_modpack.html.html',
    url: 'https://www.mcmod.cn/modpack.html',
    asserts: [
      ['.mp-page--modpack', 1, '页面外壳'],
      ['.mp-modpack-card', 32, '卡片数'],
      ['.mp-pager', 1, '分页'],
    ],
  },
  {
    key: 'category',
    file: 'www.mcmod.cn_class_category_1-1.html.html',
    url: 'https://www.mcmod.cn/class/category/1-1.html',
    asserts: [
      ['.mp-page--category', 1, '页面外壳'],
      ['.mp-cate-card', 20, '模组卡数'],
      ['.mp-rank-list', '>0', '排行榜'],
      ['.mp-pager', 1, '分页'],
    ],
  },
];

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

let pass = 0;
let fail = 0;

function check(label, cond, detail) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.log('  FAIL ' + label + (detail ? ' → ' + detail : ''));
  }
}

function count(dom, sel) {
  return dom.window.document.querySelectorAll(sel).length;
}

function assertCount(dom, sel, expected, label) {
  const n = count(dom, sel);
  const ok = typeof expected === 'number' ? n === expected : n > 0;
  check(label + ' ' + sel, ok, '实际 ' + n + '，期望 ' + expected);
}

for (const c of CASES) {
  const html = fs.readFileSync(path.join(OUT, c.file), 'utf8');
  const dom = new JSDOM(html, {
    url: c.url,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });

  dom.window.chrome = {
    runtime: {
      getURL: (p) => 'chrome-extension://test/' + p,
      sendMessage: () => {},
      openOptionsPage: () => {},
    },
    storage: {
      sync: { get: (cb) => cb({}), set: () => {} },
      local: { get: (cb) => cb({}), set: () => {} },
    },
  };

  for (const rel of SCRIPTS) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    dom.window.eval(code);
  }

  const MP = dom.window.MP;
  const mod = MP.pages[c.key];
  console.log('\n[' + c.key + ']');
  check('模块已注册', !!mod, c.key);
  if (!mod) continue;

  check('match() 命中', mod.match() === true, c.url);

  let mounted = false;
  try {
    mounted = mod.mount(null) !== false;
  } catch (e) {
    check('mount() 不抛异常', false, e && e.message);
  }
  check('mount() 成功', mounted === true);

  for (const a of c.asserts) assertCount(dom, a[0], a[1], a[2]);

  if (c.text) {
    const el = dom.window.document.querySelector(c.text[0]);
    const content = el ? el.textContent : '';
    check('标题包含「' + c.text[1] + '」', content.indexOf(c.text[1]) !== -1, content.slice(0, 60));
  }

  // 原生区块应被隐藏而非删除
  const hidden = dom.window.document.querySelectorAll('.mp-origin-hidden').length;
  check('原生区块隐藏数 > 0', hidden > 0, '实际 ' + hidden);

  // 宿主节点存在
  check('宿主 #mp-page-host', count(dom, '#mp-page-host') === 1);

  // 工具条存在
  check('悬浮工具条', count(dom, '.mp-float-bar') === 1);
}

console.log('\n通过 ' + pass + ' / 失败 ' + fail);
process.exit(fail === 0 ? 0 : 1);



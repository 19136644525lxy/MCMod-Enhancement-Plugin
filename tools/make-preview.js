/**
 * 生成可双击打开的离线预览：真实快照 + 插件重绘 + 内联样式。
 * 运行：$env:NODE_PATH="$env:TEMP\mp-test\node_modules"; node tools/make-preview.js
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
  'src/content/extract/home.js',
  'src/content/render/page-shell.js',
  'src/content/widgets/footprint.js',
  'src/content/render/pages/item.js',
  'src/content/render/pages/klass.js',
  'src/content/render/pages/modpack.js',
  'src/content/render/pages/category.js',
  'src/content/render/pages/home.js',
];

const CASES = [
  ['home', 'www.mcmod.cn_home.html', 'https://www.mcmod.cn/', 'home'],
  ['item', 'www.mcmod.cn_item_462367.html.html', 'https://www.mcmod.cn/item/462367.html', 'pages'],
  ['klass', 'www.mcmod.cn_class_17140.html.html', 'https://www.mcmod.cn/class/17140.html', 'pages'],
  ['modpack', 'www.mcmod.cn_modpack.html.html', 'https://www.mcmod.cn/modpack.html', 'pages'],
  ['category', 'www.mcmod.cn_class_category_1-1.html.html', 'https://www.mcmod.cn/class/category/1-1.html', 'pages'],
];

function readCss(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function cssBlock(kind) {
  const base = [readCss('styles/tokens.css'), readCss('styles/base.css')];
  if (kind === 'home') base.push(readCss('styles/pages/home.css'));
  else base.push(readCss('styles/pages/pages.css'));
  return base.join('\n\n');
}

for (const [key, file, url, cssKind] of CASES) {
  const src = path.join(OUT, file);
  if (!fs.existsSync(src)) {
    console.log('skip ' + key + ' (missing ' + file + ')');
    continue;
  }
  const dom = new JSDOM(fs.readFileSync(src, 'utf8'), {
    url, runScripts: 'outside-only', pretendToBeVisual: true,
  });
  // 首页预览：把真实的编辑历史喂给足迹卡，避免预览里只剩「正在读取…」
  const historyFile = path.join(OUT, 'history-829036.html');
  const historyHtml = key === 'home' && fs.existsSync(historyFile)
    ? fs.readFileSync(historyFile, 'utf8')
    : '';

  dom.window.chrome = {
    runtime: {
      getURL: (p) => 'chrome-extension://test/' + p,
      sendMessage: (msg, cb) => {
        if (historyHtml && msg && msg.type === 'mp:fetchPage') {
          cb({ ok: true, text: historyHtml, cached: false });
        } else if (cb) {
          cb({ ok: false, error: 'OFFLINE' });
        }
      },
      openOptionsPage: () => {},
    },
    storage: {
      sync: { get: (k, cb) => cb && cb({}), set: () => {} },
      local: { get: (k, cb) => cb && cb({}), set: () => {} },
    },
  };
  for (const rel of SCRIPTS) dom.window.eval(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  dom.window.MP.pages[key].mount(null);

  const doc = dom.window.document;

  // 1. 去掉所有 script，避免站点 JS 干扰静态预览
  Array.prototype.forEach.call(doc.querySelectorAll('script'), (s) => s.remove());

  // 2. 站点 CSS 改成绝对地址，离线打开也能拉到（有网时）
  Array.prototype.forEach.call(doc.querySelectorAll('link[rel="stylesheet"]'), (l) => {
    const href = l.getAttribute('href') || '';
    if (href && !/^https?:/i.test(href) && !/^chrome-extension:/i.test(href)) {
      l.setAttribute('href', new URL(href, url).href);
    }
  });

  // 3. 注入我们的样式（内联，确保离线可见）
  const style = doc.createElement('style');
  style.textContent = cssBlock(cssKind);
  doc.head.appendChild(style);

  // 4. 去掉插件注入的 <link>（已内联）
  Array.prototype.forEach.call(doc.querySelectorAll('link[data-mp-style]'), (l) => l.remove());

  // 5. 顶部加一条说明
  const note = doc.createElement('div');
  note.setAttribute('style', 'position:fixed;left:12px;bottom:12px;z-index:999999;padding:6px 12px;border-radius:8px;background:#2f6f4f;color:#fff;font:12px/1.5 system-ui;opacity:.9');
  note.textContent = '离线预览 · ' + key + ' · 插件重绘结果（无站点 JS）';
  doc.body.appendChild(note);

  const outFile = path.join(OUT, 'preview-' + key + '.html');
  fs.writeFileSync(outFile, '<!DOCTYPE html>\n' + doc.documentElement.outerHTML, 'utf8');
  console.log('written ' + outFile + ' (' + fs.statSync(outFile).size + ' B)');
  dom.window.close();
}

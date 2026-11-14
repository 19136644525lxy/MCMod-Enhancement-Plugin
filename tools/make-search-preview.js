const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const SAMPLE = 'output/search-sample.html';
const OUT = 'output/preview-search.html';

const html = read(SAMPLE);

// 站点 CSS 换成绝对地址，file:// 下也能加载
const siteCss = [
  'https://www.mcmod.cn/static/public/css/top.frame.css',
  'https://www.mcmod.cn/static/public/css/all_text.frame.css',
  'https://www.mcmod.cn/static/public/css/header.frame.css',
  'https://www.mcmod.cn/static/public/css/nprogress.css',
  'https://www.mcmod.cn/static/public/css/sweetalert.css',
  'https://www.mcmod.cn/static/public/css/main.css',
  'https://www.mcmod.cn/static/public/css/pages.css',
  'https://www.mcmod.cn/static/search/css/search.css',
];

const dom = new JSDOM(html, { url: 'https://search.mcmod.cn/s?key=minihud' });
const d = dom.window.document;

// 去掉站点脚本，避免它把我们的渲染冲掉
d.querySelectorAll('script').forEach((s) => s.remove());

// 注入站点样式（远端地址）
const linkCss = siteCss.map((u) => '<link rel="stylesheet" href="' + u + '">').join('\n');
// 注入插件样式
const pluginCss = ['styles/tokens.css', 'styles/base.css', 'styles/mp-toggle.css', 'styles/day-night.css', 'styles/background.css', 'styles/pages/search.css']
  .filter((p) => fs.existsSync(path.join(ROOT, p)))
  .map((p) => '<style data-mp="' + p + '">' + read(p) + '</style>')
  .join('\n');

// 页面结构：把插件脚本以「已挂类」的形式直接静态化
// —— 离线预览只验证样式，不跑 JS 渲染结果，所以手动把关键类补上。
const resultList = d.querySelector('.search-result-list');
let cards = '';
if (resultList) {
  const items = Array.from(resultList.querySelectorAll('.result-item')).slice(0, 8);
  cards = items.map((it) => {
    const a = it.querySelector('.head a[href]');
    const cat = it.querySelector('.head .class-category a');
    const body = it.querySelector('.body');
    const foot = it.querySelector('.foot .info');
    const title = a ? a.textContent.trim() : '';
    const href = a ? a.getAttribute('href') : '#';
    const type = cat ? cat.textContent.trim() : '模组';
    const snippet = body ? body.textContent.trim().replace(/\s+/g, ' ') : '';
    const footTxt = foot ? foot.textContent.trim() : '';
    return (
      '<a class="mp-card mp-search-card" href="' + href + '">' +
        '<div class="mp-card-head"><span class="mp-card-type">' + type + '</span>' +
        '<span class="mp-card-title">' + title + '</span></div>' +
        '<div class="mp-card-snippet">' + snippet + '</div>' +
        (footTxt ? '<div class="mp-card-foot"><span class="mp-foot-item">' + footTxt + '</span></div>' : '') +
      '</a>'
    );
  }).join('\n');
}

const chips = [
  ['全部', true], ['模组', false], ['整合包', false], ['资料', false],
  ['教程', false], ['作者', false], ['用户', false], ['社群', false],
].map(([label, on]) => '<a class="mp-chip' + (on ? ' is-on' : '') + '" href="#">' + label + '</a>').join('');

const toolbar =
  '<div class="mp-toolbar mp-search-toolbar">' +
    '<div class="mp-toolbar-left">' + chips + '</div>' +
    '<div class="mp-toolbar-right"><div class="mp-search-summary">找到约 8 条结果，共约 1 页</div>' +
    '<button class="mp-btn mp-btn-ghost" type="button">原始视图</button></div>' +
  '</div>';

if (resultList) {
  resultList.classList.add('mp-root', 'mp-search-list');
  resultList.innerHTML = cards || '<div class="mp-empty">没有匹配的结果</div>';
  resultList.insertAdjacentHTML('beforebegin', toolbar);
}

d.body.classList.add('mp-search-mode');

const out =
  '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">' +
  '<title>搜索页预览</title>' + linkCss + pluginCss + '</head>' +
  '<body class="' + d.body.className + '">' + d.body.innerHTML +
  '<div style="position:fixed;left:12px;bottom:10px;font:12px/1.6 system-ui;color:#857f75;background:rgba(255,255,255,.8);padding:4px 10px;border-radius:8px;z-index:99999">离线预览 · 仅样式</div>' +
  '</body></html>';

fs.writeFileSync(path.join(ROOT, OUT), out, 'utf8');
console.log('written ' + path.join(ROOT, OUT) + ' (' + out.length + ' B)');

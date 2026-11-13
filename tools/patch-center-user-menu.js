const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 顶栏头像下拉菜单（管理菜单 / 社群功能 / 主站功能）===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* 原站 .header-layer{padding:10px;border-radius:10px;background-color:#FFF;border:1px solid #EEE;box-shadow:1px 1px 4px #DDD;display:flex}
   这里把底色 / 边框 / 阴影全部换成主题变量，并补一层毛玻璃。
   用 !important 是因为原站在 header.frame.css 里给的是单类选择器，
   而我们这条虽然权重更高，但会被后续加载的站点样式覆盖。 */
body.mp-center-mode .header-panel .header-layer,
body.mp-center-mode .header-user .header-layer,
body.mp-center-mode .header-layer {
  background-color: var(--c-card) !important;
  background-image: none !important;
  border: 1px solid var(--c-hair) !important;
  box-shadow: 0 12px 34px rgba(40, 32, 24, .16) !important;
  border-radius: 12px !important;
  padding: 12px 14px !important;
  -webkit-backdrop-filter: blur(18px) saturate(1.35);
  backdrop-filter: blur(18px) saturate(1.35);
}

body.mp-center-mode .header-layer .header-layer-block {
  padding-right: 6px;
}
body.mp-center-mode .header-layer .header-layer-block .title {
  color: var(--c-ink-3) !important;
  font-size: 11.5px !important;
  font-weight: 600 !important;
  letter-spacing: .04em;
  margin-bottom: 8px !important;
}
body.mp-center-mode .header-layer .header-layer-block li {
  margin-bottom: 2px;
}
body.mp-center-mode .header-layer .header-layer-block a {
  color: var(--c-ink) !important;
  display: inline-block;
  padding: 3px 8px;
  margin-left: -8px;
  border-radius: 7px;
  font-size: 13px;
  transition: background-color .16s ease, color .16s ease;
}
body.mp-center-mode .header-layer .header-layer-block a:hover {
  background: var(--c-accent-soft) !important;
  color: var(--c-accent) !important;
}
body.mp-center-mode .header-layer .header-layer-block span,
body.mp-center-mode .header-layer .header-layer-block .text-muted {
  color: var(--c-ink-3) !important;
  font-size: 12px !important;
}

/* 深色下再压一档，避免半透明卡在深色背景上发灰 */
html[data-mp-theme="dark"] body.mp-center-mode .header-layer {
  background-color: rgba(30, 28, 24, .92) !important;
}
@media (prefers-color-scheme: dark) {
  html:not([data-mp-theme="light"]) body.mp-center-mode .header-layer {
    background-color: rgba(30, 28, 24, .92) !important;
  }
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended', s.length);

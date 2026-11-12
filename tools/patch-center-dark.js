const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('/* 深色兜底：等级/收藏/短评')) {
  console.log('exists');
  process.exit(0);
}

s += `
/* ---------- 深色兜底：等级/收藏/短评等未单独设计的 tab ----------
   原站这些区域把颜色写死成 #222 / #000，深色主题下直接看不见。
   这里统一接管文本色，再单独把链接、徽章、表格恢复成可读的样式。 */

html[data-mp-theme="dark"] body.mp-center-mode .tab-content,
html[data-mp-theme="dark"] body.mp-center-mode .tab-content *:not(img):not(svg):not(path):not(use) {
  color: #e6e1d8 !important;
}

html[data-mp-theme="dark"] body.mp-center-mode .tab-content a,
html[data-mp-theme="dark"] body.mp-center-mode .tab-content a * {
  color: #7ed0a5 !important;
}

html[data-mp-theme="dark"] body.mp-center-mode .tab-content table,
html[data-mp-theme="dark"] body.mp-center-mode .tab-content thead,
html[data-mp-theme="dark"] body.mp-center-mode .tab-content tbody,
html[data-mp-theme="dark"] body.mp-center-mode .tab-content tr,
html[data-mp-theme="dark"] body.mp-center-mode .tab-content th,
html[data-mp-theme="dark"] body.mp-center-mode .tab-content td {
  background-color: transparent !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}

/* 等级徽章这类带底色的元素别被上面的规则洗掉 */
html[data-mp-theme="dark"] body.mp-center-mode .tab-content .common-user-lv,
html[data-mp-theme="dark"] body.mp-center-mode .tab-content .common-user-lv * {
  color: #fff !important;
}

/* 进度条：原站是白底 + 灰槽 */
html[data-mp-theme="dark"] body.mp-center-mode .tab-content .progress,
html[data-mp-theme="dark"] body.mp-center-mode .tab-content .progress-bar {
  background-color: rgba(255, 255, 255, 0.12) !important;
}
html[data-mp-theme="dark"] body.mp-center-mode .tab-content .progress-bar {
  background-color: #57b98a !important;
}

/* 顶栏右侧的「消息 0」等文字 */
html[data-mp-theme="dark"] body.mp-center-mode .mp-topbar .header-right,
html[data-mp-theme="dark"] body.mp-center-mode .mp-topbar .header-right *:not(img):not(svg):not(path) {
  color: #e6e1d8 !important;
}
html[data-mp-theme="dark"] body.mp-center-mode .mp-topbar .header-right a:hover,
html[data-mp-theme="dark"] body.mp-center-mode .mp-topbar .header-right a:hover * {
  color: #57b98a !important;
}

/* prefers-color-scheme 走同一套（只在用户没明确选浅色时生效） */
@media (prefers-color-scheme: dark) {
  html:not([data-mp-theme="light"]) body.mp-center-mode .tab-content,
  html:not([data-mp-theme="light"]) body.mp-center-mode .tab-content *:not(img):not(svg):not(path):not(use) {
    color: #e6e1d8 !important;
  }
  html:not([data-mp-theme="light"]) body.mp-center-mode .tab-content a,
  html:not([data-mp-theme="light"]) body.mp-center-mode .tab-content a * {
    color: #7ed0a5 !important;
  }
  html:not([data-mp-theme="light"]) body.mp-center-mode .tab-content table,
  html:not([data-mp-theme="light"]) body.mp-center-mode .tab-content th,
  html:not([data-mp-theme="light"]) body.mp-center-mode .tab-content td {
    background-color: transparent !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
  html:not([data-mp-theme="light"]) body.mp-center-mode .mp-topbar .header-right,
  html:not([data-mp-theme="light"]) body.mp-center-mode .mp-topbar .header-right *:not(img):not(svg):not(path) {
    color: #e6e1d8 !important;
  }
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended, length', s.length);

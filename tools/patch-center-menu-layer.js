const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 顶栏下拉菜单的层级与不透明底 ===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* 原站 .header-container 没有给 z-index，下拉面板是普通文档流里的绝对定位，
   而下面的 .center-header（横幅）我们给了 position:relative + 背景图，
   两者在同一层叠上下文里，后出现的横幅把菜单盖住了。
   这里把顶栏整体抬到横幅上面，并给面板单独再抬一层。 */
body.mp-center-mode .header-container,
body.mp-center-mode .mp-topbar {
  position: relative !important;
  z-index: 900 !important;
}
body.mp-center-mode .header-panel {
  position: relative;
  z-index: 901;
}
body.mp-center-mode .header-layer {
  position: relative;
  z-index: 902 !important;
}

/* 半透明 + 毛玻璃叠在星空横幅上会「透出底图」，看起来像背景图失效。
   菜单是浮层，必须不透明。 */
body.mp-center-mode .header-layer {
  background-color: #ffffff !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}
html[data-mp-theme="dark"] body.mp-center-mode .header-layer {
  background-color: #232120 !important;
}
@media (prefers-color-scheme: dark) {
  html:not([data-mp-theme="light"]) body.mp-center-mode .header-layer {
    background-color: #232120 !important;
  }
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended', s.length);

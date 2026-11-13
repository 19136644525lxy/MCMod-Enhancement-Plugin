const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 顶栏恢复 fixed 定位（原站就是 fixed + z-index:1000）===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* 原站：.header-container{padding:0 200px;position:fixed;top:0;left:0;right:0;z-index:1000}
   我之前为了「把下拉面板抬到横幅上面」，把顶栏改成了 position:relative + z-index:900，
   结果顶栏不再吸顶、整条栏跟着页面滚动，视觉上「顶部栏变了」。
   其实原站 z-index 就是 1000，本来就比横幅高，不需要抬。 */
body.mp-center-mode .header-container,
body.mp-center-mode .mp-topbar {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
}

/* 面板是 .header-panel{position:absolute;left:0;top:40px;padding-top:10px;display:none}，
   hover 时显示。不要把它或 .header-layer 改成 relative：
   那样鼠标从头像往下移的过程中会离开 hover 区域，面板立刻收起，看起来就是「点不到」。 */
body.mp-center-mode .header-panel {
  position: absolute !important;
  z-index: auto !important;
}

body.mp-center-mode .header-layer {
  position: static !important;
  z-index: auto !important;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended', s.length);

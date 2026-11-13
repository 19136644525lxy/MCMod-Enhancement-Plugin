const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 头像下拉菜单的列布局 ===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* 原站是 .header-layer{display:flex} + .header-layer-block{width:220px}，
   块内 li{display:inline-block} + li:nth-child(odd){margin-right:15px}，
   也就是「两列横排」。我给 a 加了 padding 和负 margin 之后，
   每个格子的实际宽度变了，横排就对不齐、换行乱掉。
   这里改成「每块一列、项竖排」的布局，宽度交给内容决定。 */
body.mp-center-mode .header-layer {
  display: flex !important;
  align-items: flex-start;
  gap: 26px !important;
  padding: 16px 20px !important;
  max-width: min(92vw, 760px);
}

body.mp-center-mode .header-layer .header-layer-block {
  width: auto !important;
  min-width: 148px;
  flex: 0 0 auto;
  padding: 0 !important;
  display: block !important;
}

body.mp-center-mode .header-layer .header-layer-block li {
  display: block !important;
  width: 100%;
  margin: 0 0 1px !important;
  padding: 0 !important;
  white-space: nowrap;
}
body.mp-center-mode .header-layer .header-layer-block li:nth-child(odd) {
  margin-right: 0 !important;
}

body.mp-center-mode .header-layer .header-layer-block a {
  display: block !important;
  box-sizing: border-box;
  width: 100%;
  padding: 5px 10px !important;
  margin: 0 !important;
  border-radius: 7px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--c-ink) !important;
}

body.mp-center-mode .header-layer .header-layer-block li span,
body.mp-center-mode .header-layer .header-layer-block li .text-muted {
  display: inline-block;
  margin-left: 6px;
  font-size: 11.5px !important;
  color: var(--c-ink-3) !important;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended', s.length);

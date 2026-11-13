const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 恢复原站的下拉菜单紧凑两列 ===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* 原站是「两块并排、块内两列横排」的紧凑布局：
   .header-layer{display:flex;padding:10px}
   .header-layer-block{width:220px}
   li{display:inline-block} + li:nth-child(odd){margin-right:15px}
   上一版我把它改成了竖排大列表，这里全部还原，只保留配色。 */
body.mp-center-mode .header-layer {
  display: flex !important;
  align-items: flex-start;
  gap: 0 !important;
  padding: 10px !important;
  max-width: none !important;
}

body.mp-center-mode .header-layer .header-layer-block {
  width: 220px !important;
  min-width: 0 !important;
  flex: 0 0 auto !important;
  padding: 0 !important;
  display: block !important;
}

body.mp-center-mode .header-layer .header-layer-block li {
  display: inline-block !important;
  width: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  white-space: normal !important;
  line-height: 1.9;
}
body.mp-center-mode .header-layer .header-layer-block li:nth-child(odd) {
  margin-right: 15px !important;
}

body.mp-center-mode .header-layer .header-layer-block a {
  display: inline !important;
  width: auto !important;
  padding: 0 !important;
  margin: 0 !important;
  font-size: 13px !important;
  line-height: 1.9;
  color: var(--c-ink) !important;
  background: transparent !important;
}
body.mp-center-mode .header-layer .header-layer-block a:hover {
  background: transparent !important;
  color: var(--c-accent) !important;
}

body.mp-center-mode .header-layer .header-layer-block .title {
  margin-bottom: 5px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  color: var(--c-ink-3) !important;
}

body.mp-center-mode .header-layer .header-layer-block li span,
body.mp-center-mode .header-layer .header-layer-block li .text-muted {
  display: inline !important;
  margin-left: 5px !important;
  font-size: 11.5px !important;
  color: var(--c-ink-3) !important;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended', s.length);

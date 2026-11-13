const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 下拉菜单：竖排紧凑两栏（对齐原站）===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* 原站登录态菜单是「两栏并排、每栏内部一项一行」：
   管理菜单 / 文件管理 / 主站功能 / 我的收藏 / 待审列表 / …
   而 220px 那个宽度是「主站导航」下拉的，不是这个用户菜单的。
   这里按原站的视觉结果写：每栏宽度由内容决定，项竖排、行高紧。 */
body.mp-center-mode .header-layer {
  display: flex !important;
  align-items: flex-start;
  gap: 18px !important;
  padding: 12px 16px !important;
  width: auto !important;
  max-width: none !important;
}

body.mp-center-mode .header-layer .header-layer-block {
  width: auto !important;
  min-width: 0 !important;
  flex: 0 0 auto !important;
  padding: 0 !important;
  display: block !important;
}

body.mp-center-mode .header-layer .header-layer-block li {
  display: block !important;
  width: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  white-space: nowrap !important;
  line-height: 1.8 !important;
  text-align: left !important;
}
body.mp-center-mode .header-layer .header-layer-block li:nth-child(odd) {
  margin-right: 0 !important;
}

body.mp-center-mode .header-layer .header-layer-block a {
  display: block !important;
  width: auto !important;
  padding: 0 !important;
  margin: 0 !important;
  font-size: 13px !important;
  line-height: 1.8 !important;
  text-align: left !important;
  color: var(--c-ink) !important;
  background: transparent !important;
}
body.mp-center-mode .header-layer .header-layer-block a:hover {
  background: transparent !important;
  color: var(--c-accent) !important;
}

body.mp-center-mode .header-layer .header-layer-block .title {
  display: block !important;
  margin: 0 0 4px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  color: var(--c-ink-3) !important;
  line-height: 1.8 !important;
  text-align: left !important;
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

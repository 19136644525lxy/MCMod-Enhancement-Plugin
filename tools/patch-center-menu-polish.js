const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 头像下拉菜单：排版微调 + 鼠标互动 ===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* 只作用于「头像」这一块（.header-user），
   不碰主站导航那几个 .header-menu-widget 的下拉，避免影响别处。 */

body.mp-center-mode .header-user .header-layer {
  padding: 12px 16px 14px !important;
  gap: 22px !important;
}

/* 分组标题加一条极淡的下边线，把「管理菜单 / 主站功能 / 社群功能」和链接分开 */
body.mp-center-mode .header-user .header-layer .header-layer-block .title {
  margin: 0 0 7px !important;
  padding-bottom: 6px !important;
  border-bottom: 1px solid var(--c-hair);
  letter-spacing: .05em;
}

body.mp-center-mode .header-user .header-layer .header-layer-block li {
  line-height: 1.95 !important;
}

/* 链接：默认左侧留一条 2px 的透明竖条位，hover 时变绿并右移 2px */
body.mp-center-mode .header-user .header-layer .header-layer-block a {
  position: relative;
  display: block;
  padding-left: 10px !important;
  transition: color .16s ease, transform .2s cubic-bezier(.22, 1, .36, 1);
  will-change: transform;
}
body.mp-center-mode .header-user .header-layer .header-layer-block a::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 2px;
  height: 0;
  border-radius: 2px;
  background: var(--c-accent);
  transform: translateY(-50%);
  transition: height .2s cubic-bezier(.22, 1, .36, 1);
}
body.mp-center-mode .header-user .header-layer .header-layer-block a:hover {
  color: var(--c-accent) !important;
  transform: translateX(2px);
  background: transparent !important;
}
body.mp-center-mode .header-user .header-layer .header-layer-block a:hover::before {
  height: 12px;
}

/* 右侧那条「今日收录模组：0 个」在 hover 时不跟着动 */
body.mp-center-mode .header-user .header-layer .header-layer-block li span,
body.mp-center-mode .header-user .header-layer .header-layer-block li .text-muted {
  transition: color .16s ease;
}
body.mp-center-mode .header-user .header-layer .header-layer-block li:hover span,
body.mp-center-mode .header-user .header-layer .header-layer-block li:hover .text-muted {
  color: var(--c-ink-2) !important;
}

/* 面板本身的入场：从上方 4px 落下 + 淡入，只在显示时播一次 */
@keyframes mp-menu-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: none; }
}
body.mp-center-mode .header-user:hover .header-layer,
body.mp-center-mode .header-user .header-panel:hover .header-layer {
  animation: mp-menu-in .18s cubic-bezier(.22, 1, .36, 1) both;
}
@media (prefers-reduced-motion: reduce) {
  body.mp-center-mode .header-user .header-layer,
  body.mp-center-mode .header-user .header-layer .header-layer-block a,
  body.mp-center-mode .header-user .header-layer .header-layer-block a::before {
    animation: none !important;
    transition: none !important;
  }
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended', s.length);

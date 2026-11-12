const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 名片卡下移 / 收藏格卡片化（第二轮） ===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* 名片预览卡在原站是绝对定位：.center-card-view{position:absolute;right:0;top:50px}
   所以给它自己加 padding 是没用的，得动 top。 */
body.mp-center-mode .center-card-view {
  top: 64px !important;
}
body.mp-center-mode .center-card-view .common-user-card {
  border: 1px solid var(--c-hair) !important;
  border-radius: 14px;
  background: var(--c-card-soft);
  box-shadow: var(--c-shadow);
  overflow: hidden;
}

/* 收藏的格子：不管父级是不是 .center-main.favorite，都按卡片处理。
   原站拿 border-right/bottom 10px solid #FFF 当间距，深色下就是白框。 */
body.mp-center-mode .favorite-slot-ul li {
  border-right: 10px solid transparent !important;
  border-bottom: 12px solid transparent !important;
  box-sizing: border-box !important;
  vertical-align: top;
  background: var(--c-card-soft);
  border-radius: 12px;
  padding: 8px !important;
  transition: background-color .18s ease, transform .18s ease;
}
body.mp-center-mode .favorite-slot-ul li:hover {
  background: var(--c-card);
  transform: translateY(-2px);
}

body.mp-center-mode .favorite-slot-ul li img {
  border: 0 !important;
  outline: 0 !important;
  box-shadow: none !important;
  display: block;
  border-radius: 9px;
}
body.mp-center-mode .favorite-slot-ul li .name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--c-ink);
  padding: 6px 2px 2px;
  height: auto !important;
  line-height: 1.4 !important;
}
body.mp-center-mode .favorite-slot-ul li .subname {
  font-size: 12px;
  color: var(--c-ink-3);
  padding: 0 2px 4px;
  height: auto !important;
  line-height: 1.4 !important;
}

/* 作者卡：头像圆形、名字和时间各占一行 */
body.mp-center-mode .favorite-slot-ul li img[src*="avatar"] {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  object-fit: cover;
  margin-bottom: 6px;
}

html[data-mp-theme="dark"] body.mp-center-mode .favorite-slot-ul li .name,
html[data-mp-theme="dark"] body.mp-center-mode .favorite-slot-ul li .subname {
  color: #e6e1d8 !important;
}
html[data-mp-theme="dark"] body.mp-center-mode .favorite-slot-ul li .subname {
  color: #a9a29a !important;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended, length', s.length);

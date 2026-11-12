const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 卡片去描边 / 名片卡配色 ===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* 收藏 / 作者卡片：去掉一切描边与投影，只留底色和间距 */
body.mp-center-mode .favorite-slot-ul li,
body.mp-center-mode .favorite-slot-ul li > a,
body.mp-center-mode .favorite-slot-ul li > div,
body.mp-center-mode .favorite-slot-ul li > a > *,
body.mp-center-mode .favorite-slot-ul li > div > * {
  border: 0 !important;
  box-shadow: none !important;
  outline: 0 !important;
}
body.mp-center-mode .favorite-slot-ul li {
  border-right: 10px solid transparent !important;
  border-bottom: 12px solid transparent !important;
  background: var(--c-card-soft) !important;
  border-radius: 12px !important;
}
body.mp-center-mode .favorite-slot-ul li:hover {
  background: var(--c-card) !important;
}

/* 名片预览卡内部：原站 .item 是 #f5f3f2 白灰底、exp-rate 是 #FFF，深色下全白 */
body.mp-center-mode .common-user-card .card-container .tracker-frame .block .item {
  background: var(--c-card) !important;
  color: var(--c-ink) !important;
  border-radius: 10px;
  border: 0 !important;
}
body.mp-center-mode .common-user-card .card-container .tracker-frame .block .item * {
  color: inherit !important;
}

body.mp-center-mode .common-user-card .card-userinfo .exp-rate {
  background: transparent !important;
  color: var(--c-ink-3) !important;
}

body.mp-center-mode .common-user-card .card-avatar .avatar img {
  background: transparent !important;
  border-color: var(--c-hair) !important;
}

body.mp-center-mode .common-user-card .card-userinfo .username,
body.mp-center-mode .common-user-card .card-userinfo .sign {
  color: var(--c-ink) !important;
}

body.mp-center-mode .common-user-card hr {
  border: 0;
  border-top: 1px dashed var(--c-hair) !important;
}

html[data-mp-theme="dark"] body.mp-center-mode .common-user-card .card-container .tracker-frame .block .item {
  background: rgba(255, 255, 255, .09) !important;
  color: #e6e1d8 !important;
}
html[data-mp-theme="dark"] body.mp-center-mode .common-user-card .card-userinfo .username,
html[data-mp-theme="dark"] body.mp-center-mode .common-user-card .card-userinfo .sign {
  color: #e6e1d8 !important;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended, length', s.length);

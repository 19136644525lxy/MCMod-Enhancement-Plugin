const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 收藏左侧文件夹列表 / 名片卡细化 ===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* .favorite-fold-list 是左侧那条文件夹栏（原站 width:200px、position:absolute），
   不是右侧的模组格子。原站用 #fafafa 底 + #545b62 选中，深色下很脏。 */
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list {
  padding-right: 8px;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list li {
  padding: 0 !important;
  margin-bottom: 6px;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a {
  display: block !important;
  width: 100% !important;
  padding: 9px 12px !important;
  border-radius: 12px !important;
  background: var(--c-card-soft) !important;
  border: 1px solid transparent !important;
  color: var(--c-ink) !important;
  box-sizing: border-box;
  transition: background-color .18s ease, border-color .18s ease;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a:hover {
  background: var(--c-card) !important;
  border-color: var(--c-hair) !important;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a.active {
  background: var(--c-accent) !important;
  border-color: transparent !important;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a.active .title,
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a.active .count,
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a.active span {
  color: #fff !important;
}

body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list li .title {
  height: auto !important;
  line-height: 1.5 !important;
  font-size: 13.5px;
  font-weight: 600;
  padding-left: 0 !important;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list li .count {
  height: auto !important;
  line-height: 1.5 !important;
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--c-ink-3) !important;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list li .count i {
  margin-right: 4px;
  font-size: 11px;
}

html[data-mp-theme="dark"] body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a {
  background: rgba(255, 255, 255, .06) !important;
  color: #e6e1d8 !important;
}
html[data-mp-theme="dark"] body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a:hover {
  background: rgba(255, 255, 255, .1) !important;
}
html[data-mp-theme="dark"] body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list a.active {
  background: var(--c-accent) !important;
}
html[data-mp-theme="dark"] body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-fold-list li .count {
  color: #9c958b !important;
}

/* ---- 名片卡：头像、等级条、徽章区 ---- */
body.mp-center-mode .common-user-card .card-avatar {
  height: 168px !important;
}
body.mp-center-mode .common-user-card .card-avatar .avatar img {
  width: 108px !important;
  height: 108px !important;
  margin-top: 24px !important;
  padding: 4px !important;
  border-radius: 50% !important;
  border: 1px solid var(--c-hair) !important;
  background: transparent !important;
}
body.mp-center-mode .common-user-card .card-userinfo .exp-bar {
  height: 4px !important;
  border-radius: 999px;
  background: var(--c-hair) !important;
  overflow: hidden;
}
body.mp-center-mode .common-user-card .card-userinfo .exp-bar .progress-bar {
  background: var(--c-accent) !important;
  border-radius: 999px;
}
body.mp-center-mode .common-user-card .card-container .tracker-frame .block {
  margin-bottom: 8px !important;
}
body.mp-center-mode .common-user-card .card-container .tracker-frame .block .item {
  border-radius: 10px !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
  padding: 8px 6px !important;
  white-space: normal !important;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended', s.length);

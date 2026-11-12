const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 名片下移 / 收藏白边 / 作者卡 ===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* 名片页往下让一点，别贴着 tab 条 */
body.mp-center-mode #center-page-card {
  padding-top: 14px;
  box-sizing: border-box;
}

/* 收藏卡片的「白边」其实是原站拿 10px 白边框当间距：
   .favorite-slot-ul li{width:20%;border-right:10px solid #FFF;border-bottom:10px solid #FFF}
   深色主题下这就是一圈白框，改成透明。 */
body.mp-center-mode .center-main.favorite .favorite-slot-ul li {
  border-right: 10px solid transparent !important;
  border-bottom: 12px solid transparent !important;
  box-sizing: border-box;
  vertical-align: top;
}

body.mp-center-mode .center-main.favorite .favorite-slot-ul li > a,
body.mp-center-mode .center-main.favorite .favorite-slot-ul li > div {
  display: block;
  border-radius: 12px;
  overflow: hidden;
  transition: background-color .18s ease, transform .18s ease;
}
body.mp-center-mode .center-main.favorite .favorite-slot-ul li > a:hover,
body.mp-center-mode .center-main.favorite .favorite-slot-ul li > div:hover {
  background: var(--c-card);
}

body.mp-center-mode .center-main.favorite .favorite-slot-ul li img {
  border: 0 !important;
  outline: 0 !important;
  box-shadow: none !important;
  border-radius: 10px;
  display: block;
}

body.mp-center-mode .center-main.favorite .favorite-slot-ul li .name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--c-ink);
  padding: 6px 2px 2px;
}
body.mp-center-mode .center-main.favorite .favorite-slot-ul li .subname {
  font-size: 12px;
  color: var(--c-ink-3);
  padding: 0 2px 4px;
}

/* 作者 Tab：头像统一圆形，卡片给一层淡底 */
body.mp-center-mode .center-main.favorite .favorite-slot-ul li img[src*="avatar"] {
  width: 38px !important;
  height: 38px !important;
  border-radius: 50%;
  object-fit: cover;
}

/* 左侧文件夹列表跟随主题（原站常态 #fafafa、选中 #545b62） */
body.mp-center-mode .center-main.favorite .favorite-fold-list a {
  background: var(--c-card) !important;
  color: var(--c-ink) !important;
}
body.mp-center-mode .center-main.favorite .favorite-fold-list a:hover {
  background: var(--c-card-soft) !important;
}
body.mp-center-mode .center-main.favorite .favorite-fold-list a.active {
  background: var(--c-accent) !important;
  color: #fff !important;
}
body.mp-center-mode .center-main.favorite .favorite-fold-list li .count {
  color: var(--c-ink-3);
}
body.mp-center-mode .center-main.favorite .favorite-fold-list a.active .count,
body.mp-center-mode .center-main.favorite .favorite-fold-list a.active span {
  color: #fff !important;
}

/* 文件夹信息区 */
body.mp-center-mode .center-main.favorite .favorite-fold-info .fold-cover {
  background: var(--c-card);
}
body.mp-center-mode .center-main.favorite .favorite-fold-info .fold-name {
  color: var(--c-ink);
}

/* 深色下这两块的文字 */
html[data-mp-theme="dark"] body.mp-center-mode .center-main.favorite .favorite-slot-ul li .name,
html[data-mp-theme="dark"] body.mp-center-mode .center-main.favorite .favorite-slot-ul li .subname,
html[data-mp-theme="dark"] body.mp-center-mode .center-main.favorite .favorite-fold-info .fold-name,
html[data-mp-theme="dark"] body.mp-center-mode .center-main.favorite .favorite-fold-info .fold-content {
  color: #e6e1d8 !important;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended, length', s.length);

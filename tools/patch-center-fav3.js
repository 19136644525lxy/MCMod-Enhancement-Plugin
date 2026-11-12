const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

const MARK = '/* ===== 收藏格（提高特异性）/ 页脚 ===== */';
if (s.includes(MARK)) {
  console.log('exists');
  process.exit(0);
}

s += `
${MARK}

/* 上一版输在特异性：原站是 .center-main.favorite .favorite-slot-ul li（0,4,1），
   我写的是 body.mp-center-mode .favorite-slot-ul li（0,2,1），即使加了 !important 也比不过。
   这里用 id 把权重提上去。 */
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-slot-ul li {
  border: 0 !important;
  border-right: 10px solid transparent !important;
  border-bottom: 12px solid transparent !important;
  box-sizing: border-box !important;
  background: var(--c-card-soft) !important;
  border-radius: 12px !important;
  padding: 8px !important;
  vertical-align: top;
  transition: background-color .18s ease, transform .18s ease;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-slot-ul li:hover {
  background: var(--c-card) !important;
  transform: translateY(-2px);
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-slot-ul li > a,
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-slot-ul li > div {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-slot-ul li img {
  border: 0 !important;
  box-shadow: none !important;
  border-radius: 9px;
  display: block;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-slot-ul li .name {
  height: auto !important;
  line-height: 1.45 !important;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--c-ink) !important;
  padding: 6px 2px 2px;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-slot-ul li .subname {
  height: auto !important;
  line-height: 1.45 !important;
  font-size: 12px;
  color: var(--c-ink-3) !important;
  padding: 0 2px 4px;
}
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-slot-ul li img[src*="avatar"] {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  object-fit: cover;
  margin-bottom: 4px;
}

/* ---- 页脚 ---- */
body.mp-center-mode footer {
  background: transparent !important;
  border: 0 !important;
  margin-top: 26px;
  padding: 0 !important;
  color: var(--c-ink-2);
}
body.mp-center-mode footer .container {
  background: var(--c-card-soft) !important;
  border: 0 !important;
  border-radius: 18px;
  padding: 26px 28px 18px !important;
  box-shadow: var(--c-shadow);
  box-sizing: border-box;
}
body.mp-center-mode footer h5 {
  color: var(--c-ink) !important;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
}
body.mp-center-mode footer .footer-nav a {
  color: var(--c-ink-2) !important;
  font-size: 13px;
}
body.mp-center-mode footer .footer-nav a:hover {
  color: var(--c-accent) !important;
}
body.mp-center-mode footer .text {
  color: var(--c-ink-3) !important;
  font-size: 12.5px;
  line-height: 1.75;
  margin-top: 10px;
}
body.mp-center-mode footer .logo {
  border-radius: 10px;
}
body.mp-center-mode footer .copyright,
body.mp-center-mode footer .footer-copyright,
body.mp-center-mode footer p {
  color: var(--c-ink-3) !important;
  font-size: 12px;
}

html[data-mp-theme="dark"] body.mp-center-mode footer .text,
html[data-mp-theme="dark"] body.mp-center-mode footer .copyright,
html[data-mp-theme="dark"] body.mp-center-mode footer .footer-copyright,
html[data-mp-theme="dark"] body.mp-center-mode footer p {
  color: #9c958b !important;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended, length', s.length);

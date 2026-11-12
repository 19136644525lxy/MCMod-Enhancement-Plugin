const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

if (!s.includes('底板透明')) {
  s += `

/* 底板透明：原站 .common-frame / .center 自己带一层浅色底，
   把背景图和背景层整块盖住了。这里只清 background-color，
   不动 background-image（.center-header 的横幅图还得留着）。 */
body.mp-center-mode .common-frame,
body.mp-center-mode .common-center,
body.mp-center-mode .center.center-frame,
body.mp-center-mode .tab-content,
body.mp-center-mode .common-menu-area,
body.mp-center-mode #center-page-home,
body.mp-center-mode .center-main {
  background-color: transparent !important;
  background-image: none !important;
}

/* 未重绘的区域（等级 / 收藏 / 短评等）也给一层同款毛玻璃，不然会突然变成白板 */
body.mp-center-mode .tab-content > .tab-pane {
  border-radius: var(--c-radius);
}
`;
}

fs.writeFileSync(p, s, 'utf8');
console.log('added:', s.includes('底板透明'));

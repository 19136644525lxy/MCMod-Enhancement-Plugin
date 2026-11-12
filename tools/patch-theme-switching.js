const fs = require('fs');
const p = 'styles/base.css';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('mp-theme-switching')) {
  console.log('exists');
  process.exit(0);
}

s += `
/* 主题切换的那两帧：把过渡全停掉。
   颜色变量、渐变、backdrop-filter 混在一起时，让 background-color 单独过渡
   会出现「一半已经变暗、一半还是浅色」的中间态。 */
html.mp-theme-switching,
html.mp-theme-switching *,
html.mp-theme-switching *::before,
html.mp-theme-switching *::after {
  transition: none !important;
  animation-duration: 0s !important;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended', s.length);

const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('.mp-act-origin-titles')) {
  console.log('exists');
  process.exit(0);
}

s += `
/* 原站自带的「活跃度」标题保留，但要跟着主题变色 */
body.mp-center-mode .mp-chart-frame.mp-act-origin-titles .title-main {
  color: var(--c-ink) !important;
  font-size: 14px;
}
body.mp-center-mode .mp-chart-frame.mp-act-origin-titles .title-sub {
  color: var(--c-ink-3) !important;
  font-size: 12px;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended');

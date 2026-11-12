const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('/* hr: 全部隐藏 */')) {
  console.log('already patched');
  process.exit(0);
}

s += `

/* hr: 全部隐藏 */
/* 原站每块之间用 <hr/> 分隔，而且是 .center-total 的兄弟节点，
   之前写 .mp-center-total > hr 选不中，统计条下面那条线一直留着。 */
body.mp-center-mode .center-total + hr,
body.mp-center-mode #center-page-home > hr,
body.mp-center-mode .center-main > hr,
body.mp-center-mode .center-main hr,
body.mp-center-mode .center-frame hr {
  display: none !important;
  border: 0 !important;
  height: 0 !important;
  margin: 0 !important;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended, has rule', s.includes('center-total + hr'));

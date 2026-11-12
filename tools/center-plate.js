const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('统一父容器底色')) {
  console.log('already patched');
  process.exit(0);
}

s += `

/* ---------- 统一父容器底色 ----------
   卡片之间露出的缝隙会透出背景图，看起来像被切开。
   给两组卡片（统计条 + 内容块）各套一个更淡的底，缝隙就落在同一块板子上。 */

body.mp-center-mode .mp-center-total {
  background: var(--c-card-soft);
  border-radius: var(--c-radius);
  padding: 10px;
  margin-bottom: 14px;
}

body.mp-center-mode .mp-center-total > ul {
  margin: 0;
}

body.mp-center-mode .center-main {
  background: var(--c-card-soft);
  border-radius: var(--c-radius);
  padding: 10px;
}

body.mp-center-mode .center-main > .mp-center-block {
  margin-bottom: 10px;
}

body.mp-center-mode .center-main > .mp-center-block:last-child {
  margin-bottom: 0;
}

/* 父容器有底了，卡片自身就不要再叠一层同样浓的底，
   否则两层半透明相加会发灰。 */
body.mp-center-mode .mp-center-total > ul > li,
body.mp-center-mode .mp-center-block {
  background: var(--c-card);
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended, braces', (s.match(/{/g) || []).length, (s.match(/}/g) || []).length);

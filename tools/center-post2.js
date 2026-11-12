const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('原站 .post-block 是 inline-block')) {
  console.log('already patched');
  process.exit(0);
}

s += `

/* 原站 .post-block 是 inline-block + width:12.5%（竖向小卡）。
   我改成 flex 横排时没盖掉这个宽度，结果封面把 12.5% 撑满，右侧文字被压成 0 宽。
   这里把宽度、内边距、文字裁切全部复位。 */
body.mp-center-mode .mp-center-block .post-list .post-block {
  width: 100% !important;
  padding-right: 0;
  box-sizing: border-box;
}

body.mp-center-mode .mp-center-block .post-list .post-block .info .title,
body.mp-center-mode .mp-center-block .post-list .post-block .info .other {
  height: auto;
  line-height: 1.45;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}

body.mp-center-mode .mp-center-block .post-list .post-block .info .other {
  position: static;
}

body.mp-center-mode .mp-center-block .post-list .post-block .info .other .time {
  position: static;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended, braces', (s.match(/{/g) || []).length, (s.match(/}/g) || []).length);

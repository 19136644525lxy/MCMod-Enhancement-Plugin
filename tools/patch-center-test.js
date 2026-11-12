const fs = require('fs');
const p = 'tools/test-center.js';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes('顶栏设置齿轮')) {
  const anchor = "ok('编辑动态列表', !!w.document.querySelector('.mp-edit-list'));";
  if (!s.includes(anchor)) {
    console.error('anchor missing');
    process.exit(1);
  }
  s = s.replace(anchor, anchor +
    "\nok('顶栏设置齿轮', !!w.document.querySelector('.header-right #mp-center-gear'));" +
    "\nok('顶栏齿轮用 mp-gear-btn 样式', !!w.document.querySelector('.header-right .mp-gear-btn'));");
  fs.writeFileSync(p, s, 'utf8');
}
console.log('patched:', fs.readFileSync(p, 'utf8').includes('顶栏设置齿轮'));

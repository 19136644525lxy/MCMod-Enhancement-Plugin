const fs = require('fs');
const p = 'src/content/render/pages/center.js';
let s = fs.readFileSync(p, 'utf8');

const anchor = `    unbindLightbox();
    const sw = document.getElementById('mp-daynight');`;

const repl = `    // 恢复原站活跃度图表：我们把它 display:none 了，切回原始视图必须还原，
    // 否则站点自己的 ECharts 永远不出现，只剩一片空白。
    const chartObj = document.getElementById('center-editchart-obj');
    if (chartObj) chartObj.style.display = '';
    const actHost = document.getElementById('mp-activity');
    if (actHost && actHost.parentNode) actHost.parentNode.removeChild(actHost);
    const chartFrame = document.querySelector('.mp-chart-frame');
    if (chartFrame) chartFrame.classList.remove('mp-act-origin-titles');
    actKey = '';
    actBusy = false;
    actToken++;

    unbindLightbox();
    const sw = document.getElementById('mp-daynight');`;

if (s.indexOf('恢复原站活跃度图表') >= 0) {
  console.log('already patched');
  process.exit(0);
}
if (s.indexOf(anchor) < 0) {
  console.log('anchor missing');
  process.exit(1);
}
s = s.replace(anchor, repl);
fs.writeFileSync(p, s, 'utf8');
console.log('patched');

const fs = require('fs');
const p = 'src/content/render/pages/center.js';
let s = fs.readFileSync(p, 'utf8');

// 1) 跨度上限放宽，允许更长的历史
s = s.replace('weeks = Math.max(26, Math.min(140, weeks));', 'weeks = Math.max(26, Math.min(180, weeks));');

// 2) 回补段数放宽（每段 92 天，16 段约 4 年）
s = s.replace('    var total = 12;', '    var total = 16;');
s = s.replace("paintActivity(host, days, { progress: '0/12' });", "paintActivity(host, days, { progress: '0/16' });");

// 3) 悬停提示：在 body 末尾挂一个跟随鼠标的小气泡
if (!s.includes('mp-act-tip')) {
  s = s.replace(
    "    host.querySelector('.mp-act-body').innerHTML =",
    "    ensureTip();\n\n    host.querySelector('.mp-act-body').innerHTML ="
  );

  s = s.replace(
    "  function ymd(d) {",
    `  // 悬停提示：格子太小时原生 title 要等一秒，这里自己画一个
  var tipEl = null;

  function ensureTip() {
    if (tipEl && document.body.contains(tipEl)) return tipEl;
    tipEl = document.createElement('div');
    tipEl.className = 'mp-act-tip';
    document.body.appendChild(tipEl);
    return tipEl;
  }

  function moveTip(ev) {
    if (!tipEl || !tipEl.classList.contains('is-on')) return;
    tipEl.style.left = (ev.clientX + 12) + 'px';
    tipEl.style.top = (ev.clientY - 10) + 'px';
  }

  function ymd(d) {`
  );

  s = s.replace(
    "      host.addEventListener('click', function (ev) {",
    `      host.addEventListener('mouseover', function (ev) {
        var cell = ev.target && ev.target.closest && ev.target.closest('.mp-act-cell');
        if (!cell) return;
        var tip = ensureTip();
        var bits = (cell.getAttribute('title') || '').split(' · ');
        tip.textContent = bits[0] + (bits[1] ? ' · ' + bits[1] : '');
        tip.classList.add('is-on');
      });

      host.addEventListener('mouseout', function (ev) {
        var cell = ev.target && ev.target.closest && ev.target.closest('.mp-act-cell');
        if (!cell || !tipEl) return;
        tipEl.classList.remove('is-on');
      });

      host.addEventListener('mousemove', moveTip);

      host.addEventListener('click', function (ev) {`
  );
}

fs.writeFileSync(p, s, 'utf8');
console.log('weeks 180:', s.includes('Math.min(180, weeks)'), '| total 16:', s.includes('var total = 16;'), '| tip:', s.includes('mp-act-tip'));

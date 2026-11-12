const fs = require('fs');
const p = 'src/content/render/pages/center.js';
let s = fs.readFileSync(p, 'utf8');

const start = s.indexOf('  function paintActivity(host, days, state) {');
const end = s.indexOf('  function ymd(d) {');
if (start < 0 || end < 0) {
  console.log('anchors missing');
  process.exit(1);
}

const impl = `  function paintActivity(host, days, state) {
    state = state || {};
    var counts = {};
    days.forEach(function (d) { counts[d] = (counts[d] || 0) + 1; });

    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var dow = (now.getDay() + 6) % 7; // 周一 = 0
    var end = new Date(now.getTime() - dow * 86400000);

    // 周数按「最早一条记录 -> 今天」算，别再固定 26 周把更早的数据丢掉
    var first = days.slice().sort()[0];
    var weeks = 26;
    if (first) {
      var span = end.getTime() - new Date(first + 'T00:00:00+08:00').getTime();
      weeks = Math.ceil(span / (7 * 86400000)) + 1;
    }
    weeks = Math.max(26, Math.min(140, weeks));

    // 格子尺寸跟着周数和容器宽度走，最小 8px，避免溢出
    var hostW = host.clientWidth || 900;
    var cell = Math.floor((hostW - weeks * 3) / weeks);
    cell = Math.max(8, Math.min(13, cell));

    var cells = [];
    var total = 0;
    var active = 0;
    for (var w = weeks - 1; w >= 0; w--) {
      for (var d = 0; d < 7; d++) {
        var date = new Date(end.getTime() - (w * 7 + (6 - d)) * 86400000);
        var key = date.toISOString().slice(0, 10);
        var n = counts[key] || 0;
        if (n > 0) { total += n; active++; }
        var lv = n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3;
        cells.push('<i class="mp-act-cell" data-lv="' + lv + '" style="--cell:' + cell + 'px" title="' + key + ' · ' + n + ' 次"></i>');
      }
    }

    var status = state.progress
      ? '补全中 ' + state.progress
      : state.note === '全部'
        ? '全部 ' + total + ' 次'
        : total + ' 次';

    host.querySelector('.mp-act-body').innerHTML =
      '<div class="mp-act-scroll"><div class="mp-act-grid" style="--cell:' + cell + 'px">' + cells.join('') + '</div></div>' +
      '<div class="mp-act-foot">' +
        '<span>近 ' + weeks + ' 周 · ' + active + ' 天有记录 · ' + status + '</span>' +
        '<span class="mp-act-actions">' +
          '<button class="mp-act-refresh" type="button" title="重新抓取">刷新</button>' +
          '<span class="mp-act-legend"><i data-lv="0"></i><i data-lv="1"></i><i data-lv="2"></i><i data-lv="3"></i><b>多</b></span>' +
        '</span>' +
      '</div>';
  }

`;

s = s.slice(0, start) + impl + s.slice(end);
fs.writeFileSync(p, s, 'utf8');
console.log('paint rewritten, has mp-act-scroll:', s.includes('mp-act-scroll'));

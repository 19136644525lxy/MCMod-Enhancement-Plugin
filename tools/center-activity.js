const fs = require('fs');
const p = 'src/content/render/pages/center.js';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('function ensureActivity')) {
  console.log('already patched');
  process.exit(0);
}

// 1) mark() 里调用
s = s.replace(
  '    ensureGear();\n    ensureDayNight();',
  '    ensureGear();\n    ensureDayNight();\n    try { ensureActivity(); } catch (e) {}'
);

// 2) 插入实现（放在 ensureGear 之前）
const anchor = '  function ensureGear(';
const impl = `  // 活跃度：原站是 ECharts 画的，深色主题下是一整块白底。
  // 这里把它藏掉，用 history.html 的真实编辑记录重画一张热力图。
  // 数据与首页「我的足迹」同源，所以两边是一致的。
  var actKey = '';

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function activityUrl(uid) {
    return 'https://www.mcmod.cn/history.html?userid=' + uid;
  }

  function collectDays(doc) {
    var out = [];
    var lis = doc.querySelectorAll('.history-list li');
    for (var i = 0; i < lis.length; i++) {
      var t = lis[i].querySelector('.time');
      var txt = t ? (t.textContent || '') : '';
      var m = /(\\d{4})-(\\d{2})-(\\d{2})/.exec(txt);
      if (m) out.push(m[1] + '-' + m[2] + '-' + m[3]);
    }
    return out;
  }

  function paintActivity(host, days) {
    var counts = {};
    days.forEach(function (d) { counts[d] = (counts[d] || 0) + 1; });

    var WEEKS = 26;
    var cells = [];
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var dow = (now.getDay() + 6) % 7; // 周一 = 0
    var end = new Date(now.getTime() - dow * 86400000);

    var total = 0;
    var active = 0;
    for (var w = WEEKS - 1; w >= 0; w--) {
      for (var d = 0; d < 7; d++) {
        var date = new Date(end.getTime() - (w * 7 + (6 - d)) * 86400000);
        var key = date.toISOString().slice(0, 10);
        var n = counts[key] || 0;
        if (n > 0) { total += n; active++; }
        var lv = n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3;
        cells.push('<i class="mp-act-cell" data-lv="' + lv + '" title="' + key + ' · ' + n + ' 次"></i>');
      }
    }

    host.querySelector('.mp-act-body').innerHTML =
      '<div class="mp-act-grid">' + cells.join('') + '</div>' +
      '<div class="mp-act-foot">' +
        '<span>近 26 周 · ' + total + ' 次编辑 · ' + active + ' 天有记录</span>' +
        '<span class="mp-act-legend"><i data-lv="0"></i><i data-lv="1"></i><i data-lv="2"></i><i data-lv="3"></i><b>多</b></span>' +
      '</div>';
  }

  function ensureActivity() {
    var frame = document.querySelector('.mp-chart-frame');
    if (!frame) return;
    if (!/\\/\\d+\\/?$/.test(location.pathname)) return;

    var uid = (location.pathname.match(/(\\d+)/) || [])[1];
    if (!uid) return;
    if (actKey === uid && frame.querySelector('#mp-activity')) return;
    actKey = uid;

    var obj = frame.querySelector('#center-editchart-obj');
    if (obj) obj.style.display = 'none';

    var host = frame.querySelector('#mp-activity');
    if (!host) {
      host = document.createElement('div');
      host.id = 'mp-activity';
      host.className = 'mp-activity';
      host.innerHTML = '<div class="mp-act-head"><b>活跃度</b><span>历史成功完成改动操作的次数</span></div><div class="mp-act-body">载入中…</div>';
      frame.appendChild(host);
    }

    if (!MP.page || !MP.page.fetchDoc) {
      host.querySelector('.mp-act-body').textContent = '增强视图未就绪';
      return;
    }
    MP.page.fetchDoc(activityUrl(uid)).then(function (doc) {
      paintActivity(host, collectDays(doc));
    }).catch(function () {
      host.querySelector('.mp-act-body').textContent = '活跃度载入失败';
    });
  }

`;

if (s.indexOf(anchor) < 0) {
  console.log('anchor missing');
  process.exit(1);
}
s = s.replace(anchor, impl + anchor);

fs.writeFileSync(p, s, 'utf8');
console.log('patched, has ensureActivity:', s.includes('function ensureActivity'));

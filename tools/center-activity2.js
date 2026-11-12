const fs = require('fs');
const p = 'src/content/render/pages/center.js';
let s = fs.readFileSync(p, 'utf8');

const startMarker = '  // 活跃度：原站是 ECharts 画的';
const endMarker = '  function ensureGear(';

const i = s.indexOf(startMarker);
const j = s.indexOf(endMarker);
if (i < 0 || j < 0 || j < i) {
  console.log('anchors missing', i, j);
  process.exit(1);
}

const impl = `  // 活跃度：原站是 ECharts 画的，深色主题下是一整块白底。
  // 这里把它藏掉，用 history.html 的真实编辑记录重画一张热力图。
  // 数据与首页「我的足迹」同源，所以两边是一致的。
  var actKey = '';
  var actToken = 0;

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

  function paintActivity(host, days, state) {
    state = state || {};
    var counts = {};
    days.forEach(function (d) { counts[d] = (counts[d] || 0) + 1; });

    var WEEKS = 26;
    var cells = [];
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var dow = (now.getDay() + 6) % 7;
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

    var status = state.progress
      ? '补全中 ' + state.progress
      : state.note === '全部'
        ? '全部 ' + total + ' 次'
        : total + ' 次';

    host.querySelector('.mp-act-body').innerHTML =
      '<div class="mp-act-grid">' + cells.join('') + '</div>' +
      '<div class="mp-act-foot">' +
        '<span>近 26 周 · ' + active + ' 天有记录 · ' + status + '</span>' +
        '<span class="mp-act-actions">' +
          '<button class="mp-act-refresh" type="button" title="重新抓取">刷新</button>' +
          '<span class="mp-act-legend"><i data-lv="0"></i><i data-lv="1"></i><i data-lv="2"></i><i data-lv="3"></i><b>多</b></span>' +
        '</span>' +
      '</div>';
  }

  function ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function readCache(key) {
    return new Promise(function (resolve) {
      try {
        chrome.storage.local.get([key], function (o) { resolve(o && o[key]); });
      } catch (e) { resolve(null); }
    });
  }

  function writeCache(key, days, partial) {
    try {
      chrome.storage.local.set({ [key]: { days: days, partial: !!partial, at: Date.now() } });
    } catch (e) {}
  }

  function clearCache(key) {
    try { chrome.storage.local.remove([key]); } catch (e) {}
  }

  // 分段回补：history.html 一次只给 100 条，用 starttime/endtime 按季度往前翻。
  // 间隔 600ms，最多 12 段，连续两段空就停——不会形成高频访问特征。
  function backfill(uid, firstDays, onProgress, done) {
    var earliest = firstDays.slice().sort()[0];
    var all = firstDays.slice();
    var guard = 0;
    var misses = 0;
    var total = 12;

    function step() {
      guard++;
      if (guard > total || misses >= 2 || !earliest) {
        done(all);
        return;
      }
      if (onProgress) onProgress(guard, total);

      var end = new Date(earliest + 'T00:00:00+08:00');
      var start = new Date(end.getTime() - 92 * 86400000);
      var s = Math.floor(start.getTime() / 1000);
      var e = Math.floor(end.getTime() / 1000);

      MP.page.fetchDoc('https://www.mcmod.cn/history.html?userid=' + uid + '&starttime=' + s + '&endtime=' + e)
        .then(function (res) {
          if (!res || !res.ok || !res.doc) throw new Error('FETCH_FAILED');
          var got = collectDays(res.doc);
          if (got.length) {
            misses = 0;
            got.forEach(function (d) { if (all.indexOf(d) < 0) all.push(d); });
            var min = got.slice().sort()[0];
            if (min && min < earliest) earliest = min;
          } else {
            misses++;
          }
          setTimeout(step, 600);
        })
        .catch(function () {
          done(all);
        });
    }

    setTimeout(step, 600);
  }

  function ensureActivity() {
    var frame = document.querySelector('.mp-chart-frame');
    if (!frame) return;
    if (!/\\/\\d+\\/?$/.test(location.pathname)) return;

    var uid = (location.pathname.match(/(\\d+)/) || [])[1];
    if (!uid) return;

    frame.classList.add('mp-act-origin-titles');

    var obj = frame.querySelector('#center-editchart-obj');
    if (obj) obj.style.display = 'none';

    var host = frame.querySelector('#mp-activity');
    if (!host) {
      host = document.createElement('div');
      host.id = 'mp-activity';
      host.className = 'mp-activity';
      host.innerHTML = '<div class="mp-act-body">载入中…</div>';
      frame.appendChild(host);

      host.addEventListener('click', function (ev) {
        var btn = ev.target && ev.target.closest && ev.target.closest('.mp-act-refresh');
        if (!btn) return;
        ev.preventDefault();
        run(true);
      });
    }

    if (!MP.page || !MP.page.fetchDoc) {
      host.querySelector('.mp-act-body').textContent = '增强视图未就绪';
      return;
    }

    var cacheKey = 'mp:act:' + uid;
    var myToken = ++actToken;

    function run(force) {
      actToken++;
      myToken = actToken;

      function alive() { return myToken === actToken; }

      if (force) clearCache(cacheKey);

      var body = host.querySelector('.mp-act-body');
      body.textContent = '载入中…';

      readCache(cacheKey).then(function (hit) {
        if (!alive()) return null;
        if (hit && hit.days && hit.days.length && !force) {
          paintActivity(host, hit.days, { note: hit.partial ? '' : '全部' });
          return null;
        }
        return MP.page.fetchDoc(activityUrl(uid)).then(function (res) {
          if (!res || !res.ok || !res.doc) throw new Error('FETCH_FAILED');
          var days = collectDays(res.doc);
          if (!alive()) return null;
          paintActivity(host, days, { progress: '0/12' });
          return days;
        });
      }).then(function (first) {
        if (!first || !first.length || !alive()) return;
        backfill(uid, first, function (n, t) {
          if (alive()) paintActivity(host, first, { progress: n + '/' + t });
        }, function (allDays) {
          if (!alive()) return;
          paintActivity(host, allDays, { note: '全部' });
          writeCache(cacheKey, allDays, false);
        });
      }).catch(function () {
        if (myToken === actToken) body.textContent = '活跃度载入失败';
      });
    }

    if (actKey === uid && host.querySelector('.mp-act-grid')) return;
    actKey = uid;
    run(false);
  }

`;

s = s.slice(0, i) + impl + s.slice(j);
fs.writeFileSync(p, s, 'utf8');
console.log('rewritten, len', s.length);

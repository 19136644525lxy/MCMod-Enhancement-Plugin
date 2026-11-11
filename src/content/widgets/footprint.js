/**
 * 我的足迹（编辑热力图）
 *
 * 数据只有一处：www.mcmod.cn/history.html?userid=<uid>
 * 该页面服务端直出「最近 100 条」编辑记录，带精确到秒的时间戳，
 * 因此可以按天聚合画热力图，不需要请求任何接口。
 *
 * 防 WAF：
 *   - 只发 1 次请求（整页 HTML），且必须经过 bg.js 的 mp:fetchPage 白名单；
 *   - 结果写入 chrome.storage.local，6 小时内不再请求；
 *   - 未登录 / 拿不到 uid 时直接跳过，不发请求。
 */
(function () {
  'use strict';

  var MP = window.MP;
  if (!MP) return;

  var WEEKS = 20;
  var CACHE_KEY = 'mp:footprint';
  var TTL = 6 * 60 * 60 * 1000; // 6 小时

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function dayKey(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function parseYmd(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  /** 从 history.html 里解析编辑记录 */
  function parseHistory(text) {
    var doc = new DOMParser().parseFromString(text, 'text/html');
    var lis = doc.querySelectorAll('.history-list li');
    var out = [];
    for (var i = 0; i < lis.length; i++) {
      var li = lis[i];
      var tm = li.querySelector('.time');
      var m = tm ? /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/.exec(tm.textContent) : null;
      if (!m) continue;

      var body = li.textContent || '';
      var action = 'edit';
      if (body.indexOf('添加了') !== -1) action = 'add';
      else if (body.indexOf('更新了') !== -1) action = 'update';
      else if (body.indexOf('删除了') !== -1) action = 'remove';

      // 目标链接：优先 item，其次 class / post / modpack
      var target = null;
      var links = li.querySelectorAll('a[href]');
      for (var k = 0; k < links.length; k++) {
        var href = links[k].getAttribute('href') || '';
        if (/\/(item\/\d+|class\/\d+|post\/\d+|modpack\/\d+)\.html/.test(href)) {
          if (!target || /\/item\//.test(href)) target = links[k];
        }
      }

      out.push({
        date: m[1],
        time: m[2],
        action: action,
        title: target ? (target.textContent || '').trim() : '',
        href: target ? MP.dom.absUrl(target.getAttribute('href')) : ''
      });
    }
    return out;
  }

  function statsFrom(list) {
    var byDay = Object.create(null);
    var mods = Object.create(null);
    var latest = '';

    list.forEach(function (r) {
      byDay[r.date] = (byDay[r.date] || 0) + 1;
      if (r.href) mods[r.href] = 1;
      if (!latest || r.date > latest) latest = r.date;
    });

    var today = new Date();
    var d30 = new Date(today.getTime() - 29 * 86400000);
    var d90 = new Date(today.getTime() - 89 * 86400000);

    var n30 = 0, n90 = 0;
    list.forEach(function (r) {
      var d = parseYmd(r.date);
      if (!d) return;
      if (d >= d30) n30++;
      if (d >= d90) n90++;
    });

    // 连续天数：从最近一条记录所在日往回数
    var streak = 0;
    if (latest) {
      var cur = parseYmd(latest);
      while (cur && byDay[dayKey(cur)]) {
        streak++;
        cur = new Date(cur.getTime() - 86400000);
      }
    }

    return {
      total: list.length,
      days: Object.keys(byDay).length,
      mods: Object.keys(mods).length,
      n30: n30,
      n90: n90,
      streak: streak,
      latest: latest,
      byDay: byDay
    };
  }

  /** 生成热力图单元格：返回 {weeks: [[{date,count}|null]]} */
  function buildGrid(byDay) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    // 对齐到本周周一
    var end = new Date(today.getTime());
    var dow = (end.getDay() + 6) % 7; // 周一=0
    end = new Date(end.getTime() - dow * 86400000);

    var start = new Date(end.getTime() - (WEEKS - 1) * 7 * 86400000);
    var weeks = [];
    var total = 0;

    for (var w = 0; w < WEEKS; w++) {
      var col = [];
      for (var d = 0; d < 7; d++) {
        var cur = new Date(start.getTime() + (w * 7 + d) * 86400000);
        if (cur > today) { col.push(null); continue; }
        var key = dayKey(cur);
        var n = byDay[key] || 0;
        total += n;
        col.push({ date: key, count: n });
      }
      weeks.push(col);
    }
    return { weeks: weeks, total: total, start: start, end: end };
  }

  function level(n) {
    if (!n) return 0;
    if (n === 1) return 1;
    if (n <= 3) return 2;
    return 3;
  }

  function renderHeat(host, grid) {
    var wrap = host.querySelector('.mp-fp-heat');
    if (!wrap) return;
    MP.dom.clear(wrap);

    var months = host.querySelector('.mp-fp-months');
    if (months) MP.dom.clear(months);

    var table = document.createElement('div');
    table.className = 'mp-fp-grid';

    var lastMonth = -1;
    grid.weeks.forEach(function (col, ci) {
      var cellCol = document.createElement('div');
      cellCol.className = 'mp-fp-col';
      col.forEach(function (cell) {
        var el = document.createElement('i');
        el.className = 'mp-fp-cell';
        if (!cell) {
          el.classList.add('is-empty');
        } else {
          el.setAttribute('data-lv', String(level(cell.count)));
          el.title = cell.date + (cell.count ? ' · ' + cell.count + ' 次编辑' : ' · 无记录');
        }
        cellCol.appendChild(el);
      });
      table.appendChild(cellCol);

      // 月份标签：取该列第一天
      var first = col.filter(Boolean)[0];
      if (first && months) {
        var m = parseYmd(first.date).getMonth();
        if (m !== lastMonth) {
          lastMonth = m;
          var lab = document.createElement('span');
          lab.className = 'mp-fp-month';
          lab.style.left = (ci * 15) + 'px';
          lab.textContent = (m + 1) + '月';
          months.appendChild(lab);
        }
      }
    });

    wrap.appendChild(table);
  }

  function fmtDate(s) { return s ? s.slice(5).replace('-', '/') : '—'; }

  /** 填充卡片（异步） */
  function fill(host, list) {
    var st = statsFrom(list);
    var grid = buildGrid(st.byDay);

    var num = function (cls, v, label) {
      return MP.dom.h('div', { class: 'mp-fp-stat' },
        MP.dom.h('b', { class: 'mp-fp-num ' + cls }, String(v)),
        MP.dom.h('span', { class: 'mp-fp-label' }, label)
      );
    };

    var side = host.querySelector('.mp-fp-stats');
    if (side) {
      MP.dom.clear(side);
      side.appendChild(num('', st.n30, '近 30 天'));
      side.appendChild(num('', st.streak, '连续天数'));
      side.appendChild(num('', st.mods, '涉及条目'));
      side.appendChild(num('', st.days, '有记录的天数'));
    }

    var note = host.querySelector('.mp-fp-note');
    if (note) {
      note.textContent = '最近 ' + st.total + ' 条记录 · 最后一次 ' + fmtDate(st.latest);
    }

    renderHeat(host, grid);

    var recent = host.querySelector('.mp-fp-recent');
    if (recent) {
      MP.dom.clear(recent);
      list.slice(0, 4).forEach(function (r) {
        var tag = r.action === 'add' ? '新增' : r.action === 'update' ? '更新' : r.action === 'remove' ? '删除' : '编辑';
        recent.appendChild(MP.dom.h('li', { class: 'mp-fp-line' },
          MP.dom.h('span', { class: 'mp-fp-tag is-' + r.action }, tag),
          r.href
            ? MP.dom.h('a', { href: r.href, target: '_blank', rel: 'noopener' }, r.title || '条目')
            : MP.dom.h('span', null, r.title || '条目'),
          MP.dom.h('span', { class: 'mp-fp-time' }, fmtDate(r.date))
        ));
      });
    }

    host.classList.add('is-ready');
  }

  function fail(host, reason) {
    var note = host.querySelector('.mp-fp-note');
    if (note) note.textContent = reason;
    host.classList.add('is-failed');
  }

  /** 入口：只发一次请求，且有 6 小时本地缓存 */
  function load(host, uid, opts) {
    opts = opts || {};
    var force = !!opts.force;

    try {
      chrome.storage.local.get(CACHE_KEY, function (res) {
        var hit = res && res[CACHE_KEY];
        if (!force && hit && hit.uid === uid && Date.now() - hit.at < TTL) {
          fill(host, hit.list);
          return;
        }
        request(host, uid);
      });
    } catch (e) {
      request(host, uid);
    }
  }

  function request(host, uid) {
    var url = 'https://www.mcmod.cn/history.html?userid=' + encodeURIComponent(uid);

    chrome.runtime.sendMessage({ type: 'mp:fetchPage', url: url }, function (res) {
      if (chrome.runtime.lastError || !res || !res.ok) {
        fail(host, '足迹暂时读不到（' + ((res && res.error) || '网络异常') + '）');
        return;
      }
      var list = parseHistory(res.text);
      if (!list.length) {
        fail(host, '没有找到编辑记录');
        return;
      }
      fill(host, list);
      try {
        chrome.storage.local.set({ [CACHE_KEY]: { uid: uid, at: Date.now(), list: list } });
      } catch (e) { /* 忽略 */ }
    });
  }

  MP.footprint = { load: load, parseHistory: parseHistory, statsFrom: statsFrom, buildGrid: buildGrid };
})();

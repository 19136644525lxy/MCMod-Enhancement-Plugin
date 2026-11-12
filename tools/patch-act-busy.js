const fs = require('fs');
const p = 'src/content/render/pages/center.js';
let s = fs.readFileSync(p, 'utf8');

// 1) 增加 busy 标志，避免 MutationObserver 反复触发 mark() 时把正在进行的请求全部作废
if (!s.includes('var actBusy = false;')) {
  s = s.replace('  var actKey = \'\';\n  var actToken = 0;', '  var actKey = \'\';\n  var actToken = 0;\n  var actBusy = false;');
}

// 2) ensureActivity 入口：已经在跑就直接返回
s = s.replace(
  "    if (!MP.page || !MP.page.fetchDoc) {\n      host.querySelector('.mp-act-body').textContent = '增强视图未就绪';\n      return;\n    }",
  "    if (!MP.page || !MP.page.fetchDoc) {\n      host.querySelector('.mp-act-body').textContent = '增强视图未就绪';\n      return;\n    }\n\n    // mark() 会被 MutationObserver 反复调用，这里必须拦住，\n    // 否则每调一次 actToken 就 +1，上一轮的请求全部作废，界面永远停在「载入中」\n    if (actBusy) return;"
);

// 3) run() 内部置位/复位
s = s.replace(
  "    function run(force) {\n      actToken++;\n      myToken = actToken;",
  "    function run(force) {\n      actBusy = true;\n      actToken++;\n      myToken = actToken;"
);

s = s.replace(
  "        }, function (allDays) {\n          if (!alive()) return;\n          paintActivity(host, allDays, { note: '全部' });\n          writeCache(cacheKey, allDays, false);\n        });",
  "        }, function (allDays) {\n          actBusy = false;\n          if (!alive()) return;\n          paintActivity(host, allDays, { note: '全部' });\n          writeCache(cacheKey, allDays, false);\n        });"
);

s = s.replace(
  "      }).catch(function () {\n        if (myToken === actToken) body.textContent = '活跃度载入失败';\n      });",
  "      }).catch(function () {\n        actBusy = false;\n        if (myToken === actToken) body.textContent = '活跃度载入失败';\n      });"
);

fs.writeFileSync(p, s, 'utf8');
console.log('busy guard:', s.includes('var actBusy = false;'), s.includes('if (actBusy) return;'), s.includes('actBusy = false;'));

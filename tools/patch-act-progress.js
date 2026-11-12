const fs = require('fs');
const p = 'src/content/render/pages/center.js';
let s = fs.readFileSync(p, 'utf8');

s = s.replace('if (onProgress) onProgress(guard, total);', 'if (onProgress) onProgress(guard, total, all);');

s = s.replace(
  "        backfill(uid, first, function (n, t) {\n          if (alive()) paintActivity(host, first, { progress: n + '/' + t });\n        }, function (allDays) {",
  "        backfill(uid, first, function (n, t, acc) {\n          if (alive()) paintActivity(host, acc || first, { progress: n + '/' + t });\n        }, function (allDays) {"
);

fs.writeFileSync(p, s, 'utf8');
console.log('progress uses accumulated days:', s.includes('acc || first'));

const fs = require('fs');
const p = 'manifest.json';
const m = JSON.parse(fs.readFileSync(p, 'utf8'));

// 启动动画也要覆盖个人主页
const splash = m.content_scripts[0];
if (splash && splash.run_at === 'document_start') {
  const want = 'https://center.mcmod.cn/*';
  if (!splash.matches.includes(want)) splash.matches.push(want);
}

fs.writeFileSync(p, JSON.stringify(m, null, 2) + '\n', 'utf8');
console.log('splash matches:', m.content_scripts[0].matches.join(', '));

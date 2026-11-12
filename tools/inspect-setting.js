const fs = require('fs');

const j = JSON.parse(fs.readFileSync('output/frame-CenterSetting.html', 'utf8'));
const html = j.html;
console.log('len', html.length);

const cls = new Set();
const re = /class="([^"]+)"/g;
let m;
while ((m = re.exec(html))) {
  m[1].split(/\s+/).forEach(c => c && cls.add(c));
}
console.log('classes:', [...cls].join(' '));

console.log('---- first 1200 ----');
console.log(html.slice(0, 1200));

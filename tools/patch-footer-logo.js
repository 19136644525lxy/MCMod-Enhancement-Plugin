const fs = require('fs');
const p = 'src/content/render/pages/center.js';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('swapFooterLogo')) {
  console.log('exists');
  process.exit(0);
}

// 1) 插入函数：在 mark() 之前
const anchor = '  function mark() {';
const fn = `  // 页脚那个会动的 logo 是 GIF（1-bit 透明），深色底上边缘会有一圈白毛边。
  // 换成处理过的 WebP 动画：同 36 帧、体积更小、边缘干净。
  function swapFooterLogo() {
    try {
      if (!chrome || !chrome.runtime || !chrome.runtime.getURL) return;
      var logo = document.querySelector('footer img.logo');
      if (!logo) return;
      var url = chrome.runtime.getURL('assets/logo_dynamic.webp');
      if (logo.getAttribute('src') !== url) logo.setAttribute('src', url);
    } catch (e) {}
  }

`;

if (!s.includes(anchor)) {
  console.error('mark() anchor not found');
  process.exit(1);
}
s = s.replace(anchor, fn + anchor);

// 2) 在 mark() 体里调用
const markBody = '  function mark() {\n';
if (!s.includes(markBody)) {
  console.error('mark body anchor not found');
  process.exit(1);
}
s = s.replace(markBody, markBody + '    swapFooterLogo();\n');

fs.writeFileSync(p, s, 'utf8');
console.log('patched', s.includes('swapFooterLogo()'));

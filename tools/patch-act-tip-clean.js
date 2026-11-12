const fs = require('fs');
const p = 'src/content/render/pages/center.js';
let s = fs.readFileSync(p, 'utf8');

s = s.replace(
  "    const actHost = document.getElementById('mp-activity');\n    if (actHost && actHost.parentNode) actHost.parentNode.removeChild(actHost);",
  "    const actHost = document.getElementById('mp-activity');\n    if (actHost && actHost.parentNode) actHost.parentNode.removeChild(actHost);\n    const actTip = document.querySelector('.mp-act-tip');\n    if (actTip && actTip.parentNode) actTip.parentNode.removeChild(actTip);\n    tipEl = null;"
);

fs.writeFileSync(p, s, 'utf8');
console.log('tip cleaned on unmount:', s.includes("querySelector('.mp-act-tip')"));

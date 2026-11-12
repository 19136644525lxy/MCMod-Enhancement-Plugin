const fs = require('fs');
const p = 'src/content/render/pages/center.js';
let s = fs.readFileSync(p, 'utf8');

s = s.replace(
  "    const chartFrame = document.querySelector('.mp-chart-frame');\n    if (chartFrame) chartFrame.classList.remove('mp-act-origin-titles');",
  "    const chartFrames = document.querySelectorAll('.edit-chart-frame');\n    for (let ci = 0; ci < chartFrames.length; ci++) chartFrames[ci].classList.remove('mp-act-origin-titles');"
);

fs.writeFileSync(p, s, 'utf8');
console.log('uses edit-chart-frame:', s.includes("querySelectorAll('.edit-chart-frame')"));

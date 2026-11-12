const fs = require('fs');
const hp = 'styles/pages/home.css';
let h = fs.readFileSync(hp, 'utf8');

// 1) 浅色主规则
const lightRe = /body\.mp-home-mode\s*\{[^}]*\}/;
const m1 = h.match(lightRe);
if (!m1) {
  console.error('no light rule');
  process.exit(1);
}
console.log('---- old light ----');
console.log(m1[0]);

const lightNew = `body.mp-home-mode {
  --mp-bg-base: #f3f1ec;
  --mp-spot-a: rgba(87, 185, 138, 0.16);
  --mp-spot-b: rgba(214, 168, 96, 0.14);
  --mp-spot-c: rgba(120, 140, 200, 0.10);

  background-color: var(--mp-bg-base);
  background-image:
    radial-gradient(1200px 600px at 15% -10%, var(--mp-spot-a), transparent 60%),
    radial-gradient(900px 500px at 95% 5%, var(--mp-spot-b), transparent 55%),
    radial-gradient(700px 600px at 50% 100%, var(--mp-spot-c), transparent 60%);
  background-size: 100% 1600px;
  background-repeat: no-repeat;
  transition:
    --mp-bg-base 0.34s ease,
    --mp-spot-a 0.34s ease,
    --mp-spot-b 0.34s ease,
    --mp-spot-c 0.34s ease;
}`;

h = h.replace(lightRe, lightNew);

// 2) 深色覆盖（html[data-mp-theme="dark"] 与 prefers-color-scheme 两处）
const darkRe = /(html\[data-mp-theme="dark"\]\s+body\.mp-home-mode)\s*\{[^}]*\}/;
const m2 = h.match(darkRe);
if (m2) {
  h = h.replace(darkRe, `$1 {
  --mp-bg-base: #14130f;
  --mp-spot-a: rgba(87, 185, 138, 0.14);
  --mp-spot-b: rgba(196, 140, 60, 0.12);
  --mp-spot-c: rgba(90, 110, 170, 0.14);
}`);
  console.log('dark patched');
}

const mediaRe = /(html:not\(\[data-mp-theme="light"\]\)\s+body\.mp-home-mode)\s*\{[^}]*\}/;
const m3 = h.match(mediaRe);
if (m3) {
  h = h.replace(mediaRe, `$1 {
    --mp-bg-base: #14130f;
    --mp-spot-a: rgba(87, 185, 138, 0.14);
    --mp-spot-b: rgba(196, 140, 60, 0.12);
    --mp-spot-c: rgba(90, 110, 170, 0.14);
  }`);
  console.log('media patched');
}

fs.writeFileSync(hp, h, 'utf8');
console.log('done', h.length);

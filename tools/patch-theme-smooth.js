const fs = require('fs');

/* ---------- 1. tokens.css 里注册可过渡的颜色变量 ---------- */
const tp = 'styles/tokens.css';
let t = fs.readFileSync(tp, 'utf8');
if (!t.includes('@property --mp-bg-base')) {
  t += `
/* 主题背景的可插值颜色。
   普通 CSS 变量没法参与 transition；用 @property 把它声明成 <color> 之后，
   渐变里的颜色才会跟着过渡，而不是「渐变瞬间换、底色慢慢变」的中间态。 */
@property --mp-bg-base {
  syntax: '<color>';
  inherits: true;
  initial-value: #f3f1ec;
}
@property --mp-spot-a {
  syntax: '<color>';
  inherits: true;
  initial-value: rgba(87, 185, 138, 0.16);
}
@property --mp-spot-b {
  syntax: '<color>';
  inherits: true;
  initial-value: rgba(214, 168, 96, 0.14);
}
@property --mp-spot-c {
  syntax: '<color>';
  inherits: true;
  initial-value: rgba(120, 140, 200, 0.1);
}
`;
  fs.writeFileSync(tp, t, 'utf8');
  console.log('tokens patched');
}

/* ---------- 2. home.css：背景改用变量 ---------- */
const hp = 'styles/pages/home.css';
let h = fs.readFileSync(hp, 'utf8');

const light = `body.mp-home-mode {
  background-color: #f3f1ec;
  background-image:
    radial-gradient(1200px 600px at 15% -10%, rgba(87, 185, 138, 0.16), transparent 60%),
    radial-gradient(900px 500px at 95% 5%, rgba(214, 168, 96, 0.14), transparent 55%),
    radial-gradient(700px 600px at 50% 100%, rgba(120, 140, 200, 0.10), transparent 60%);
  /* 不要用 background-attachment: fixed —— 它和 backdrop-filter 在 Windows Chrome 上
     会互相抢合成层，滚动时出现整屏闪烁。光斑固定留在文档顶部即可。 */
  background-size: 100% 1600px;
  background-repeat: no-repeat;
  transition: background-color 0.3s ease;
}`;

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
  /* 不要用 background-attachment: fixed —— 它和 backdrop-filter 在 Windows Chrome 上
     会互相抢合成层，滚动时出现整屏闪烁。光斑固定留在文档顶部即可。 */
  background-size: 100% 1600px;
  background-repeat: no-repeat;
  transition:
    --mp-bg-base 0.34s ease,
    --mp-spot-a 0.34s ease,
    --mp-spot-b 0.34s ease,
    --mp-spot-c 0.34s ease;
}`;

if (!h.includes(light)) {
  console.error('light block not found');
  process.exit(1);
}
h = h.replace(light, lightNew);

const darkOld = `html[data-mp-theme="dark"] body.mp-home-mode {
  background-color: #14130f;
  background-image:
    radial-gradient(1200px 600px at 15% -10%, rgba(87, 185, 138, 0.14), transparent 60%),
    radial-gradient(900px 500px at 95% 5%, rgba(196, 140, 60, 0.12), transparent 55%),
    radial-gradient(700px 600px at 50% 100%, rgba(90, 110, 170, 0.14), transparent 60%);
  background-size: 100% 1600px;
  background-repeat: no-repeat;
}`;

const darkNew = `html[data-mp-theme="dark"] body.mp-home-mode {
  --mp-bg-base: #14130f;
  --mp-spot-a: rgba(87, 185, 138, 0.14);
  --mp-spot-b: rgba(196, 140, 60, 0.12);
  --mp-spot-c: rgba(90, 110, 170, 0.14);
}`;

if (!h.includes(darkOld)) {
  console.error('dark block not found');
  process.exit(1);
}
h = h.replace(darkOld, darkNew);

fs.writeFileSync(hp, h, 'utf8');
console.log('home patched');

const fs = require('fs');
const p = 'styles/pages/center.css';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('TA的教程')) {
  console.log('already patched');
  process.exit(0);
}

s += `

/* ---------- TA的教程：原站是「小封面 + 蓝链接 + 灰字」的裸排，
   塞进玻璃卡里显得很单薄。改成横向小卡：大一点的封面 + 可换行标题 + 元信息。 */

body.mp-center-mode .mp-center-block .post-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

body.mp-center-mode .mp-center-block .post-block {
  display: flex;
  gap: 14px;
  align-items: stretch;
  padding: 12px;
  border-radius: 14px;
  background: var(--c-card-soft);
  transition: transform 0.22s ease, background-color 0.22s ease;
}

body.mp-center-mode .mp-center-block .post-block:hover {
  transform: translateY(-2px);
  background: var(--c-card);
}

body.mp-center-mode .mp-center-block .post-block .cover {
  flex: none;
  width: 132px;
}

body.mp-center-mode .mp-center-block .post-block .cover a {
  display: block;
  height: 100%;
}

body.mp-center-mode .mp-center-block .post-block .cover img {
  display: block;
  width: 132px;
  height: 88px;
  object-fit: cover;
  border-radius: 10px;
}

body.mp-center-mode .mp-center-block .post-block .info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

body.mp-center-mode .mp-center-block .post-block .info .title {
  font-size: 14.5px;
  line-height: 1.45;
}

body.mp-center-mode .mp-center-block .post-block .info .title a {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--c-ink);
  font-weight: 600;
}

body.mp-center-mode .mp-center-block .post-block .info .title a:hover {
  color: var(--c-accent);
  text-decoration: none;
}

body.mp-center-mode .mp-center-block .post-block .info .other {
  color: var(--c-ink-3);
  font-size: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
`;

fs.writeFileSync(p, s, 'utf8');
console.log('appended, braces', (s.match(/{/g) || []).length, (s.match(/}/g) || []).length);

const fs = require('fs');
const p = 'docs/页面改造手册.md';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('## 13. 个人主页与主题系统')) {
  console.log('exists');
  process.exit(0);
}

s += `
---

## 13. 个人主页与主题系统（2026-11-13 定稿）

> 第 10 节写于开工前，这一节是做完之后的实际结论，以本节为准。

### 13.1 页面结构

个人主页是 hash 路由 SPA：\`#/home/\`、\`#/rank/\`、\`#/favorite/\`、\`#/comment/\`、\`#/task/\`、\`#/item/\`、\`#/card/\`、\`#/setting/\`。

每个 tab 的内容由 \`POST https://center.mcmod.cn/frame/{Tab}/\` 拉 JSON 片段填进对应的 \`#center-page-*\`，所以：

- **不要试图导出 HTML 做离线分析**：导出的只是外壳，tab 内容全是空的。
- 抓片段要带四个头，缺一个就返回 0 字节：
  \`Referer: https://center.mcmod.cn/{uid}/\`、\`Origin\`、\`X-Requested-With: XMLHttpRequest\`、\`Content-Type: application/x-www-form-urlencoded\`，body \`uid={uid}&data=%7B%7D\`。
- 匿名能拿到的只有 \`CenterHome\` / \`CenterRank\` / \`CenterComment\` / \`CenterSetting\`（部分）。\`CenterTask\` 和 \`CenterCard\` 返回 \`{"state":0,"html":""}\`，\`CenterFavoriteSoltList\` 返回 \`{"state":217}\`（要登录）——这三个只能靠截图 + 猜类名，或者让用户贴 DevTools。

### 13.2 主题变量

\`styles/pages/center.css\` 顶部一组 \`--c-*\`：

| 变量 | 浅色 | 深色 |
|---|---|---|
| \`--c-ink\` | \`#26231f\` | \`#e6e1d8\` |
| \`--c-ink-2\` | \`#55504a\` | \`#b9b2a8\` |
| \`--c-ink-3\` | \`#857f75\` | \`#8f887d\` |
| \`--c-card\` | \`rgba(255,255,255,.55)\` | \`rgba(26,25,22,.52)\` |
| \`--c-card-soft\` | \`rgba(255,255,255,.4)\` | \`rgba(26,25,22,.38)\` |
| \`--c-hair\` | \`rgba(38,35,31,.09)\` | \`rgba(255,255,255,.1)\` |

**关键原则**：卡片底色 \`.55\` 而不是 \`.88\`。太不透明就看不出底下是背景图，页面会退化成「一堆白卡叠在灰底上」。真要加不透明度，用 \`backdrop-filter: blur()\` 补偿，不要靠提高 alpha。

### 13.3 主题切换的平滑过渡（重要）

**普通 CSS 变量不能参与 transition**。如果背景由「\`background-color\` + \`radial-gradient\`」组成，只给颜色加过渡，会得到「渐变已经变暗、底色还在浅色」的中间态——用户看到的就是「半暗半白」。

正确做法：用 \`@property\` 把颜色变量注册成可插值类型，让渐变和底色由同一组缓动驱动。

\`\`\`css
/* styles/tokens.css */
@property --mp-bg-base { syntax: '<color>'; inherits: true; initial-value: #f3f1ec; }
@property --mp-spot-a  { syntax: '<color>'; inherits: true; initial-value: rgba(87,185,138,.16); }
@property --mp-spot-b  { syntax: '<color>'; inherits: true; initial-value: rgba(214,168,96,.14); }
@property --mp-spot-c  { syntax: '<color>'; inherits: true; initial-value: rgba(120,140,200,.1); }
\`\`\`

\`\`\`css
/* styles/pages/home.css */
body.mp-home-mode {
  --mp-bg-base: #f3f1ec;
  --mp-spot-a: rgba(87,185,138,.16);
  /* … */
  background-color: var(--mp-bg-base);
  background-image:
    radial-gradient(1200px 600px at 15% -10%, var(--mp-spot-a), transparent 60%),
    radial-gradient(900px 500px at 95% 5%,  var(--mp-spot-b), transparent 55%),
    radial-gradient(700px 600px at 50% 100%, var(--mp-spot-c), transparent 60%);
  transition: --mp-bg-base .34s ease, --mp-spot-a .34s ease,
              --mp-spot-b .34s ease, --mp-spot-c .34s ease;
}
html[data-mp-theme="dark"] body.mp-home-mode {
  --mp-bg-base: #14130f;
  --mp-spot-a: rgba(87,185,138,.14);
  /* … */
}
\`\`\`

翻 \`data-mp-theme\` 就完事，\`MP.theme.apply()\` 里不要再做任何「冻结过渡两帧」之类的补丁。

**反例（已废弃）**：给 \`html\` 加一个类让所有元素 \`transition: none\`，两个 rAF 后再移除。它确实没有中间态了，但变成硬切，用户立刻反馈「太不美观」。

### 13.4 深色兜底与特异性

原站很多地方把颜色写死成 \`#222\` / \`#000\`，深色主题下就是黑字黑底。两条通用兜底：

\`\`\`css
html[data-mp-theme="dark"] body.mp-center-mode .tab-content,
html[data-mp-theme="dark"] body.mp-center-mode .tab-content *:not(img):not(svg):not(path):not(use) {
  color: #e6e1d8 !important;
}
html[data-mp-theme="dark"] body.mp-center-mode .tab-content a,
html[data-mp-theme="dark"] body.mp-center-mode .tab-content a * { color: #7ed0a5 !important; }
\`\`\`

**踩过的最大一个坑：\`!important\` 不保证赢**。双方都带 \`!important\` 时，浏览器比的是**特异性**。

\`\`\`css
/* 原站：0,4,1 */
.center-main.favorite .favorite-slot-ul li { border-right: 10px solid #FFF; }
/* 我第一版：0,2,1 —— 加 !important 也没用，照样输 */
body.mp-center-mode .favorite-slot-ul li { border-right: 10px solid transparent !important; }
/* 修法：塞一个 id 进去，变成 1,4,1 */
body.mp-center-mode #center-page-favorite .center-main.favorite .favorite-slot-ul li { … !important }
\`\`\`

排查顺序：先看 DevTools 里那条规则有没有被划掉 → 被划掉就是权重输，加 id 或复制原站完整选择器。

### 13.5 原站那些「看起来像设计、其实是 bug」的写法

| 现象 | 真相 |
|---|---|
| 收藏卡片之间有白色缝隙 | \`border-right: 10px solid #FFF; border-bottom: 10px solid #FFF\` 拿白边当间距 |
| 教程卡文字消失 | 原站 \`.post-block{width:12.5%;display:inline-block}\`，改了 flex 却没盖 width，\`.info\` 被压成 0 宽 |
| 头卡底部露出卡片底 | banner 原图 1500×220，容器 1200 时 \`100% auto\` 只有 176px，\`min-height:220px\` 差 44px；改 \`cover\` |
| 名片统计块是白块 | \`.tracker-frame .block .item{background:#f5f3f2}\`、\`.exp-rate{background:#FFF}\` |
| 统计条下面有条线 | 原站 \`<hr>\` 是 \`.center-total\` 的**兄弟**节点，\`.center-total > hr\` 选不中 |
| 悬浮条没往下移 | \`.center-card-view{position:absolute;top:50px}\`——绝对定位元素加 \`padding-top\` 无效，要动 \`top\` |
| 页脚 logo 有白毛边 | \`logo_dynamic.gif\` 是 1-bit 透明，抗锯齿边缘退化成白色实心像素；逐帧清白边后转 WebP 动画 |

### 13.6 页脚 logo

\`footer img.logo\` 原图是 \`logo_dynamic.gif\`（265×172，36 帧）。处理流程在 \`tools/clean-logo.py\`：

1. 逐帧读 RGBA；
2. 找「自己可见、四邻有透明像素」的边缘像素；
3. 其中 \`R/G/B > 200\` 的（白渣）alpha 设为 0；
4. 存成 WebP 动画（保留 36 帧 / 时长 / 循环）。

产物 \`assets/logo_dynamic.webp\`（137KB，比原 GIF 的 142KB 还小）。\`center.js\` 的 \`swapFooterLogo()\` 在 \`mark()\` 里把 \`src\` 换掉。

### 13.7 当日完成度

| 区块 | 状态 |
|---|---|
| 顶栏（玻璃 + 搜索框 + 日夜开关 + 齿轮） | ✅ |
| 头卡（220px 横幅 + 圆形头像 + 白字） | ✅ |
| tab 胶囊 | ✅ |
| 统计 6 格 | ✅ |
| 我的模组区域 | ✅ |
| 我的教程 | ✅ |
| 编辑动态 | ✅（时间轴化未做） |
| 活跃度热力图（自绘 + 补全 + 悬停气泡） | ✅ |
| 留言板（深色可读 + 全屏灯箱） | ✅ |
| 等级 tab | ✅（深色兜底） |
| 收藏 tab | ⚠️ 匿名拿不到数据，靠截图猜的类名 |
| 成就 tab | ⚠️ 同上 |
| 名片 tab | ⚠️ 同上 |
| 设置 tab | ✅（有真实片段） |
| 页脚 | ✅ |

### 13.8 下一步

1. 收藏 / 成就 / 名片三个 tab：需要用户在自己账号下切过去、贴 DevTools 截图（能看到 class 的那种），再按真实结构补样式。
2. 编辑动态时间轴化（左侧竖线 + 节点）。
3. item / klass / modpack / category 四页仍 gated by \`redrawPages=false\`，要逐页重新做，参考 \`pages/home.js\` 的自绘结构。

### 13.9 一条硬规矩

**任何「拿不到结构」的页面，先别写 CSS。** 匿名接口返回空的时候，猜测类名写出来的规则多半不生效，白白来回三四轮。要么抓片段，要么让用户贴 DevTools 的 DOM 层。
`;

fs.writeFileSync(p, s, 'utf8');
console.log('handbook length', s.length);

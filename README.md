# MCMod-Enhancement-Plugin

MC百科（mcmod.cn）全站增强浏览器扩展。目标是把 MC百科 的浏览体验重做成一套自有的、现代的界面，同时**不触碰任何写操作**。

> 原型阶段（v0.2.0）：零构建原生 JS，可直接加载到 Chrome / Edge 试用。

## 当前能力

- **命令面板**：任意 MC百科 页面按 `Ctrl / ⌘ + K`，聚合全站搜索 + 模组结构化检索，支持 `mod:` `pack:` `item:` `post:` `user:` 前缀过滤。
- **搜索页重绘**：`search.mcmod.cn` 结果列表接管渲染，支持关键词高亮、类型筛选、一键回滚原生视图。
- **物品页重绘**：简介、物品命令（可复制）、属性表、合成表（材料 → 产物）、矿物词典、相关物品、贡献者。
- **模组页重绘**：模组介绍富文本、状态徽章、分类、基本信息、标签、相关链接、互动数据、评分、更新日志、管理/编辑/贡献者。
- **整合包检索页重绘**：保留原生筛选条，卡片列表与分页按自有网格渲染。
- **分类页重绘**：保留原生「模组元素列表」，模组卡列表 + 日/周/月榜 + 分页重绘。
- **首页重绘**：毛玻璃卡片风格，顶栏 + 全部内容区自绘（导航、搜索、模组卡三 tab、编辑动态、教程、社群动态、最受欢迎、版本检索、贡献榜、热门标签、评比排行、九大分类），原首页整块隐藏，可一键回滚；模组卡每 8 秒本地轮换（零网络请求）。
- **我的足迹**：登录状态下读取公开的编辑记录（`history.html?userid=`），按天聚合成热力图，显示近 30 天 / 连续天数 / 涉及条目与最近 4 条编辑；只发 1 次请求，本地缓存 6 小时。
- **背景预设**：晨雾 / 极光 / 像素夜空 / 草方块 / 星空，五套全部本地生成（CSS 渐变或 Canvas 绘制），不请求任何图片；极光是唯一带动画的，12fps 且页面不可见时暂停。设置面板「外观 → 背景」里切换，立即生效。
- **设计系统**：tokens.css + base.css + pages.css，浅色 / 深色 / 跟随系统，紧凑模式。
- **调试面板**：`Ctrl + Shift + D` 查看抽取结果、当前接管状态、网络请求统计与设置，可导出当前页面 HTML 快照。
- **设置页 / 弹窗**：总开关、主题、面板、重绘、紧凑五项开关，`chrome.storage.sync` 同步。

> 结构重绘（物品 / 模组 / 整合包 / 分类四页）仍处于实验状态，默认关闭，可在设置页「实验性」中打开。首页重绘默认开启。

## 安装（开发态）

1. 打开 `chrome://extensions/`（Edge 为 `edge://extensions/`）
2. 右上角开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择本目录
4. 打开 https://www.mcmod.cn/item/462367.html 验证

> 改动代码后，需在扩展管理页点一次「重新加载」才会生效。

## 目录结构

```
manifest.json                 MV3 清单（22 个内容脚本按序注入）
src/bg.js                     service worker：跨子域抓取代理 + 缓存 + 限流
src/content/
  core/dom.js                 h() 渲染、文本清理、safeHtml、关键词高亮
  core/store.js               chrome.storage 封装 + 默认设置
  core/selectors.js           站点选择器集中表
  core/theme.js               样式注入与主题切换
  core/fetch-page.js          经 background 抓取并解析远程页面
  extract/search.js           搜索结果 DOM → JSON
  extract/modlist.js          模组列表 DOM → JSON
  extract/item.js             物品页 DOM → JSON
  extract/klass.js            模组页 DOM → JSON
  extract/modpack.js          整合包检索页 DOM → JSON
  extract/category.js         分类页 DOM → JSON
  extract/home.js             首页 DOM → JSON
  render/components.js        chip / button / card / skeleton / empty
  render/page-shell.js        页面外壳：标题区 + 双栏 + 增强/原始切换
  render/pages/search.js      搜索页重绘
  widgets/footprint.js        编辑足迹（热力图 + 统计）
  widgets/background.js       首页背景预设（5 套，本地绘制）
  render/pages/home.js        首页毛玻璃重绘
  render/pages/item.js        物品页重绘
  render/pages/klass.js       模组页重绘
  render/pages/modpack.js     整合包检索页重绘
  render/pages/category.js    分类页重绘
  widgets/command-palette.js  Cmd+K 命令面板
  router.js                   入口：分发、快捷键、设置响应
styles/tokens.css             设计令牌
styles/base.css               组件样式
styles/pages/pages.css        结构重绘页面样式
styles/pages/home.css         首页毛玻璃样式
popup/ options/               弹窗与设置页
docs/                         方案、设计分析、WAF 事件记录
```

## 设计原则

1. **三段式**：extract（DOM → JSON）→ store（数据）→ render（组件自绘）。抽取与渲染解耦，站点改版只改 extract 或 selectors。
2. **三类分区**：
   - A 类纯展示：完全接管；
   - B 类站内导航：接管但保留原生 `<a href>` / GET 表单语义；
   - C 类写操作（编辑、评论、评分、收藏、登录）：**不接管**，原 DOM 保留。
3. **失败回退**：抽取结果校验失败时整页回退原生视图，不白屏。
4. **零外链**：所有数据来自用户已登录的浏览器会话，不经过第三方服务器。

## 安全与限流

2026-11-10 调试期间，本机 IP 因「短时高频请求」触发过 MC百科 WAF。为此 `src/bg.js` 做了三道闸：

1. 白名单：只允许 `search.mcmod.cn/s?`、`www.mcmod.cn/modlist.html?`、`www.mcmod.cn/(item|class|post)/数字.html`；
2. 限流：60 秒内最多 30 次；
3. 计数：调试面板显示「网络请求 N 次（拦截 M）」。

插件本身不请求任何图片、样式来自扩展内部（`chrome-extension://`），页面加载阶段不产生任何 mcmod 请求。

## 路线图

| 里程碑 | 内容 | 状态 |
| --- | --- | --- |
| M1 | 骨架 + 设计系统 + Cmd+K + 搜索页重绘 | 已完成 |
| M2 | 首页排版重做（待用原始 CSS 重做） | 暂停 |
| M3 | 物品页 + 模组页 + 整合包页 + 分类页 | 已完成（待真机验证） |
| M4 | 检索页 + 桥接层 + Vite/Preact 迁移 + 打磨 | 待开始 |

## 开发说明

- 原型阶段不引入构建工具，改完刷新扩展即可。
- 本地校验：`node output/test-render.js`（需 `jsdom`，见 `output/` 下脚本头注释），用真实页面快照驱动四个页面的抽取与渲染。
- `output/preview-*.html` 是离线预览（内联全部 CSS、去掉站点 JS），可直接双击查看重绘效果。
- M4 将迁移到 Vite + `@crxjs/vite-plugin` + Preact（约 4KB），组件签名保持不变。

## 许可

暂未确定，等作者决定后补充。



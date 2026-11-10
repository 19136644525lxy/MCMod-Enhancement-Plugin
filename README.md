# MCMod-Enhancement-Plugin

MC百科（mcmod.cn）全站增强浏览器扩展。目标是把 MC百科 的浏览体验重做成一套自有的、现代的界面，同时**不触碰任何写操作**。

> 原型阶段（v0.1.0）：零构建原生 JS，可直接加载到 Chrome 试用。

## 当前能力（M1 + M2 进行中）

- **命令面板**：任意 MC百科 页面按 `Ctrl / ⌘ + K`，聚合全站搜索 + 模组结构化检索，支持 `mod:` `pack:` `item:` `post:` `user:` 前缀过滤。
- **搜索页重绘**：`search.mcmod.cn` 结果列表接管渲染，支持关键词高亮、类型筛选、一键盘回滚原生视图。
- **首页布局增强**：首页模组 / 教程卡片区重排为响应式网格，卡片统一圆角、封面比例与悬浮反馈（只动布局，不动 DOM 与链接）。
- **设计系统**：tokens.css + base.css 两层，浅色 / 深色 / 跟随系统，紧凑模式。
- **调试面板**：`Ctrl + Shift + D` 查看抽取结果、首页增强状态、当前设置与样式注入状态，可导出当前页面 HTML 快照。
- **设置页 / 弹窗**：总开关、主题、面板、重绘、紧凑五项开关，`chrome.storage.sync` 同步。

## 安装（开发态）

1. 打开 `chrome://extensions/`
2. 右上角开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择本目录
4. 打开 https://www.mcmod.cn/ 或 https://search.mcmod.cn/s?key=foo 验证

Edge 同理：`edge://extensions/`。

## 目录结构

```
manifest.json                 MV3 清单
src/bg.js                     service worker：跨子域页面抓取代理 + 5 分钟缓存
src/content/
  core/dom.js                 h() 渲染、文本清理、关键词高亮
  core/store.js               chrome.storage 封装 + 默认设置
  core/selectors.js           站点选择器集中表
  core/theme.js               样式注入与主题切换
  core/fetch-page.js          经 background 抓取并解析远程页面
  extract/search.js           搜索结果 DOM → JSON
  extract/modlist.js          模组列表 DOM → JSON
  render/components.js        chip / button / card / skeleton / empty
  render/pages/search.js      搜索页重绘（含原始视图回滚）
  render/pages/home.js        首页布局增强（网格化，不改 DOM 结构）
  widgets/command-palette.js  Cmd+K 命令面板
  router.js                   入口：分发、快捷键、设置响应
styles/tokens.css             设计令牌
styles/base.css               组件样式
styles/pages/home.css         首页布局增强样式
popup/ options/               弹窗与设置页
```

## 设计原则

1. **三段式**：extract（DOM → JSON）→ store（数据）→ render（组件自绘）。抽取与渲染解耦，站点改版只改 extract 或 selectors。
2. **三类分区**：
   - A 类纯展示：完全接管；
   - B 类站内导航：接管但保留原生 `<a href>` / GET 表单语义；
   - C 类写操作（编辑、评论、评分、收藏、登录）：**不接管**，原 DOM 保留。
3. **失败回退**：抽取结果校验失败时整页回退原生视图，不白屏。
4. **零外链**：所有数据来自用户已登录的浏览器会话，不经过第三方服务器。

## 路线图

| 里程碑 | 内容 | 状态 |
| --- | --- | --- |
| M1 | 骨架 + 设计系统 + Cmd+K + 搜索页重绘 | 已完成原型，待真机验证 |
| M2 | 首页布局增强 + 结构重绘 + Vite/Preact 迁移 | 进行中（布局增强已完成） |
| M3 | 物品页 + 模组页 | 待开始 |
| M4 | 检索页 + 桥接层 + 打磨 | 待开始 |

## 开发说明

- 原型阶段不引入构建工具，改完刷新扩展即可。
- M2 将迁移到 Vite + `@crxjs/vite-plugin` + Preact（约 4KB），组件签名保持不变。

## 许可

暂未确定，等作者决定后补充。

# MARGIN 插件视觉设计分析

> 分析对象：F:\下载\margin（映间 MARGIN v0.60.0，B 站增强扩展）
> 分析日期：2026-11-10
> 目的：提取可借鉴到 MCMod-Enhancement-Plugin 的设计语言

---

## 0. 一句话概括

MARGIN 的设计语言是：**暖纸底 + 衬线标题 + 等宽数字 + 暖棕四级阴影 + 大圆角可调 + clip-path 揭示动效 + 皮肤式覆盖**。
它不追求"更炫"，而是追求"更像一本排版讲究的刊物"——低饱和、暖灰底、细线、留白。

---

## 1. 色彩系统

### 1.1 语义 token（浅色）

| token | 值 | 用途 |
| --- | --- | --- |
| `--m-canvas` | `#f5f4f1` | 页面底色（暖灰白，非纯白） |
| `--m-surface` | `#fff` | 卡片/面板 |
| `--m-ink` | `#17181a` | 主文字（近黑，带一点暖） |
| `--m-muted` | `#5f6167` | 次要文字 |
| `--m-faint` | `#66686d` | 更弱文字 |
| `--m-line` | `#17181a17` | 分隔线（墨色 9%） |
| `--m-chip` | `#17181a0d` | 标签/控件底（墨色 5%） |
| `--m-accent` | `var(--margin-primary, #00aeec)` | 强调色（B 站蓝，可换） |
| `--m-radius` | `calc(16px * var(--margin-rk, 1))` | 圆角基准 |

### 1.2 语义 token（深色）

| token | 值 |
| --- | --- |
| `--m-canvas` | `#111112` |
| `--m-surface` | `#1a1a1c` |
| `--m-ink` | `#ededee` |
| `--m-muted` | `#b0b1b6` |
| `--m-faint` | `#8a8b90` |
| `--m-line` | `#ffffff14` |
| `--m-chip` | `#ffffff0f` |

### 1.3 强调色的派生

- `--brand_blue_thin: color-mix(in srgb, var(--brand_blue) 12%, var(--m-surface))` —— 浅色标签底，不另造颜色。

### 1.4 兼容层

MARGIN 是"皮肤式"改造：它把 B 站原站变量整体替换（`--bg1/--bg2/--bg3`、`--text1~4`、`--line_light/regular/bold`、`--graph_*`），让原站组件自动跟随新配色。这是它能在不重建 DOM 的前提下保持统一的根本原因。

---

## 2. 字体系统

三套字体，各司其职：

| 角色 | 字体栈 |
| --- | --- |
| 标题/衬线 | `"Instrument Serif", "Margin Serif SC", "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif` |
| 正文 | `"Geist", "Margin Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif` |
| 数字/标签 | `"Geist Mono", "Margin Sans SC", ui-monospace, SFMono-Regular, Menlo, monospace` |

细节：
- 字号档：12 / 13 / 14 / 16 / 18 / 20 px；正文 14，小字 12，标题 18–20。
- 小标签用 `letter-spacing: .22em` 的等宽大写（popup 的 "MARGIN · v0.6"）。
- 中文用**子集切片**：`Margin Sans SC` / `Margin Serif SC` 按 unicode-range 各切 34 片，低频组合并、常用组独立加载，避免几 MB 字体一次性下载。

---

## 3. 形状与质感

### 3.1 圆角

- 基准：`--m-radius = 16px × --margin-rk`
- 圆角档位（设置项 `radius`）：`0 / 50 / 100 / 150` → 系数 `0 / .5 / 1 / 1.5`
- 组件实际使用：`12px`（面板）、`10px`（列表项）、`8px`（小按钮）、`2px`（微标签）、`999px`（胶囊/chip）

### 3.2 阴影（暖棕，非纯黑）

`--shadow-rgb: 24 22 20`（浅色）→ 阴影带暖调，融进暖灰底。

| 级别 | 值 |
| --- | --- |
| `--sh-xs` | `0 1px 1px rgb(...)/.05, 0 2px 2px rgb(...)/.04` |
| `--sh-sm` | `0 2px 4px .06, 0 7px 7px .04` |
| `--sh-md` | `0 4px 8px .08, 0 14px 14px .06` |
| `--sh-lg` | `0 7px 14px .12, 0 27px 25px .08` |

深色：`--shadow-rgb: 0 0 0`，透明度加深（.13 / .15 / .2 / .31），`--hair: .5px`。

### 3.3 描边

- `--ring: 0 0 0 var(--hair) #0000000f`（浅色 1px，深色 `.5px #ffffff1f`）
- 用 ring 代替 border，避免布局抖动。

---

## 4. 动效

### 4.1 核心曲线

```
--mcc-duration: .35s;
--mcc-ease: cubic-bezier(.16, 1, .3, 1);   /* easeOutExpo，收敛快、尾巴长 */
```

其他过渡用 `cubic-bezier(.22, 1, .36, 1)` 与 `.13s–.25s`。

### 4.2 面板展开（命令面板）

```css
/* 起始 */
opacity: 0;
clip-path: inset(0 0 70% round 12px);
transform: translateY(-6px) scale(.98);
/* 结束 */
clip-path: inset(0 round 12px);
```

即"从顶部揭开 + 轻微下沉"，比纯 fade 更有实体感。

### 4.3 其他

- `m-opt-in`：`opacity 0 + translateY(4px)` 的逐项入场。
- `prefers-reduced-motion` 有兜底（`html.margin-reduce` 关闭动效）。

---

## 5. 组件

### 5.1 开关（popup）

```
40 × 24，border-radius 99px，底 var(--chip)，边框 var(--line)
圆钮 18px 白，box-shadow 0 1px 3px rgb(0 0 0 / .25)
选中：底 var(--accent)，边框透明，圆钮 translateX(16px)
transition: background .2s / transform .2s
```

### 5.2 分段控件（主题切换）

```
容器 padding 3px，radius 10px，底 var(--chip)
按钮 padding 4px 10px，radius 7px
选中：底 var(--bg)，阴影 0 1px 3px rgb(0 0 0 / .12)
```

### 5.3 命令面板

- 面板：`background: var(--m-surface)`、`radius 12px`、`overflow: hidden`、`clip-path` 开合。
- 圆点指示器：12×12 点击区，内部 6px 圆点，`#fff6` → 当前 `#fff`。
- 悬浮控制按钮：`background: #ffffff1c`、`border: 1px solid #ffffff1a`、`radius 8px`、26×28、hover `#ffffff38`。

### 5.4 卡片

`surface` 底 + `ring` 描边 + `--sh-xs/sm` 阴影；hover 抬升用 `translateY(-2px)` + `--sh-md`。

### 5.5 popup 版式

- 宽 300，padding 20。
- 标题衬线 20px/1，字距 .04em；副标题等宽 10px/.22em。
- 行：`padding 12px 0`，`border-top 1px solid var(--line)`。
- 页脚 11px muted。

---

## 6. 结构模式

- 页面标记：`html.margin-watch / margin-detail / margin-search / margin-page / margin-live / margin-skin`，用**一个 class 切换整页皮肤**。
- 覆盖策略：替换原站 CSS 变量 + 覆盖具体组件类，**不重建 DOM**。
- 少量增强组件：`m-channel-carousel`（频道轮播）、`m-wcard`、`m-voltip`。
- 背景层：`flux.js` 是 WebGPU 库（VGPU），提供 `aurora` 等 shader 背景，可关闭、可调强度（`bg.intensity`）。

---

## 7. 对 MCMod 插件的映射建议

### 7.1 直接可借鉴

| MARGIN | MCMod 插件落地 |
| --- | --- |
| 暖灰画布 `#f5f4f1` | 替换当前的纯白底，减少刺眼感 |
| 衬线标题 | 物品/模组页标题用 `LXGW Neo ZhiSong` 或 `Noto Serif SC` |
| 等宽数字 | 物品 ID、耐久、堆叠、统计数字用 `Geist Mono` |
| 暖棕阴影 | `--shadow-rgb: 24 22 20`，替代纯黑阴影 |
| 圆角系数 | 设置项 `radius: 0/50/100/150` → `--mp-rk` |
| clip-path 揭示 | Cmd+K 面板、详情预览用同一手法 |
| 语义 token 命名 | 沿用 `--mp-canvas/surface/ink/muted/line/chip/accent` |

### 7.2 谨慎借鉴

- **皮肤式覆盖** vs **结构重绘**：MARGIN 靠覆盖原站变量保持统一，风险低；MCMod 方案 v0.2 选的是"完全重做"，若走重绘，要自己保证组件全套，工作量更大。建议：**能覆盖就覆盖，覆盖不了再重绘**。
- 子集字体：切片脚本不在扩展包内，若要复刻，需自己跑 `slice-fonts.py` 或直接引 CDN。
- WebGPU 背景：收益低、兼容性风险高，不建议首版引入。

### 7.3 可复用的开源字体（许可允许嵌入）

| 字体 | 许可 |
| --- | --- |
| Geist / Geist Mono | SIL OFL 1.1 |
| Noto Sans SC（子集） | SIL OFL 1.1 |
| LXGW Neo ZhiSong（霞鹜新致宋，子集） | IPA Font License 1.0 |
| Instrument Serif | SIL OFL 1.1 |

---

## 8. 结论

MARGIN 好看的核心不是某一个组件，而是**一整套克制的 token 体系**：暖底、暖影、细线、大圆角、衬线标题、等宽数字、短促有力的缓动。
MCMod 插件若要"好看"，优先照搬这套 token 与版式节奏，而不是逐个抄组件。

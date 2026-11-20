# OneLaser Store — 1laser.com 重设计初稿

**首页源码来源：** [Yonge6/onelaser-store](https://github.com/Yonge6/onelaser-store/tree/66bb29fecae1674f9a9c399ff8102d7a981250be)，对应 [同事的预览](https://yonge6.github.io/onelaser-store/#/)。

本仓库用于独立修改首页。首页结构在 `src/pages/Home.jsx`，数据在 `src/data/site.js`，样式在 `src/styles.css`。

这是 1laser.com 购物站的重设计初稿（静态原型，不是线上店铺，不会产生真实订单）。

- **结构**：照 [DJI Store](https://us.store.dji.com/) + [Bambu Lab Store](https://us.store.bambulab.com/) 的购物框架；参考 [GoPro](https://gopro.com/en/us/)（Why shop / 应用场景）和 [ComMarker](https://store.commarker.com/)（机型对比）。
- **内容**：机器、配件、耗材、价格、图片、参数全部来自 www.1laser.com（2026-11-16 抓取，含黑五价）。UI 规范（字体、字号、圆角、间距）全部照 Insta360，只保留 OneLaser 品牌红。

## 页面（模块和 UI 规范对照 DJI Store 实测，2026-11-16）

| 页面 | 地址 | 模块（自上而下） |
| --- | --- | --- |
| 首页 | `#/` | 主视觉轮播 → 保障条 → 机器系列（X Series、Cobra Series、Hydra Gen2、VertiGo，含机型对比入口）→ 独立选机问答 → 品牌与用户证据 → 购买保障 → 活动 → 配件、材料入口 → 下一步与 FAQ。系列入口与分类入口在 `src/data/site.js`，选机界面在 `src/components/Finder.jsx`，推荐规则在 `src/components/finderRules.js`。 |
| 列表 | `#/collections/:handle` | 照 **Insta360 商城列表页**（实测 1440）：灰底页面 → 吸顶白色分类条（124×148 图块）→ 左侧 240 筛选栏（Offers / Category）+ 三列白色卡片 316×395 圆角 16（191 图、18/24 标题、14 号价格、36 高深色胶囊按钮） |
| 商品详情 | `#/products/:handle` | 购买区照 **Insta360 商城商品页**（实测 1440）：左侧通栏灰色大图区（吸顶，599 高）+ 胶囊缩略图 / 右侧 464 宽栏（32 号标题、选项摘要行、黑五卡、图标信息卡、带图选项卡、Frequently bought together、灰底订单小结、配送说明）；底部固定 80 高购买条（24 号价格、180×56 胶囊按钮）。下方同样照 Insta360：吸顶 49 高白色菜单（左商品名，右 Overview / Compare / Specs / FAQ / Accessories）→ 黑底概览（首图、Take a closer look 四列、数据行、居中卖点 800×450、左右卖点 620+420、带胶囊标签的轮播卖点，见 `src/components/Story.jsx`）→ Compare models（64 号标题、250 宽列）→ Specs（44 号标题、28 号分组、240 宽标签）→ 白底 FAQ（32 号标题、编号行）→ You might also like（288×534 卡片）。没做：评价、以旧换新、保障计划、云服务（没有数据或业务） |
| 购物车 | `#/cart` | 照 **Insta360 商城购物车**：灰底、Shopping cart 32 号粗体、左 800 白卡（商品行：图、20/24 粗体名称、标签、数量、价格）+ 右 480 白卡 Order details（24 号加粗合计、56 高胶囊 Check out、服务说明） |
| 结算 | `#/checkout` | 照 **Insta360 商城结算页**：64 页头带 Secure、Check out as guest 28 号粗体、左 742 白卡（Contact info、Shipping details，56 高输入框圆角 8，Save 胶囊按钮；Shipping method / Billing address / Payment method 逐步展开）+ 右 434 白卡 Order summary（优惠码、合计、Place order）。仅演示，不保存不提交 |

**UI 规范（取自 insta360.com 和 store.insta360.com 实测值，2026-11-17）**

| 项 | 桌面 1440 | 手机 390 |
| --- | --- | --- |
| 字体 | Poppins（Insta360 的 “Poppins Num” 即 Poppins），字重 400–800，正文色 `rgba(0,0,0,.85)` | 同 |
| 导航 | 固定 64 高，左右 64，首页首屏上透明 | 49 高 |
| 首页 | 首屏 660、h1 48/56 字重 600、四列机器系列卡 | 手机首屏 600、h1 28/32、两列机器系列卡 |
| 列表 | 分类块 124×148；卡片 316×395 圆角 16；标题 18/24 字重 500；按钮 36 高胶囊 | 两列 |
| 商品购买区 | 大图区 916×599；右栏 464；标题 32；底部条 80 高、价格 24、按钮 180×56 | 方形大图，标题 24/32，左右 20 |
| 商品概览（黑底 `#000`） | 眉题 18/21.6 字重 700 品牌红；标题 44/50.6 字重 700；正文 16/24 `#898A8E`；媒体 800×450 圆角 24；标签条 `#1A1A1A`、16/20 字重 700 | 标题 28/34，正文 14/22 |
| 对比 / 参数 | Compare models 64/73.6；数值 22/27.5；Specs 44/50.6，分组 28/30.8，标签 16/20 字重 700，值 14/21 | 横向滑动；标签在上 |
| FAQ / 推荐 | 容器 1200；标题 32/112 字重 700；卡片 288×534 圆角 8，按钮 128×40 | 两列 |
| 购物车 / 结算 | 左 800 右 480；结算左 742 右 434，输入框 56 高圆角 8，按钮 48–56 高胶囊 | 单列 |

**辅助色**（2026-11-18 加）：天蓝 `--accent: #38BDF8`（团队提供的 NEW 标签蓝；做底色时配深色字；白底上的小字和数字用同色相加深的 `--accent-ink: #0B7FC0`；浅底 `--accent-soft: #E6F6FE`）。分工：红色只用于价格、促销和主按钮；蓝色用于信息、引导和证明类元素（NEW 标签、选机卡片、月付金额、硬指标数字、文字链接、视频当前项）。要换颜色只改 `src/styles.css` 顶部这几个变量。

和 Insta360 唯一有意不同的是颜色：它的黄色按钮和蓝色强调字，这里都用品牌红 `#E7310E`。

**沿用官网的部分**（2026-11-18，读取自 www.1laser.com）：顶部黑五广告条（文案、倒计时、产品图，可关闭，页面下滚后收起）；导航菜单的栏目和下拉内容（Laser Machines / Accessories / Material / Black Friday / Support / Community / Contact，外加电话和 Schedule a Sales Call 按钮），商品类链接指向本店页面，服务类链接指向官网；页脚（Community / Machines / Support / Policy / Contact Us 五栏、联系方式、社交账号、版权行）；首页 “The OneLaser Standard” 模块和总部航拍照片。数据都在 `src/data/site.js` 的 `nav`、`contact`、`footer`、`homeStandard`、`promo`。本店自己加的搜索、购物车、语言选择保留在导航右侧。

**多语言**：导航栏右侧只有一个地球图标，鼠标移上去（或点击）下拉出语言列表；手机端在侧边菜单顶部展开，目前有 English、Español、Français、Deutsch、简体中文、日本語。界面文字（导航、按钮、筛选、购物车、结算、FAQ、首页文案）走 `src/i18n.js` 的 `t()`，词典在 `src/locales/*.js`，以英文原文为键，缺的条目自动回退英文；全部键列在 `src/locales/_keys.json`。商品名称、描述、参数和商品页长叙事来自官网，只有英文，没有翻译。译文是机器翻译，上线前需要母语者校对。加一种语言：在 `LANGS` 里加一行，再加一个同名词典文件。

购物流程：Add to Cart → 购物车页 → Check Out；Buy Now → 直接到结算。

## 团队怎么改

| 想改什么 | 改哪个文件 |
| --- | --- |
| 促销条、导航、首页轮播/推荐/分区、卖点、FAQ、商品页推荐配件 | `src/data/site.js` |
| 商品数据（价格、图片、规格） | 不要手改 `src/data/catalog.json`；更新 `data-source/` 里的原始数据后运行 `npm run catalog` |
| 商品页卖点内容 | 更新 `data-source/product-pages.json` 后运行 `npm run stories`；版式和挑选规则在 `src/pages/Product.jsx` |
| 颜色、字号、间距、响应式 | `src/styles.css`（顶部 `:root` 是设计变量） |
| 各页面结构 | `src/pages/*.jsx`，公共头尾和购物车在 `src/components/` |

```bash
npm ci
npm run dev      # 本地预览 http://localhost:5173/store/#/
npm run build
```

## 初稿待确认 / 已知缺口

- 首页轮播第一张用的是带文字的旧 banner，左侧用深色遮罩盖住了原文字；需要一张无文字的 XRF 主视觉。
- 「Why buy」里的承诺（30 天退货、3-2-1 保修、美国本土支持等）取自官网现有文案，上线前需老板确认。
- 商品页推荐配件的兼容性按机型系列粗配（`site.js` 的 `addOns`），需逐型号核对。
- 机器商品页的卖点、应用、视频、规格、保障内容抓自官网各商品页（`data-source/product-pages.json` → `npm run stories` → `src/data/stories.json`），商品页按官网顺序全部填进 Insta360 的黑底概览版式（`src/components/Story.jsx`）。“Take a closer look” 的 8 张卡是自动挑的，需要人工确认每台机器该放哪几条。
- 运费、税、分期、折扣码、账号登录都是占位；真实下单仍在 Shopify。
- 机器规格来自之前整理的规格表（`data-source/machine-specs.json`），本次未重新逐项核对。

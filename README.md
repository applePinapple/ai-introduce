# AI、大语言模型与 Agent

本地中文演讲幻灯片项目，面向老板与技术同事。**47 页、58 分钟的完整演讲采用原生 HTML**，其中讲解 53 分钟、讨论 5 分钟，保留首页封面，随后直接进入 AI 基础。AI 基础先用独立页面介绍定义，再讲四次浪潮，随后用十一页图片展示各阶段的代表性系统与应用；深度学习分为视觉识别、驾驶与控制两页，第四浪潮扩展到图像、视频、语音音乐、3D、具身与科学 AI。模块最后用一页关系图串起技术包含关系、模型能力和前面的应用场景。该模块使用用户指定的 ReinBEE 蓝黄底板与浅色标志，其他模块沿用现有样式。

默认视觉来自用户认可的三页样例与 [lip-html-slides 技能](skills/lip-html-slides/SKILL.md)，参考 **skJack/-lip- 第 21 期 VLA 的 HTML 实现与风格**。三页样例继续作为独立视觉基准保留，AI 基础的局部样式不改变全局技能风格基准。

原演讲内容提炼自用户提供的四段课程视频。视频证据来自实际抽帧、课件与可见硬字幕核对，没有进行音频逐字转写。AI 与大语言模型部分保留课程主线，Agent 执行闭环与应用实践根据论文和官方工程资料扩展；教学示例、研究结果与实施建议在正文或备注中明确区分。

## 当前生成方式

需要 Node.js 22 或更新版本。安装锁定依赖后，在项目目录运行：

```powershell
npm ci
npm run check
npm test
npm run build
npm run verify
```

`npm test` 已使用无进程隔离模式。浏览器验证会查找本机 Chrome、Edge 或 Playwright 的 Chromium；如果没有安装可用浏览器，先运行：

```powershell
npx playwright-core install chromium
```

浏览器装在其他位置时，可通过环境变量 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定其可执行文件，再运行 `npm run verify`。

`build` 生成 HTML 与讲稿，`verify` 使用本地浏览器检查全部页面并导出 PDF、逐页截图和总览。默认结果位于 `output/ai-history/`：

| 文件 | 用途 |
| --- | --- |
| [`deck.html`](output/ai-history/deck.html) | 47 页 HTML 演示入口 |
| [`presenter.html`](output/ai-history/presenter.html) | 个人屏幕上的讲者窗口，讲稿随投屏翻页同步 |
| [`deck.pdf`](output/ai-history/deck.pdf) | 静态阅读与打印 |
| [`预览-全部页面.png`](output/ai-history/预览-全部页面.png) | 47 页视觉总览 |
| `overview-01.png` 至 `overview-08.png` | 每组六页的复核图 |
| `slides/slide-01.png` 至 `slide-47.png` | 逐页预览 |
| `speaker-notes.html` | 浏览器可读的完整讲稿、建议时长与来源 |
| `speaker-notes.json` | 逐页讲稿与完整来源 |
| `verification.json` | 浏览器与导出检查结果 |

用 Chrome 或 Edge 打开 HTML，保留相邻 `media/` 即可离线演示。重复构建覆盖当前演讲产物；`output/` 不手工修改或纳入 Git。HTML 是主要可编辑演示格式，PDF 和 PNG 是静态导出。完整正文在 `content/decks/ai-history.json` 修改，排版与交互在 `src/slides/` 修改，再重新构建。需要重建三页基准时运行 `npm run build -- --sample` 与 `npm run verify -- --sample`，结果仍在 `output/lip-sample/`。

三页基准分别是封面、Agent 执行闭环、固定工作流与 Agent 的比较。完整演讲复用这些版式，并补齐时间线、图片画廊、关系图、双栏、流程、案例、图解和表格。Token 与生成过程根据课程截图重新组织，保留原生文字与 SVG；证据路径记录在正文的 `evidencePaths` 中。

第 04–14 页采用 `gallery` 布局，画面保留章节标题与品牌，图片不加白框：规则与符号 AI 页为 MYCIN 架构与 Shakey；机器学习页为 SpamBayes 两张界面图；深度学习第一页展示人脸识别、扫地机在家具旁识别线缆等障碍物、YOLO 以马为例的目标检测，第二页展示自动驾驶与传统机械臂的算法；大语言模型页为 ChatGPT 与 DeepSeek。第 09–14 页分别展示图像生成、视频生成、语音与音乐、3D 生成、具身大模型和科学 AI，每页两图、60 秒。两页深度学习各讲 45 秒。牛羊马等目标类别、图片解释、图源与概念边界维护在 `notes`：传统运动学与控制算法本身不属于深度学习，可用视觉模型增强。

第 15 页采用 `relationship` 布局，按“技术包含关系 → 模型能力 → 应用场景”组织一张关系图，建议讲解 105 秒，详细解释放在 `notes`。第 03 页参考时间线原文与前面十一页图片保持；AI 基础覆盖第 02–15 页，大语言模型为第 16–29 页，Agent 与收束为第 30–46 页，第 47 页交流。

项目中的 `skills/lip-html-slides/` 是技能源，个人技能目录为 `C:/Users/Edison/.codex/skills/lip-html-slides/`。开始新演讲时先读技能，复用 `src/slides/`，不重新生成多种风格供比选。更新技能时同步个人副本。

## 参考风格如何实现

参考是普通 HTML 文件，没有使用幻灯片框架，也不是把 PowerPoint 页面转换为截图。每页对应一个 `<section class="slide">`；CSS 负责排版，SVG 负责透视网格及示意图，JavaScript 控制当前页与全屏。论文图和照片通过同目录 `media/` 引用。

- **1920×1080 画布**：固定 16:9，以 `min(窗口宽/1920, 窗口高/1080)` 等比缩放。
- **浅灰背景与透视网格**：`#EEF2F6` 底色，SVG 从视点向下发散，渐变遮罩让网格主要出现在底部。
- **白卡片与三色语义**：白色组件、细灰边框、小圆角；蓝色表示信息或模型，橙色表示动作或输出，绿色表示状态或反馈。
- **固定文字层级**：中文无衬线正文，等宽字体用于章节、标签和数值，衬线字体用于公式；主标题 60 px，主要正文 30–34 px。
- **每页手工组织信息**：Flex 双栏、流程块、表格、统计卡片、图片标注与 SVG 图解组合，不依赖切换主题来改变风格。

完整制作流程见 [lip-html-slides 技能](skills/lip-html-slides/SKILL.md)，颜色、尺寸、组件、播放行为和参考适配细节统一维护在 [样式规则](skills/lip-html-slides/references/design-system.md)；[项目规则索引](docs/slide-rules.md) 说明本项目入口。本地参考源为 [第 21 期 deck.html](assets/references/skJack-lip/01-第21期-VLA入门(一)-RT-2-OpenVLA-π0/slides/deck.html)，原项目地址为 [skJack/-lip-](https://github.com/skJack/-lip-/tree/main)。

## 演示操作

| 操作 | 方式 |
| --- | --- |
| 下一页 | `→`、`↓`、空格、`PageDown` |
| 上一页 | `←`、`↑`、`PageUp` |
| 首尾页 | `Home`、`End` |
| 页面目录 | 左上角 `☰` 或 `G` |
| 讲者窗口 | `P` 或导航中的 `P` 按钮，打开 `presenter.html` |
| 全屏 | `F` |
| 页码提示 | `C` |
| 跳页 | 输入页码，或地址栏 `deck.html#2` |
| 鼠标翻页 | 左侧 20% 上一页，其余区域下一页 |

双屏演示时选择“扩展（非复制）”模式，把 `deck.html` 放在投屏屏幕，把讲者窗口留在个人屏幕；线上会议只共享 `deck.html` 所在窗口。从幻灯片按 `P` 打开讲者窗口，才能建立翻页同步；单独阅读完整讲稿可打开 `speaker-notes.html`。离线文件没有访问控制，讲者窗口和讲稿文件仅供讲者自用。

## 内容与工程结构

```text
content/decks/sample.json      当前 3 页样例正文、讲稿与来源关联
content/decks/ai-history.json  默认构建的 47 页完整演讲内容
content/sources.json           来源、核验日期、支持范围与视频证据
schemas/sample.schema.json    当前样例的内容契约
schemas/full.schema.json      完整 HTML 演讲的内容契约
schemas/deck.schema.json      原 39 页内容的历史契约
src/slides/                   HTML、CSS、SVG 与播放实现
scripts/slides/               检查、构建、浏览器导出与产物验证
scripts/media/                视频下载、核验和证据抽帧工具
skills/lip-html-slides/        默认幻灯片技能源及可复用样式规则
docs/                         生成规则索引、讲解节奏与内容原则
assets/references/            下载的参考项目及获取记录
assets/videos/                视频、分 P 索引与来源记录
assets/video-evidence/        抽帧清单与视频提炼依据
assets/research/              论文和官方资料的核验结果
assets/design/                已采用的概念插画
assets/fonts/                 离线字体、许可与来源记录
assets/inbox/                 待整理的原始图片
output/ai-history/            完整 HTML 演讲及导出产物
output/lip-sample/            独立三页样例及导出产物
```

新增外部事实须实际核验并填写日期，通过每页 `sourceIds` 关联到 `content/sources.json`。完整引用进入备注或配套讲稿。屏幕上一页只解释一个问题，细节放入 `notes`，不靠缩小字号容纳正文。正式演讲前需要逐页检查字体、换行、媒体和打印结果，并按讲稿试讲。

视频工具统一从项目根目录调用：通用下载脚本为 `scripts/media/you-get-bilibili.ps1`，课程下载与核验为 `scripts/media/download-bilibili.py`，课件抽帧为 `scripts/media/extract-video-evidence.py`。通用脚本默认下载到 `assets/videos/bilibili/downloads/`，可用 `-OutputDir` 指定其他位置；具体课程操作见 [视频素材说明](assets/videos/bilibili/BV178w1z7EHQ/README.md)。

原 PPTX 流程及失败样稿不恢复。完整演讲与三页视觉基准分别维护，共用 HTML 渲染与播放实现。PDF 独立视觉复核可使用带有 `pypdfium2`、`Pillow` 的 Python 运行 `scripts/slides/render-pdf.py`；结果写入 `output/ai-history/pdf-review/`。

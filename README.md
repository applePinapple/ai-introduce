# AI、大语言模型与 Agent

本地中文演讲幻灯片项目，面向老板与技术同事。当前 **3 页 HTML 样例已获用户认可**，其规则已固化为 [lip-html-slides 技能](skills/lip-html-slides/SKILL.md)。后续幻灯片任务默认优先使用这套技能及现有源码，沿用 **skJack/-lip- 第 21 期 VLA 的 HTML 实现与风格**，直接制作内容；用户后续明确提出的新要求优先。原有 **39 页、50 分钟**的完整内容仍保留，尚未全部迁移。

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

`build` 生成 HTML 与讲稿，`verify` 使用本地浏览器检查页面并导出 PDF、逐页截图和总览。结果位于 `output/lip-sample/`：

| 文件 | 用途 |
| --- | --- |
| [`deck.html`](output/lip-sample/deck.html) | 3 页 HTML 演示入口 |
| [`deck.pdf`](output/lip-sample/deck.pdf) | 静态阅读与打印 |
| [`预览-全部页面.png`](output/lip-sample/预览-全部页面.png) | 3 页视觉总览 |
| `slides/slide-01.png` 至 `slide-03.png` | 逐页预览 |
| `speaker-notes.json` | 逐页讲稿与完整来源 |
| `verification.json` | 浏览器与导出检查结果 |

用 Chrome 或 Edge 打开 HTML，保留相邻媒体与字体文件即可本地演示。重复构建覆盖当前样例产物；`output/` 不手工修改或纳入 Git。HTML 是主要可编辑演示格式，PDF 和 PNG 是静态导出。正文在 `content/decks/sample.json` 修改，排版与交互在 `src/slides/` 修改，再重新构建。

当前三页分别是 AI、LLM 与 Agent 封面、Agent 执行闭环、固定工作流与 Agent 的比较，作为已认可的封面、流程图和表格基准。3 页只描述当前样例范围；未来演讲根据内容确定页数，并同步扩展内容契约、构建和验证。

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
| 全屏 | `F` |
| 页码提示 | `C` |
| 跳页 | 输入页码，或地址栏 `deck.html#2` |
| 鼠标翻页 | 左侧 20% 上一页，其余区域下一页 |

## 内容与工程结构

```text
content/decks/sample.json      当前 3 页样例正文、讲稿与来源关联
content/decks/ai-history.json  保留的 39 页完整演讲内容
content/sources.json           来源、核验日期、支持范围与视频证据
schemas/sample.schema.json    当前样例的内容契约
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
output/lip-sample/            当前 HTML 样例及导出产物
```

新增外部事实须实际核验并填写日期，通过每页 `sourceIds` 关联到 `content/sources.json`。完整引用进入备注或配套讲稿。屏幕上一页只解释一个问题，细节放入 `notes`，不靠缩小字号容纳正文。正式演讲前需要逐页检查字体、换行、媒体和打印结果，并按讲稿试讲。

视频工具统一从项目根目录调用：通用下载脚本为 `scripts/media/you-get-bilibili.ps1`，课程下载与核验为 `scripts/media/download-bilibili.py`，课件抽帧为 `scripts/media/extract-video-evidence.py`。通用脚本默认下载到 `assets/videos/bilibili/downloads/`，可用 `-OutputDir` 指定其他位置；具体课程操作见 [视频素材说明](assets/videos/bilibili/BV178w1z7EHQ/README.md)。

原 PPTX 流程、主题配置、Blue Professional 与其他失败样稿的代码、规则、专用素材及输出已清理。原 39 页正文及其数据契约、来源、研究视频、下载的参考项目和仍使用的配图继续保留；当前 3 页样例与原演讲正文分别维护。

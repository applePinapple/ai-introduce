# AI、大语言模型与 Agent

本地中文演讲幻灯片项目，面向老板与技术同事。**当前稿为 65 页、85分15秒（5115 秒），采用原生 HTML**，范围为首页封面、AI 基础、神经网络原理、大语言模型、大模型应用、Agent 原理与 Harness 工程。AI 基础先用独立页面介绍定义，再讲四次浪潮，随后用十一页图片展示各阶段的代表性系统与应用；深度学习分为视觉识别、驾驶与控制两页，第四浪潮扩展到图像、视频、语音音乐、3D、具身与科学 AI。最后用一页关系图串起技术包含关系、模型能力和前面的应用场景。该模块使用用户指定的 ReinBEE 蓝黄底板与浅色标志。第 16–29 页的神经网络原理参考视频 003，第 30–44 页的大语言模型参考视频 004；第 45–52 页的大模型应用参考视频 005，为 8 页、750 秒；第 53–59 页的 Agent 原理参考视频 015，为 7 页、690 秒；第 60–65 页的 Harness 工程依据官方网络工程材料补充，为 6 页、600 秒。后续模块均统一为浅灰透视网格与 ReinBee 蓝黄浅色底板，保留完整讲稿；视频同图连续展开页按用户要求合并。

默认视觉来自用户认可的三页样例与 [lip-html-slides 技能](skills/lip-html-slides/SKILL.md)，参考 **skJack/-lip- 第 21 期 VLA 的 HTML 实现与风格**。三页样例继续作为独立视觉基准保留，AI 基础、神经网络和大语言模型模块的局部样式不改变全局技能风格基准。

项目原始研究来自用户提供的课程视频，以及论文和官方资料。视频证据来自实际抽帧、课件与可见硬字幕核对，没有进行音频逐字转写。历史课程、LLM 与 Agent 研究资料继续保留供参考；当前大语言模型与 Agent 章节分别依据视频 004 和视频 015 新做重构，不恢复原已删除的正文。当前正文和讲稿集中维护封面、AI 基础、神经网络原理、大语言模型、大模型应用、Agent 原理与 Harness 工程。应用模块根据视频 005 新建，Harness 工程依据实际核验的LangChain、Anthropic官方材料新建，原讨论章节仍未恢复。

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
| [`deck.html`](output/ai-history/deck.html) | 当前 65 页 HTML 演示入口 |
| [`presenter.html`](output/ai-history/presenter.html) | 个人屏幕上的讲者窗口，讲稿随投屏翻页同步 |
| [`deck.pdf`](output/ai-history/deck.pdf) | 静态阅读与打印 |
| [`预览-全部页面.png`](output/ai-history/预览-全部页面.png) | 当前 65 页视觉总览 |
| `overview-01.png` 至 `overview-11.png` | 每组六页的复核图 |
| `slides/slide-01.png` 至 `slide-65.png` | 逐页预览 |
| `speaker-notes.html` | 浏览器可读的当前稿讲稿、建议时长与来源 |
| `speaker-notes.json` | 逐页讲稿与完整来源 |
| `verification.json` | 浏览器与导出检查结果 |

用 Chrome 或 Edge 打开 HTML，保留相邻 `media/` 即可离线演示。重复构建覆盖当前演讲产物；`output/` 不手工修改或纳入 Git。HTML 是主要可编辑演示格式，PDF 和 PNG 是静态导出。当前正文在 `content/decks/ai-history.json` 修改，排版与交互在 `src/slides/` 修改，再重新构建。需要重建三页基准时运行 `npm run build -- --sample` 与 `npm run verify -- --sample`，结果仍在 `output/lip-sample/`。

三页基准分别是封面、Agent 执行闭环、固定工作流与 Agent 的比较，作为独立视觉样例保留。当前正文采用封面、AI 定义、四次浪潮时间线、图片画廊、关系图、神经网络原理、大语言模型、大模型应用、Agent 原理与 Harness 工程图示；已有其他版式实现与历史视频证据继续供后续重构使用。

第 04–14 页采用 `gallery` 布局，画面保留章节标题与品牌，图片不加白框：规则与符号 AI 页为 MYCIN 架构与 Shakey；机器学习页为 SpamBayes 两张界面图；深度学习第一页展示人脸识别、扫地机在家具旁识别线缆等障碍物、YOLO 以马为例的目标检测，第二页展示自动驾驶与传统机械臂的算法；大语言模型页为 ChatGPT 与 DeepSeek。第 09–14 页分别展示图像生成、视频生成、语音与音乐、3D 生成、具身大模型和科学 AI，每页两图、60 秒。两页深度学习各讲 45 秒。牛羊马等目标类别、图片解释、图源与概念边界维护在 `notes`：传统运动学与控制算法本身不属于深度学习，可用视觉模型增强。

第 15 页采用 `relationship` 布局，按“技术包含关系 → 模型能力 → 应用场景”组织一张关系图，建议讲解 105 秒，详细解释放在 `notes`。第 03 页参考时间线原文与前面十一页图片保持。封面第 01 页为45秒，AI 基础第 02–15 页为915秒，神经网络原理第 16–29 页为885秒，大语言模型第 30–44 页为1230秒，大模型应用第 45–52 页为750秒，Agent 原理第 53–59 页为690秒，Harness 工程第 60–65 页为600秒，合计5115秒。

LLM讲解中的Token不等于词，向量维度与上下文容量依具体模型和配置而定。示意向量、概率、人物描述和数值纹理不作为模型实测或真人事实；注意力不是简单词向量相加。规模页采用GPT-3、LLaMA等历史公开论文数据，替代缺乏可靠依据的GPT-4/GPT-5参数传闻，不以规模图推断固定AGI临界点。详细边界保留在讲稿中。

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
content/decks/ai-history.json  默认构建的当前 65 页正文与讲稿
content/sources.json           来源、核验日期、支持范围与视频证据
schemas/sample.schema.json    当前样例的内容契约
schemas/full.schema.json      默认 HTML 演讲的内容契约
schemas/deck.schema.json      原 39 页内容的历史契约
src/slides/                   HTML、CSS、SVG 与播放实现
scripts/slides/               检查、构建、浏览器导出与产物验证
scripts/media/                视频下载、核验和证据抽帧工具
skills/lip-html-slides/        默认幻灯片技能源及可复用样式规则
docs/                         生成规则索引、讲解节奏与内容原则
assets/references/            下载的参考项目及获取记录
assets/videos/                视频、分 P 索引与来源记录
assets/video-evidence/        抽帧清单与视频提炼依据
assets/neural/                神经网络模块裁切、重构与样式覆盖记录
assets/llm/                   大语言模型视频复核与原生重构记录
assets/applications/          大模型应用视频复核、页面映射与技术纠正
assets/agent/                 Agent原理视频复核、原生重构与技术纠正
assets/harness/               Harness工程来源核验与页面改编记录
assets/research/              论文和官方资料的核验结果
assets/design/                已采用的概念插画
assets/fonts/                 离线字体、许可与来源记录
assets/inbox/                 待整理的原始图片
output/ai-history/            当前 HTML 演讲及导出产物
output/lip-sample/            独立三页样例及导出产物
```

新增外部事实须实际核验并填写日期，通过每页 `sourceIds` 关联到 `content/sources.json`。完整引用进入备注或配套讲稿。屏幕上一页只解释一个问题，细节放入 `notes`，不靠缩小字号容纳正文。正式演讲前需要逐页检查字体、换行、媒体和打印结果，并按讲稿试讲。

视频工具统一从项目根目录调用：通用下载脚本为 `scripts/media/you-get-bilibili.ps1`，课程下载与核验为 `scripts/media/download-bilibili.py`，课件抽帧为 `scripts/media/extract-video-evidence.py`。通用脚本默认下载到 `assets/videos/bilibili/downloads/`，可用 `-OutputDir` 指定其他位置；具体课程操作见 [视频素材说明](assets/videos/bilibili/BV178w1z7EHQ/README.md)。

原 PPTX 流程及失败样稿不恢复。当前稿与三页视觉基准分别维护，共用 HTML 渲染与播放实现。PDF 独立视觉复核可使用带有 `pypdfium2`、`Pillow` 的 Python 运行 `scripts/slides/render-pdf.py`；结果写入 `output/ai-history/pdf-review/`。


## 2026-10-15 页面合并（覆盖前述拆页数量与页码）

2026-10-15合并时为44页、51分15秒（3075秒）：封面第01页，AI基础第02–15页，神经网络原理第16–29页（14页、885秒），大语言模型第30–44页（15页、1230秒）。2026-10-15按用户要求合并同一图示的连续展开，保留独立概念、原生可编辑图示、来源与各阶段讲稿；本轮只减少翻页，不压缩讲解时间。 旧页码与新页码见 [合并记录](docs/consolidation-2026-10-15.json)。


## 2026-10-20 大模型应用

第45–52页使用 `application` 布局，依次讲解GPT与ChatGPT、对话机器人、对话生成、应用与模型的分工、能力比较、混合式应用、API调用时序和本节回顾。主标题来自 `title`，图示正文来自 `applicationData`，讲稿来自 `notes`。全部图示为原生可编辑HTML/SVG，左页眉为“04 大模型应用”，沿用蓝黄底板、浅灰透视网格与ReinBee浅色标志。

视频005的同图连续展开合并为完整状态。GPT名称回顾合入关系页，对话示例与登录/存储分工分别保留。模型输出、订单与聊天内容为教学示例，不表示实测结果。上下文由应用组织，长期记忆另需产品能力；程序和模型按任务协同，混合式应用也需要结果验证。视频证据与改编依据见 `assets/applications/video-review.json`。该次追加完成时整稿为52页、3825秒；未增加视频005未涉及的RAG、Agent或微调章节。

## 2026-10-20 Agent原理

该次在前52页之后追加第53–59页，共7页、690秒，完成时整稿为59页、75分15秒。依据视频015《14-LangChain入门-快速入门和Agent原理》，以天气工具示例串起快速入门、执行循环、工具接口、消息历史和调用时序，末页补充可靠性与执行边界。`agentKind` 依次为 `weather`、`setup`、`loop`、`schema`、`messages`、`sequence`、`safeguards`，实现位于 `src/slides/agent.mjs/css`。左页眉“05 Agent原理”，使用1712×770原生内容子画布，延续蓝黄底板、浅灰透视网格与浅色Logo。主标题、图示文字与讲稿分别来自 `title`、`agentData` 和 `notes`。

模型产生工具名称与参数，由应用运行时实际执行，结果通过ToolMessage回传；模型根据结果继续调用或生成回答，运行时也可依据停止条件结束。工具schema描述可用接口，不等于执行代码；可观察的工具调用日志不等于模型隐藏思维链。天气数据和消息轨迹为教学示意，不声称已经接入天气服务或运行真实模型。安装与配置步骤保留在讲稿，当前LangChain接口根据官方文档核验；末页工程补充与视频内容分开标明。

视频复核和改编映射见 `assets/agent/video-review.json` 与 `assets/agent/reconstruction.json`，技术来源统一登记在 `content/sources.json`。本轮仅制作本地幻灯片，保留前52页及独立三页视觉基准，不增加开发环境安装、远程发布或真实模型API集成。当前Agent是依据新视频的重构，原讨论章节仍未恢复。

## 2026-10-20 Harness工程

在前59页之后追加第60–65页，共6页、600秒，整稿为65页、85分15秒。左页眉“06 Harness工程”，使用 `harness` 布局与 `harnessKind`，主标题、原生图示、讲稿分别来自 `title`、`harnessData` 和 `notes`；实现位于 `src/slides/harness.mjs/css`。保持1712×770内容子画布、蓝黄底板、浅灰透视网格、白卡片与浅色Logo。

六页依次介绍系统组成、上下文与持久状态、长任务分解和恢复、工具执行约束、评测改进外循环，以及失败到工程改进的教学案例。Harness作为工程用语解释，不宣称是统一行业标准。任务内的模型与工具执行循环，与开发阶段的“评测→分析轨迹→修改→回归”外循环分开讲解；状态恢复、上下文压缩和工具执行的限制放入讲稿，教学案例不冒充真实客户成效。

本章是基于官方网络材料的新补充，未将其归为视频015内容。LangChain、Anthropic来源的核验记录见 `assets/harness/source-review.json`，页面映射见 `assets/harness/reconstruction.json`，完整引用仍维护在 `content/sources.json`。本轮保留前59页及独立三页样例，仅制作本地演示与静态导出，不部署Agent服务或接入模型API。

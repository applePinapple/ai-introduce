# 幻灯片规则入口

用户已确认三页样例，并指定以后优先使用此风格。唯一技能入口是 [lip-html-slides](../skills/lip-html-slides/SKILL.md)，精确视觉与实现参数维护在 [design-system.md](../skills/lip-html-slides/references/design-system.md)，不再维护多套风格规则。

AI 基础模块（第 02–15 页）按用户新要求使用 ReinBEE 蓝黄底板与浅色标志，独立的 AI 定义页之后为四次浪潮，第 03 页保留参考时间线原文。第 04–14 页采用仅图片的 `gallery` 布局，图片不加白框，保留章节标题与品牌：第 04 页为 MYCIN 架构与 Shakey，第 05 页为 SpamBayes 两图，第 06 页为人脸识别、扫地机在家具旁识别线缆等障碍物、YOLO以马为例的目标检测（牛羊马等类别在讲稿说明）三类视觉图例，第 07 页为自动驾驶与传统机械臂的算法图，第 08 页为 ChatGPT 与 DeepSeek，第 09–14 页依次为图像生成、视频生成、语音与音乐、3D生成、具身大模型、科学AI，每页两图60秒。深度学习拆为两页各45秒，解释、图源与“传统运动学与控制算法本身不属于深度学习，可用视觉模型增强”等概念边界维护在 `notes`，不投屏显示。第 15 页以 `ai-relationships`（`relationship` 布局、105 秒）呈现技术包含关系 → 模型能力 → 前面的应用场景，详细解释维护在 `notes`。此局部要求不改变全局技能风格基准及三页样例；后续重构继续遵循已确认的样式。

神经网络模块按用户2026-10-15的后续要求，与前面页面统一使用浅灰透视网格、ReinBee蓝黄浅色底板、标准标题与页眉：左侧“02 神经网络原理”，右侧ReinBee浅色标志。该要求覆盖视频003原有的白红或黑底整页视觉；视频继续提供内容、图示结构和讲解顺序参考。`src/slides/neural-white.mjs/css` 和 `neural-black.mjs/css` 保留为图示实现的文件名，图示配色统一调整，页面使用共同底板，不跳过网格与页眉。合并后第16–18页介绍结构，第19–28页介绍数字识别，第29页介绍完整训练循环。每页主题标题来自主JSON的 `title`，图示说明、公式与图注来自 `neuralData`，演讲稿来自 `notes`；完整画面不使用截图。重构记录在 `assets/neural/reconstruction-white.json` 和 `reconstruction-black.json`，通过 `styleOverride` 记录后续样式要求，并保留裁切、视频证据与技术校正，不复制原作者品牌。

LLM内容须区分Token与词、初始embedding与上下文表示；维度、分词与上下文容量依模型及配置而定。示意坐标、向量方向、概率、人物故事与数值纹理不得写成实测结果或真人事实，注意力不等于简单向量加法。原论文encoder-decoder翻译结构与GPT类因果decoder路线在讲稿中区分；规模采用历史公开论文数据替代GPT-4/GPT-5传闻，不断言固定AGI临界点，也不把上下文窗口等同训练知识或长期记忆。

本项目采用以下映射：

- 当前正文和讲稿：`content/decks/ai-history.json`；内容契约：`schemas/full.schema.json`。
- 三页视觉基准：`content/decks/sample.json`；内容契约：`schemas/sample.schema.json`。
- HTML/CSS/SVG及播放：`src/slides/`；检查、构建及导出实现：`scripts/slides/`。
- 离线字体、授权与来源记录：`assets/fonts/`。
- 检查、测试、构建、导出：`npm run check`、`npm test`、`npm run build`、`npm run verify`。
- 默认当前稿：`output/ai-history/deck.html`，44页、51分15秒（3075秒），包含封面（45秒）、AI基础（915秒）、神经网络原理（885秒）与大语言模型（1230秒），配套PDF、逐页PNG、分组总览及可读HTML讲稿。截图为 `slides/slide-01.png` 至 `slide-44.png`，分组总览为 `overview-01.png` 至 `overview-08.png`。
- 个人讲者窗口：`output/ai-history/presenter.html`；演示时按 `P` 或导航 `P` 按钮打开，讲稿随翻页同步。分屏与会议共享的用法见 [README](../README.md#演示操作)。
- 构建与验证命令添加 `-- --sample` 可生成独立样例到 `output/lip-sample/`。历史正文契约 `schemas/deck.schema.json` 仅作历史记录。
- 视频下载及抽帧工具：`scripts/media/`；待整理图片：`assets/inbox/`。

三页是已确认的独立视觉基准，当前稿为44页，包含封面、第02–15页AI基础、第16–29页神经网络原理和第30–44页大语言模型。后两模块按视频实际讲解阶段拆页，未设数量上限，等待用户后续融合；历史课程、论文和研究素材可保留供参考。本轮LLM是依据视频004的新重构，不恢复原已删除的正文，原Agent与讨论章节仍未恢复。后续按实际内容确定页数与时长，同步内容契约、渲染与检查，沿用已确认视觉系统及用户明确指定的局部样式。生成目录不能手工维护正文。视频依据路径使用 `evidencePaths` 关联，来源仍统一由 `sourceIds` 登记。

个人技能安装到 `~/.codex/skills/lip-html-slides`（或 `CODEX_HOME/skills/lip-html-slides`），允许自动选用，也可以 `$lip-html-slides` 显式调用。项目 `skills/lip-html-slides/` 是可维护的技能源；同步个人安装时只更新这一技能。新的明确需求优先于默认偏好。


## 2026-10-15 页面合并（覆盖前述拆页数量与页码）

当前合并稿为44页、51分15秒（3075秒）：封面第01页，AI基础第02–15页，神经网络原理第16–29页（14页、885秒），大语言模型第30–44页（15页、1230秒）。2026-10-15按用户要求合并同一图示的连续展开，保留独立概念、原生可编辑图示、来源与各阶段讲稿；本轮只减少翻页，不压缩讲解时间。 旧页码与新页码见 [合并记录](consolidation-2026-10-15.json)。

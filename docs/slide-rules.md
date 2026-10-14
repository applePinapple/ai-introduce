# 幻灯片规则入口

用户已确认三页样例，并指定以后优先使用此风格。唯一技能入口是 [lip-html-slides](../skills/lip-html-slides/SKILL.md)，精确视觉与实现参数维护在 [design-system.md](../skills/lip-html-slides/references/design-system.md)，不再维护多套风格规则。

AI 基础模块（第 02–15 页）按用户新要求使用 ReinBEE 蓝黄底板与浅色标志，独立的 AI 定义页之后为四次浪潮，第 03 页保留参考时间线原文。第 04–14 页采用仅图片的 `gallery` 布局，图片不加白框，保留章节标题与品牌：第 04 页为 MYCIN 架构与 Shakey，第 05 页为 SpamBayes 两图，第 06 页为人脸识别、扫地机在家具旁识别线缆等障碍物、YOLO以马为例的目标检测（牛羊马等类别在讲稿说明）三类视觉图例，第 07 页为自动驾驶与传统机械臂的算法图，第 08 页为 ChatGPT 与 DeepSeek，第 09–14 页依次为图像生成、视频生成、语音与音乐、3D生成、具身大模型、科学AI，每页两图60秒。深度学习拆为两页各45秒，解释、图源与“传统运动学与控制算法本身不属于深度学习，可用视觉模型增强”等概念边界维护在 `notes`，不投屏显示。第 15 页以 `ai-relationships`（`relationship` 布局、105 秒）呈现技术包含关系 → 模型能力 → 前面的应用场景，详细解释维护在 `notes`。其他模块沿用现有样式；此局部要求不改变全局技能风格基准及三页样例。

本项目采用以下映射：

- 完整正文和讲稿：`content/decks/ai-history.json`；内容契约：`schemas/full.schema.json`。
- 三页视觉基准：`content/decks/sample.json`；内容契约：`schemas/sample.schema.json`。
- HTML/CSS/SVG及播放：`src/slides/`；检查、构建及导出实现：`scripts/slides/`。
- 离线字体、授权与来源记录：`assets/fonts/`。
- 检查、测试、构建、导出：`npm run check`、`npm test`、`npm run build`、`npm run verify`。
- 默认完整演讲：`output/ai-history/deck.html`，47页、58分钟（3480秒，含53分钟讲解与5分钟讨论），保留首页封面，随后直接进入 AI 基础，配套PDF、逐页PNG、分组总览及可读HTML讲稿。
- 个人讲者窗口：`output/ai-history/presenter.html`；演示时按 `P` 或导航 `P` 按钮打开，讲稿随翻页同步。分屏与会议共享的用法见 [README](../README.md#演示操作)。
- 构建与验证命令添加 `-- --sample` 可生成独立样例到 `output/lip-sample/`。历史正文契约 `schemas/deck.schema.json` 仅作历史记录。
- 视频下载及抽帧工具：`scripts/media/`；待整理图片：`assets/inbox/`。

三页是已确认的视觉基准，当前完整演讲为47页；未来页数按任务确定。当前 AI 基础为第 02–15 页，大语言模型为第 16–29 页，Agent 与收束为第 30–46 页，第 47 页交流。扩展时同步内容契约、渲染与检查，沿用已确认视觉系统及用户明确指定的局部样式。生成目录不能手工维护正文。视频依据路径使用 `evidencePaths` 关联，来源仍统一由 `sourceIds` 登记。

个人技能安装到 `~/.codex/skills/lip-html-slides`（或 `CODEX_HOME/skills/lip-html-slides`），允许自动选用，也可以 `$lip-html-slides` 显式调用。项目 `skills/lip-html-slides/` 是可维护的技能源；同步个人安装时只更新这一技能。新的明确需求优先于默认偏好。

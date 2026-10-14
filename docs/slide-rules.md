# 幻灯片规则入口

用户已确认三页样例，并指定以后优先使用此风格。唯一技能入口是 [lip-html-slides](../skills/lip-html-slides/SKILL.md)，精确视觉与实现参数维护在 [design-system.md](../skills/lip-html-slides/references/design-system.md)，不再维护多套风格规则。

本项目采用以下映射：

- 完整正文和讲稿：`content/decks/ai-history.json`；内容契约：`schemas/full.schema.json`。
- 三页视觉基准：`content/decks/sample.json`；内容契约：`schemas/sample.schema.json`。
- HTML/CSS/SVG及播放：`src/slides/`；检查、构建及导出实现：`scripts/slides/`。
- 离线字体、授权与来源记录：`assets/fonts/`。
- 检查、测试、构建、导出：`npm run check`、`npm test`、`npm run build`、`npm run verify`。
- 默认完整演讲：`output/ai-history/deck.html`，39页、50分钟，配套PDF、逐页PNG、分组总览及可读HTML讲稿。
- 构建与验证命令添加 `-- --sample` 可生成独立样例到 `output/lip-sample/`。历史正文契约 `schemas/deck.schema.json` 仅作历史记录。
- 视频下载及抽帧工具：`scripts/media/`；待整理图片：`assets/inbox/`。

三页是已确认的视觉基准，完整39页已迁移；未来页数按任务确定。扩展时同步内容契约、渲染与检查，沿用已确认视觉系统。生成目录不能手工维护正文。视频依据路径使用 `evidencePaths` 关联，来源仍统一由 `sourceIds` 登记。

个人技能安装到 `~/.codex/skills/lip-html-slides`（或 `CODEX_HOME/skills/lip-html-slides`），允许自动选用，也可以 `$lip-html-slides` 显式调用。项目 `skills/lip-html-slides/` 是可维护的技能源；同步个人安装时只更新这一技能。新的明确需求优先于默认偏好。

# 演讲素材

图片、截图、视频和参考模板放在此目录。引入外部素材时，记录出处和使用说明。

- [公司品牌素材](brand/README.md)：用户提供的 ReinBEE Logo、公司轮式双臂机器人原图及封面布局参考，供封面通过 `logoPath` 与 `imagePath` 引用。

- [黑马程序员 AI 通识与 LangChain／Agent 课程视频](videos/bilibili/BV178w1z7EHQ/README.md)：演讲准备的参考素材，含来源、下载说明和分 P 索引。

当前幻灯片使用 HTML、CSS、SVG 和本地媒体，通过 `imagePath` 引用 `design/` 中的概念插画及 `brand/` 中的公司机器人原图。完整演讲首页使用用户提供的机器人图片，此前生成的机器人概念图保留在 `design/` 中但不再使用。`fonts/` 保存离线字体、许可与来源记录；`video-evidence/` 保存视频抽帧与核对记录，`research/` 保存资料核验结果，`references/` 保存 skJack-lip 原始参考项目及下载记录。参考项目保持原样。

`inbox/` 存放待整理的原始图片，确定用途后再放入对应素材目录并记录出处。视频下载、核验及抽帧脚本统一放在项目的 `scripts/media/`；通用下载脚本默认保存至 `videos/bilibili/downloads/`。

已认可样例的制作规范统一维护在 [lip-html-slides 技能](../skills/lip-html-slides/SKILL.md) 及其 [样式规则](../skills/lip-html-slides/references/design-system.md)。此前失败样稿的专用素材与规则已清理。

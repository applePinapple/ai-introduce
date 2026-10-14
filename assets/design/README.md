# 演示文稿配图

本目录图片通过内置图像生成工具制作，作为概念插画使用。文字、表格和讲稿维护在 `content/decks/` 中的演讲内容文件。插画不表示真实模型内部结构、研究数据或公司实物产品。

## 原有概念插画

以下两幅图片均于 2026-10-13 生成，原有素材及提示继续保留。

- `ai-language-tools-cover.png`：16:9 深蓝背景，右侧玻璃知识页连接文件、放大镜和机械工具，左侧留白用于可编辑标题。
- `neural-digits.png`：手写数字、简化网络与数字分类的教学示意，实际网络结构与输出分数未在图中表达。

## 轮式双臂机器人概念图（保留，不再使用）

`wheeled-dual-arm-robot.png` 于 2026-10-14 通过内置 `image_gen` 工具生成，曾用于完整演讲首页右侧至下方的概念插图。机器人具有轮式底盘、两条机械臂和夹爪，采用浅色机身、石墨色关节及少量蓝色细节；透明背景便于融入浅灰透视网格。

- 性质：机器人公司的概念插画，不代表 ReinBEE 的真实产品、型号或已实现能力。
- 当前状态：同日按用户要求由其提供的公司机器人原图替换，完整演讲首页不再引用此概念图；原图位置与来源见 [品牌目录](../brand/README.md#公司轮式双臂机器人)。本概念图及生成记录保留，便于追溯。
- 来源与完整提示：[robotics-cover-generation.json](robotics-cover-generation.json)。该文件同时记录浅色 Logo 的编辑输入与提示；品牌素材说明见 [品牌目录](../brand/README.md)。
- 原有 `ai-language-tools-cover.png` 继续保留，用于三页视觉样例，不再作为完整演讲首页配图。

## 原有生成提示

封面提示：Use case: stylized-concept. Asset type: widescreen 16:9 keynote presentation cover background for a Chinese business and technology lecture about large language models and AI agents. A sophisticated editorial 3D still life: on the right half, a sculptural stack of translucent glass sheets with fine abstract printed lines suggesting language and knowledge; a single luminous pale teal filament emerges and connects to a few small practical objects, a document, a magnifying glass and a mechanical instrument, suggesting the movement from understanding to tool use. Deep midnight navy backdrop #102B38, subdued teal glass and warm ivory highlights. Architectural product photography, soft cinematic side lighting, tactile frosted glass, strong elegant negative space. Entire left 50 percent must stay uniformly dark navy and free of objects for large editable title later; objects confined to right. No text, no letters, no numbers, no logos, no humanoid robot, no brains, no glowing circuit boards. Premium restrained visual, high resolution 16:9 landscape.

神经网络提示：Use case: scientific-educational. Asset type: conceptual illustration placed on the left of a Chinese lecture slide about neural networks learning handwritten digits. Landscape 3:2, warm ivory background #F7F5EF. Show three distinct stages left to right: on left a black handwritten digit 9 on a small paper sample with lightly visible square pixel grid; at center several precise small teal nodes in 3 vertical layers joined by thin very subtle grey connections; at right the printed numeral 9 clean and confident in deep navy, with small faint numerals 3 and 8 beneath it suggesting alternate classes. This is explicitly a simplified teaching illustration, not actual data or a particular neural network. Flat editorial scientific print illustration with subtle paper texture, restrained navy teal palette, generous negative space, mature textbook quality. No words, no labels, no headings, no arrows, no percent signs, no decorative robot or brain. Sharp clean composition at high resolution.

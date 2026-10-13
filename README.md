# AI、大语言模型与 Agent

本地中文演讲 PPT 生产项目，面向老板与技术同事。当前版本为 **39 页、50 分钟、16:9**，包括 45 分钟讲解与 5 分钟交流。重点讲大语言模型与 Agent，通过订单处理、知识库问答、销售准备、代码修复和经营分析等例子解释能力与边界。

内容提炼自用户提供的四段课程视频。视频证据来自实际抽帧、课件与可见硬字幕核对，**没有进行音频逐字转写**。AI 与大语言模型部分保留课程主线，Agent 执行闭环与应用实践根据论文和官方工程资料扩展；教学示例、研究结果与实施建议在正文或备注中明确区分。

## 生成与验证

需要 Node.js 22 或更新版本，安装锁定依赖后运行：

```powershell
npm ci
npm run check
npm test
npm run build
npm run verify
```

若受限环境禁止 Node 启动测试子进程，可运行相同测试的单进程形式：

```powershell
npm test -- --test-isolation=none
```

生成结果：

- `output/ai-history-to-agents-50min.pptx`：可编辑 PowerPoint，含逐页讲稿、建议时长、完整引用和视频时间段。
- `output/speaker-notes.md`：逐页 Markdown 讲稿与来源。
- `output/speaker-notes.html`：无需联网的可打印讲稿。

重复构建覆盖这些产物。`output/` 为生成目录，不手工修改或纳入 Git。

本机安装 WPS 时，可通过实际演示软件导出 PDF 与逐页 PNG，用于检查字体与排版：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/render-preview.ps1
```

此步骤输出 `output/ai-history-to-agents-50min.pdf`，逐页预览和文字边界报告写入 `.cache/slide-preview/`。执行前关闭正在打开的同名 PPTX，以免文件被锁定；脚本不关闭其他用户文档。

## Blue Professional HTML 样稿

项目还保留一轮视觉改版的源码：只制作原第 **1、18、25 页**的 3 页 HTML 样稿，并整理原稿全部 39 页的分析。当前样稿用于确认视觉方向，尚未开展 39 页完整改版。正文、表格与备注从原稿核对后复用。

- `src/frontend-slides/`：样稿页面、样式、导航与编辑功能，以及 39 页分析页面的源码。
- `assets/redesign/original-inventory.json`、`original-media/`：直接从原 PPTX 的 OOXML 提取的对象清单、完整备注、引用、图片与源文件 SHA256。
- `assets/redesign/review-01-20.json`、`review-21-39.json`：逐页审阅记录。
- `assets/redesign/fonts/`：离线使用的 Space Grotesk、Inter、Noto Sans SC 字体及各自的 OFL 授权。
- `assets/redesign/references/`：选定模板、样式依据、获取记录与授权文件。

**HTML 构建有原稿与预览前置条件，克隆仓库后不能直接一键复现。** `output/` 和 `.cache/` 不提交，因此需要恢复 `original-inventory.json` 所指向、且 SHA256 完全匹配的原 PPTX，以及 `.cache/slide-preview/slide-01.png` 至 `slide-39.png` 的逐页渲染。构建还会核对 `content/deck.json` 与提取清单记录的哈希。

如果没有同一份原稿，可以先运行常规 `npm run build` 生成新的 PPTX，再运行以下命令重新提取并核对。新生成文件的哈希可能不同，须检查新清单的正文与备注比较结果，并重新核对逐页审阅记录；不能只替换旧哈希跳过核验。

```powershell
python scripts/inspect-pptx.py
powershell -ExecutionPolicy Bypass -File scripts/render-preview.ps1
```

提取脚本只使用 Python 标准库。逐页渲染脚本目前要求 Windows 与已注册 `kwpp.Application` COM 接口的 WPS 演示。恢复或重新核验完原稿和 39 张渲染图后，在项目根目录运行：

```powershell
npm run build -- --html-samples
```

结果位于 `output/blue-professional-review/`：`samples.html` 是 3 页样稿，`analysis.html` 是 39 页原稿分析，另含页码对应表、完整备注与可编辑源码。用 Chrome 或 Edge 打开 HTML，保留相邻 `assets/` 文件夹即可离线使用。支持方向键、空格、滚轮和滑动翻页，`N` 查看原备注，`E` 编辑文字，`Ctrl+S` 导出当前 HTML；导出的 HTML 也需与 `assets/` 文件夹放在一起。

HTML 浏览器和 PDF 校验是额外流程，不包含在普通 `npm test` 或 GitHub Actions 检查中。当前脚本使用 Windows Chrome 默认路径 `C:/Program Files/Google/Chrome/Application/chrome.exe`，并从忽略的缓存目录加载以下固定版本工具；这些安装命令首次需要联网：

```powershell
npm install --prefix .cache/browser-tools --no-package-lock --no-save playwright-core@1.64.0
python -m pip install --target .cache/pdf-tools PyMuPDF==1.28.2
node scripts/verify-html-samples.mjs
python scripts/verify-sample-pdf.py
node scripts/package-html-samples.mjs
```

浏览器检查生成 3 页 PDF、不同视口的截图与校验报告，PDF 检查继续核对文字、字体和页面比例，最后的打包命令生成离线样稿 ZIP。上述产物仍只写入 `output/`。

## 内容与工程结构

```text
content/deck.json          正文、讲稿、逐页时间与来源关联（唯一内容源）
content/sources.json       来源、核验日期、支持范围与视频证据
config/theme.json         暖白、深蓝和青绿色的统一主题
schemas/deck.schema.json  编辑器字段提示与布局契约
src/content.mjs           内容加载、时间与引用检查
src/render.mjs            原生可编辑 PPTX 排版
src/notes.mjs             时间与完整引用格式
src/artifact.mjs          PPTX 内容、备注、表格和图片验证
scripts/                  构建、验证、抽帧与真实渲染
assets/video-evidence/    抽帧清单与视频提炼依据
assets/research/          论文和官方资料的核验结果
assets/design/            封面视觉素材
docs/outline.md           页序、时间分配与编辑原则
output/                   生成的 PPTX、PDF 与讲稿
```

## 编辑约定

修改 `content/deck.json` 后重新生成。每页包含稳定 `id`、`section`、`layout`、`title`、`notes`、`sourceIds` 和 `timingSeconds`。逐页时长之和必须等于 `durationMinutes × 60`，当前为 **3000 秒**。详细解释放在 `notes`，正文不靠缩小字号容纳。

| 布局 | 正文字段 | 用途与容量 |
| --- | --- | --- |
| `cover` | `title`、可选 `subtitle`、`imagePath` | 简洁封面 |
| `bullets` | `bullets` | 1–4 条平面列表 |
| `timeline` | `items`：`label`、`description` | 2–4 个历史路标 |
| `process` | `items`：`label`、`description` | 2–4 步横向过程 |
| `comparison` | `columns`：`title`、`bullets` | 两列，每列 1–3 条 |
| `table` | `headers`、`rows` | 原生可编辑表格，2–5 列、2–6 行 |
| `spotlight` | `lead`、可选 `bullets` | 大字主张、数据或讨论问题 |
| `example` | `prompt`、`response`、可选 `caption` | 输入与输出的教学示例 |
| `image` | `imagePath`、`caption`、可选 `bullets` | 保持原图比例的证据图 |
| `closing` | `bullets` | 收束与行动建议 |

各页还可使用 `takeaway` 与 `footnote`。图片使用 `assets/` 内的相对路径。字符上限是输入约束，实际可容纳量仍由字形、换行与布局决定；构建会拦截超出画布或文本框容量的内容。新增布局须同时更新内容验证、Schema、渲染器与必要测试。

来源登记支持 `localPath`、`evidence` 与 `timeRanges`。新增外部事实需实际核验并填写日期，再通过每页 `sourceIds` 关联；生成时完整引用进入备注和独立讲稿。检查命令不代替事实核验。

## 质量检查

`check` 验证内容字段、引用、时间与主题；`test` 覆盖错误输入与正文丢失；`build` 生成并检查排版容量；`verify` 核对 PPTX 包结构、所有可编辑正文、完整讲稿与引用。实际字体与换行需结合 WPS/PowerPoint 渲染结果逐页检查，正式演讲前按备注时间试讲。

项目使用锁定的 PptxGenJS 本地生成流程，没有网站、数据库、远程发布或模型 API 集成。


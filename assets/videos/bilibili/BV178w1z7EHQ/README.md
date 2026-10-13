# AI 通识与 LangChain／Agent 视频参考素材

本目录保存演讲准备所用的视频参考素材，便于后续查阅、选择片段和整理讲稿。

- 原标题：黑马程序员2026最新版LangChain+LangGraph开发实战全套视频课程，从Agent开发，到LangSmith的监控、调试、评估一套搞定。
- 发布者：黑马程序员。
- [Bilibili 原视频](https://www.bilibili.com/video/BV178w1z7EHQ/)。
- 范围：2026-10-13 保存的公开元数据中的全部 28 个分 P，总时长 7 小时 18 分 23 秒；不扩展到作者其他视频。
- 下载工具：you-get；选定流为 `dash-flv480-AVC`（480P、H.264／AAC），合并为 MP4。实际文件参数由 ffprobe 核验后写入清单。

分 P 标题、时长和链接见 [catalog.md](catalog.md)。是否下载完成以 [manifest.json](manifest.json) 中的状态和核验结果为准；索引本身不代表文件已下载。

## 目录

| 路径 | 内容 |
| --- | --- |
| `media/` | 保留来源顺序的原视频文件，按三位分 P 序号与标题命名 |
| `metadata/` | 公开来源元数据快照；[view.json](metadata/view.json) 记录标题、发布者、分 P 列表和时长 |
| [manifest.json](manifest.json) | 每个分 P 的来源、文件路径、下载状态和音视频参数核验信息 |
| `logs/` | you-get 的逐分 P 下载日志 |
| [catalog.md](catalog.md) | 28 个分 P 的本地文件索引与原页链接 |

## 下载与核验

需要 Python，以及在 `PATH` 中可用的 `you-get`、`ffmpeg` 和 `ffprobe`。在项目根目录运行：

```powershell
python scripts/download-bilibili.py
```

脚本按保存的元数据下载全部分 P。重新运行时先核验已有文件，通过的文件直接保留；you-get 保留的下载分片可用于续传。每个文件都会检查音视频轨道、H.264 编码，以及实际时长与来源时长是否相符。

只核验本地文件并更新清单：

```powershell
python scripts/download-bilibili.py --verify-only
```

媒体、下载分片和日志不提交到 Git。后续提取截图或片段时记录原分 P 与时间点；需要在 PPT 中引用技术结论时，按项目约定核验原始或官方资料，并登记到 `content/sources.json`。

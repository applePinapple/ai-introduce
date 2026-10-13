"""Download the recorded Bilibili multipart video with you-get and verify it.

Usage: python scripts/media/download-bilibili.py [--verify-only]
"""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time


ROOT = Path(__file__).resolve().parents[2]
BVID = "BV178w1z7EHQ"


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def write_json(destination, data):
    temporary = destination.with_suffix(destination.suffix + ".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(destination)


def inspect_media(file, expected_seconds):
    if not file.is_file() or file.stat().st_size == 0:
        raise ValueError("没有生成完整的视频文件")
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(file)],
        capture_output=True, encoding="utf-8", errors="replace", timeout=60, check=True,
    )
    media = json.loads(result.stdout)
    video = next((stream for stream in media["streams"] if stream.get("codec_type") == "video"), None)
    audio = next((stream for stream in media["streams"] if stream.get("codec_type") == "audio"), None)
    duration = float(media.get("format", {}).get("duration", 0))
    tolerance = max(3, expected_seconds * 0.01)
    if not video or not audio:
        raise ValueError("文件缺少视频或音频轨")
    if abs(duration - expected_seconds) > tolerance:
        raise ValueError(f"时长不符：预期 {expected_seconds}s，实际 {duration:.2f}s")
    if video.get("codec_name") != "h264":
        raise ValueError("文件并非所选 AVC/H.264 格式")
    return {
        "bytes": file.stat().st_size,
        "durationSeconds": round(duration, 3),
        "width": video.get("width"),
        "height": video.get("height"),
        "videoCodec": video.get("codec_name"),
        "audioCodec": audio.get("codec_name"),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify-only", action="store_true", help="Check files without downloading")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    for command in ["ffprobe", "ffmpeg"] + ([] if args.verify_only else ["you-get"]):
        if not shutil.which(command):
            raise RuntimeError(f"找不到所需工具：{command}")

    folder = ROOT / "assets" / "videos" / "bilibili" / BVID
    metadata = json.loads((folder / "metadata" / "view.json").read_text(encoding="utf-8-sig"))
    if metadata.get("code") != 0 or metadata.get("data", {}).get("bvid") != BVID:
        raise RuntimeError("来源元数据无效或与指定视频不符")
    data = metadata["data"]
    pages = data["pages"]
    media_dir = folder / "media"
    log_dir = folder / "logs"
    media_dir.mkdir(parents=True, exist_ok=True)
    log_dir.mkdir(parents=True, exist_ok=True)
    manifest_file = folder / "manifest.json"
    old_entries = {}
    if manifest_file.is_file():
        previous = json.loads(manifest_file.read_text(encoding="utf-8"))
        old_entries = {entry["cid"]: entry for entry in previous.get("videos", [])}
    manifest = {
        "sourceUrl": f"https://www.bilibili.com/video/{BVID}/",
        "bvid": BVID,
        "title": data["title"],
        "uploader": {"name": data["owner"]["name"], "mid": data["owner"]["mid"]},
        "metadataRecordedOn": "2026-10-13",
        "tool": "you-get 0.4.1743",
        "format": "dash-flv480-AVC",
        "scope": "来源元数据中全部多 P 分集，不扩展到作者其他视频",
        "expectedCount": len(pages),
        "expectedDurationSeconds": sum(page["duration"] for page in pages),
        "videos": [],
    }
    for page in pages:
        safe_title = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", page["part"]).strip(" .")[:70]
        stem = f"{page['page']:03d}_{safe_title}"
        entry = {
            "page": page["page"], "cid": page["cid"], "title": page["part"],
            "url": f"https://www.bilibili.com/video/{BVID}/?p={page['page']}",
            "expectedDurationSeconds": page["duration"],
            "file": f"media/{stem}.mp4",
            "status": "pending",
        }
        previous = old_entries.get(page["cid"], {})
        if previous.get("downloadedAt"):
            entry["downloadedAt"] = previous["downloadedAt"]
        manifest["videos"].append(entry)
    write_json(manifest_file, manifest)

    for index, entry in enumerate(manifest["videos"], 1):
        file = folder / entry["file"]
        prefix = f"[{index:02d}/{len(pages)}] {entry['title']}"
        try:
            verification = inspect_media(file, entry["expectedDurationSeconds"])
            entry.update(status="complete", verifiedAt=now(), verification=verification)
            print(prefix + "：已存在，检查通过", flush=True)
            write_json(manifest_file, manifest)
            continue
        except (ValueError, subprocess.SubprocessError, json.JSONDecodeError) as error:
            if args.verify_only:
                entry.update(status="failed", error=str(error))
                print(prefix + "：检查失败 " + str(error), flush=True)
                write_json(manifest_file, manifest)
                continue

        print(prefix + "：开始下载", flush=True)
        entry.update(status="downloading", startedAt=now())
        write_json(manifest_file, manifest)
        for attempt in range(1, 4):
            command = [
                "you-get", "--timeout", "30", "--no-caption",
                "--format", manifest["format"], "--output-dir", str(media_dir),
                "--output-filename", file.stem, entry["url"],
            ]
            # No --force: keep you-get's partial downloads for resuming.
            if file.exists():
                backup = file.with_name(file.name + ".invalid-" + str(time.time_ns()))
                file.rename(backup)
            try:
                with (log_dir / f"{entry['page']:03d}.log").open("ab") as log:
                    result = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, timeout=1800)
                if result.returncode:
                    raise RuntimeError(f"you-get 退出码 {result.returncode}，详见 logs/{entry['page']:03d}.log")
                verification = inspect_media(file, entry["expectedDurationSeconds"])
                entry.pop("error", None)
                entry.update(status="complete", downloadedAt=now(), verifiedAt=now(), verification=verification, attempts=attempt)
                print(prefix + f"：完成，{verification['bytes'] / 2**20:.1f} MiB", flush=True)
                break
            except (ValueError, RuntimeError, subprocess.SubprocessError, json.JSONDecodeError) as error:
                entry.update(status="failed", error=str(error), attempts=attempt)
                print(prefix + f"：第 {attempt} 次失败，" + str(error), flush=True)
                write_json(manifest_file, manifest)
                if attempt < 3:
                    time.sleep(attempt * 3)
        write_json(manifest_file, manifest)

    completed = [entry for entry in manifest["videos"] if entry["status"] == "complete"]
    manifest.update(
        updatedAt=now(), completedCount=len(completed),
        totalBytes=sum(entry["verification"]["bytes"] for entry in completed),
        status="complete" if len(completed) == len(pages) else "incomplete",
    )
    write_json(manifest_file, manifest)
    print(f"结果：{len(completed)}/{len(pages)}，共 {manifest['totalBytes'] / 2**30:.2f} GiB", flush=True)
    return 0 if len(completed) == len(pages) else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("已中断，保留下载分片；重新运行可继续。", flush=True)
        sys.exit(130)

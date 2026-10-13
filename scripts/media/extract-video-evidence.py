"""Extract reviewable course stills locally without uploading video/audio.

Usage: python scripts/media/extract-video-evidence.py
Only ffmpeg, ffprobe, and the Python standard library are required.
Frame timestamps are exactly 0, 30, 60, ... seconds (30 fps input).
"""
from pathlib import Path
import concurrent.futures
import json
import subprocess

ROOT = Path(__file__).resolve().parents[2]
MEDIA = ROOT / "assets/videos/bilibili/BV178w1z7EHQ/media"
DEST = ROOT / "assets/video-evidence"
INTERVAL = 30


def extract(page):
    source = next(MEDIA.glob(f"{page:03d}_*.mp4"))
    target = DEST / f"{page:03d}"
    target.mkdir(parents=True, exist_ok=True)
    probe = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_format", "-show_streams",
        "-of", "json", str(source)
    ]))
    video = next(s for s in probe["streams"] if s["codec_type"] == "video")
    fps_num, fps_den = map(int, video["r_frame_rate"].split("/"))
    step_frames = round(INTERVAL * fps_num / fps_den)
    vf = (f"select='not(mod(n,{step_frames}))',"
          "drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':"
          "text='%{pts\\:hms}':fontsize=22:fontcolor=yellow:"
          "box=1:boxcolor=black@0.8:x=8:y=8")
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
        "-vf", vf, "-fps_mode", "vfr", "-q:v", "2", str(target / "frame-%03d.jpg")
    ], check=True)
    count = len(list(target.glob("frame-*.jpg")))
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-framerate", "1", "-i", str(target / "frame-%03d.jpg"),
        "-vf", "tile=2x4:padding=4:margin=4:color=gray", "-q:v", "2",
        str(target / "contact-%02d.jpg")
    ], check=True)
    # Denser inspection of the short montage explaining algorithm/data/compute.
    detail_times = [135, 195, 225, 255, 280, 290] if page == 2 else []
    for timestamp in detail_times:
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-ss", str(timestamp), "-i", str(source), "-frames:v", "1",
            "-q:v", "2", str(target / f"detail-{timestamp:03d}.jpg")
        ], check=True)
    return {
        "page": page, "source": str(source.relative_to(ROOT)).replace("\\", "/"),
        "durationSeconds": float(probe["format"]["duration"]),
        "width": video["width"], "height": video["height"],
        "hasSubtitleStream": any(s["codec_type"] == "subtitle" for s in probe["streams"]),
        "frameIntervalSeconds": INTERVAL, "frameCount": count,
        "supplementalFrameTimesSeconds": detail_times,
        "frameIndexRule": "frame-001.jpg = 00:00; frame-NNN.jpg = (NNN-1)*30 seconds",
        "method": "Local ffmpeg frames; visual review of course slides, not an audio transcript."
    }


if __name__ == "__main__":
    DEST.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(extract, [2, 3, 4, 5]))
    (DEST / "frame-manifest.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    for r in results:
        print(f"{r['page']:03d}: {r['durationSeconds']:.1f}s, {r['frameCount']} frames")

import os
import re
import uuid
import subprocess
import asyncio
from functools import partial
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/youtube", tags=["youtube"])

DOWNLOAD_DIR = Path("downloads")
DOWNLOAD_DIR.mkdir(exist_ok=True)


# ── Pydantic models ──────────────────────────────────────────────

class FormatInfo(BaseModel):
    format_id: str
    ext: str
    resolution: Optional[str] = None
    filesize: Optional[int] = None
    note: Optional[str] = None
    has_video: bool = True
    has_audio: bool = True


class VideoInfo(BaseModel):
    title: str
    thumbnail: Optional[str] = None
    duration: Optional[int] = None
    uploader: Optional[str] = None
    view_count: Optional[int] = None
    upload_date: Optional[str] = None
    formats: list[FormatInfo] = []


class DownloadRequest(BaseModel):
    url: str
    format_id: Optional[str] = None
    audio_only: bool = False


class DownloadStatus(BaseModel):
    status: str
    filename: Optional[str] = None
    download_id: Optional[str] = None
    error: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────

_url_pattern = re.compile(
    r"^(https?://)?(www\.)?"
    r"(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)"
    r"[\w\-]+"
)


def _validate_url(url: str) -> None:
    if not _url_pattern.match(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")


async def _run_ytdlp(args: list[str]) -> tuple[int, str, str]:
    """Run yt-dlp in a thread so it works on Windows too."""
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None,
        partial(
            subprocess.run,
            ["yt-dlp", *args],
            capture_output=True,
            text=True,
        ),
    )
    return result.returncode, result.stdout, result.stderr


def _cleanup_old_files(max_age_seconds: int = 3600) -> None:
    import time
    now = time.time()
    for f in DOWNLOAD_DIR.iterdir():
        if f.is_file() and (now - f.stat().st_mtime) > max_age_seconds:
            f.unlink(missing_ok=True)


MIME_MAP = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mkv": "video/x-matroska",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".ogg": "audio/ogg",
    ".opus": "audio/opus",
}


# ── Routes ────────────────────────────────────────────────────────

@router.get("/info", response_model=VideoInfo)
async def get_video_info(url: str = Query(..., description="YouTube video URL")):
    _validate_url(url)

    import json as _json

    rc, stdout, stderr = await _run_ytdlp([
        "--dump-json",
        "--no-download",
        "--no-warnings",
        url,
    ])

    if rc != 0:
        raise HTTPException(status_code=502, detail=f"yt-dlp error: {stderr.strip()}")

    try:
        data = _json.loads(stdout)
    except _json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Failed to parse video info")

    formats: list[FormatInfo] = []
    seen = set()

    for f in data.get("formats", []):
        fid = f.get("format_id", "")
        if fid in seen:
            continue
        seen.add(fid)

        ext = f.get("ext", "?")
        h = f.get("height")
        resolution = f"{h}p" if h else f.get("format_note", "audio")
        has_video = f.get("vcodec", "none") != "none"
        has_audio = f.get("acodec", "none") != "none"

        note_parts = []
        if has_video and has_audio:
            note_parts.append("video+audio")
        elif has_video:
            note_parts.append("video only")
        else:
            note_parts.append("audio only")
        note_parts.append(ext)

        formats.append(FormatInfo(
            format_id=fid,
            ext=ext,
            resolution=resolution,
            filesize=f.get("filesize") or f.get("filesize_approx"),
            note=" · ".join(note_parts),
            has_video=has_video,
            has_audio=has_audio,
        ))

    return VideoInfo(
        title=data.get("title", "Unknown"),
        thumbnail=data.get("thumbnail"),
        duration=data.get("duration"),
        uploader=data.get("uploader"),
        view_count=data.get("view_count"),
        upload_date=data.get("upload_date"),
        formats=formats,
    )


@router.post("/download", response_model=DownloadStatus)
async def start_download(req: DownloadRequest):
    _validate_url(req.url)
    _cleanup_old_files()

    download_id = uuid.uuid4().hex[:12]
    out_template = str(DOWNLOAD_DIR / f"{download_id}.%(ext)s")

    args = [
        "-o", out_template,
        "--no-playlist",
        "--no-warnings",
        "--restrict-filenames",
    ]

    if req.audio_only:
        args += ["-x", "--audio-format", "mp3"]
    elif req.format_id:
        args += ["-f", f"{req.format_id}/bestvideo+bestaudio/best"]
    else:
        args += ["-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"]

    args.append(req.url)

    rc, _stdout, stderr = await _run_ytdlp(args)

    if rc != 0:
        return DownloadStatus(status="error", error=stderr.strip())

    matches = list(DOWNLOAD_DIR.glob(f"{download_id}.*"))
    if not matches:
        return DownloadStatus(status="error", error="Download finished but file not found")

    filepath = matches[0]
    return DownloadStatus(
        status="complete",
        filename=filepath.name,
        download_id=download_id,
    )


@router.get("/file/{filename}")
async def serve_file(filename: str):
    """Stream the file to the browser as a download, then delete it."""
    safe_name = Path(filename).name
    filepath = DOWNLOAD_DIR / safe_name

    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found or expired")

    ext = filepath.suffix.lower()
    media_type = MIME_MAP.get(ext, "application/octet-stream")
    file_size = filepath.stat().st_size

    def iterfile():
        try:
            with open(filepath, "rb") as f:
                while chunk := f.read(1024 * 1024):   # 1 MB chunks
                    yield chunk
        finally:
            # clean up temp file after it's been sent
            filepath.unlink(missing_ok=True)

    return StreamingResponse(
        iterfile(),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}"',
            "Content-Length": str(file_size),
        },
    )
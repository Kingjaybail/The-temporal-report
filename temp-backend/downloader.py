import os
import random
import re
import shutil
import uuid
import subprocess
import asyncio
from functools import partial
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/youtube", tags=["youtube"])

DOWNLOAD_DIR = Path("downloads")
DOWNLOAD_DIR.mkdir(exist_ok=True)

# Path to a Netscape-format cookies.txt exported from a browser logged into
# YouTube. Needed on cloud hosts because YouTube blocks data-center IPs with
# "Sign in to confirm you're not a bot".
_COOKIES_SRC = os.environ.get("YT_DLP_COOKIES")

# yt-dlp tries to *write* the cookies file back on close to persist rotated
# session tokens. Render's Secret Files mount at /etc/secrets is read-only,
# so we copy the source to a writable location at startup and point yt-dlp
# at the copy.
COOKIES_FILE: Optional[str] = None
if _COOKIES_SRC and Path(_COOKIES_SRC).exists():
    _writable_cookies = DOWNLOAD_DIR / "cookies.txt"
    try:
        shutil.copyfile(_COOKIES_SRC, _writable_cookies)
        COOKIES_FILE = str(_writable_cookies)
    except OSError:
        COOKIES_FILE = _COOKIES_SRC  # fall back; may still hit RO error on close

# Optional HTTP(S) proxy URL passed to yt-dlp via --proxy. Comma-separated
# list is allowed; one is chosen at random per request for crude rotation.
# Format: http://user:pass@host:port
_PROXY_ENV = os.environ.get("YT_DLP_PROXY", "").strip()
PROXIES: list[str] = [p.strip() for p in _PROXY_ENV.split(",") if p.strip()]


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
    user_agent: Optional[str] = None


class InfoRequest(BaseModel):
    url: str
    user_agent: Optional[str] = None


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


_BRAVE_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)


async def _run_ytdlp(
    args: list[str],
    user_agent: Optional[str] = None,
) -> tuple[int, str, str]:
    """Run yt-dlp in a thread so it works on Windows too."""
    cookie_args = ["--cookies", COOKIES_FILE] if COOKIES_FILE else []
    proxy_args = ["--proxy", random.choice(PROXIES)] if PROXIES else []
    # Switching player clients dodges YouTube's bot wall on data-center IPs;
    # matching UA to the *caller's* browser reduces fingerprint mismatch
    # against the session whose cookies we're replaying.
    anti_bot_args = [
        "--user-agent", user_agent or _BRAVE_UA,
        "--extractor-args", "youtube:player_client=default,android,web_safari",
    ]
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None,
        partial(
            subprocess.run,
            ["yt-dlp", *cookie_args, *proxy_args, *anti_bot_args, *args],
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

@router.post("/info", response_model=VideoInfo)
async def get_video_info(req: InfoRequest):
    _validate_url(req.url)

    import json as _json

    rc, stdout, stderr = await _run_ytdlp(
        [
            "--dump-json",
            "--no-download",
            "--no-warnings",
            req.url,
        ],
        user_agent=req.user_agent,
    )

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

    rc, _stdout, stderr = await _run_ytdlp(args, user_agent=req.user_agent)

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
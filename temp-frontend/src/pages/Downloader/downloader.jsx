import React, { useState, useCallback } from "react";
import Navbar from "../../components/Navbar/navbar.jsx";
import "./downloader.scss";

const API_BASE = import.meta.env.VITE_REACT_API_URL;

/* ─── API helpers ─────────────────────────────────────────────── */

async function fetchVideoInfo(url) {
  const res = await fetch(`${API_BASE}/youtube/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      user_agent: navigator.userAgent,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch video info");
  }
  return res.json();
}

async function requestDownload(url, formatId = null, audioOnly = false) {
  const res = await fetch(`${API_BASE}/youtube/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      format_id: formatId,
      audio_only: audioOnly,
      user_agent: navigator.userAgent,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Download request failed");
  }
  return res.json();
}

async function triggerBrowserDownload(filename) {
  const url = `${API_BASE}/youtube/file/${encodeURIComponent(filename)}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error("File download failed");

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // cleanup
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
    a.remove();
  }, 100);
}

/* ─── Formatting utils ────────────────────────────────────────── */

function fmtDuration(s) {
  if (!s) return "??:??";
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function fmtSize(b) {
  if (!b) return "—";
  if (b < 1_000_000) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1_048_576).toFixed(1)} MB`;
}

function fmtViews(n) {
  if (!n) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M views`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K views`;
  return `${n} views`;
}

function fmtDate(d) {
  if (!d || d.length !== 8) return "";
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

/* ─── Component ───────────────────────────────────────────────── */

export default function Downloader() {
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [audioOnly, setAudioOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  /* ── fetch info ── */
  const handleFetch = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    setResult(null);
    setSelectedFormat(null);

    try {
      const data = await fetchVideoInfo(url.trim());
      setInfo(data);
      const combined = data.formats.find((f) => f.has_video && f.has_audio);
      if (combined) setSelectedFormat(combined.format_id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  /* ── start download on server, then save to browser ── */
  const handleDownload = useCallback(async () => {
    if (!url.trim()) return;
    setDownloading(true);
    setError(null);
    setResult(null);

    try {
      // step 1: tell backend to download from youtube
      const data = await requestDownload(url.trim(), selectedFormat, audioOnly);

      if (data.status === "error") {
        setError(data.error || "Download failed");
        return;
      }

      setResult(data);

      // step 2: stream file from backend → browser save dialog
      setSaving(true);
      await triggerBrowserDownload(data.filename);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(false);
      setSaving(false);
    }
  }, [url, selectedFormat, audioOnly]);

  /* ── manual re-save if they dismissed the dialog ── */
  const handleSaveAgain = useCallback(async () => {
    if (!result?.filename) return;
    setSaving(true);
    try {
      await triggerBrowserDownload(result.filename);
    } catch (e) {
      setError("File may have expired. Try downloading again.");
    } finally {
      setSaving(false);
    }
  }, [result]);

  /* ── filtered formats ── */
  const formats = info
    ? info.formats.filter((f) => (audioOnly ? !f.has_video : f.has_video))
    : [];

  return (
    <div className="page">
      <Navbar />
      <div className="content">
        <main className="main-content">
          <div className="dl-container">
            {/* header */}
            <div className="dl-title">YouTube Video Downloader</div>
            <div className="dl-meta">
              Paste a YouTube link below · only download content you have rights to
            </div>

            {/* url bar */}
            <div className="dl-controls">
              <input
                className="dl-url-input"
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              />
              <button
                className="dl-btn"
                disabled={loading || !url.trim()}
                onClick={handleFetch}
              >
                {loading ? "Loading…" : "Fetch"}
              </button>
            </div>

            <hr className="dl-divider" />

            {error && <div className="dl-error">⚠ {error}</div>}

            {/* video card */}
            {info && (
              <div className="dl-card">
                {info.thumbnail && (
                  <img className="dl-thumb" src={info.thumbnail} alt="Video thumbnail" />
                )}

                <div className="dl-video-title">{info.title}</div>

                <div className="dl-meta">
                  {info.uploader || "Unknown uploader"} · {fmtDuration(info.duration)}{' '}
                  · {fmtViews(info.view_count)}
                  {info.upload_date ? ` · ${fmtDate(info.upload_date)}` : ""}
                </div>

                {/* audio toggle */}
                <label className="dl-audio-label">
                  <input
                    type="checkbox"
                    checked={audioOnly}
                    onChange={(e) => {
                      setAudioOnly(e.target.checked);
                      setSelectedFormat(null);
                    }}
                  />
                  Audio only (MP3)
                </label>

                {/* format table */}
                {!audioOnly && formats.length > 0 && (
                  <table className="dl-formats">
                    <thead>
                      <tr>
                        <th />
                        <th>Res</th>
                        <th>Ext</th>
                        <th>Type</th>
                        <th>Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formats.map((f) => (
                        <tr key={f.format_id}>
                          <td className="dl-radio-cell">
                            <input
                              type="radio"
                              name="fmt"
                              checked={selectedFormat === f.format_id}
                              onChange={() => setSelectedFormat(f.format_id)}
                            />
                          </td>
                          <td>{f.resolution}</td>
                          <td>{f.ext}</td>
                          <td>{f.note}</td>
                          <td>{fmtSize(f.filesize)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* download / save buttons */}
                <div className="dl-actions">
                  <button
                    className="dl-btn"
                    disabled={downloading || saving}
                    onClick={handleDownload}
                  >
                    {downloading && !saving
                      ? "Preparing…"
                      : saving
                      ? "Saving…"
                      : "Download"}
                  </button>
                </div>

                {/* re-save link */}
                {result && result.status === "complete" && !saving && (
                  <div className="dl-status dl-success">
                    ✓ Download complete —{' '}
                    <button className="dl-link-btn" onClick={handleSaveAgain}>
                      Save again
                    </button>
                  </div>
                )}
              </div>
            )}

            {!info && !loading && !error && (
              <div className="dl-status">Enter a URL and press Fetch to begin.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
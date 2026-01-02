import { useState } from "react";
import "./create.scss";
import { saveDraft, publishArticle, fetchLatestDraft } from "../../util/router";
import Navbar from "../../components/Navbar/navbar.jsx"
export default function Create() {
  const loggedInUser = localStorage.getItem("user");

  if (!loggedInUser) {
    window.location.href = "/login";
  }

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [showDraft, setShowDraft] = useState(false);
  const [draft, setDraft] = useState(null);

  const handleSaveDraft = async () => {
    setError("");
    try {
      await saveDraft(title, body, loggedInUser);
      alert("Draft saved.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePublish = async () => {
    setError("");
    try {
      await publishArticle(title, body, loggedInUser);
      window.location.href = "/articles";
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoadDraft = async () => {
    try {
      const d = await fetchLatestDraft(loggedInUser);
      if (d) {
        setDraft(d);
        setShowDraft(true);
      } else {
        alert("No saved drafts found.");
      }
    } catch {
      alert("Failed to load draft.");
    }
  };

  const applyDraft = () => {
    setTitle(draft.title);
    setBody(draft.body);
    setShowDraft(false);
  };

  return (
    <div className="page">
      <Navbar/>
      <div className="content">
        <aside className="sidebar">
          <section>
            <h3>Publishing</h3>
            <ul>
              <li>New Draft</li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLoadDraft();
                  }}
                >
                  Saved Draft
                </a>
              </li>
            </ul>
          </section>
        </aside>

        <main className="main-content">
          <h2>Create New Article</h2>

          <p style={{ fontSize: "12px", color: "#555" }}>
            Author: <strong>{loggedInUser}</strong>
          </p>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <form className="editor-form">
            <div className="form-row">
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="form-row">
              <label>Body</label>
              <textarea
                rows={14}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleSaveDraft}>
                Save Draft
              </button>
              <button type="button" onClick={handlePublish}>
                Publish
              </button>
            </div>
          </form>
        </main>

        {showDraft && draft && (
          <div className="draft-popup">
            <div className="draft-popup-inner">
              <h3>Latest Saved Draft</h3>

              <p>
                <strong>Title:</strong> {draft.title}
              </p>
              <p>
                <strong>Last Modified:</strong>{" "}
                {new Date(draft.created_at).toLocaleString()}
              </p>

              <div className="draft-popup-actions">
                <button onClick={applyDraft}>Load Draft</button>
                <button onClick={() => setShowDraft(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        An ignorant man complains about his ripped pocket while a wise man uses it to scratch his balls.
      </footer>
    </div>
  );
}

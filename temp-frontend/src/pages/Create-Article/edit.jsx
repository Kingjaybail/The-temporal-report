import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./create.scss";
import { fetchArticleById, updateArticle } from "../../util/router";

export default function Edit() {
  const { id } = useParams();
  const loggedInUser = localStorage.getItem("user");

  if (!user) window.location.href = "/login";

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchArticleById(id)
      .then((a) => {
        setTitle(a.title);
        setBody(a.body);
      })
      .catch(() => setError("Failed to load article"));
  }, [id]);

  const handleUpdate = async () => {
    try {
      await updateArticle(id, title, body, loggedInUser);
      window.location.href = "/articles";
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="title">Edit Published Article</div>
      </header>

      <main className="main-content">
        {error && <p style={{ color: "red" }}>{error}</p>}

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

        <button onClick={handleUpdate}>Save Changes</button>
      </main>
    </div>
  );
}

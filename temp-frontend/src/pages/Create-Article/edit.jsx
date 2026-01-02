import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./create.scss";
import { fetchArticleById, updateArticle } from "../../util/router";
import Navbar from "../../components/Navbar/navbar.jsx";

export default function Edit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loggedInUser = localStorage.getItem("user");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(true);

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/login");
      return;
    }

    fetchArticleById(id)
      .then((a) => {
        if (a.author !== loggedInUser) {
          setAuthorized(false);
          setError("You are not authorized to edit this article.");
          return;
        }
        setTitle(a.title);
        setBody(a.body);
      })
      .catch(() => setError("Failed to load article"));
  }, [id, loggedInUser, navigate]);

  const handleUpdate = async () => {
    try {
      await updateArticle(id, title, body, loggedInUser);
      navigate("/articles");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <Navbar />

      <main className="main-content">
        <h2>Edit Article</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {authorized && (
          <>
            <div className="form-row">
              <label>Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
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
          </>
        )}
      </main>
    </div>
  );
}

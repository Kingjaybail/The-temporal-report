import "./articles.scss";
import { useEffect, useState } from "react";
import { fetchArticles, deleteArticle } from "../../util/router";

import Navbar from "../../components/Navbar/navbar.jsx";

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState("");
  const loggedInUser = localStorage.getItem("user");

    const handleDelete = async (id) => {
      if (!window.confirm("Delete this article permanently?")) return;

      try {
        await deleteArticle(id, loggedInUser);
        setArticles((prev) => prev.filter((a) => a.id !== id));
      } catch {
        alert("Delete failed");
      }
    };

  useEffect(() => {
    fetchArticles()
      .then(setArticles)
      .catch(() => setError("Failed to load articles"));
  }, []);

  return (
    <div className="page">
      <Navbar />

      <div className="content">
        <aside className="sidebar">
          <section>
            <h3>Archive</h3>
            <ul>
              <li>Latest Reports</li>
              <li>By Author</li>
              <li>By Date</li>
            </ul>
          </section>
        </aside>

        <main className="main-content">
          <h2>Filed Reports</h2>

          {error && <p style={{ color: "red" }}>{error}</p>}

          {articles.length === 0 && (
            <p>No reports have been filed.</p>
          )}
          {articles.map((article) => (
              <article key={article.id} className="news-article">
                <h3 className="article-title">{article.title}</h3>

                <div className="article-meta">
                  Filed by: {article.author}
                  {" | "}
                  {new Date(article.created_at).toLocaleDateString()}

                  {article.author === loggedInUser && (
                    <>
                      {" | "}
                      <a href={`/edit/${article.id}`} style={{ fontSize: "12px" }}>
                        Edit
                      </a>
                      {" | "}
                      <a
                        href="#"
                        style={{ fontSize: "12px", color: "darkred" }}
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(article.id);
                        }}
                      >
                        Delete
                      </a>
                    </>
                  )}
                </div>
                <div className="article-body">
                  {article.body.split("\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                <hr className="article-divider" />
              </article>
            ))}
        </main>
      </div>

      <footer className="footer">
         "We are what isn't. To the unattuned it is a paradox, but put a deaf man in a sea of sound and he will believe himself in absence." - The Blind Seer
      </footer>
    </div>
  );
}

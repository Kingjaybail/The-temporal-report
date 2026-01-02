import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./userPage.scss";
import { fetchUserPage } from "../../util/router";
import Navbar from "../../components/Navbar/navbar.jsx";

export default function UserPage() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserPage(username)
      .then(setData)
      .catch(() => setError("User not found"));
  }, [username]);

  if (!data && !error) return null;

  return (
    <div className="page">
      <Navbar />

      <div className="content">
        <main className="main-content">
          {error && <p style={{ color: "red" }}>{error}</p>}

          {data && (
            <>
              <h2>Contributor: {data.username}</h2>

              {data.articles.length === 0 && (
                <p>No published articles.</p>
              )}

              {data.articles.map((article) => (
                <article key={article.id} className="news-article">
                  <h3>{article.title}</h3>

                  <div className="article-meta">
                    {new Date(article.created_at).toLocaleDateString()}
                  </div>

                  <div className="article-body">
                    {article.body.split("\n").map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>

                  <hr />
                </article>
              ))}
            </>
          )}
        </main>
      </div>

      <footer className="footer">
        Contributor Archive
      </footer>
    </div>
  );
}

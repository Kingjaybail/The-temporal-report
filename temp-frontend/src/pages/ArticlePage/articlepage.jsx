import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./articlepage.scss";
import { fetchArticleById } from "../../util/router";
import Navbar from "../../components/Navbar/navbar.jsx";
import CommentThread from "./CommentThread.jsx";

export default function ArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState("");
  const loggedInUser = localStorage.getItem("user");

  useEffect(() => {
    loadArticle();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  async function loadArticle() {
    try {
      const data = await fetchArticleById(id);
      setArticle(data);
    } catch {
      setError("Article not found");
    }
  }

  if (error) {
    return (
      <div className="page">
        <Navbar />
        <main className="main-content">
          <p style={{ color: "red" }}>{error}</p>
        </main>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="page">
      <Navbar />

      <div className="content">
        <main className="main-content">
          <article className="full-article">
            <h2 className="article-title">{article.title}</h2>

            <div className="article-meta">
              Filed by:{" "}
              <a href={`/users/${article.author}`} className="article-author-link">
                {article.author}
              </a>{" "}
               | {new Date(article.created_at).toLocaleDateString()}
              {article.author === loggedInUser && (
                <>
                  {" | "}
                  <a href={`/edit/${article.id}`} style={{ fontSize: "12px" }}>
                    Edit
                  </a>
                </>
              )}
            </div>

            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: article.body }}
            />
          </article>

          {/* Threaded Comments Section */}
          <CommentThread articleId={article.id} loggedInUser={loggedInUser} />
        </main>
      </div>

      <footer className="footer">
        "Even words fall silent when the truth speaks too loud." – Anonymous
      </footer>
    </div>
  );
}

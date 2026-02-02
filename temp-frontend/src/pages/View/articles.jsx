import "./articles.scss";
import { useEffect, useMemo, useState } from "react";
import { fetchArticles, deleteArticle } from "../../util/router";
import Navbar from "../../components/Navbar/navbar.jsx";

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at");
  const [grandmaMode, setGrandmaMode] = useState(false);

  // NEW: local input state for page jumping
  const [pageInput, setPageInput] = useState("1");

  const limit = grandmaMode ? 1 : 2;
  const loggedInUser = localStorage.getItem("user");

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  // NEW: keep page within bounds if totalPages shrinks (e.g., search changes)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [totalPages]); // intentionally not including `page` to avoid loops

  // NEW: keep pageInput synced with current page
  useEffect(() => {
    setPageInput(String(page));
  }, [page, totalPages]);

  const clampPage = (n) => {
    const num = Number.isFinite(n) ? n : 1;
    return Math.min(totalPages, Math.max(1, num));
  };

  const goToPage = () => {
    const parsed = parseInt(pageInput, 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(page)); // revert if invalid
      return;
    }
    setPage(clampPage(parsed));
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchArticles({
        page,
        limit,
        search,
        sort,
        order: "desc",
      });

      setArticles(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

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
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadArticles();
  }, [page, search, sort, limit]); // NOTE: include `limit` so grandma mode reloads correctly

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

          <label className="switch">
            <input
              type="checkbox"
              checked={grandmaMode}
              onChange={() => {
                setPage(1);
                setGrandmaMode(!grandmaMode);
              }}
            />
            <span className="slider">Grandma mode</span>
          </label>

          <div className="article-controls">
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="article-search"
            />

            <select
              value={sort}
              onChange={(e) => {
                setPage(1);
                setSort(e.target.value);
              }}
              className="article-sort"
            >
              <option value="created_at">Newest</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
            </select>
          </div>

          {loading && <p>Loading...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
          {!loading && articles.length === 0 && <p>No reports have been filed.</p>}

          {articles.map((article) => (
            <article key={article.id} className="news-article">
              <h3 className="article-title">
                <a href={`/articles/${article.id}`} className="article-link">
                  {article.title}
                </a>
              </h3>

              <div className="article-meta">
                Filed by:{" "}
                <a href={`/users/${article.author}`} className="article-author-link">
                  {article.author}
                </a>
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

              <div
                className={`article-body ${grandmaMode ? "grandma-text" : ""}`}
                dangerouslySetInnerHTML={{ __html: article.body }}
              />
              <hr className="article-divider" />
            </article>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(1)}>
                First
              </button>

              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>

              <span>
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>

              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                Last
              </button>

              <div className="page-jump">
                <span>Go to </span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goToPage();
                    if (e.key === "Escape") setPageInput(String(page));
                  }}
                />
                <button onClick={goToPage} style={{ marginLeft: "8px" }}>Go</button>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="footer">
        "We are what isn't. To the unattuned it is a paradox, but put a deaf man in a sea of sound and he will believe himself in absence."
        – The Blind Seer
      </footer>
    </div>
  );
}

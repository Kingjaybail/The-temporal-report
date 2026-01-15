import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./userpage.scss";
import { fetchUserPage } from "../../util/router";
import Navbar from "../../components/Navbar/navbar.jsx";

export default function UserPage() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [aboutDraft, setAboutDraft] = useState("");
  const loggedInUser = localStorage.getItem("user");

  async function loadUser() {
    try {
      const result = await fetchUserPage(username);
      setData(result);
      setAboutDraft(result.about || "");
    } catch {
      setError("User not found");
    }
   }
    function fireHintRequest() {
        console.log("test");
      fetch(`${import.meta.env.VITE_REACT_API_URL}/A_Gift`, {
        headers: {
          "A_gift_from_the_creator": "The mall contains much, but a talking dog? how bizarre"
        }
      }).catch(() => {});
    }

    useEffect(() => {
      if (username === "The_Creator") {
        fireHintRequest();
      }
    }, [username]);

  useEffect(() => {
    loadUser();
  }, [username]);

  async function saveAbout() {
    const res = await fetch(
      `${import.meta.env.VITE_REACT_API_URL}/users/${username}/about`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ about: aboutDraft }),
      }
    );
    if (res.ok) {
      setData({ ...data, about: aboutDraft });
      setEditing(false);
    } else {
      alert("Failed to update About Me");
    }
  }

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

              {/* About Me Section */}
              <section className="user-about">
                <h3>About Me</h3>
                {editing ? (
                  <>
                    <textarea
                      value={aboutDraft}
                      onChange={(e) => setAboutDraft(e.target.value)}
                      rows={4}
                      style={{ width: "100%" }}
                    />
                    <div style={{ marginTop: "8px" }}>
                      <button onClick={saveAbout}>Save</button>{" "}
                      <button onClick={() => setEditing(false)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>{data.about || "This user has not added an About Me yet."}</p>
                    {loggedInUser === data.username && (
                      <button
                        style={{ marginTop: "8px" }}
                        onClick={() => setEditing(true)}
                      >
                        Edit
                      </button>
                    )}
                  </>
                )}
              </section>

              <hr />

              <h3>Articles</h3>
              {data.articles.length === 0 && <p>No published articles.</p>}

              {data.articles.map((article) => (
                <article key={article.id} className="news-article">
                  <h2><a href={`/articles/${article.id}`}>{article.title}</a></h2>
                  <div className="article-meta">
                    {new Date(article.created_at).toLocaleDateString()}
                  </div>
                  <div
                    className="article-body"
                    dangerouslySetInnerHTML={{ __html: article.body }}
                  />
                  <hr />
                </article>
              ))}
            </>
          )}
        </main>
      </div>
      {data.username == "The_Creator" ? (
        <footer className="footer">Wonder whats going on in the network these days?</footer>
      ): (
        <footer className="footer">Contributor Archive</footer>
      )}
    </div>
  );
}

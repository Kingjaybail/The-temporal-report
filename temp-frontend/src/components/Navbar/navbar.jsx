import "./navbar.scss";
import { useEffect, useState } from "react";
import { fetchUsers } from "../../util/router";

export default function Navbar() {
  const user = localStorage.getItem("user");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => setError("Failed to load users"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="title">The Temporal Report</div>
          <div className="subtitle">
            A users guide to the evil and twisted
          </div>
        </div>
      </header>

      <nav className="top-nav">
        <a className="nav-button" href="/">Home</a>
        <a className="nav-button" href="/create">Create Article</a>
        <a className="nav-button" href="/articles">Articles</a>

        <div className="nav-right">
          {user ? (
            <>
              <span className="nav-user">
                  Logged in as:{" "}
                  <a href={`/users/${user}`} className="nav-user-link">
                    <strong>{user}</strong>
                  </a>
              </span>
              <a href="#" className="nav-button" onClick={handleLogout}>Logout</a>
            </>
          ) : (
            <a href="/login" className="nav-button">Login</a>
          )}
        </div>
      </nav>
    </>
  );
}

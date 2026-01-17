import "./navbar.scss";
import { useEffect, useState } from "react";
import { fetchUsers, fetchNotifications, markNotificationsRead } from "../../util/router";

export default function Navbar() {
  const user = localStorage.getItem("user");
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => console.error("Failed to load users"));

    if (user) {
      fetchNotifications(user)
        .then(setNotifications)
        .catch(console.error);
    }
  }, [user]);

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
          {user && (
            <div className="notifications-wrapper">
              <button
                className="nav-button notification-btn"
                style={{ marginLeft: "1px" }}
                onClick={async () => {
                  if (!showNotifications && notifications.length > 0) {
                    await markNotificationsRead(user);
                  }
                  setShowNotifications(!showNotifications);
                }}
              >
                Notifications {notifications.length > 0 && `(${notifications.length})`}
              </button>
              {showNotifications && (
                <div className="notifications-dropdown">
                  {notifications.length === 0 ? (
                    <div className="notification-item">No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <a key={n.id} href={`/articles/${n.article_id}`} className="notification-item">
                        New comment on <strong>{n.article_title}</strong>
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

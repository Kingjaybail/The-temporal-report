import "./navbar.scss";

export default function Navbar() {
  const user = localStorage.getItem("user");

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
        <a href="/">Home</a>
        <a href="/create">Create Article</a>
        <a href="/articles">Articles</a>

        <div className="nav-right">
          {user ? (
            <>
              <span className="nav-user">Logged in as: <strong>{user}</strong></span>
              <a href="#" onClick={handleLogout}>Logout</a>
            </>
          ) : (
            <a href="/login">Login</a>
          )}
        </div>
      </nav>
    </>
  );
}

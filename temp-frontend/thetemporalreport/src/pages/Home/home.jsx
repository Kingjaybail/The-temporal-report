import "./home.scss"

export default function Home() {
  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div className="title">The Temporal Report</div>
          <div className="subtitle">
            A users guide to the evil and twisted
          </div>
        </div>
      </header>

      <nav className="top-nav">
        <a href="#">Home</a>
        <a href="#">Archives</a>
        <a href="#">About</a>
        <a href="#">Articles</a>
      </nav>

      <div className="content">
        <aside className="sidebar">
          <section>
            <h3>Browse</h3>
            <ul>
              <li><a href="#">Latest Entries</a></li>
              <li><a href="#">By Date</a></li>
              <li><a href="#">By Topic</a></li>
              <li><a href="#">Full Archive</a></li>
            </ul>
          </section>

          <section>
            <h3>Meta</h3>
            <ul>
              <li><a href="#">About This Site</a></li>
              <li><a href="#">Editorial Policy</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </section>
        </aside>

        <main className="main-content">
          <h2>Welcome to The Temporal Report</h2>
          <p>
              A user report system to declassify the classified
          </p>
          <p>
            Our mission? RE-REDACT the Epstein files!
          </p>
        </main>
      </div>

      <footer className="footer">
        The Temporal Report 2003–2005
      </footer>
    </div>
  );
}

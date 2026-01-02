import "./home.scss"
import Navbar from "../../components/Navbar/navbar.jsx";

export default function Home() {

  return (
    <div className="page">
        <Navbar/>
      <div className="content">
        <aside className="sidebar">
          <section>
            <h3>Browse</h3>
            <ul>
              <li><a href="/articles">Latest Entries</a></li>
              <li><a href="/articles">Full Archive</a></li>
            </ul>
          </section>

          <section>
            <h3>Meta</h3>
            <ul>
              <li><a href="#">About This Site</a></li>
              <li><a href="#">Editorial Policy</a></li>
              <li><a href="/users">Find Users</a></li>
            </ul>
          </section>
        </aside>

        <main className="main-content">
          <h2>Welcome to The Temporal Report</h2>
          <p>
              A user report system to declassify the classified
          </p>
          <p>
            Dont assume all pages can be found by links
          </p>
          <p>But the users can be try clicking Find Users to discover people</p>
        </main>
      </div>

      <footer className="footer">
        The Temporal Report 2003–2005 <br></br>
        Editors: note as of December 22nd 2025 we are no longer partnered with the Epstein Foundation of youths in congress
      </footer>
    </div>
  );
}

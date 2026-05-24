import "./home.scss"
import Navbar from "../../components/Navbar/navbar.jsx";

export default function Home() {
    const showRareFooter = Math.floor(Math.random() * 25) === 0;
    const normalFooter = (
      <>
        The Temporal Report 2003–2005 <br />
        Editors: note as of December 22nd 2025 we are no longer partnered with the Epstein Foundation of youths in congress
      </>
    );

    const rareFooter = (
      <>
        Hint: A note exists beneath my feat, a trail it leads, start at the beginning but gaze upon the end <br/>
      </>
    );

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
              <li><a href="/Downloader">Downloader</a></li>
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
          {showRareFooter ? rareFooter : normalFooter}
        </footer>
    </div>
  );
}

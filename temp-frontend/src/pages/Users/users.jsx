import { useEffect, useState } from "react";
import "./users.scss";
import { fetchUsers } from "../../util/router";
import Navbar from "../../components/Navbar/navbar.jsx";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => setError("Failed to load users"));
  }, []);

  return (
    <div className="page">
      <Navbar />

      <div className="content">
        <main className="main-content">
          <h2>All Registered Users</h2>

          <p className="users-intro">
            Registered contributors
          </p>
          {error && <p style={{ color: "red" }}>{error}</p>}

          <ul className="user-list">
            {users.map((u) => (
              <li key={u}>
                <a href={`/users/${u}`}>{u}</a>
              </li>
            ))}
          </ul>
        </main>
      </div>

      <footer className="footer">
        Fear the elderly in a world where most die young
      </footer>
    </div>
  );
}

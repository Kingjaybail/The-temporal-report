import { useState } from "react";
import "./login.scss";
import { loginUser, signupUser } from "../../util/router.jsx";

export default function Login() {
  const [loginUserName, setLoginUserName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupUserName, setSignupUserName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await loginUser(loginUserName, loginPassword);
      localStorage.setItem("user", res.user);
      window.location.href = "/"
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await signupUser(signupUserName, signupPassword);
      localStorage.setItem("user", res.user);
      window.location.href = "/create";
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div className="title">The Temporal Report</div>
          <div className="subtitle">Restricted Editorial Access</div>
        </div>
      </header>

      <nav className="top-nav">
        <a href="/">Home</a>
        <a href="/login">Login</a>
      </nav>

      <div className="content">
        <aside className="sidebar">
          <section>
            <h3>Notice</h3>
            <ul>
              <li>Authorized users only</li>
              <li>Activity may be logged</li>
              <li>Credentials archived</li>
            </ul>
          </section>
        </aside>

        <main className="main-content">
          <h2>User Authentication</h2>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div className="auth-panels">
            {/* LOGIN */}
            <div className="auth-panel">
              <h3>Login</h3>

              <form onSubmit={handleLogin}>
                <div className="form-row">
                  <label>Username</label>
                  <input
                    value={loginUserName}
                    onChange={(e) => setLoginUserName(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <label>Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <button type="submit">Enter</button>
              </form>
            </div>

            {/* SIGNUP */}
            <div className="auth-panel">
              <h3>Signup</h3>

              <form onSubmit={handleSignup}>
                <div className="form-row">
                  <label>Username</label>
                  <input
                    value={signupUserName}
                    onChange={(e) => setSignupUserName(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <label>Password</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>

                <button type="submit">Register</button>
              </form>
            </div>
          </div>
        </main>
      </div>

      <footer className="footer">
        Unauthorized access is prohibited and punishable
      </footer>
    </div>
  );
}

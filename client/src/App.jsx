import { useState } from "react";
import axios from "axios";
import "./App.css";
import ClientDashboard from "./ClientDashboard";
import BrowseServices from "./BrowseServices";
import BookService from "./BookService";
import Home from "./Home";
import CreatorDashboard from "./CreatorDashboard";
import AIChatbot from "./components/AIChatbot";
import FloatingChatbot from "./components/FloatingChatbot";

const API_URL = "http://localhost:5000/api";

function App() {
  const [isLogin, setIsLogin] = useState(
    window.location.pathname !== "/register" &&
      new URLSearchParams(window.location.search).get("mode") !== "register"
  );
  const [role, setRole] = useState("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";

      const payload = isLogin
        ? { email, password }
        : { name, email, password, role };

      const response = await axios.post(`${API_URL}${endpoint}`, payload);
      const data = response.data;

      if (!isLogin) {
        setSuccess("Registration successful! Please sign in.");
        setIsLogin(true);
        setPassword("");
        return;
      }

      const token = data.token || data.accessToken;

      if (!token) {
        setError("Login response did not contain a token.");
        return;
      }

      localStorage.setItem("creatorStudioToken", token);
      localStorage.setItem(
        "creatorStudioUser",
        JSON.stringify(data.user || data)
      );

      const user = data.user || data;

      localStorage.setItem("creatorStudioUser", JSON.stringify(user));

      if (user.role === "creator") {
        window.location.href = "/creator-dashboard";
      } else {
        window.location.href = "/client-dashboard";
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const pathname = window.location.pathname;

  let pageContent = null;
  if (pathname === "/client-dashboard") {
    pageContent = <ClientDashboard />;
  } else if (pathname === "/browse-services") {
    pageContent = <BrowseServices />;
  } else if (pathname.startsWith("/book-service/")) {
    pageContent = <BookService />;
  } else if (pathname === "/") {
    pageContent = <Home />;
  } else if (pathname === "/creator-dashboard") {
    pageContent = <CreatorDashboard />;
  } else if (pathname === "/ai-chat") {
    pageContent = <AIChatbot />;
  } else {
    pageContent = (
      <main className="auth-page">
        <section className="auth-visual">
          <div className="brand">
            <div className="brand-icon">C</div>
            <span>CreatorStudio</span>
          </div>

          <div className="visual-content">
            <span className="eyebrow">YOUR CREATIVITY, YOUR BUSINESS</span>
            <h1>Make your next great idea happen.</h1>
            <p>
              Showcase your work, connect with clients, and turn your
              creative ideas into successful projects.
            </p>

            <div className="visual-card">
              <div className="visual-card-icon">✦</div>
              <div>
                <strong>Made for creators</strong>
                <p>Showcase your talent. Build your future.</p>
              </div>
            </div>
          </div>

          <div className="visual-footer">
            <span>Portfolio</span>
            <span>Collaboration</span>
            <span>Growth</span>
          </div>
        </section>

        <section className="auth-panel">
          <div className="mobile-brand">
            <div className="brand-icon">C</div>
            <span>CreatorStudio</span>
          </div>

          <div className="auth-form-wrap">
            <div className="form-heading">
              <span className="eyebrow">
                {isLogin ? "WELCOME BACK" : "JOIN OUR COMMUNITY"}
              </span>
              <h2>
                {isLogin ? "Sign in to your account" : "Create your account"}
              </h2>
              <p>
                {isLogin
                  ? "Enter your details to continue to CreatorStudio."
                  : "Start showcasing your creativity today."}
              </p>
            </div>

            <div className="auth-switch">
              <button
                type="button"
                className={isLogin ? "switch-active" : ""}
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                  setSuccess("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={!isLogin ? "switch-active" : ""}
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                  setSuccess("");
                }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  <label htmlFor="role">I want to join as</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="client">Client</option>
                    <option value="creator">Creator</option>
                  </select>
                </>
              )}

              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={6}
                required
              />

              {error && <div className="form-message error">{error}</div>}
              {success && <div className="form-message success">{success}</div>}

              <button
                className="submit-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign In →"
                    : "Create Account →"}
              </button>
            </form>

            <p className="form-bottom">
              {isLogin ? "New to CreatorStudio? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccess("");
                }}
              >
                {isLogin ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="copyright">
            © 2026 CreatorStudio. Built for creative minds.
          </p>
        </section>
      </main>
    );
  }

  return (
    <>
      {pageContent}
      {pathname !== "/ai-chat" && <FloatingChatbot />}
    </>
  );
}

export default App;

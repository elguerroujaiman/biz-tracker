import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MdEmail, MdLock, MdBarChart } from "react-icons/md";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { authFetch } from "../utils/api";
import { useSettings } from "../contexts/SettingsContext";
import "./LoginPageStyle/Login.css";

const Login = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();
  const { refreshSettings }     = useSettings();

  // Pre-fill remembered email only (NOT password — security fix)
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) setEmail(savedEmail);

    // Redirect if already logged in
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (token) navigate("/home");
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store token — never store password in localStorage
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("userDetails", JSON.stringify(data.user));
        await refreshSettings();

        // Optionally remember email (not password) for UX convenience
        localStorage.setItem("rememberEmail", email);

        navigate("/home");
      } else {
        setError(data.message || "Login failed. Please check your credentials.");
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated gradient background */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg-blob auth-bg-blob-1" />
        <div className="auth-bg-blob auth-bg-blob-2" />
        <div className="auth-bg-blob auth-bg-blob-3" />
      </div>

      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <MdBarChart size={22} />
          </div>
          <span className="auth-brand-name">BizTracker</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your business dashboard</p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email address</label>
            <div className="input-wrapper has-icon-left">
              <span className="input-icon input-icon-left">
                <MdEmail />
              </span>
              <input
                id="login-email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <div className="input-wrapper has-icon-left has-icon-right">
              <span className="input-icon input-icon-left">
                <MdLock />
              </span>
              <input
                id="login-password"
                type={showPwd ? "text" : "password"}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-icon input-icon-right clickable-icon"
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <VscEyeClosed /> : <VscEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-submit"
            disabled={loading}
          >
            {loading ? <span className="auth-spinner" /> : "Sign in"}
          </button>
        </form>

        <p className="auth-footer-text">
          Don't have an account?{" "}
          <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

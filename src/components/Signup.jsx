import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MdPerson, MdEmail, MdLock, MdBarChart } from "react-icons/md";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { authFetch } from "../utils/api";
import { toast } from "react-hot-toast";
import "./LoginPageStyle/Login.css";

const SignUp = () => {
  const [username, setUsername]               = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const navigate                              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8 || password.length > 72 || new TextEncoder().encode(password).length > 72) {
      setError("Password must be 8 to 72 characters and no more than 72 UTF-8 bytes.");
      return;
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must include an uppercase letter and a number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await authFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created successfully! Please sign in.");
        localStorage.setItem("rememberEmail", email.trim().toLowerCase());
        navigate("/signin");
      } else {
        setError(data.message || (data.errors && data.errors[0]?.msg) || "Registration failed.");
      }
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg-blob auth-bg-blob-1" />
        <div className="auth-bg-blob auth-bg-blob-2" />
        <div className="auth-bg-blob auth-bg-blob-3" />
      </div>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <MdBarChart size={22} />
          </div>
          <span className="auth-brand-name">BizTracker</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start tracking your business performance today</p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Username */}
          <div className="form-group">
            <label htmlFor="reg-username" className="form-label">Full Name or Username</label>
            <div className="input-wrapper has-icon-left">
              <span className="input-icon input-icon-left">
                <MdPerson />
              </span>
              <input
                id="reg-username"
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Email address</label>
            <div className="input-wrapper has-icon-left">
              <span className="input-icon input-icon-left">
                <MdEmail />
              </span>
              <input
                id="reg-email"
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
            <label htmlFor="reg-password" className="form-label">Password</label>
            <div className="input-wrapper has-icon-left has-icon-right">
              <span className="input-icon input-icon-left">
                <MdLock />
              </span>
              <input
                id="reg-password"
                type={showPwd ? "text" : "password"}
                className="form-control"
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
            <div className="input-wrapper has-icon-left has-icon-right">
              <span className="input-icon input-icon-left">
                <MdLock />
              </span>
              <input
                id="reg-confirm"
                type={showConfirm ? "text" : "password"}
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="input-icon input-icon-right clickable-icon"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <VscEyeClosed /> : <VscEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-submit"
            disabled={loading}
          >
            {loading ? <span className="auth-spinner" /> : "Create Account"}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;

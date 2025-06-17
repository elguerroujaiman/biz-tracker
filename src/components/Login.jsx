import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import loginImage from "./LoginPageStyle/login-image.png";
import "./LoginPageStyle/Login.css";
import { VscEye, VscEyeClosed } from "react-icons/vsc";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    const savedPassword = localStorage.getItem("rememberPassword");
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", data.token);
        storage.setItem("userDetails", JSON.stringify(data.user));

        if (rememberMe) {
          localStorage.setItem("rememberEmail", email);
          localStorage.setItem("rememberPassword", password);
        } else {
          localStorage.removeItem("rememberEmail");
          localStorage.removeItem("rememberPassword");
        }

        navigate("/home");
      } else {
        setError(data.message || "Login failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="login-page-container">
      {/* Left Side (Form) */}
      <div className="login-left">
        <form onSubmit={handleSubmit} className="form-card">
          <h3>Login</h3>
          {error && <div className="text-danger mt-2">{error}</div>}

          <input
            type="email"
            className="form-control mt-3 custom-input"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="input-icon-wrapper mt-3">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control custom-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {showPassword ? (
              <VscEyeClosed
                className="input-icon"
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <VscEye
                className="input-icon"
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>
          
          <div className="form-check mt-3 mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="rememberMe">
              Remember Me
            </label>
          </div>

          <button type="submit" className="btn btn-success w-100 mb-3">
            Login
          </button>

          <div className="text-center">
            New user? <Link to="/signup">Signup</Link>
          </div>
        </form>
      </div>

      {/* Right Side (Hero-style image and shape background) */}
      <div className="login-right">
        <div className="image-shape-bg"></div>
        <img
          src={loginImage}
          alt="Login Visual"
          className="login-image"
        />
      </div>
    </div>
  );
};

export default Login;
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import "./SignupPageStyle/Signup.css";

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/signin");
      } else {
        setError(data.message || "Signup failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit} className="signup-card">
        <h3>Sign Up</h3>
        {error && <div className="text-danger mt-2">{error}</div>}

        <input
          type="text"
          className="form-control mt-3"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="email"
          className="form-control mt-3"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="input-icon-wrapper mt-3">
          <input
            type={showPassword ? "text" : "password"}
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span className="input-icon" onClick={() => setShowPassword((prev) => !prev)}>
            {showPassword ? <VscEyeClosed /> : <VscEye />}
          </span>
        </div>

        <div className="input-icon-wrapper mt-3">
          <input
            type={showConfirmPassword ? "text" : "password"}
            className="form-control"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <span className="input-icon" onClick={() => setShowConfirmPassword((prev) => !prev)}>
            {showConfirmPassword ? <VscEyeClosed /> : <VscEye />}
          </span>
        </div>

        <button type="submit" className="btn btn-success w-100 mt-4 mb-3">
          Sign Up
        </button>

        <div className="text-center">
          Already have an account? <Link to="/signin">Sign in</Link>
        </div>
      </form>
    </div>
  );
};

export default SignUp;
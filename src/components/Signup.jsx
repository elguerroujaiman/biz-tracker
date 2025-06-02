import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

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
    <div className="d-flex align-items-center loginBox">
      <form onSubmit={handleSubmit} className="form-signin bg-white">
        <h3>Sign Up</h3>
        {error && <div className="text-danger">{error}</div>}

        <input
          type="text"
          className="form-control mt-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <input
          type="email"
          className="form-control"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
        />
        <input
          type="password"
          className="form-control mb-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />

        <div className="d-grid my-2">
          <button type="submit" className="btn btn-primary btn-block mb-3">
            Sign Up
          </button>
        </div>

        <div className="text-center">
          Already have an account? <Link to="/signin">Sign in</Link>
        </div>
      </form>
    </div>
  );
};

export default SignUp;
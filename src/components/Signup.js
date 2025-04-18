import React, { Component } from "react";
import { Link, useNavigate } from "react-router-dom";

function SignUpWrapper(props) {
  const navigate = useNavigate();
  return <SignUp {...props} navigate={navigate} />;
}

class SignUp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      email: "",
      password: "",
      error: "",
    };
  }

  handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.state),
      });

      const data = await response.json();

      if (response.ok) {
        this.props.navigate("/signin");
      } else {
        this.setState({ error: data.message });
      }
    } catch (err) {
      console.error(err);
      this.setState({ error: "Something went wrong. Please try again." });
    }
  };

  render() {
    return (
      <div className="d-flex align-items-center loginBox">
        <form onSubmit={this.handleSubmit} className="form-signin bg-white">
          <h3>Sign Up</h3>
          {this.state.error && (
            <div className="text-danger">{this.state.error}</div>
          )}
          <input
            type="text"
            className="form-control mt-4"
            value={this.state.username}
            onChange={(e) => this.setState({ username: e.target.value })}
            placeholder="Username"
            required
          />
          <input
            type="email"
            className="form-control"
            value={this.state.email}
            onChange={(e) => this.setState({ email: e.target.value })}
            placeholder="Email address"
            required
          />
          <input
            type="password"
            value={this.state.password}
            onChange={(e) => this.setState({ password: e.target.value })}
            className="form-control mb-2"
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
  }
}

export default SignUpWrapper;
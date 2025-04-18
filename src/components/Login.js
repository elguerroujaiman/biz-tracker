import React, { Component } from "react";
import { useNavigate, Link } from "react-router-dom";

function LoginWrapper(props) {
  const navigate = useNavigate();
  return <Login {...props} navigate={navigate} />;
}

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      rememberMe: false,
      error: '',
    };
  }

  componentDidMount() {
    const savedEmail = localStorage.getItem("rememberEmail");
    const savedPassword = localStorage.getItem("rememberPassword");
    if (savedEmail && savedPassword) {
      this.setState({
        email: savedEmail,
        password: savedPassword,
        rememberMe: true,
      });
    }
  }

  handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: this.state.email,
          password: this.state.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        const storage = this.state.rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", data.token);
        storage.setItem("userDetails", JSON.stringify(data.user));

        // If Remember Me is checked, save email & password in localStorage
        if (this.state.rememberMe) {
          localStorage.setItem("rememberEmail", this.state.email);
          localStorage.setItem("rememberPassword", this.state.password);
        } else {
          localStorage.removeItem("rememberEmail");
          localStorage.removeItem("rememberPassword");
        }

        this.props.navigate("/home");
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
          <h3>Login</h3>
          {this.state.error && <div className="text-danger">{this.state.error}</div>}
          
          <input
            type="email"
            className="form-control mt-3"
            placeholder="Email address"
            value={this.state.email}
            onChange={(e) => this.setState({ email: e.target.value })}
            required
          />

          <input
            type="password"
            className="form-control"
            value={this.state.password}
            onChange={(e) => this.setState({ password: e.target.value })}
            placeholder="Password"
            required
          />

          <div className="form-check mt-2 mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="rememberMe"
              checked={this.state.rememberMe}
              onChange={(e) => this.setState({ rememberMe: e.target.checked })}
            />
            <label className="form-check-label" htmlFor="rememberMe">
              Remember Me
            </label>
          </div>

          <div className="d-grid my-2">
            <button type="submit" className="btn btn-primary btn-block mb-3">
              Login
            </button>
          </div>

          <div className="forgot-password form-inline">
            New user? <Link to="/signup">Signup</Link>
          </div>
        </form>
      </div>
    );
  }
}

export default LoginWrapper;
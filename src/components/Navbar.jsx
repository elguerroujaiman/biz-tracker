import React, { useState } from "react";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Topbar Navigation */}
      <header className="navbar-top">
        <div className="app-name">Store Tracker</div>

        {/* Hamburger toggle (mobile) */}
        <button
          className="topbar-toggle-btn d-md-none"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>

        <nav className="nav-links d-none d-md-flex">
        <NavLink className="nav-link" to="/home">Home</NavLink>
        <NavLink className="nav-link" to="/inventory">Inventory</NavLink>
        <NavLink className="nav-link" to="/sales">Sales</NavLink>
        <NavLink className="nav-link" to="/purchases">Purchases</NavLink>
        <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
        <NavLink className="nav-link" to="/settings">Settings</NavLink>
        </nav>
      </header>

      {/* Mobile dropdown menu */}
      {open && (
        <nav className="mobile-nav d-md-none">
          <Link className="nav-link" to="/home" onClick={() => setOpen(false)}>Home</Link>
          <Link className="nav-link" to="/inventory" onClick={() => setOpen(false)}>Inventory</Link>
          <Link className="nav-link" to="/sales" onClick={() => setOpen(false)}>Sales</Link>
          <Link className="nav-link" to="/purchases" onClick={() => setOpen(false)}>Purchases</Link>
          <Link className="nav-link" to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
          <Link className="nav-link" to="/settings" onClick={() => setOpen(false)}>Settings</Link>
        </nav>
      )}
    </>
  );
};

export default Navbar;
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button (only visible when sidebar is closed) */}
      {!open && (
        <button
          className="sidebar-toggle-btn d-md-none"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
        >
          <FaBars />
        </button>
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`d-flex flex-column align-items-center ${open ? "open" : ""}`}
      >
        <div className="sidebar-header d-flex justify-content-between align-items-center w-100 px-3">
          <h4 className="mt-3 mb-3 app-name text-center fw-bold">
            Business Tracker
          </h4>

          {/* Close button (only when sidebar is open on small screens) */}
          <button
            className="close-sidebar-btn d-md-none"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <FaTimes />
          </button>
        </div>

        {/* Separator */}
        <hr className="sidebar-separator" />

        {/* Navigation */}
        <nav className="nav flex-column w-100 text-center" onClick={() => setOpen(false)}>
          <Link className="nav-link" to="/home">Home</Link>
          <Link className="nav-link" to="/inventory">Inventory</Link>
          <Link className="nav-link" to="/sales">Sales</Link>
          <Link className="nav-link" to="/purchases">Purchases</Link>
          <Link className="nav-link" to="/dashboard">Dashboard</Link>
          <Link className="nav-link" to="/settings">Settings</Link>
        </nav>
      </aside>
    </>
  );
};

export default Navbar;
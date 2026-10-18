import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdInventory2,
  MdPointOfSale,
  MdShoppingCart,
  MdHome,
  MdSettings,
  MdMenu,
  MdClose,
  MdLogout,
  MdBarChart,
} from "react-icons/md";

const NAV_ITEMS = [
  { to: "/home",       label: "Overview",    icon: <MdHome /> },
  { to: "/dashboard",  label: "Dashboard",   icon: <MdDashboard /> },
  { to: "/inventory",  label: "Inventory",   icon: <MdInventory2 /> },
  { to: "/sales",      label: "Sales",       icon: <MdPointOfSale /> },
  { to: "/purchases",  label: "Purchases",   icon: <MdShoppingCart /> },
];

const BOTTOM_ITEMS = [
  { to: "/settings", label: "Settings", icon: <MdSettings /> },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Close sidebar on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userDetails");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userDetails");
    navigate("/");
  };

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <MdBarChart style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="sidebar-brand-text">
          Biz<span>Tracker</span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? " active" : ""}`
            }
            onClick={() => setOpen(false)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: "0.75rem" }}>
          Account
        </div>
        {BOTTOM_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? " active" : ""}`
            }
            onClick={() => setOpen(false)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button
          className="sidebar-link btn-ghost"
          onClick={handleLogout}
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer" }}
        >
          <span className="sidebar-icon">
            <MdLogout />
          </span>
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar d-none d-md-flex" style={{ flexDirection: "column" }}>
        <SidebarContent />
      </aside>

      {/* Mobile Topbar */}
      <header className="mobile-topbar d-flex d-md-none">
        <div className="sidebar-brand" style={{ border: "none", padding: "0" }}>
          <div className="sidebar-brand-icon">
            <MdBarChart style={{ color: "var(--accent-primary)" }} />
          </div>
          <div className="sidebar-brand-text">
            Biz<span>Tracker</span>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <MdClose size={22} /> : <MdMenu size={22} />}
        </button>
      </header>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`sidebar-overlay${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`sidebar d-flex d-md-none${open ? " open" : ""}`}
        style={{ flexDirection: "column" }}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Navbar;
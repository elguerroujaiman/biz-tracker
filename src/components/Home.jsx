import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdPointOfSale,
  MdShoppingCart,
  MdInventory2,
  MdTrendingUp,
  MdWarningAmber,
  MdArrowForward,
  MdAdd,
  MdInsights,
  MdStorefront
} from "react-icons/md";
import { authFetch } from "../utils/api";
import { useSettings } from "../contexts/SettingsContext";

const HomePage = () => {
  const navigate = useNavigate();
  const { currency_symbol } = useSettings();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    todaysRevenue: 0,
    todaysSales: 0,
    totalProducts: 0,
    lowStockCount: 0,
    totalSpent: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("userDetails");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // fallback
    }

    const loadCockpitData = async () => {
      try {
        const [salesSumRes, purchSumRes, prodsRes, salesListRes] = await Promise.all([
          authFetch("/sales/summary").catch(() => null),
          authFetch("/purchases/summary").catch(() => null),
          authFetch("/products").catch(() => null),
          authFetch("/sales").catch(() => null),
        ]);

        const salesSum = salesSumRes?.ok ? await salesSumRes.json() : {};
        const purchSum = purchSumRes?.ok ? await purchSumRes.json() : {};
        const prods = prodsRes?.ok ? await prodsRes.json() : [];
        const salesList = salesListRes?.ok ? await salesListRes.json() : [];

        const lowStock = Array.isArray(prods)
          ? prods.filter((p) => Number(p.total_quantity) <= Number(p.low_stock_threshold)).length
          : 0;

        setStats({
          totalRevenue: salesSum.totalRevenue || 0,
          totalSales: salesSum.totalSales || 0,
          todaysRevenue: salesSum.todaysRevenue || 0,
          todaysSales: salesSum.todaysSales || 0,
          totalProducts: Array.isArray(prods) ? prods.length : 0,
          lowStockCount: lowStock,
          totalSpent: purchSum.totalSpent || 0,
        });

        if (Array.isArray(salesList)) {
          setRecentSales(salesList.slice(0, 5));
        }
      } catch (err) {
        console.error("Cockpit loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCockpitData();
  }, []);

  const formatCurrency = (val) => {
    return `${currency_symbol || "$"}${Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="page-container">
      {/* Welcome Hero Banner */}
      <div className="hero-banner mb-4">
        <div className="hero-banner-content">
          <h1 className="hero-title mt-2">
            Welcome back, <span className="text-accent">{user?.username || "Store Owner"}</span>
          </h1>
          <p className="hero-subtitle">
            Here's what's happening with your inventory, sales, and profit performance today.
          </p>

          <div className="hero-actions mt-3">
            <button
              id="hero-btn-new-sale"
              className="btn btn-primary"
              onClick={() => navigate("/sales/new")}
            >
              <MdAdd size={18} /> New Sale
            </button>
            <button
              id="hero-btn-new-purchase"
              className="btn btn-secondary"
              onClick={() => navigate("/purchases/new")}
            >
              <MdAdd size={18} /> Record Purchase
            </button>
            <button
              id="hero-btn-add-product"
              className="btn btn-secondary"
              onClick={() => navigate("/inventory")}
            >
              <MdInventory2 size={18} /> Manage Inventory
            </button>
            <button
              id="hero-btn-analytics"
              className="btn btn-outline"
              onClick={() => navigate("/dashboard")}
            >
              <MdInsights size={18} /> Open Analytics
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="stat-grid mb-4">
        {/* Total Revenue */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Revenue</span>
            <div className="stat-card-icon icon-revenue">
              <MdTrendingUp />
            </div>
          </div>
          <div className="stat-card-value">
            {loading ? "..." : formatCurrency(stats.totalRevenue)}
          </div>
          <div className="stat-card-footer">
            <span className="badge badge-success">
              {stats.totalSales} completed sales
            </span>
          </div>
        </div>

        {/* Total Expenses / Purchases */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Purchases</span>
            <div className="stat-card-icon icon-purchases">
              <MdShoppingCart />
            </div>
          </div>
          <div className="stat-card-value">
            {loading ? "..." : formatCurrency(stats.totalSpent)}
          </div>
          <div className="stat-card-footer">
            <span className="text-muted">Total inventory procurement</span>
          </div>
        </div>

        {/* Active Products */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Catalog Products</span>
            <div className="stat-card-icon icon-inventory">
              <MdInventory2 />
            </div>
          </div>
          <div className="stat-card-value">
            {loading ? "..." : stats.totalProducts}
          </div>
          <div className="stat-card-footer">
            <span className="text-secondary">Across your categories</span>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Low Stock Items</span>
            <div className={`stat-card-icon ${stats.lowStockCount > 0 ? "icon-warning" : "icon-revenue"}`}>
              <MdWarningAmber />
            </div>
          </div>
          <div className="stat-card-value">
            {loading ? "..." : stats.lowStockCount}
          </div>
          <div className="stat-card-footer">
            {stats.lowStockCount > 0 ? (
              <span className="badge badge-danger">Needs restocking</span>
            ) : (
              <span className="badge badge-success">Stock levels healthy</span>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Sales + Quick Access Modules */}
      <div className="grid-2col">
        {/* Recent Sales Card */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title">
              <MdPointOfSale className="panel-icon text-accent" />
              <h3>Recent Sales</h3>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate("/sales")}
            >
              View all <MdArrowForward size={14} />
            </button>
          </div>

          <div className="panel-card-body">
            {recentSales.length > 0 ? (
              <div className="recent-list">
                {recentSales.map((sale) => (
                  <div
                    key={sale.sale_id}
                    className="recent-item"
                    onClick={() => navigate(`/sales/${sale.sale_id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/sales/${sale.sale_id}`);
                      }
                    }}
                    role="link"
                    tabIndex={0}
                  >
                    <div className="recent-item-left">
                      <div className="recent-item-icon">
                        <MdPointOfSale />
                      </div>
                      <div>
                        <div className="recent-item-title">
                          Sale #{sale.sale_id}
                          {sale.items_count ? (
                            <span className="text-muted ml-2">({sale.items_count} items)</span>
                          ) : null}
                        </div>
                        <div className="recent-item-sub">
                          {new Date(sale.sale_date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {sale.note ? ` • "${sale.note}"` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="recent-item-right">
                      <span className="recent-item-amount text-success">
                        +{formatCurrency(sale.total_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <MdStorefront size={48} className="empty-state-icon" />
                <p className="empty-state-text">No sales recorded yet.</p>
                <button
                  className="btn btn-primary btn-sm mt-2"
                  onClick={() => navigate("/sales/new")}
                >
                  Record first sale
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Operations & Navigation Hub */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title">
              <MdStorefront className="panel-icon text-accent" />
              <h3>Business Operations</h3>
            </div>
          </div>

          <div className="panel-card-body operations-grid">
            {/* Sales shortcut */}
            <div
              className="operation-card"
              onClick={() => navigate("/sales")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate("/sales");
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="operation-icon op-sales">
                <MdPointOfSale size={24} />
              </div>
              <div className="operation-content">
                <div className="operation-title">Sales Management</div>
                <div className="operation-desc">
                  Issue sales, print receipts, and browse transaction history.
                </div>
              </div>
              <MdArrowForward className="operation-arrow" />
            </div>

            {/* Purchases shortcut */}
            <div
              className="operation-card"
              onClick={() => navigate("/purchases")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate("/purchases");
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="operation-icon op-purchases">
                <MdShoppingCart size={24} />
              </div>
              <div className="operation-content">
                <div className="operation-title">Purchases & Expenses</div>
                <div className="operation-desc">
                  Log supplier invoices, restock items, and track expenditures.
                </div>
              </div>
              <MdArrowForward className="operation-arrow" />
            </div>

            {/* Inventory shortcut */}
            <div
              className="operation-card"
              onClick={() => navigate("/inventory")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate("/inventory");
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="operation-icon op-inventory">
                <MdInventory2 size={24} />
              </div>
              <div className="operation-content">
                <div className="operation-title">Inventory Catalog</div>
                <div className="operation-desc">
                  Maintain items, price lists, stock levels, and alert thresholds.
                </div>
              </div>
              <MdArrowForward className="operation-arrow" />
            </div>

            {/* Analytics shortcut */}
            <div
              className="operation-card"
              onClick={() => navigate("/dashboard")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate("/dashboard");
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="operation-icon op-analytics">
                <MdInsights size={24} />
              </div>
              <div className="operation-content">
                <div className="operation-title">Analytics Dashboard</div>
                <div className="operation-desc">
                  Net revenue charts, top profit-makers, and turnover metrics.
                </div>
              </div>
              <MdArrowForward className="operation-arrow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

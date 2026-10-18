import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import {
  MdShoppingCart,
  MdAttachMoney,
  MdInventory2,
  MdArrowBack,
  MdShoppingBag,
  MdAccountBalanceWallet,
} from "react-icons/md";
import { useSettings } from "../../contexts/SettingsContext";

const PurchaseStats = () => {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();
  const { currency_symbol }   = useSettings();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await authFetch("/purchases/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch purchase stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="page-container py-5 text-center">
        <div className="skeleton skeleton-title mx-auto mb-3" />
        <div className="skeleton skeleton-card mx-auto" />
      </div>
    );
  }

  const formatCurrency = (val) => {
    return `${currency_symbol || "$"}${Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            className="btn btn-secondary btn-sm mb-2"
            onClick={() => navigate("/purchases")}
          >
            <MdArrowBack /> Back to Purchases
          </button>
          <h1 className="page-title">Procurement & Expense Analytics</h1>
          <p className="page-subtitle">
            Insights on supplier costs, purchase volumes, and inventory investment.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stat-grid mb-4">
        {/* Total Spent */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Expenditure</span>
            <div className="stat-card-icon icon-purchases">
              <MdAccountBalanceWallet />
            </div>
          </div>
          <div className="stat-card-value text-accent">
            {formatCurrency(stats?.total_spent)}
          </div>
          <div className="stat-card-footer">
            <span className="badge badge-accent">
              Across {stats?.total_purchases || 0} purchase orders
            </span>
          </div>
        </div>

        {/* Total Units Bought */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Units Acquired</span>
            <div className="stat-card-icon icon-inventory">
              <MdInventory2 />
            </div>
          </div>
          <div className="stat-card-value">
            {Number(stats?.total_units_bought || 0).toLocaleString()}
          </div>
          <div className="stat-card-footer">
            <span className="text-secondary">Added into store inventory</span>
          </div>
        </div>

        {/* Most Bought Product */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Most Bought Product</span>
            <div className="stat-card-icon icon-revenue">
              <MdShoppingBag />
            </div>
          </div>
          <div className="stat-card-value text-truncate" title={stats?.most_bought_product}>
            {stats?.most_bought_product || "N/A"}
          </div>
          <div className="stat-card-footer">
            <span className="badge badge-info">Highest acquisition volume</span>
          </div>
        </div>

        {/* Top Spend Product */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Highest Capital Allocation</span>
            <div className="stat-card-icon icon-warning">
              <MdAttachMoney />
            </div>
          </div>
          <div className="stat-card-value text-truncate" title={stats?.top_spend_product}>
            {stats?.top_spend_product || "N/A"}
          </div>
          <div className="stat-card-footer">
            <span className="badge badge-warning">Largest financial cost</span>
          </div>
        </div>
      </div>

      {/* Breakdown Panel */}
      <div className="panel-card">
        <div className="panel-card-header">
          <div className="panel-card-title">
            <MdShoppingCart className="panel-icon text-accent" />
            <h3>Procurement Highlights Summary</h3>
          </div>
        </div>
        <div className="panel-card-body">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">Total Purchase Orders</td>
                  <td className="font-mono">{stats?.total_purchases || 0}</td>
                  <td className="text-muted">Total number of supplier invoices recorded</td>
                </tr>
                <tr>
                  <td className="font-semibold">Gross Spending</td>
                  <td className="font-mono text-accent">{formatCurrency(stats?.total_spent)}</td>
                  <td className="text-muted">Cumulative amount paid to vendors</td>
                </tr>
                <tr>
                  <td className="font-semibold">Units Procured</td>
                  <td className="font-mono">{stats?.total_units_bought || 0} units</td>
                  <td className="text-muted">Total physical stock received</td>
                </tr>
                <tr>
                  <td className="font-semibold">Top Volume Product</td>
                  <td className="font-semibold text-primary">{stats?.most_bought_product || "N/A"}</td>
                  <td className="text-muted">Item with the greatest number of units ordered</td>
                </tr>
                <tr>
                  <td className="font-semibold">Largest Cost Item</td>
                  <td className="font-semibold text-primary">{stats?.top_spend_product || "N/A"}</td>
                  <td className="text-muted">Item representing the highest aggregate investment</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseStats;
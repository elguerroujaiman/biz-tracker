import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { MdTrendingUp, MdLeaderboard, MdAttachMoney, MdArrowBack } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext";

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

const SalesStats = () => {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate            = useNavigate();
  const { currency_symbol } = useSettings();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authFetch("/sales/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching sales stats:", error);
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

  const topProducts = stats?.top_products || [];
  const revenueByProduct = stats?.revenue_by_product || [];

  const barData = {
    labels: topProducts.map((p) => p.product_name || `Product #${p.product_id}`),
    datasets: [
      {
        label: "Units Sold",
        data: topProducts.map((p) => Number(p.total_units) || 0),
        backgroundColor: "rgba(124, 111, 224, 0.75)",
        borderColor: "#7c6fe0",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#94a3b8", font: { family: "Inter", size: 12 } },
      },
      tooltip: {
        backgroundColor: "#1c2133",
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y: {
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { color: "rgba(255,255,255,0.05)" },
        beginAtZero: true,
      },
    },
  };

  const doughnutColors = [
    "#7c6fe0",
    "#38bdf8",
    "#22c55e",
    "#f59e0b",
    "#ec4899",
    "#a855f7",
    "#14b8a6",
  ];

  const doughnutData = {
    labels: revenueByProduct.map((p) => p.product_name || `Product #${p.product_id}`),
    datasets: [
      {
        data: revenueByProduct.map((p) => Number(p.revenue) || 0),
        backgroundColor: doughnutColors.slice(0, Math.max(revenueByProduct.length, 1)),
        borderColor: "#141824",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            className="btn btn-secondary btn-sm mb-2"
            onClick={() => navigate("/sales")}
          >
            <MdArrowBack /> Back to Sales
          </button>
          <h1 className="page-title">Sales Analytics & Insights</h1>
          <p className="page-subtitle">
            Deep dive into top volume movers, revenue share, and product rankings.
          </p>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-2 mb-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Best-Selling Product by Volume</span>
            <div className="stat-card-icon icon-revenue">
              <MdLeaderboard />
            </div>
          </div>
          <div className="stat-card-value">
            {stats?.best_selling_product || "N/A"}
          </div>
          <div className="stat-card-footer">
            <span className="badge badge-success">
              {stats?.best_selling_units || 0} total units sold
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Highest Revenue Generator</span>
            <div className="stat-card-icon icon-inventory">
              <MdAttachMoney />
            </div>
          </div>
          <div className="stat-card-value">
            {stats?.top_revenue_product || "N/A"}
          </div>
          <div className="stat-card-footer">
            <span className="badge badge-accent">
              {currency_symbol || "$"}
              {Number(stats?.top_revenue_amount || 0).toFixed(2)} gross sales
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-2 gap-4">
        {/* Units Sold Chart */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title">
              <MdTrendingUp className="panel-icon text-accent" />
              <h3>Units Sold per Product</h3>
            </div>
          </div>
          <div className="panel-card-body" style={{ height: "340px" }}>
            {topProducts.length > 0 ? (
              <Bar data={barData} options={chartOptions} />
            ) : (
              <div className="empty-state py-5">
                <p className="text-muted">No sales data available yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Share Doughnut */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title">
              <MdAttachMoney className="panel-icon text-accent" />
              <h3>Revenue Distribution by Product</h3>
            </div>
          </div>
          <div className="panel-card-body" style={{ height: "340px" }}>
            {revenueByProduct.length > 0 ? (
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { color: "#94a3b8", font: { size: 11 }, padding: 12 },
                    },
                    tooltip: {
                      callbacks: {
                        label: (ctx) =>
                          ` ${ctx.label}: ${currency_symbol || "$"}${Number(ctx.raw).toFixed(2)}`,
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="empty-state py-5">
                <p className="text-muted">No revenue data available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesStats;
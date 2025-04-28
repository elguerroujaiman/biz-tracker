import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";

const SalesStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authFetch("/sales/stats");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching sales stats:", error);
      }
    };

    fetchStats();
  }, []);

  if (!stats) {
    return <div>Loading statistics...</div>;
  }

  const formatCurrency = (value) => {
    if (value == null) return "N/A";
    return `$${Number(value).toFixed(2)}`;
  };

  const formatUnits = (value) => {
    if (value == null) return "N/A";
    return `${Number(value).toFixed(2)} units`;
  };

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>📊 Sales Overview</h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem",
      }}>
        <StatCard title="Total Sales" value={stats.total_sales} />
        <StatCard title="Total Revenue" value={formatCurrency(stats.total_revenue)} />
        <StatCard title="Best-Selling Product" value={stats.best_selling_product ? `${stats.best_selling_product} (${stats.best_selling_units} units)` : "N/A"} />
        <StatCard title="Top Revenue Product" value={stats.top_revenue_product ? `${stats.top_revenue_product} (${formatCurrency(stats.top_revenue_amount)})` : "N/A"} />
        <StatCard title="Total Units Sold" value={stats.total_units_sold} />
        <StatCard title="Average Order Size" value={formatUnits(stats.average_order_size)} />
        <StatCard title="Highest Single Sale" value={formatCurrency(stats.highest_single_sale)} />
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div style={{
    padding: "1rem",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  }}>
    <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem", color: "#555" }}>{title}</h3>
    <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{value}</p>
  </div>
);

export default SalesStats;
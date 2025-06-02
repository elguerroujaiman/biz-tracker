import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

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

  if (!stats) return <p>Loading statistics...</p>;

  const barData = {
    labels: stats.top_products?.map(p => p.product_name),
    datasets: [{
      label: "Units Sold",
      data: stats.top_products?.map(p => p.total_units),
      backgroundColor: "rgba(75,192,192,0.6)",
    }],
  };

  const pieData = {
    labels: stats.revenue_by_product?.map(p => p.product_name),
    datasets: [{
      data: stats.revenue_by_product?.map(p => p.revenue),
      backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#66BB6A", "#BA68C8"],
    }],
  };

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2>📊 Sales Overview</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
        <StatCard title="Best-Selling Product" value={stats.best_selling_product ? `${stats.best_selling_product} (${stats.best_selling_units} units)` : "N/A"} />
        <StatCard title="Top Revenue Product" value={stats.top_revenue_product ? `${stats.top_revenue_product} ($${Number(stats.top_revenue_amount).toFixed(2)})` : "N/A"} />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Top Products by Units Sold</h3>
        <Bar data={barData} />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Revenue Distribution</h3>
        <Pie data={pieData} />
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
    <h4>{title}</h4>
    <p>{value}</p>
  </div>
);

export default SalesStats;
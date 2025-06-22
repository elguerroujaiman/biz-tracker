import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { authFetch } from "../../utils/api";
import { toast } from "react-hot-toast";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

const SalesChart = () => {
  const [dailySales, setDailySales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDailySales = async () => {
    try {
      const res = await authFetch("/sales/daily");
      if (!res.ok) throw new Error("Failed to fetch daily sales");
      const data = await res.json();
      setDailySales(data);
    } catch (err) {
      console.error("Error loading daily sales:", err);
      toast.error("Could not load sales chart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySales();
  }, []);

  const labels = dailySales.map((entry) =>
    new Date(entry.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    })
  );

  const salesAmounts = dailySales.map((entry) => entry.total);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Sales ",
        data: salesAmounts,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value.toFixed(2)}`,
        },
      },
    },
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Daily Sales (Last 30 Days)</h2>
      {loading ? (
        <p>Loading chart...</p>
      ) : dailySales.length === 0 ? (
        <p className="text-sm text-muted">No sales data available.</p>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
};

export default SalesChart;
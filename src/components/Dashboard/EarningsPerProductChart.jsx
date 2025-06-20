import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import axios from "axios";

ChartJS.register(ArcElement, Tooltip, Legend);

const EarningsPerProductChart = () => {
  const [chartData, setChartData] = useState(null);
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/analytics/earnings-per-product",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const labels = response.data.map(item => item.name);
        const data = response.data.map(item => item.earnings);

        setChartData({
          labels,
          datasets: [
            {
              label: "Earnings",
              data,
              backgroundColor: [
                "#4ade80", "#60a5fa", "#facc15", "#f87171",
                "#a78bfa", "#34d399", "#f472b6", "#fb923c"
              ],
              borderWidth: 1,
            },
          ],
        });
      } catch (error) {
        console.error("Failed to load earnings per product:", error);
      }
    };

    fetchEarnings();
  }, [token]);

  return (
    <div style={{ padding: "1rem", height: "100%" }}>
      <h2 className="text-lg font-semibold text-red-600 mb-4">Earnings by Product</h2>
      {chartData ? (
        <div style={{ position: "relative", height: "400px" }}>
          <Pie
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false, // allows the chart to grow taller
            }}
          />
        </div>
      ) : (
        <p>Loading chart...</p>
      )}
    </div>
  );
};

export default EarningsPerProductChart;
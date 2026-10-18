import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { authFetch } from "../../utils/api";
import { useSettings } from "../../contexts/SettingsContext";
import { MdPieChart } from "react-icons/md";

ChartJS.register(ArcElement, Tooltip, Legend);

const EarningsPerProductChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading]     = useState(true);
  const { currency_symbol }       = useSettings();

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await authFetch("/analytics/earnings-per-product");
        if (response.ok) {
          const rows = await response.json();

          const labels = rows.map((item) => item.name);
          const data   = rows.map((item) => Number(item.earnings) || 0);

          const colors = [
            "#7c6fe0",
            "#38bdf8",
            "#22c55e",
            "#f59e0b",
            "#ec4899",
            "#a855f7",
            "#14b8a6",
            "#f97316",
            "#6366f1",
            "#84cc16",
          ];

          setChartData({
            labels,
            datasets: [
              {
                label: "Profit Share",
                data,
                backgroundColor: colors.slice(0, Math.max(labels.length, 1)),
                borderColor: "#141824",
                borderWidth: 2,
              },
            ],
          });
        }
      } catch (error) {
        console.error("Failed to load earnings per product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  return (
    <div className="panel-card h-100">
      <div className="panel-card-header">
        <div className="panel-card-title">
          <MdPieChart className="panel-icon text-accent" />
          <div>
            <h3>Profit Margin per Product</h3>
            <span className="text-muted text-sm">Cumulative net margin share</span>
          </div>
        </div>
      </div>
      <div className="panel-card-body d-flex flex-column justify-content-center">
        {loading ? (
          <div className="py-5 text-center">
            <div className="skeleton skeleton-title mx-auto mb-2" />
            <div className="skeleton skeleton-card mx-auto" />
          </div>
        ) : chartData && chartData.labels.length > 0 ? (
          <div style={{ height: "300px", position: "relative" }}>
            <Doughnut
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: "#94a3b8",
                      font: { family: "Inter", size: 11 },
                      padding: 10,
                      boxWidth: 12,
                    },
                  },
                  tooltip: {
                    backgroundColor: "#1c2133",
                    titleColor: "#f1f5f9",
                    bodyColor: "#94a3b8",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                      label: (ctx) =>
                        ` ${ctx.label}: ${currency_symbol || "$"}${Number(ctx.raw).toFixed(2)}`,
                    },
                  },
                },
              }}
            />
          </div>
        ) : (
          <p className="text-muted text-center py-5">No earnings recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default EarningsPerProductChart;
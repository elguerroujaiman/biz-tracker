import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { toast } from "react-hot-toast";
import { authFetch } from "../../utils/api";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { format, addDays, parseISO } from "date-fns";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const now = new Date();
const CUR_YEAR = now.getFullYear();
const CUR_MONTH = now.getMonth() + 1;

const NetRevenueChart = () => {
  const [year, setYear] = useState(CUR_YEAR);
  const [month, setMonth] = useState(CUR_MONTH);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  const yearOptions = Array.from({ length: 6 }, (_, i) => CUR_YEAR - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const res = await authFetch(`/analytics/net-revenue?year=${year}&month=${month}`);
        if (!res.ok) throw new Error(res.statusText);
        const rows = await res.json();

        const revenueMap = {};

        // Log and build revenue map
        rows.forEach((r) => {
          const shiftedDate = addDays(parseISO(r.day), 0);
          const shiftedKey = format(shiftedDate, "yyyy-MM-dd");
          revenueMap[shiftedKey] = parseFloat(r.netRevenue);
        });

        const daysInSelectedMonth = new Date(year, month, 0).getDate();
        const labels = [];
        const data = [];

        for (let day = 1; day <= daysInSelectedMonth; day++) {
          const dayStr = String(day).padStart(2, "0");
          const monthStr = String(month).padStart(2, "0");
          const dateKey = `${year}-${monthStr}-${dayStr}`;
          const labelDate = new Date(year, month - 1, day); // Local date
          labels.push(format(labelDate, "d MMM"));
          const revenue = revenueMap[dateKey] || 0;
          data.push(revenue);
        }

        setChartData({
          labels,
          datasets: [
            {
              label: "Earnings",
              data,
              backgroundColor: "#10b981",
              borderRadius: 4,
              barPercentage: 0.7,
              categoryPercentage: 0.8,
            },
          ],
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load net-revenue data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month]);

  return (
    <div className="dashboard-widget p-4" style={{ flex: 1, height: "100%" }}>
      <h2 className="text-lg font-semibold text-red-600 mb-4">Earnings chart</h2>
      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          {/* Year */}
          <label className="text-sm font-medium text-gray-700">Year <label></label></label>
          <select
            value={year}
            onChange={(e) => setYear(+e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y === CUR_YEAR ? `${y} (Current)` : y}
              </option>
            ))}
          </select>
          {/*Month*/}
          <label className="text-sm font-medium text-gray-700 mb-1 block"><label></label> Month <label></label></label>
          <select
            value={month}
            onChange={(e) => setMonth(+e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m === CUR_MONTH && year === CUR_YEAR ? `${m} (Current)` : m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <p>Loading chart…</p>
      ) : chartData ? (
        <div className="chart-container">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" } },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        </div>
      ) : (
        <p className="text-sm text-gray-500">No data for selected month.</p>
      )}
    </div>
  );
};

export default NetRevenueChart;
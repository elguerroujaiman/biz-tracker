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
import { format } from "date-fns";
import { useSettings } from "../../contexts/SettingsContext";
import { MdTrendingUp, MdCalendarToday } from "react-icons/md";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const now = new Date();
const CUR_YEAR = now.getFullYear();
const CUR_MONTH = now.getMonth() + 1;

const NetRevenueChart = () => {
  const [year, setYear]           = useState(CUR_YEAR);
  const [month, setMonth]         = useState(CUR_MONTH);
  const [chartData, setChartData] = useState(null);
  const [totalMonthRev, setTotal] = useState(0);
  const [loading, setLoading]     = useState(false);

  const { currency_symbol } = useSettings();

  const yearOptions  = Array.from({ length: 6 }, (_, i) => CUR_YEAR - i);
  const monthOptions = [
    { num: 1, name: "January" },
    { num: 2, name: "February" },
    { num: 3, name: "March" },
    { num: 4, name: "April" },
    { num: 5, name: "May" },
    { num: 6, name: "June" },
    { num: 7, name: "July" },
    { num: 8, name: "August" },
    { num: 9, name: "September" },
    { num: 10, name: "October" },
    { num: 11, name: "November" },
    { num: 12, name: "December" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await authFetch(`/analytics/net-revenue?year=${year}&month=${month}`);
        if (!res.ok) throw new Error(res.statusText);
        const rows = await res.json();

        const revenueMap = {};
        let sum = 0;

        rows.forEach((r) => {
          if (r.day) {
            const key = r.day.substring(0, 10);
            const val = parseFloat(r.netRevenue) || 0;
            revenueMap[key] = val;
            sum += val;
          }
        });

        setTotal(sum);

        const daysInSelectedMonth = new Date(year, month, 0).getDate();
        const labels = [];
        const data   = [];

        for (let day = 1; day <= daysInSelectedMonth; day++) {
          const dayStr = String(day).padStart(2, "0");
          const monthStr = String(month).padStart(2, "0");
          const dateKey = `${year}-${monthStr}-${dayStr}`;
          const labelDate = new Date(year, month - 1, day);
          labels.push(format(labelDate, "d MMM"));
          data.push(revenueMap[dateKey] || 0);
        }

        setChartData({
          labels,
          datasets: [
            {
              label: "Net Earnings",
              data,
              backgroundColor: "rgba(124, 111, 224, 0.8)",
              hoverBackgroundColor: "#a89ef0",
              borderColor: "#7c6fe0",
              borderWidth: 1,
              borderRadius: 5,
              barPercentage: 0.65,
              categoryPercentage: 0.8,
            },
          ],
        });
      } catch (err) {
        console.error("Net revenue chart error:", err);
        toast.error("Failed to load net revenue data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1c2133",
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => ` Earnings: ${currency_symbol || "$"}${Number(ctx.raw).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8", font: { size: 10 } },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
      y: {
        ticks: {
          color: "#94a3b8",
          font: { size: 10 },
          callback: (val) => `${currency_symbol || "$"}${val}`,
        },
        grid: { color: "rgba(255,255,255,0.06)" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="panel-card">
      <div className="panel-card-header flex-wrap gap-2">
        <div className="panel-card-title">
          <MdTrendingUp className="panel-icon text-accent" />
          <div>
            <h3>Net Revenue Performance</h3>
            <span className="text-muted text-sm">
              Daily earnings calculated as (Sale Price - Purchase Cost)
            </span>
          </div>
        </div>

        {/* Date Filters */}
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-1">
            <MdCalendarToday className="text-muted" size={16} />
            <select
              value={month}
              onChange={(e) => setMonth(+e.target.value)}
              className="form-control form-control-sm"
              style={{ width: "130px" }}
            >
              {monthOptions.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={year}
            onChange={(e) => setYear(+e.target.value)}
            className="form-control form-control-sm"
            style={{ width: "90px" }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="panel-card-body">
        {/* Month Summary Bar */}
        <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <span className="text-secondary text-sm">
            Total Net Earnings in {monthOptions.find((m) => m.num === month)?.name} {year}:
          </span>
          <span className="font-mono font-bold text-accent" style={{ fontSize: "1.25rem" }}>
            {currency_symbol || "$"}{totalMonthRev.toFixed(2)}
          </span>
        </div>

        {loading ? (
          <div className="py-5 text-center">
            <div className="skeleton skeleton-title mx-auto mb-2" />
            <div className="skeleton skeleton-card mx-auto" />
          </div>
        ) : chartData ? (
          <div style={{ height: "320px", position: "relative" }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        ) : (
          <p className="text-muted text-center py-5">No financial data found for this period.</p>
        )}
      </div>
    </div>
  );
};

export default NetRevenueChart;
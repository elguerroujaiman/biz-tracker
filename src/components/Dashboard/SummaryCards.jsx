import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";
import { toast } from "react-hot-toast";

const SummaryCards = () => {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalSales: 0,
    todaysRevenue: 0,
    todaysSales: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await authFetch("/sales/summary");
        if (!res.ok) throw new Error("Failed to fetch sales summary");
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error("Error fetching sales summary:", err);
        toast.error("Could not load summary.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const stats = [
    {
      title: "Total Sales",
      value: summary.totalSales,
    },
    {
      title: "Total Revenue",
      value: `$${summary.totalRevenue.toFixed(2)}`,
    },
    {
      title: "Today’s Sales",
      value: summary.todaysSales,
    },
    {
      title: "Total Products",
      value: 312, // Replace with actual value if needed
    },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex flex-nowrap gap-4">
        {(loading ? Array.from({ length: 4 }) : stats).map((stat, idx) => (
          <div
            key={idx}
            className="w-[200px] min-w-[200px] bg-white shadow-sm border rounded-lg p-5 hover:shadow-md transition"
          >
            <h3 className="text-sm text-gray-500">
              {loading ? "Loading..." : stat.title}
            </h3>
            <p className="text-xl font-semibold">
              {loading ? "..." : stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryCards;
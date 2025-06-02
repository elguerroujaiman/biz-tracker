import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";

const PurchaseStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await authFetch("/purchases/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };

    fetchStats();
  }, []);

  if (!stats) return <p>Loading stats...</p>;

  return (
    <div className="my-3">
      <h4>Purchase Stats</h4>
      <ul>
        <li><strong>Total Purchases:</strong> {stats.total_purchases}</li>
        <li><strong>Total Spent:</strong> ${stats.total_spent}</li>
        <li><strong>Total Units Bought:</strong> {stats.total_units_bought}</li>
        <li><strong>Most Bought Product:</strong> {stats.most_bought_product}</li>
        <li><strong>Top Spend Product:</strong> {stats.top_spend_product}</li>
      </ul>
    </div>
  );
};

export default PurchaseStats;
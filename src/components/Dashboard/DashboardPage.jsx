import React from "react";
import SalesChart from "./SalesChart";
import TopProducts from "./TopProducts";
import LowStockAlert from "./LowStockAlert";

const DashboardPage = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Overview</h1>

      {/* Sales Chart */}
      <SalesChart />

      {/* Top Products and Low Stock Alerts in grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <TopProducts />
        <LowStockAlert />
      </div>
    </div>
  );
};

export default DashboardPage;
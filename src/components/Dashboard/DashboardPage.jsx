import React from "react";
import LowStockAlert from "./LowStockAlert";
import NetRevenueChart from "./NetRevenueChart";
import TopNetProduct from "./TopNetProduct";

const DashboardPage = () => {
  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Overview</h1>

      <LowStockAlert />
      
      {/* Net Revenue Chart */}
      <div className="mt-6">
        <NetRevenueChart />
      </div>

      {/* Top Net Product and Low Stock Alert side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <TopNetProduct />
      </div>
    </div>
  );
};

export default DashboardPage;
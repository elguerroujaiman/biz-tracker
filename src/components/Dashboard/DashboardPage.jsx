import React from "react";
import LowStockAlert from "./LowStockAlert";
import NetRevenueChart from "./NetRevenueChart";
import EarningsPerProductChart from "./EarningsPerProductChart";
import ProductActivityList from "./ProductActivityList";
import ProductEarningsOverview from "./ProductEarningsOverview";

const DashboardPage = () => {
  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Overview</h1>

      {/* Low Stock Alert */}
      <div className="dashboard-card mb-6">
        <LowStockAlert />
      </div>

      {/* Net Revenue Line Chart */}
      <div className="dashboard-card mb-6">
        <NetRevenueChart />
      </div>

      <ProductEarningsOverview />

      {/* Row for Earnings per Product & Product Activity */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="dashboard-card dashboard-chart-container">
            <EarningsPerProductChart />
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="dashboard-card">
            <ProductActivityList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
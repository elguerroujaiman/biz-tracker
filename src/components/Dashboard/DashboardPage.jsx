import React from "react";
import LowStockAlert from "./LowStockAlert";
import NetRevenueChart from "./NetRevenueChart";
import EarningsPerProductChart from "./EarningsPerProductChart";
import ProductActivityList from "./ProductActivityList";
import ProductEarningsOverview from "./ProductEarningsOverview";

const DashboardPage = () => {
  return (
    <div className="page-container">
      <h2 style={{ fontWeight: "bold", marginBottom: "2rem" }}>Dashboard Overview</h2>

      {/* === Top: Net Revenue Chart === */}
      <div className="dashboard-card mb-4">
        <NetRevenueChart />
      </div>

      {/* === Middle Row: Earnings Chart & Product Overview === */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="dashboard-card dashboard-chart-container">
            <EarningsPerProductChart />
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="dashboard-card">
            <ProductEarningsOverview />
          </div>
        </div>
      </div>

      {/* === Bottom Row: Activity List (2/3) & Low Stock (1/3) === */}
      <div className="row">
        <div className="col-md-8 mb-4">
          <div className="dashboard-card">
            <ProductActivityList />
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="dashboard-card">
            <LowStockAlert />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
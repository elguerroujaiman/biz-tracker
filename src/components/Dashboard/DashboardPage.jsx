import React from "react";
import NetRevenueChart from "./NetRevenueChart";
import TopNetProduct from "./TopNetProduct";
import EarningsPerProductChart from "./EarningsPerProductChart";
import ProductEarningsOverview from "./ProductEarningsOverview";
import LowStockAlert from "./LowStockAlert";
import ProductActivityList from "./ProductActivityList";

const DashboardPage = () => {
  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics & Intelligence</h1>
          <p className="page-subtitle">
            Real-time profitability tracking, margin analysis, and inventory velocity.
          </p>
        </div>
      </div>

      {/* Row 1: Net Revenue Over Time */}
      <div className="mb-4">
        <NetRevenueChart />
      </div>

      {/* Row 2: Top Profit Star & Profit Share Doughnut */}
      <div className="grid grid-2 gap-4 mb-4">
        <TopNetProduct />
        <EarningsPerProductChart />
      </div>

      {/* Row 3: Product Profit Breakdown & Low Stock Watchlist */}
      <div className="grid grid-2 gap-4 mb-4">
        <ProductEarningsOverview />
        <div className="d-flex flex-column gap-4">
          <LowStockAlert />
          <ProductActivityList />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
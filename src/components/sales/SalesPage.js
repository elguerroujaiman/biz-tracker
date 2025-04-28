import React, { useEffect, useState, useCallback } from "react";
import { authFetch } from "../../utils/api";
import SaleForm from "./SaleForm";
import SaleDetail from "./SaleDetail";
import SalesStats from "./SalesStats";

const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [statsUpdatedAt, setStatsUpdatedAt] = useState(Date.now());

  const fetchSales = useCallback(async () => {
    try {
      const response = await authFetch("/sales");
      let data = await response.json();

      if (!Array.isArray(data)) {
        data = [data];
      }

      setSales(data);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleSaleCreated = () => {
    fetchSales();            // refresh sales list
    setStatsUpdatedAt(Date.now()); // trigger stats refresh
    setShowForm(false);      // close form after creation
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Sales</h1>

      <SalesStats key={statsUpdatedAt} />

      <button
        style={{
          margin: "1rem 0",
          padding: "0.5rem 1rem",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Close Sale Form" : "Create New Sale"}
      </button>

      {showForm && <SaleForm onSaleCreated={handleSaleCreated} />}

      <h2 style={{ marginTop: "2rem", fontSize: "1.5rem" }}>All Sales</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {sales.map((sale) => (
          <li key={sale.sale_id} style={{ margin: "0.5rem 0" }}>
            <button
              style={{
                width: "100%",
                textAlign: "left",
                padding: "0.75rem",
                backgroundColor: "#f1f1f1",
                border: "1px solid #ccc",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={() => setSelectedSaleId(sale.sale_id)}
            >
              Sale #{sale.sale_id} - {new Date(sale.sale_date).toLocaleString()} - ${sale.total_amount}
            </button>
          </li>
        ))}
      </ul>

      {selectedSaleId && (
        <div style={{ marginTop: "2rem" }}>
          <SaleDetail sale_id={selectedSaleId} key={selectedSaleId} />
        </div>
      )}
    </div>
  );
};

export default SalesPage;
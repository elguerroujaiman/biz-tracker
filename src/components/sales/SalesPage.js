import React, { useEffect, useState, useCallback } from "react";
import { authFetch } from "../../utils/api";
import SaleForm from "./SaleForm";
import SaleDetail from "./SaleDetail";
import SalesStats from "./SalesStats";
import ExportCSVButton from "./ExportCSVButton";

const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [statsUpdatedAt, setStatsUpdatedAt] = useState(Date.now());
  const [filterText, setFilterText] = useState("");
  const [filteredSales, setFilteredSales] = useState([]);

  const fetchSales = useCallback(async () => {
    try {
      const response = await authFetch("/sales");
      let data = await response.json();
      if (!Array.isArray(data)) data = [data];
      setSales(data);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    if (!filterText) {
      setFilteredSales(sales);
    } else {
      setFilteredSales(
        sales.filter(s =>
          s.note?.toLowerCase().includes(filterText.toLowerCase()) ||
          s.sale_id.toString().includes(filterText)
        )
      );
    }
  }, [sales, filterText]);

  const handleSaleCreated = () => {
    fetchSales();
    setStatsUpdatedAt(Date.now());
    setShowForm(false);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Sales</h1>

      <SalesStats key={statsUpdatedAt} />

      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          margin: "1rem 0",
          padding: "0.5rem 1rem",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {showForm ? "Close Sale Form" : "Create New Sale"}
      </button>

      {showForm && <SaleForm onSaleCreated={handleSaleCreated} />}

      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between" }}>
        <input
          type="text"
          placeholder="Search by Sale ID or Note"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ flex: 1, padding: "0.5rem", marginRight: "1rem" }}
        />
        <ExportCSVButton data={filteredSales} filename="sales_export.csv" />
      </div>

      <h2 style={{ marginTop: "2rem", fontSize: "1.5rem" }}>All Sales</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {filteredSales.map((sale) => (
          <li key={sale.sale_id} style={{ margin: "0.5rem 0" }}>
            <button
              onClick={() => setSelectedSaleId(sale.sale_id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "0.75rem",
                backgroundColor: "#f1f1f1",
                border: "1px solid #ccc",
                borderRadius: "5px",
                cursor: "pointer",
              }}
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
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { authFetch } from "../../utils/api";
import { Modal } from "react-bootstrap";
import SaleForm from "./SaleForm";
import SaleDetail from "./SaleDetail";
import { toast } from "react-hot-toast";
import { useSettings } from "../../contexts/SettingsContext";
import { useNavigate } from "react-router-dom";
import {
  MdAdd,
  MdSearch,
  MdInsights,
  MdDelete,
  MdVisibility,
  MdArrowUpward,
  MdArrowDownward,
  MdPointOfSale,
  MdClose,
} from "react-icons/md";

const SalesPage = () => {
  const [sales, setSales]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterText, setFilterText]     = useState("");
  const [sortBy, setSortBy]             = useState("date");
  const [sortAsc, setSortAsc]           = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailSaleId, setDetailSaleId] = useState(null);

  const { currency_symbol } = useSettings();
  const navigate            = useNavigate();

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch("/sales");
      if (response.ok) {
        let data = await response.json();
        if (!Array.isArray(data)) data = data ? [data] : [];
        setSales(data);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const filteredSales = useMemo(() => {
    let list = [...sales];

    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      list = list.filter(
        (s) =>
          String(s.sale_id).includes(q) ||
          s.note?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let valA, valB;
      if (sortBy === "id") {
        valA = Number(a.sale_id);
        valB = Number(b.sale_id);
      } else if (sortBy === "amount") {
        valA = Number(a.total_amount) || 0;
        valB = Number(b.total_amount) || 0;
      } else if (sortBy === "earnings") {
        valA = Number(a.total_earnings) || 0;
        valB = Number(b.total_earnings) || 0;
      } else {
        valA = new Date(a.sale_date).getTime();
        valB = new Date(b.sale_date).getTime();
      }

      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [sales, filterText, sortBy, sortAsc]);

  const toggleSort = (criterion) => {
    if (sortBy === criterion) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(criterion);
      setSortAsc(false);
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm(`Are you sure you want to delete Sale #${saleId}?`)) return;

    try {
      const res = await authFetch(`/sales/${saleId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Sale #${saleId} deleted.`);
        fetchSales();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to delete sale.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Could not delete sale.");
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales History & Invoicing</h1>
          <p className="page-subtitle">
            Browse transactions, print receipts, and monitor gross & net revenue.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/sales/stats")}
          >
            <MdInsights size={18} /> Sales Stats
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <MdAdd size={20} /> New Sale
          </button>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="panel-card mb-4">
        <div className="panel-card-body">
          <div className="inventory-controls-row">
            <div className="input-wrapper has-icon-left flex-grow-1">
              <span className="input-icon input-icon-left">
                <MdSearch size={18} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search sales by Invoice ID or customer note..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
              {filterText && (
                <span
                  className="input-icon input-icon-right clickable-icon"
                  onClick={() => setFilterText("")}
                >
                  <MdClose />
                </span>
              )}
            </div>

            <div className="sort-controls">
              <span className="text-muted text-sm">Sort:</span>
              <select
                className="form-control form-control-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Transaction Date</option>
                <option value="id">Sale ID</option>
                <option value="amount">Total Amount</option>
                <option value="earnings">Net Earnings</option>
              </select>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSortAsc(!sortAsc)}
                title={sortAsc ? "Ascending order" : "Descending order"}
              >
                {sortAsc ? <MdArrowUpward /> : <MdArrowDownward />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="panel-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("id")} style={{ cursor: "pointer" }}>
                  Invoice {sortBy === "id" && (sortAsc ? "↑" : "↓")}
                </th>
                <th onClick={() => toggleSort("date")} style={{ cursor: "pointer" }}>
                  Date & Time {sortBy === "date" && (sortAsc ? "↑" : "↓")}
                </th>
                <th>Memo / Note</th>
                <th onClick={() => toggleSort("amount")} style={{ cursor: "pointer" }}>
                  Total {sortBy === "amount" && (sortAsc ? "↑" : "↓")}
                </th>
                <th onClick={() => toggleSort("earnings")} style={{ cursor: "pointer" }}>
                  Net Margin {sortBy === "earnings" && (sortAsc ? "↑" : "↓")}
                </th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="skeleton skeleton-title mx-auto mb-2" />
                    <div className="skeleton skeleton-text mx-auto w-50" />
                  </td>
                </tr>
              ) : filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale.sale_id}>
                    <td className="font-mono font-bold text-primary">#{sale.sale_id}</td>
                    <td className="text-muted text-sm">
                      {new Date(sale.sale_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="text-secondary text-sm">
                      {sale.note ? `"${sale.note}"` : <span className="text-muted">—</span>}
                    </td>
                    <td className="font-mono font-semibold text-primary">
                      {currency_symbol || "$"}{Number(sale.total_amount || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className="badge badge-success font-mono">
                        +{currency_symbol || "$"}{Number(sale.total_earnings || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setDetailSaleId(sale.sale_id)}
                          title="View Receipt"
                        >
                          <MdVisibility size={14} /> Receipt
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteSale(sale.sale_id)}
                          title="Delete Sale"
                        >
                          <MdDelete size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <MdPointOfSale size={40} className="empty-state-icon" />
                    <p className="empty-state-text mt-2">
                      {filterText ? "No sales match your search filter." : "No sales recorded yet."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
        centered
        contentClassName="custom-modal-dark"
      >
        <Modal.Header closeButton>
          <Modal.Title>Issue New Sale</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SaleForm
            onSaleCreated={() => {
              setShowAddModal(false);
              fetchSales();
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Sale Details Modal */}
      <Modal
        show={!!detailSaleId}
        onHide={() => setDetailSaleId(null)}
        size="lg"
        centered
        contentClassName="custom-modal-dark"
      >
        <Modal.Header closeButton>
          <Modal.Title>Sale Receipt #{detailSaleId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailSaleId && <SaleDetail sale_id={detailSaleId} />}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SalesPage;
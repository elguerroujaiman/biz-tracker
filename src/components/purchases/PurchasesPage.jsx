import React, { useEffect, useState, useCallback, useMemo } from "react";
import { authFetch } from "../../utils/api";
import { Modal } from "react-bootstrap";
import PurchaseForm from "./PurchaseForm";
import PurchaseDetail from "./PurchaseDetail";
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
  MdShoppingCart,
  MdClose,
} from "react-icons/md";

const PurchasesPage = () => {
  const [purchases, setPurchases]             = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [filterText, setFilterText]           = useState("");
  const [sortBy, setSortBy]                   = useState("date");
  const [sortAsc, setSortAsc]                 = useState(false);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [detailPurchaseId, setDetailPurchId]  = useState(null);

  const { currency_symbol } = useSettings();
  const navigate            = useNavigate();

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch("/purchases");
      if (response.ok) {
        let data = await response.json();
        setPurchases(Array.isArray(data) ? data : data.purchases || []);
      }
    } catch (err) {
      console.error("Failed to fetch purchases", err);
      toast.error("Failed to load purchases list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const filteredPurchases = useMemo(() => {
    let list = [...purchases];

    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      list = list.filter(
        (p) =>
          String(p.purchase_id).includes(q) ||
          p.notes?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let valA, valB;
      if (sortBy === "id") {
        valA = Number(a.purchase_id);
        valB = Number(b.purchase_id);
      } else if (sortBy === "amount") {
        valA = Number(a.total_amount) || 0;
        valB = Number(b.total_amount) || 0;
      } else {
        valA = new Date(a.purchase_date).getTime();
        valB = new Date(b.purchase_date).getTime();
      }

      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [purchases, filterText, sortBy, sortAsc]);

  const toggleSort = (criterion) => {
    if (sortBy === criterion) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(criterion);
      setSortAsc(false);
    }
  };

  const handleDelete = async (purchaseId) => {
    if (!window.confirm(`Are you sure you want to delete Purchase #${purchaseId}?`)) return;

    try {
      const res = await authFetch(`/purchases/${purchaseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Purchase #${purchaseId} deleted.`);
        fetchPurchases();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to delete purchase order.");
      }
    } catch (err) {
      console.error("Delete purchase error:", err);
      toast.error("Could not delete purchase order.");
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchases & Expenses</h1>
          <p className="page-subtitle">
            Log vendor restocking orders, track physical acquisitions, and monitor expenditures.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/purchases/stats")}
          >
            <MdInsights size={18} /> Purchase Stats
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <MdAdd size={20} /> Record Purchase
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
                placeholder="Search purchases by PO ID or supplier memo..."
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
                <option value="date">Order Date</option>
                <option value="id">PO ID</option>
                <option value="amount">Total Spent</option>
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

      {/* Purchases Table */}
      <div className="panel-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("id")} style={{ cursor: "pointer" }}>
                  PO ID {sortBy === "id" && (sortAsc ? "↑" : "↓")}
                </th>
                <th onClick={() => toggleSort("date")} style={{ cursor: "pointer" }}>
                  Date & Time {sortBy === "date" && (sortAsc ? "↑" : "↓")}
                </th>
                <th>Supplier Memo / Notes</th>
                <th onClick={() => toggleSort("amount")} style={{ cursor: "pointer" }}>
                  Total Expenditure {sortBy === "amount" && (sortAsc ? "↑" : "↓")}
                </th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="skeleton skeleton-title mx-auto mb-2" />
                    <div className="skeleton skeleton-text mx-auto w-50" />
                  </td>
                </tr>
              ) : filteredPurchases.length > 0 ? (
                filteredPurchases.map((p) => (
                  <tr key={p.purchase_id}>
                    <td className="font-mono font-bold text-primary">PO #{p.purchase_id}</td>
                    <td className="text-muted text-sm">
                      {new Date(p.purchase_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="text-secondary text-sm">
                      {p.notes ? `"${p.notes}"` : <span className="text-muted">—</span>}
                    </td>
                    <td className="font-mono font-semibold text-accent">
                      {currency_symbol || "$"}{Number(p.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="text-end">
                      <div className="btn-group">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setDetailPurchId(p.purchase_id)}
                          title="View Invoice"
                        >
                          <MdVisibility size={14} /> Invoice
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(p.purchase_id)}
                          title="Delete Purchase"
                        >
                          <MdDelete size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <MdShoppingCart size={40} className="empty-state-icon" />
                    <p className="empty-state-text mt-2">
                      {filterText
                        ? "No purchase orders match your filter."
                        : "No purchases recorded yet."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
        centered
        contentClassName="custom-modal-dark"
      >
        <Modal.Header closeButton>
          <Modal.Title>Record Restock Purchase Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PurchaseForm
            onPurchaseCreated={() => {
              setShowAddModal(false);
              fetchPurchases();
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Purchase Details Modal */}
      <Modal
        show={!!detailPurchaseId}
        onHide={() => setDetailPurchId(null)}
        size="lg"
        centered
        contentClassName="custom-modal-dark"
      >
        <Modal.Header closeButton>
          <Modal.Title>Purchase Order #{detailPurchaseId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailPurchaseId && <PurchaseDetail purchaseId={detailPurchaseId} />}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default PurchasesPage;
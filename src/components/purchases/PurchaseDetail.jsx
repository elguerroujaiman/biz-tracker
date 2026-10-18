import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../../utils/api";
import { useSettings } from "../../contexts/SettingsContext";
import { MdArrowBack, MdReceipt } from "react-icons/md";

const PurchaseDetail = ({ purchaseId: propId }) => {
  const { purchase_id: paramId } = useParams();
  const purchaseId               = propId || paramId;
  const isStandalone             = !propId;

  const [purchase, setPurchase]  = useState(null);
  const [loading, setLoading]    = useState(true);
  const navigate                 = useNavigate();
  const { currency_symbol }      = useSettings();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await authFetch(`/purchases/${purchaseId}`);
        if (res.ok) {
          const data = await res.json();
          setPurchase(data);
        }
      } catch (err) {
        console.error("Failed to fetch purchase detail", err);
      } finally {
        setLoading(false);
      }
    };

    if (purchaseId) fetchDetail();
  }, [purchaseId]);

  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="skeleton skeleton-title mx-auto mb-2" />
        <div className="skeleton skeleton-card mx-auto" />
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="empty-state py-5 text-center">
        <MdReceipt size={48} className="empty-state-icon" />
        <p className="empty-state-text mt-2">Purchase invoice not found.</p>
        {isStandalone && (
          <button className="btn btn-secondary mt-3" onClick={() => navigate("/purchases")}>
            <MdArrowBack /> Back to Purchases
          </button>
        )}
      </div>
    );
  }

  const items = Array.isArray(purchase.items) ? purchase.items : [];

  const content = (
    <div>
      {/* Overview Stat Badges */}
      <div className="grid grid-2 gap-3 mb-4">
        <div className="stat-card p-3">
          <span className="text-muted text-xs block">Invoice ID</span>
          <div className="font-mono font-bold text-primary">PO #{purchase.purchase_id}</div>
          <span className="text-xs text-muted">
            {new Date(purchase.purchase_date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="stat-card p-3">
          <span className="text-muted text-xs block">Total Procurement Cost</span>
          <div className="font-mono font-bold text-accent" style={{ fontSize: "1.25rem" }}>
            {currency_symbol || "$"}{Number(purchase.total_amount || 0).toFixed(2)}
          </div>
          <span className="badge badge-accent text-xs">Supplier expense</span>
        </div>
      </div>

      {purchase.notes && (
        <div className="p-3 rounded mb-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <span className="text-muted text-xs block font-semibold">Supplier Memo / Notes</span>
          <p className="text-primary text-sm mb-0 mt-1">{purchase.notes}</p>
        </div>
      )}

      {/* Items Table */}
      <h4 className="font-semibold mb-3">Procured Items ({items.length})</h4>
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th className="text-center">Quantity Acquired</th>
              <th>Unit Cost</th>
              <th className="text-end">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="font-semibold">{item.product_name}</td>
                <td>
                  <span className="badge badge-accent">{item.category || "General"}</span>
                </td>
                <td className="text-center font-mono">{item.quantity}</td>
                <td className="font-mono">
                  {currency_symbol || "$"}{Number(item.unit_price || item.price || 0).toFixed(2)}
                </td>
                <td className="font-mono text-end font-semibold">
                  {currency_symbol || "$"}{Number(item.total_price || (item.quantity * (item.unit_price || item.price || 0))).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isStandalone) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <button
              className="btn btn-secondary btn-sm mb-2"
              onClick={() => navigate("/purchases")}
            >
              <MdArrowBack /> Back to Purchases
            </button>
            <h1 className="page-title">Purchase Order #{purchase.purchase_id} Details</h1>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-card-body">{content}</div>
        </div>
      </div>
    );
  }

  return content;
};

export default PurchaseDetail;
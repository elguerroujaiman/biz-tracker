import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../../utils/api";
import { useSettings } from "../../contexts/SettingsContext";
import { MdArrowBack, MdReceipt } from "react-icons/md";

const SaleDetail = ({ sale_id: propSaleId }) => {
  const { sale_id: paramSaleId } = useParams();
  const sale_id                  = propSaleId || paramSaleId;
  const isStandalone             = !propSaleId;

  const [sale, setSale]          = useState(null);
  const [loading, setLoading]    = useState(true);
  const navigate                 = useNavigate();
  const { currency_symbol }      = useSettings();

  useEffect(() => {
    const fetchSaleDetails = async () => {
      try {
        const response = await authFetch(`/sales/${sale_id}`);
        if (response.ok) {
          const data = await response.json();
          setSale(data);
        }
      } catch (error) {
        console.error("Error fetching sale details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sale_id) {
      fetchSaleDetails();
    }
  }, [sale_id]);

  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="skeleton skeleton-title mx-auto mb-2" />
        <div className="skeleton skeleton-card mx-auto" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="empty-state py-5 text-center">
        <MdReceipt size={48} className="empty-state-icon" />
        <p className="empty-state-text mt-2">Sale record not found.</p>
        {isStandalone && (
          <button className="btn btn-secondary mt-3" onClick={() => navigate("/sales")}>
            <MdArrowBack /> Back to Sales
          </button>
        )}
      </div>
    );
  }

  const items = Array.isArray(sale.items) ? sale.items : [];

  const content = (
    <div>
      {/* Overview Stat Badges */}
      <div className="grid grid-3 gap-3 mb-4">
        <div className="stat-card p-3">
          <span className="text-muted text-xs block">Invoice ID</span>
          <div className="font-mono font-bold text-primary">#{sale.sale_id}</div>
          <span className="text-xs text-muted">
            {new Date(sale.sale_date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="stat-card p-3">
          <span className="text-muted text-xs block">Total Gross Amount</span>
          <div className="font-mono font-bold text-accent" style={{ fontSize: "1.25rem" }}>
            {currency_symbol || "$"}{Number(sale.total_amount || 0).toFixed(2)}
          </div>
          <span className="badge badge-success text-xs">Paid in full</span>
        </div>

        <div className="stat-card p-3">
          <span className="text-muted text-xs block">Calculated Profit</span>
          <div className="font-mono font-bold text-success" style={{ fontSize: "1.25rem" }}>
            +{currency_symbol || "$"}{Number(sale.total_earnings || 0).toFixed(2)}
          </div>
          <span className="text-xs text-muted">Over item procurement costs</span>
        </div>
      </div>

      {sale.note && (
        <div className="p-3 rounded mb-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <span className="text-muted text-xs block font-semibold">Note / Customer Memo</span>
          <p className="text-primary text-sm mb-0 mt-1">{sale.note}</p>
        </div>
      )}

      {/* Items Table */}
      <h4 className="font-semibold mb-3">Line Items ({items.length})</h4>
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th className="text-center">Quantity</th>
              <th>Sale Unit Price</th>
              <th>Total Amount</th>
              <th className="text-end">Item Profit</th>
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
                  {currency_symbol || "$"}{Number(item.unit_price || 0).toFixed(2)}
                </td>
                <td className="font-mono font-semibold">
                  {currency_symbol || "$"}{Number(item.total_price || 0).toFixed(2)}
                </td>
                <td className="font-mono text-end text-success font-semibold">
                  +{currency_symbol || "$"}{Number(item.earnings || 0).toFixed(2)}
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
              onClick={() => navigate("/sales")}
            >
              <MdArrowBack /> Back to Sales
            </button>
            <h1 className="page-title">Sale #{sale.sale_id} Receipt Details</h1>
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

export default SaleDetail;
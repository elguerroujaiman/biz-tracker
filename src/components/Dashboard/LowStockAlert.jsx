import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { MdWarningAmber, MdArrowForward, MdCheckCircle } from "react-icons/md";

const LowStockAlert = () => {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch("/products/low-stock");
        if (res.ok) {
          const data = await res.json();
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Low stock loading error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="panel-card h-100">
      <div className="panel-card-header">
        <div className="panel-card-title">
          <MdWarningAmber
            className={`panel-icon ${items.length > 0 ? "text-danger" : "text-success"}`}
          />
          <div>
            <h3>Low Stock Watchlist</h3>
            <span className="text-muted text-sm">Critical replenishment triggers</span>
          </div>
        </div>
      </div>

      <div className="panel-card-body">
        {loading ? (
          <div className="py-4 text-center">
            <div className="skeleton skeleton-text mx-auto w-75 mb-2" />
            <div className="skeleton skeleton-text mx-auto w-50" />
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state py-4 text-center">
            <MdCheckCircle size={36} className="text-success mb-2" />
            <p className="font-semibold text-primary">All stock levels healthy!</p>
            <p className="text-muted text-sm">
              No products are currently under their replenishment threshold.
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {items.map((p) => {
              const isZero = Number(p.total_quantity) <= 0;
              return (
                <div
                  key={p.product_id}
                  className="p-3 rounded d-flex justify-content-between align-items-center"
                  style={{
                    background: isZero ? "var(--danger-dim)" : "var(--warning-dim)",
                    border: `1px solid ${isZero ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                  }}
                >
                  <div>
                    <div className="font-semibold text-primary">{p.name}</div>
                    <div className="text-muted text-sm">
                      Threshold: {p.low_stock_threshold} units
                    </div>
                  </div>
                  <div className="text-end">
                    <span className={`badge ${isZero ? "badge-danger" : "badge-warning"}`}>
                      {p.total_quantity} left
                    </span>
                  </div>
                </div>
              );
            })}

            <button
              className="btn btn-secondary btn-sm mt-3 w-100"
              onClick={() => navigate("/purchases/new")}
            >
              Order Replenishment <MdArrowForward size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LowStockAlert;
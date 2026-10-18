import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";
import { MdEmojiEvents } from "react-icons/md";
import { useSettings } from "../../contexts/SettingsContext";

const TopNetProduct = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currency_symbol }   = useSettings();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch("/analytics/top-net-product");
        if (res.ok) {
          const data = await res.json();
          setProduct(data && data.name ? data : null);
        }
      } catch (err) {
        console.error("Top product error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="panel-card h-100">
        <div className="panel-card-body py-4 text-center">
          <div className="skeleton skeleton-title mx-auto mb-2" />
          <div className="skeleton skeleton-text mx-auto w-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card h-100">
      <div className="panel-card-header">
        <div className="panel-card-title">
          <MdEmojiEvents className="panel-icon text-accent" />
          <div>
            <h3>Top Profit Star</h3>
            <span className="text-muted text-sm">Product with highest cumulative net profit</span>
          </div>
        </div>
      </div>

      <div className="panel-card-body">
        {!product ? (
          <p className="text-muted text-center py-4">No sales data available yet.</p>
        ) : (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
              <div>
                <span className="badge badge-accent mb-1">#1 Top Earner</span>
                <h4 className="font-bold text-primary mb-0">{product.name}</h4>
              </div>
              <div className="text-end">
                <div className="text-xs text-muted">Net Earnings</div>
                <div className="font-mono font-bold text-success" style={{ fontSize: "1.25rem" }}>
                  +{currency_symbol || "$"}{Number(product.netRevenue || 0).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-3 gap-2 text-sm">
              <div className="p-2 rounded" style={{ background: "var(--bg-elevated)" }}>
                <span className="text-muted text-xs block">Units Sold</span>
                <span className="font-semibold text-primary">{product.unitsSold}</span>
              </div>
              <div className="p-2 rounded" style={{ background: "var(--bg-elevated)" }}>
                <span className="text-muted text-xs block">Gross Revenue</span>
                <span className="font-semibold text-primary">
                  {currency_symbol || "$"}{Number(product.totalRevenue || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-2 rounded" style={{ background: "var(--bg-elevated)" }}>
                <span className="text-muted text-xs block">Total Cost</span>
                <span className="font-semibold text-muted">
                  {currency_symbol || "$"}{Number(product.totalCost || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopNetProduct;
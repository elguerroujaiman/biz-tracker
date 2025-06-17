import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authFetch } from "../../utils/api";
import { Spinner} from "react-bootstrap";

const PurchaseDetail = ({ purchaseId: propId }) => {
  // allow the component to work both inside a <Route> or via prop
  const { purchaseId: paramId } = useParams();
  const purchaseId = propId || paramId;

  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await authFetch(`/purchases/${purchaseId}`);
        const data = await res.json();
        setPurchase(data);
      } catch (err) {
        console.error("Failed to fetch purchase detail", err);
      } finally {
        setLoading(false);
      }
    };

    if (purchaseId) fetchDetail();
  }, [purchaseId]);

  if (loading) return <Spinner animation="border" size="sm" />;

  if (!purchase) return <div>Purchase not found.</div>;

  const items = Array.isArray(purchase.items) ? purchase.items : [];

  return (
    <div>
      <p><strong>Purchase&nbsp;ID:</strong> {purchase.purchase_id}</p>
      <p><strong>Date:</strong> {new Date(purchase.purchase_date).toLocaleString("en-GB")}</p>
      <p><strong>Total&nbsp;Amount:</strong> ${Number(purchase.total_amount).toFixed(2)}</p>

      <p><strong>Purchase&nbsp;Items:</strong></p>
      {items.length === 0 ? (
        <p>No items found for this purchase.</p>
      ) : (
        <table className="custom-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit&nbsp;Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.product_name}</td>
                <td>{item.category}</td>
                <td>{item.quantity}</td>
                <td>${Number(item.unit_price).toFixed(2)}</td>
                <td>${Number(item.total_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PurchaseDetail;
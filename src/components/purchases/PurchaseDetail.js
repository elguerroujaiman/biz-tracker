import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";

const PurchaseDetail = ({ purchaseId }) => {
  const [purchase, setPurchase] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await authFetch(`/purchases/${purchaseId}`);
        const data = await res.json();
        setPurchase(data);
      } catch (err) {
        console.error("Failed to fetch purchase detail", err);
      }
    };

    fetchDetail();
  }, [purchaseId]);

  if (!purchase) return <p>Loading...</p>;

  return (
    <div className="mt-4">
      <h4>Purchase Details</h4>
      <p><strong>Date:</strong> {new Date(purchase.purchase_date).toLocaleString()}</p>
      <p><strong>Total:</strong> ${purchase.total_amount}</p>
      <p><strong>Notes:</strong> {purchase.notes}</p>
      <ul>
        {purchase.items.map((item, idx) => (
          <li key={idx}>
            {item.product_name} - {item.quantity} × ${item.price} = ${item.total_price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PurchaseDetail;
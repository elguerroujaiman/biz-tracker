import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";
import { toast } from "react-hot-toast";

const LowStockAlert = () => {
  const [items, setItems]   = useState([]);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await authFetch("/products/low-stock");
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load low-stock products");
      } finally {
        setLoad(false);
      }
    };
    load();
  }, []);

  if (loading) return <p>Loading low-stock alerts…</p>;

  return (
    <div className="dashboard-widget p-6 mt-6">
      <h2 className="text-lg font-semibold text-red-600 mb-4">Low Stock Alerts</h2>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No products are currently low on stock.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((p) => (
            <li key={p.product_id} className="py-2 flex justify-between text-sm">
              <span><strong>{p.name} </strong>is low on stock : </span>
              <span className="low-stock"> {p.total_quantity} left</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LowStockAlert;
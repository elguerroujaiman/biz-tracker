import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";
import { toast } from "react-hot-toast";

const TopNetProduct = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch("/analytics/top-net-product?from=2025-06-01&to=2025-06-30");
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        setProduct(data && data.name ? data : null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load top product");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p>Loading top net product…</p>;

  return (
    <div className="bg-white border rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-blue-600 mb-4">Top Net Revenue Product</h2>

      {!product ? (
        <p className="text-sm text-gray-500">No data available for the selected period.</p>
      ) : (
        <ul className="text-sm space-y-1">
          <li><strong>Name:</strong> {product.name}</li>
          <li><strong>Units Sold:</strong> {product.unitsSold}</li>
          <li><strong>Total Revenue:</strong> ${product.totalRevenue}</li>
          <li><strong>Total Cost:</strong> ${product.totalCost}</li>
          <li><strong>Net Revenue:</strong> <span className="text-green-600 font-medium">${product.netRevenue}</span></li>
        </ul>
      )}
    </div>
  );
};

export default TopNetProduct;
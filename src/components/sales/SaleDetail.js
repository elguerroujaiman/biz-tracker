import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authFetch } from "../../utils/api";

const SaleDetail = ({ sale_id: propSaleId }) => {
  const { sale_id: paramSaleId } = useParams();
  const sale_id = propSaleId || paramSaleId;
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaleDetails = async () => {
      try {
        const response = await authFetch(`/sales/${sale_id}`);
        const data = await response.json();
        setSale(data);
      } catch (error) {
        console.error("Error fetching sale details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSaleDetails();
  }, [sale_id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!sale) {
    return <div>Sale not found</div>;
  }

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Sale Details</h2>
      <p><strong>Sale ID:</strong> {sale.sale_id}</p>
      <p><strong>Total Amount:</strong> ${sale.total_amount}</p>
      <p><strong>Sale Date:</strong> {new Date(sale.sale_date).toLocaleString()}</p>
      <p><strong>Note:</strong> {sale.note || "No note available"}</p>

      <h3 style={{ marginTop: "1rem" }}>Items</h3>
      <ul style={{ paddingLeft: "1.5rem" }}>
        {sale.items?.map((item, index) => (
          <li key={index}>
            {item.product_name} ({item.category}) - {item.quantity} × ${item.unit_price} = ${item.total_price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SaleDetail;
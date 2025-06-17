import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authFetch } from "../../utils/api";
import { Spinner } from "react-bootstrap";

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

    if (sale_id) {
      fetchSaleDetails();
    }
  }, [sale_id]);

  if (loading) return <Spinner animation="border" size="sm" />;
  if (!sale) return <div>Sale not found.</div>;

  return (
    <div>
      <p><strong>Sale ID: </strong> {sale.sale_id}</p>
      <p><strong>Date: </strong> {new Date(sale.sale_date).toLocaleString("en-GB")}</p>
      <p><strong>Total Amount:</strong> ${Number(sale.total_amount).toFixed(2)}</p>
      <p><strong>Total Earnings:</strong> ${Number(sale.total_earnings).toFixed(2)}</p>

      <p><strong>Sale Items:</strong></p>
      <table className="custom-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
            <th>Earnings</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item, idx) => (
            <tr key={idx}>
              <td>{item.product_name}</td>
              <td>{item.category}</td>
              <td>{item.quantity}</td>
              <td>${item.unit_price.toFixed(2)}</td>
              <td>${item.total_price.toFixed(2)}</td>
              <td>${item.earnings.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SaleDetail;
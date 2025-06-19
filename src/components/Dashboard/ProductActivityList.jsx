import React, { useEffect, useState } from "react";
import axios from "axios";

const ProductActivityList = () => {
  const [products, setProducts] = useState([]);
  const [sortOrder, setSortOrder] = useState("active");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/analytics/product-activity?sort=${sortOrder}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProducts(response.data);
      } catch (error) {
        console.error("Failed to load product activity:", error);
      }
    };

    fetchActivity();
  }, [sortOrder, token]);

  return (
    <div className="card p-4 shadow-sm mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Product Activity</h4>
        <select
          className="form-select w-auto"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="active">Most Active</option>
          <option value="inactive">Most Inactive</option>
        </select>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Last Sold</th>
          </tr>
        </thead>
        <tbody>
          {products.length ? (
            products.map((p) => (
              <tr key={p.product_id}>
                <td>{p.name}</td>
                <td>{p.lastSold ? new Date(p.lastSold).toLocaleString("en-GB") : "Never Sold"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="text-center">No product activity found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductActivityList;
import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";
import { MdHistory } from "react-icons/md";

const ProductActivityList = () => {
  const [products, setProducts]   = useState([]);
  const [sortOrder, setSortOrder] = useState("active");
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const response = await authFetch(`/analytics/product-activity?sort=${sortOrder}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load product activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [sortOrder]);

  return (
    <div className="panel-card h-100">
      <div className="panel-card-header flex-wrap gap-2">
        <div className="panel-card-title">
          <MdHistory className="panel-icon text-accent" />
          <div>
            <h3>Product Turnover Activity</h3>
            <span className="text-muted text-sm">Velocity and recent sales frequency</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="text-muted text-sm">Filter:</span>
          <select
            className="form-control form-control-sm"
            style={{ width: "140px" }}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="active">Most Active</option>
            <option value="inactive">Least Active</option>
          </select>
        </div>
      </div>

      <div className="panel-card-body p-0">
        <div className="table-responsive">
          <table className="custom-table mb-0">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Last Transaction Date</th>
                <th>Velocity Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    <div className="skeleton skeleton-text mx-auto w-75" />
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const hasSold = !!p.lastSold;
                  return (
                    <tr key={p.product_id}>
                      <td className="font-semibold">{p.name}</td>
                      <td className="text-muted text-sm">
                        {hasSold
                          ? new Date(p.lastSold).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Never Sold"}
                      </td>
                      <td>
                        {hasSold ? (
                          <span className="badge badge-success">Active Seller</span>
                        ) : (
                          <span className="badge badge-warning">Stagnant Stock</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-muted">
                    No product turnover records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductActivityList;
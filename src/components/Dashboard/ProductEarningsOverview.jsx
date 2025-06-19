import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { toast } from "react-hot-toast";
import { Modal, Button } from "react-bootstrap";
import { authFetch } from "../../utils/api";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { format, addDays, parseISO } from "date-fns";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const now = new Date();
const CUR_YEAR = now.getFullYear();
const CUR_MONTH = now.getMonth() + 1;

const ProductEarningsOverview = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [year, setYear] = useState(CUR_YEAR);
  const [month, setMonth] = useState(CUR_MONTH);
  const [chartData, setChartData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);

  const yearOptions = Array.from({ length: 6 }, (_, i) => CUR_YEAR - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await authFetch("/products");
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load products");
      }
    };

    fetchProducts();
  }, []);

  const openModalForProduct = async (product) => {
    setSelectedProduct(product);
    setShowModal(true);
    await fetchChartData(product.product_id, year, month);
  };

  const fetchChartData = async (productId, y, m) => {
    setLoadingChart(true);
    try {
      const res = await authFetch(
        `/analytics/product-revenue?productId=${productId}&year=${y}&month=${m}`
      );
      if (!res.ok) throw new Error("Failed to load chart");
      const rows = await res.json();

      const revenueMap = {};
      rows.forEach((r) => {
        const shiftedDate = addDays(parseISO(r.day), 0);  // Corrects timezone shift
        const shiftedKey = format(shiftedDate, "yyyy-MM-dd");
        revenueMap[shiftedKey] = parseFloat(r.netRevenue);
      });

      const daysInMonth = new Date(y, m, 0).getDate();
      const labels = [];
      const data = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const labelDate = new Date(y, m - 1, day);
        labels.push(format(labelDate, "d MMM"));
        data.push(revenueMap[dateStr] || 0);
      }

      setChartData({
        labels,
        datasets: [
          {
            label: "Net Earnings",
            data,
            backgroundColor: "#10b981",
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.8,
          },
        ],
      });
    } catch (err) {
      console.error(err);
      toast.error("Error fetching chart data");
    } finally {
      setLoadingChart(false);
    }
  };

  const handleSelectorChange = async (type, value) => {
    if (type === "year") setYear(value);
    else if (type === "month") setMonth(value);

    if (selectedProduct) {
      await fetchChartData(selectedProduct.product_id, type === "year" ? value : year, type === "month" ? value : month);
    }
  };

  return (
    <div className="dashboard-widget p-6 mt-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">All Products Earnings</h2>

      <table className="product-activity-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center">No products found</td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.product_id}>
                <td>{product.name}</td>
                <td>
                <Button
                  variant="primary"
                  className="dashboard-button btn-sm py-2 px-3"
                  onClick={() => openModalForProduct(product)}
                  style={{ fontSize: "0.75rem", lineHeight: "1", verticalAlign: "middle" }}
                >
                  View Chart
                </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Bootstrap Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        contentClassName="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedProduct?.name} - Earnings Chart</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Selectors */}
          <div className="row mb-4">
            <div className="col">
              <label className="form-label">Year</label>
              <select
                className="form-select"
                value={year}
                onChange={(e) => handleSelectorChange("year", +e.target.value)}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y === CUR_YEAR ? `${y} (Current)` : y}
                  </option>
                ))}
              </select>
            </div>
            <div className="col">
              <label className="form-label">Month</label>
              <select
                className="form-select"
                value={month}
                onChange={(e) => handleSelectorChange("month", +e.target.value)}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m === CUR_MONTH && year === CUR_YEAR ? `${m} (Current)` : m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chart */}
          {loadingChart ? (
            <p>Loading chart…</p>
          ) : chartData ? (
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: { legend: { position: "top" } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          ) : (
            <p>No data found for this product.</p>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProductEarningsOverview;
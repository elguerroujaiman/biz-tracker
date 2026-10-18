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
import { format } from "date-fns";
import { MdShowChart, MdCalendarToday } from "react-icons/md";
import { useSettings } from "../../contexts/SettingsContext";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const now = new Date();
const CUR_YEAR = now.getFullYear();
const CUR_MONTH = now.getMonth() + 1;

const ProductEarningsOverview = () => {
  const [products, setProducts]             = useState([]);
  const [selectedProduct, setSelectedProd]  = useState(null);
  const [year, setYear]                     = useState(CUR_YEAR);
  const [month, setMonth]                   = useState(CUR_MONTH);
  const [chartData, setChartData]           = useState(null);
  const [showModal, setShowModal]           = useState(false);
  const [loadingChart, setLoadingChart]     = useState(false);
  const [loadingProds, setLoadingProds]     = useState(true);

  const { currency_symbol } = useSettings();

  const yearOptions  = Array.from({ length: 6 }, (_, i) => CUR_YEAR - i);
  const monthOptions = [
    { num: 1, name: "Jan" },
    { num: 2, name: "Feb" },
    { num: 3, name: "Mar" },
    { num: 4, name: "Apr" },
    { num: 5, name: "May" },
    { num: 6, name: "Jun" },
    { num: 7, name: "Jul" },
    { num: 8, name: "Aug" },
    { num: 9, name: "Sep" },
    { num: 10, name: "Oct" },
    { num: 11, name: "Nov" },
    { num: 12, name: "Dec" },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await authFetch("/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load products for overview:", err);
      } finally {
        setLoadingProds(false);
      }
    };

    fetchProducts();
  }, []);

  const openModalForProduct = async (product) => {
    setSelectedProd(product);
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
      if (Array.isArray(rows)) {
        rows.forEach((r) => {
          if (r.day) {
            const key = r.day.substring(0, 10);
            revenueMap[key] = parseFloat(r.netRevenue) || 0;
          }
        });
      }

      const daysInMonth = new Date(y, m, 0).getDate();
      const labels = [];
      const data   = [];

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
            backgroundColor: "rgba(56, 189, 248, 0.75)",
            hoverBackgroundColor: "#7dd3fc",
            borderColor: "#38bdf8",
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.8,
          },
        ],
      });
    } catch (err) {
      console.error(err);
      toast.error("Error fetching product revenue breakdown.");
    } finally {
      setLoadingChart(false);
    }
  };

  const handleSelectorChange = async (type, value) => {
    const nextY = type === "year" ? value : year;
    const nextM = type === "month" ? value : month;
    if (type === "year") setYear(value);
    if (type === "month") setMonth(value);

    if (selectedProduct) {
      await fetchChartData(selectedProduct.product_id, nextY, nextM);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1c2133",
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => ` Profit: ${currency_symbol || "$"}${Number(ctx.raw).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8", font: { size: 10 } },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
      y: {
        ticks: {
          color: "#94a3b8",
          font: { size: 10 },
          callback: (v) => `${currency_symbol || "$"}${v}`,
        },
        grid: { color: "rgba(255,255,255,0.06)" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="panel-card h-100">
      <div className="panel-card-header">
        <div className="panel-card-title">
          <MdShowChart className="panel-icon text-accent" />
          <div>
            <h3>Product Profit Breakdown</h3>
            <span className="text-muted text-sm">Select an individual item to view daily trajectory</span>
          </div>
        </div>
      </div>

      <div className="panel-card-body p-0">
        <div className="table-responsive" style={{ maxHeight: "330px", overflowY: "auto" }}>
          <table className="custom-table mb-0">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingProds ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    <div className="skeleton skeleton-text mx-auto w-75" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-muted">
                    No products in catalog.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.product_id}>
                    <td className="font-semibold">{p.name}</td>
                    <td>
                      <span className="badge badge-accent">{p.category || "General"}</span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openModalForProduct(p)}
                      >
                        <MdShowChart size={14} /> Analyze
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Breakdown */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        contentClassName="custom-modal-dark"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Daily Performance: {selectedProduct?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Controls */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="d-flex align-items-center gap-1">
              <MdCalendarToday className="text-muted" size={16} />
              <select
                className="form-control form-control-sm"
                value={month}
                onChange={(e) => handleSelectorChange("month", +e.target.value)}
                style={{ width: "110px" }}
              >
                {monthOptions.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <select
              className="form-control form-control-sm"
              value={year}
              onChange={(e) => handleSelectorChange("year", +e.target.value)}
              style={{ width: "90px" }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Chart Display */}
          {loadingChart ? (
            <div className="py-5 text-center">
              <div className="skeleton skeleton-title mx-auto mb-2" />
              <div className="skeleton skeleton-card mx-auto" />
            </div>
          ) : chartData ? (
            <div style={{ height: "300px", position: "relative" }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          ) : (
            <p className="text-muted text-center py-4">No profit records for this period.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProductEarningsOverview;
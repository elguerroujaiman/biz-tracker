import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";
import { toast } from "react-hot-toast";
import { useSettings } from "../../contexts/SettingsContext";
import { useNavigate } from "react-router-dom";
import { MdAdd, MdDelete, MdArrowBack } from "react-icons/md";

const PurchaseForm = ({ onPurchaseCreated, editPurchase }) => {
  const isStandalone          = !onPurchaseCreated;
  const navigate              = useNavigate();
  const { currency_symbol }   = useSettings();

  const [products, setProducts] = useState([]);
  const [items, setItems]       = useState([
    {
      product_id: "",
      product_name: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    },
  ]);
  const [note, setNote]       = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await authFetch("/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products list.");
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (editPurchase && Array.isArray(editPurchase.items) && products.length > 0) {
      setItems(
        editPurchase.items.map((item) => {
          const product = products.find((p) => p.product_id === item.product_id);
          const prc = parseFloat(item.unit_price || item.price || 0);
          return {
            product_id: item.product_id,
            product_name: product?.name || "",
            quantity: item.quantity,
            unit_price: prc,
            total_price: item.quantity * prc,
          };
        })
      );
      setNote(editPurchase.notes || editPurchase.note || "");
    }
  }, [editPurchase, products]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];

    if (field === "product_id") {
      const selectedProduct = products.find((p) => p.product_id === parseInt(value, 10));
      if (selectedProduct) {
        const price = parseFloat(selectedProduct.cost_price ?? selectedProduct.unit_price) || 0;
        updated[index] = {
          product_id: selectedProduct.product_id,
          product_name: selectedProduct.name,
          quantity: 1,
          unit_price: price,
          total_price: price,
        };
      } else {
        updated[index] = {
          product_id: "",
          product_name: "",
          quantity: 1,
          unit_price: 0,
          total_price: 0,
        };
      }
    } else if (field === "quantity") {
      const qty = parseInt(value, 10) || 0;
      updated[index].quantity = qty;
      updated[index].total_price = qty * (updated[index].unit_price || 0);
    } else if (field === "unit_price") {
      const prc = parseFloat(value) || 0;
      updated[index].unit_price = prc;
      updated[index].total_price = (updated[index].quantity || 0) * prc;
    }

    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        product_id: "",
        product_name: "",
        quantity: 1,
        unit_price: 0,
        total_price: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length === 1) {
      toast.error("A purchase order must contain at least one item.");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0);

  const handleSubmitPurchase = async (e) => {
    e?.preventDefault();

    const validItems = items.filter((item) => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Please select at least one valid product with quantity > 0.");
      return;
    }

    const purchaseData = {
      notes: note.trim(),
      items: validItems.map(({ product_id, quantity, unit_price }) => ({
        product_id: parseInt(product_id, 10),
        quantity: parseInt(quantity, 10),
        price: parseFloat(unit_price),
      })),
    };

    setLoading(true);
    try {
      const response = await authFetch("/purchases", {
        method: "POST",
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Purchase order recording failed.");
      }

      toast.success("Purchase recorded & inventory stock increased!");

      if (typeof onPurchaseCreated === "function") {
        onPurchaseCreated();
      } else {
        navigate("/purchases");
      }
    } catch (err) {
      console.error("Error creating purchase:", err);
      toast.error(err.message || "Could not record purchase.");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmitPurchase}>
      {/* Line Items Table */}
      <div className="table-responsive mb-4">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Product Selection</th>
              <th style={{ width: "20%" }}>Quantity Procured</th>
              <th style={{ width: "20%" }}>Unit Cost ({currency_symbol || "$"})</th>
              <th style={{ width: "20%" }}>Line Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td>
                  <select
                    className="form-control form-control-sm"
                    value={item.product_id}
                    onChange={(e) => handleItemChange(i, "product_id", e.target.value)}
                    required
                  >
                    <option value="">-- Choose a Product --</option>
                    {products.map((p) => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.name} (Current Stock: {p.total_quantity})
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    className="form-control form-control-sm text-center"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control form-control-sm"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(i, "unit_price", e.target.value)}
                    required
                  />
                </td>
                <td className="font-mono font-semibold">
                  {currency_symbol || "$"}{Number(item.total_price || 0).toFixed(2)}
                </td>
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-danger"
                    onClick={() => removeItem(i)}
                    title="Remove item"
                  >
                    <MdDelete size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleAddItem}
        >
          <MdAdd size={16} /> Add Another Line Item
        </button>

        <div className="text-end">
          <span className="text-muted text-sm mr-2">Total Procurement Spend: </span>
          <span className="font-mono font-bold text-accent" style={{ fontSize: "1.375rem" }}>
            {currency_symbol || "$"}{grandTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Supplier Note */}
      <div className="form-group mb-4">
        <label className="form-label">Supplier / Order Note (Optional)</label>
        <textarea
          rows={2}
          className="form-control"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="modal-footer px-0 pb-0">
        {isStandalone ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/purchases")}
            disabled={loading}
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || grandTotal <= 0}
        >
          {loading ? <span className="auth-spinner" /> : "Record Purchase & Update Stock"}
        </button>
      </div>
    </form>
  );

  if (isStandalone) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <button
              className="btn btn-secondary btn-sm mb-2"
              onClick={() => navigate("/purchases")}
            >
              <MdArrowBack /> Back to Purchases
            </button>
            <h1 className="page-title">Record New Purchase Order</h1>
            <p className="page-subtitle">Restock inventory and record procurement expenditures.</p>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-card-body">{formContent}</div>
        </div>
      </div>
    );
  }

  return formContent;
};

export default PurchaseForm;

import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";
import { toast } from "react-hot-toast";
import { useSettings } from "../../contexts/SettingsContext";

function ProductForm({ product, onClose }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    unit_price: "",
    cost_price: "",
    total_quantity: "",
    low_stock_threshold: "",
  });
  const [loading, setLoading]       = useState(false);
  const [initialForm, setInitialForm] = useState(null);
  const { currency_symbol }         = useSettings();

  useEffect(() => {
    if (product) {
      const productData = {
        name: product.name || "",
        category: product.category || "",
        unit_price: product.unit_price ?? "",
        cost_price: product.cost_price ?? product.unit_price ?? "",
        total_quantity: product.total_quantity ?? "",
        low_stock_threshold: product.low_stock_threshold ?? 5,
      };

      setForm(productData);
      setInitialForm(productData);
    }
  }, [product]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const price = parseFloat(form.unit_price);
    const costPrice = parseFloat(form.cost_price);
    const quantity = parseInt(form.total_quantity, 10);
    const threshold = parseInt(form.low_stock_threshold, 10);

    if (isNaN(price) || price < 0) {
      toast.error("Selling price must be a valid non-negative number.");
      return;
    }

    if (isNaN(costPrice) || costPrice < 0) {
      toast.error("Cost price must be a valid non-negative number.");
      return;
    }

    if (isNaN(quantity) || quantity < 0) {
      toast.error("Total quantity must be a non-negative integer.");
      return;
    }

    if (isNaN(threshold) || threshold < 0) {
      toast.error("Low stock threshold must be a non-negative integer.");
      return;
    }

    if (product && initialForm) {
      const noChanges = Object.keys(initialForm).every(
        (key) => String(form[key]) === String(initialForm[key])
      );

      if (noChanges) {
        toast.error("No changes were made to the product.");
        return;
      }
    }

    setLoading(true);
    try {
      const method = product ? "PUT" : "POST";
      const url = product ? `/products/${product.product_id}` : "/products";

      const res = await authFetch(url, {
        method,
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category.trim(),
          unit_price: price,
          cost_price: costPrice,
          total_quantity: quantity,
          low_stock_threshold: threshold,
        }),
      });

      if (res.ok) {
        onClose(true, Boolean(product));
      } else {
        const errorData = await res.json();
        if (res.status === 409) {
          toast.error("A product with this name already exists in your catalog.");
        } else {
          toast.error(errorData.error || errorData.message || "Failed to save product.");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save product. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form-container">
      <div className="form-group mb-3">
        <label htmlFor="prod-name" className="form-label">
          Product Name <span className="text-danger">*</span>
        </label>
        <input
          id="prod-name"
          type="text"
          name="name"
          className="form-control"
          value={form.name}
          onChange={handleChange}
          autoComplete="off"
          required
        />
      </div>

      <div className="form-group mb-3">
        <label htmlFor="prod-category" className="form-label">
          Category <span className="text-danger">*</span>
        </label>
        <input
          id="prod-category"
          type="text"
          name="category"
          className="form-control"
          value={form.category}
          onChange={handleChange}
          autoComplete="off"
          required
        />
      </div>

      <div className="grid grid-3 gap-3 mb-4">
        <div className="form-group">
          <label htmlFor="prod-price" className="form-label">
            Selling Price ({currency_symbol || "$"}) <span className="text-danger">*</span>
          </label>
          <input
            id="prod-price"
            type="number"
            name="unit_price"
            className="form-control"
            value={form.unit_price}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="prod-cost-price" className="form-label">
            Cost Price ({currency_symbol || "$"}) <span className="text-danger">*</span>
          </label>
          <input
            id="prod-cost-price"
            type="number"
            name="cost_price"
            className="form-control"
            value={form.cost_price}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="prod-quantity" className="form-label">
            Initial Quantity <span className="text-danger">*</span>
          </label>
          <input
            id="prod-quantity"
            type="number"
            name="total_quantity"
            className="form-control"
            value={form.total_quantity}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="prod-threshold" className="form-label">
            Alert Threshold <span className="text-danger">*</span>
          </label>
          <input
            id="prod-threshold"
            type="number"
            name="low_stock_threshold"
            className="form-control"
            value={form.low_stock_threshold}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />
        </div>
      </div>

      <div className="modal-footer px-0 pb-0">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onClose(false)}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <span className="auth-spinner" />
          ) : product ? (
            "Save Changes"
          ) : (
            "Create Product"
          )}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;

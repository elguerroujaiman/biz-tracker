import React, { useEffect, useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { authFetch } from "../../utils/api";
import { toast } from "react-hot-toast";

function ProductForm({ product, onClose }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    unit_price: "",
    total_quantity: "",
    low_stock_threshold: ""
  });
  const [loading, setLoading] = useState(false);

  const [initialForm, setInitialForm] = useState(null);

  useEffect(() => {
    if (product) {
      const productData = {
        name: product.name,
        category: product.category,
        unit_price: product.unit_price,
        total_quantity: product.total_quantity,
        low_stock_threshold: product.low_stock_threshold ?? ""  // Fallback if null
      };

      setForm(productData);
      setInitialForm(productData); // Save original values
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
    const quantity = parseFloat(form.total_quantity);
  
    if (price < 0 || quantity < 0) {
      toast.error("Price and total quantity must not be negative.");
      return;
    }
  
    if (product && initialForm) {
      const noChanges = Object.keys(initialForm).every(
        (key) => String(form[key]) === String(initialForm[key])
      );
  
      if (noChanges) {
        toast.error("No changes detected.");
        return;
      }
    }
  
    setLoading(true);
    try {
      const method = product ? "PUT" : "POST";
      const url = product ? `/products/${product.product_id}` : "/products";
  
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
  
      if (res.ok) {
        onClose(true);
      } else {
        const errorData = await res.json();
  
        // ✅ Specific error for duplicate product name
        if (res.status === 409) {
          toast.error("A product with this name already exists.");
        } else {
          toast.error(errorData.message || "Failed to save product.");
        }
  
        console.error("Save error:", errorData);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose(false); // <--- Just close without refreshing or showing success toast
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3" controlId="name">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="custom-input"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="category">
        <Form.Label>Category</Form.Label>
        <Form.Control
          type="text"
          name="category"
          value={form.category}
          onChange={handleChange}
          className="custom-input"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="unit_price">
        <Form.Label>Unit Price</Form.Label>
        <Form.Control
          type="number"
          name="unit_price"
          value={form.unit_price}
          onChange={handleChange}
          className="custom-input"
          step="0.01"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="total_quantity">
        <Form.Label>Total Quantity</Form.Label>
        <Form.Control
          type="number"
          name="total_quantity"
          value={form.total_quantity}
          onChange={handleChange}
          className="custom-input"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="low_stock_threshold">
        <Form.Label>Low Stock Threshold</Form.Label>
        <Form.Control
          type="number"
          name="low_stock_threshold"
          value={form.low_stock_threshold}
          onChange={handleChange}
          className="custom-input"
          required
        />
      </Form.Group>

      <div className="d-flex justify-content-end">
        <Button variant="secondary" onClick={handleCancel} className="me-2" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : product ? "Update" : "Create"}
        </Button>
      </div>
    </Form>
  );
}

export default ProductForm;
import React, { useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import { authFetch } from "../../utils/api";

function ProductForm({ product, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit_price: "",
    total_quantity: "",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        unit_price: product.unit_price,
        total_quantity: product.total_quantity,
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = product ? `/products/${product.product_id}` : "/products";
    const method = product ? "PUT" : "POST";

    try {
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to save product");
      }

      onClose(); // Close modal and refresh list
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Something went wrong while saving the product.");
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3" controlId="name">
        <Form.Label>Product Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter product name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="category">
        <Form.Label>Category</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter category"
          name="category"
          value={formData.category}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="unit_price">
        <Form.Label>Unit Price</Form.Label>
        <Form.Control
          type="number"
          name="unit_price"
          value={formData.unit_price}
          onChange={handleChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="total_quantity">
        <Form.Label>Total Quantity</Form.Label>
        <Form.Control
          type="number"
          name="total_quantity"
          value={formData.total_quantity}
          onChange={handleChange}
          required
        />
      </Form.Group>

      <div className="d-flex justify-content-end">
        <Button variant="secondary" onClick={onClose} className="me-2">
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {product ? "Update" : "Add"}
        </Button>
      </div>
    </Form>
  );
}

export default ProductForm;
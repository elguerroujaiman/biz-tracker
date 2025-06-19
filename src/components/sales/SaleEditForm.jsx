import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { authFetch } from "../../utils/api";
import { useSettings } from "../../contexts/SettingsContext";

const SaleEditForm = ({ saleId, onClose, onUpdated }) => {
  const [note, setNote] = useState("");
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const { currency_symbol, loading: settingsLoading } = useSettings();

  useEffect(() => {
    const fetchSaleAndProducts = async () => {
      const [saleRes, productsRes] = await Promise.all([
        authFetch(`/sales/${saleId}`),
        authFetch("/products")
      ]);

      const saleData = await saleRes.json();
      const productsData = await productsRes.json();

      setNote(saleData.note || "");
      setItems(saleData.items || []);
      setProducts(productsData || []);
    };

    fetchSaleAndProducts();
  }, [saleId]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];

    if (field === "product_id") {
      const selectedProduct = products.find(p => p.product_id === parseInt(value));
      if (selectedProduct) {
        updated[index] = {
          product_id: selectedProduct.product_id,
          product_name: selectedProduct.name,
          quantity: 1,
          unit_price: parseFloat(selectedProduct.unit_price),
          total_price: parseFloat(selectedProduct.unit_price),
        };
      }
    } else {
      updated[index][field] = field === "quantity" || field === "unit_price"
        ? parseFloat(value)
        : value;

      updated[index].total_price = updated[index].quantity * updated[index].unit_price;
    }

    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
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
        total_price: 0
      }
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = {
      note,
      items: items.map(({ product_id, quantity, unit_price }) => ({
        product_id,
        quantity,
        unit_price,
      })),
    };

    const res = await authFetch(`/sales/${saleId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    if (res.ok) {
      onUpdated();
      onClose();
    } else {
      alert("Failed to update sale");
    }
  };

  return (
    <Modal show onHide={onClose} size="lg" contentClassName="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Edit Sale {saleId}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Note</Form.Label>
            <Form.Control
              type="text"
              value={note}
              className="custom-input"
              onChange={(e) => setNote(e.target.value)}
            />
          </Form.Group>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>
                    <Form.Select
                      value={item.product_id}
                      onChange={(e) =>
                        handleItemChange(i, "product_id", e.target.value)
                      }
                      className="custom-input"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p.product_id} value={p.product_id}>
                          {p.name}
                        </option>
                      ))}
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(i, "quantity", e.target.value)
                      }
                      min={1}
                      className="custom-input"
                      required
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleItemChange(i, "unit_price", e.target.value)
                      }
                      min={0}
                      className="custom-input"
                      step="0.01"
                      required
                    />
                  </td>
                  <td>{(item.total_price || 0).toFixed(2)}{currency_symbol}</td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveItem(i)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button variant="success" size="sm" onClick={handleAddItem}>
            + Add Item
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save Changes</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SaleEditForm;
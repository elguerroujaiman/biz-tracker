import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { authFetch } from "../../utils/api";

const PurchaseEditForm = ({ purchaseId, onClose, onUpdated }) => {
  const [notes, setNote] = useState("");
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!purchaseId) return;

    const fetchPurchaseAndProducts = async () => {
      try {
        setLoading(true);

        const [purchaseRes, productsRes] = await Promise.all([
          authFetch(`/purchases/${purchaseId}`),
          authFetch("/products")
        ]);
        const purchaseData = await purchaseRes.json();
        const productsData = await productsRes.json();

        setNote(purchaseData.notes || "");
        setItems(
          typeof purchaseData.items === "string"
            ? JSON.parse(purchaseData.items)
            : purchaseData.items || []
        );
        setProducts(productsData || []);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseAndProducts();
  }, [purchaseId]);

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
      notes,
      items: items.map(({ product_id, quantity, unit_price }) => ({
        product_id,
        quantity,
        price: unit_price,
      })),
    };

    const res = await authFetch(`/purchases/${purchaseId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    if (res.ok) {
      onUpdated();
      onClose();
    } else {
      alert("Failed to update purchase");
    }
  };

  if (!purchaseId) return null;

  return (
    <Modal show onHide={onClose} size="lg" contentClassName="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Edit Purchase {purchaseId}</Modal.Title>
      </Modal.Header>
      {loading ? (
        <Modal.Body className="text-center">
          <Spinner animation="border" variant="primary" />
        </Modal.Body>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Note</Form.Label>
              <Form.Control
                type="text"
                value={notes}
                onChange={(e) => setNote(e.target.value)}
                className="custom-input"
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
                        className="custom-input"
                        min={1}
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
                    <td>${(item.total_price || 0).toFixed(2)}</td>
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
      )}
    </Modal>
  );
};

export default PurchaseEditForm;
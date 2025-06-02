import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { authFetch } from "../../utils/api";

const PurchaseForm = ({ show, onHide, onPurchaseCreated, editPurchase }) => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await authFetch("/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (editPurchase) {
      setItems(editPurchase.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.unit_price
      })));
      setNotes(editPurchase.notes || "");
    } else {
      setItems([]);
      setNotes("");
    }
  }, [editPurchase]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = field === "quantity" || field === "price" ? parseFloat(value) : value;
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Please add at least one item.");
      return;
    }

    const payload = {
      items,
      notes
    };

    try {
      const res = await authFetch("/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onPurchaseCreated();
        onHide();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to create purchase.");
      }
    } catch (err) {
      console.error("Error creating purchase:", err);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{editPurchase ? "Edit Purchase" : "New Purchase"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {items.map((item, index) => (
            <Row key={index} className="mb-3">
              <Col md={5}>
                <Form.Select
                  value={item.product_id}
                  onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Control
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  required
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, "price", e.target.value)}
                  required
                />
              </Col>
              <Col md={1}>
                <Button variant="danger" onClick={() => removeItem(index)}>
                  &times;
                </Button>
              </Col>
            </Row>
          ))}
          <Button variant="secondary" onClick={addItem}>
            Add Item
          </Button>
          <Form.Group className="mt-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {editPurchase ? "Update Purchase" : "Create Purchase"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PurchaseForm;
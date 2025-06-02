import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Table } from "react-bootstrap";
import { authFetch } from "../../utils/api";

const SaleEditForm = ({ saleId, onClose, onUpdated }) => {
  const [note, setNote] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchSale = async () => {
      const res = await authFetch(`/sales/${saleId}`);
      const data = await res.json();
      setNote(data.note || "");
      setItems(data.items || []);
    };
    fetchSale();
  }, [saleId]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === "quantity" || field === "unit_price"
      ? parseFloat(value)
      : value;
    updated[index].total_price = updated[index].quantity * updated[index].unit_price;
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {
      note,
      items: items.map(({ product_id, quantity, unit_price }) => ({
        product_id,
        quantity,
        unit_price
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
    <Modal show onHide={onClose}>
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
              onChange={(e) => setNote(e.target.value)}
            />
          </Form.Group>
          <Table striped bordered size="sm">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.product_id}>
                  <td>{item.product_name}</td>
                  <td>
                    <Form.Control
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
                      min={1}
                      required
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(i, "unit_price", e.target.value)}
                      min={0}
                      step="0.01"
                      required
                    />
                  </td>
                  <td>${(item.total_price || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
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
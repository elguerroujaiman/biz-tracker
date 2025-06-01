import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";
import { Form, Button, Table } from "react-bootstrap";
import { toast } from "react-hot-toast";

const SaleForm = ({ onSaleCreated }) => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [saleItems, setSaleItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await authFetch("/products");
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      }
    };
    fetchProducts();
  }, []);

  const handleAddItem = () => {
    if (!selectedProductId || Number(unitPrice) <= 0 || Number(quantity) <= 0) {
      toast.error("Please select a product and provide valid unit price and quantity.");
      return;
    }

    const product = products.find((p) => p.product_id === Number(selectedProductId));
    const newItem = {
      product_id: Number(selectedProductId),
      product_name: product?.name,
      unit_price: Number(unitPrice),
      quantity: Number(quantity),
    };

    setSaleItems((prev) => [...prev, newItem]);
    setSelectedProductId("");
    setUnitPrice("");
    setQuantity("");
  };

  const handleSubmitSale = async () => {
    if (saleItems.length === 0) {
      toast.error("You must add at least one item to create a sale.");
      return;
    }

    const saleData = {
      note,
      items: saleItems,
    };

    try {
      setLoading(true);
      const response = await authFetch("/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        throw new Error("Sale creation failed");
      }

      toast.success("Sale created successfully!");
      onSaleCreated();
    } catch (err) {
      console.error("Error creating sale:", err);
      toast.error("Could not create sale.");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (index) => {
    setSaleItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <h5>Add Item to Sale</h5>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Product</Form.Label>
          <Form.Select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">-- Select a product --</option>
            {products.map((product) => (
              <option key={product.product_id} value={product.product_id}>
                {product.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Unit Price</Form.Label>
          <Form.Control
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            min="0"
            step="0.01"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Quantity</Form.Label>
          <Form.Control
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0"
          />
        </Form.Group>

        <Button variant="secondary" type="button" onClick={handleAddItem}>
          Add Item
        </Button>
      </Form>

      {saleItems.length > 0 && (
        <>
          <h5 className="mt-4">Sale Items</h5>
          <Table striped bordered>
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {saleItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_name}</td>
                  <td>${item.unit_price.toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td>${(item.unit_price * item.quantity).toFixed(2)}</td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      {/* Note & Submit */}
      <Form.Group className="mb-3 mt-3">
        <Form.Label>Note</Form.Label>
        <Form.Control
          type="text"
          placeholder="Optional note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Form.Group>

      <Button variant="primary" onClick={handleSubmitSale} disabled={loading}>
        {loading ? "Submitting..." : "Add Sale"}
      </Button>
    </>
  );
};

export default SaleForm;
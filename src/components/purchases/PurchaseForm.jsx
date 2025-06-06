import React, { useEffect, useState } from "react";
import { authFetch } from "../../utils/api";
import { Form, Button } from "react-bootstrap";
import { toast } from "react-hot-toast";

const PurchaseForm = ({ onPurchaseCreated, editPurchase }) => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([
    {
      product_id: "",
      product_name: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    },
  ]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await authFetch("/products");
        const data = await response.json();
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (editPurchase) {
      setItems(
        editPurchase.items.map((item) => {
          const product = products.find(p => p.product_id === item.product_id);
          return {
            product_id: item.product_id,
            product_name: product?.name || "",
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
          };
        })
      );
      setNote(editPurchase.note || "");
    }
  }, [editPurchase, products]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];

    if (field === "product_id") {
      const selectedProduct = products.find(p => p.product_id === parseInt(value));
      if (selectedProduct) {
        updated[index] = {
          product_id: selectedProduct.product_id,
          product_name: selectedProduct.name,
          quantity: 1,
          unit_price: parseFloat(selectedProduct.unit_price || 0),
          total_price: parseFloat(selectedProduct.unit_price || 0),
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
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitPurchase = async () => {
    if (items.length === 0) {
      toast.error("You must add at least one item to create a purchase.");
      return;
    }
  
    const purchaseData = {
      notes: note,
      items: items.map(({ product_id, quantity, unit_price }) => ({
        product_id: parseInt(product_id),
        quantity,
        price: unit_price,
      })),
    };
  
    try {
      setLoading(true);
      const response = await authFetch("/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseData),
      });
  
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Purchase creation failed");
      }
  
      toast.success("Purchase created successfully!");
      onPurchaseCreated();
  
      // Reset form
      setItems([
        {
          product_id: "",
          product_name: "",
          quantity: 1,
          unit_price: 0,
          total_price: 0,
        },
      ]);
      setNote("");
    } catch (err) {
      console.error("Error creating purchase:", err);
      toast.error(`Could not create purchase: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form>
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
                    onChange={(e) => handleItemChange(i, "product_id", e.target.value)}
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
                    onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
                    min={1}
                    className="custom-input"
                    required
                  />
                </td>
                <td>
                  <Form.Control
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(i, "unit_price", e.target.value)}
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
                    onClick={() => removeItem(i)}
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

        <Form.Group className="mb-3 mt-3">
          <Form.Label>Note</Form.Label>
          <Form.Control
            type="text"
            placeholder="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="custom-input"
          />
        </Form.Group>

        <Button variant="primary" onClick={handleSubmitPurchase} disabled={loading}>
          {loading ? "Submitting..." : editPurchase ? "Update Purchase" : "Add Purchase"}
        </Button>
      </Form>
    </>
  );
};

export default PurchaseForm;
import React, { useState } from "react";
import { authFetch } from "../../utils/api";
import { toast } from "react-hot-toast"; // <-- ADDED this import

const SaleForm = ({ onSaleCreated }) => {
  const [items, setItems] = useState([]);
  const [note, setNote] = useState("");
  const [product_id, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit_price, setUnitPrice] = useState("");
  const [editIndex, setEditIndex] = useState(null);

  const addItem = () => {
    if (!product_id || !quantity || !unit_price) {
      toast.error("Please fill all item fields before adding.");
      return;
    }

    const newItem = {
      product_id,
      quantity: parseInt(quantity),
      unit_price: parseFloat(unit_price),
    };

    if (editIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editIndex] = newItem;
      setItems(updatedItems);
      setEditIndex(null);
    } else {
      setItems([...items, newItem]);
    }

    setProductId("");
    setQuantity("");
    setUnitPrice("");
  };

  const handleEdit = (index) => {
    const item = items[index];
    setProductId(item.product_id);
    setQuantity(item.quantity);
    setUnitPrice(item.unit_price);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (items.length === 0) {
      toast.error("Please add at least one item to the sale.");
      return;
    }

    const saleData = { items, note };

    try {
      const response = await authFetch("/sales", {
        method: "POST",
        body: JSON.stringify(saleData),
      });

      if (response.ok) {
        setItems([]);
        setNote("");
        setProductId("");
        setQuantity("");
        setUnitPrice("");
        setEditIndex(null);

        toast.success("Sale created successfully!");

        if (onSaleCreated) {
          onSaleCreated(); // trigger refresh from parent
        }
      } else {
        console.error("Failed to create sale:", await response.text());
        toast.error("Failed to create sale.");
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error("Error creating sale.");
    }
  };

  return (
    <div
      style={{
        margin: "2rem 0",
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h2 style={{ marginBottom: "1rem" }}>Create Sale</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Product ID:</label>
          <input
            type="text"
            value={product_id}
            onChange={(e) => setProductId(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.5rem",
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Quantity:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.5rem",
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Unit Price:</label>
          <input
            type="number"
            value={unit_price}
            onChange={(e) => setUnitPrice(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.5rem",
            }}
          />
        </div>

        <button
          type="button"
          onClick={addItem}
          style={{
            backgroundColor: editIndex !== null ? "#FFC107" : "#2196F3",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginBottom: "1rem",
          }}
        >
          {editIndex !== null ? "Update Item" : "Add Item"}
        </button>

        <div style={{ marginBottom: "1rem" }}>
          <label>Note:</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.5rem",
            }}
          ></textarea>
        </div>

        <button
          type="submit"
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "0.75rem 1.5rem",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Create Sale
        </button>
      </form>

      <h3 style={{ marginTop: "2rem" }}>Sale Items</h3>
      <ul>
        {items.map((item, index) => (
          <li key={index} style={{ marginBottom: "0.5rem" }}>
            Product ID: {item.product_id}, Quantity: {item.quantity}, Unit Price: {item.unit_price}
            <div style={{ marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => handleEdit(index)}
                style={{
                  marginRight: "0.5rem",
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "#FFC107",
                  color: "#333",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(index)}
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "#F44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {items.length > 0 && (
        <div style={{ marginTop: "1rem", fontWeight: "bold" }}>
          Total Sale Amount: $
          {items
            .reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
            .toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default SaleForm;
import React, { useState, useEffect } from "react";
import { authFetch } from "../../utils/api";
import { toast } from "react-hot-toast";

const PurchaseForm = ({ onPurchaseCreated }) => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await authFetch("/products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };

    fetchProducts();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { product_id: "", quantity: 1, price: 0 }]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = field === "quantity" || field === "price" ? Number(value) : value;
    setItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await authFetch("/purchases", {
        method: "POST",
        body: JSON.stringify({ items, notes }),
      });

      if (!response.ok) {
        throw new Error("Failed to create purchase");
      }

      toast.success("Purchase created successfully!");
      setItems([]);
      setNotes("");
      onPurchaseCreated();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create purchase.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>New Purchase</h3>
      {items.map((item, index) => (
        <div key={index} className="mb-2">
          <select
            value={item.product_id}
            onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
            required
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Quantity"
            value={item.quantity}
            min="1"
            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={item.price}
            min="0"
            step="0.01"
            onChange={(e) => handleItemChange(index, "price", e.target.value)}
            required
          />
        </div>
      ))}
      <button type="button" onClick={handleAddItem}>
        Add Item
      </button>
      <br />
      <textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="form-control mt-2"
      />
      <button type="submit" className="btn btn-success mt-2">
        Submit Purchase
      </button>
    </form>
  );
};

export default PurchaseForm;
import React, { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { authFetch } from "../../utils/api";
import { toast } from "react-hot-toast";
import { useSettings } from "../../contexts/SettingsContext";
import { MdAdd, MdDelete } from "react-icons/md";

const SaleEditForm = ({ saleId, onClose, onUpdated }) => {
  const [note, setNote]         = useState("");
  const [items, setItems]       = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  const { currency_symbol } = useSettings();

  useEffect(() => {
    if (!saleId) return;

    const fetchSaleAndProducts = async () => {
      try {
        setLoading(true);
        const [saleRes, productsRes] = await Promise.all([
          authFetch(`/sales/${saleId}`),
          authFetch("/products"),
        ]);

        const saleData = await saleRes.json();
        const productsData = await productsRes.json();

        setNote(saleData.note || "");
        setItems(
          Array.isArray(saleData.items)
            ? saleData.items.map((it) => ({
                product_id: it.product_id,
                product_name: it.product_name,
                quantity: it.quantity,
                unit_price: parseFloat(it.unit_price) || 0,
                total_price: parseFloat(it.total_price) || 0,
              }))
            : []
        );
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        console.error("Failed to load sale edit data:", err);
        toast.error("Failed to load sale details.");
      } finally {
        setLoading(false);
      }
    };

    fetchSaleAndProducts();
  }, [saleId]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];

    if (field === "product_id") {
      const selected = products.find((p) => p.product_id === parseInt(value, 10));
      if (selected) {
        const prc = parseFloat(selected.unit_price) || 0;
        updated[index] = {
          product_id: selected.product_id,
          product_name: selected.name,
          quantity: 1,
          unit_price: prc,
          total_price: prc,
        };
      }
    } else if (field === "quantity") {
      const qty = parseInt(value, 10) || 0;
      updated[index].quantity = qty;
      updated[index].total_price = qty * (updated[index].unit_price || 0);
    } else if (field === "unit_price") {
      const prc = parseFloat(value) || 0;
      updated[index].unit_price = prc;
      updated[index].total_price = (updated[index].quantity || 0) * prc;
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

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      toast.error("A sale must contain at least one line item.");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0);

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const validItems = items.filter((it) => it.product_id && it.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Please ensure all items have a selected product and quantity > 0.");
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch(`/sales/${saleId}`, {
        method: "PUT",
        body: JSON.stringify({
          note: note.trim(),
          items: validItems.map(({ product_id, quantity, unit_price }) => ({
            product_id: parseInt(product_id, 10),
            quantity: parseInt(quantity, 10),
            unit_price: parseFloat(unit_price),
          })),
        }),
      });

      if (res.ok) {
        toast.success(`Sale #${saleId} updated successfully.`);
        onUpdated();
        onClose();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to update sale.");
      }
    } catch (err) {
      console.error("Sale update error:", err);
      toast.error("Could not update sale.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      show
      onHide={onClose}
      size="lg"
      centered
      contentClassName="custom-modal-dark"
    >
      <Modal.Header closeButton>
        <Modal.Title>Edit Sale #{saleId}</Modal.Title>
      </Modal.Header>
      {loading ? (
        <Modal.Body className="text-center py-5">
          <div className="skeleton skeleton-title mx-auto mb-2" />
          <div className="skeleton skeleton-card mx-auto" />
        </Modal.Body>
      ) : (
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="form-group mb-3">
              <label className="form-label">Note / Customer Memo</label>
              <input
                type="text"
                value={note}
                className="form-control"
                placeholder="Sale notes"
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="table-responsive mb-3">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ width: "15%" }}>Quantity</th>
                    <th style={{ width: "20%" }}>Sale Price</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <select
                          value={item.product_id}
                          onChange={(e) => handleItemChange(i, "product_id", e.target.value)}
                          className="form-control form-control-sm"
                          required
                        >
                          <option value="">-- Select Product --</option>
                          {products.map((p) => (
                            <option key={p.product_id} value={p.product_id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm text-center"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control form-control-sm"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(i, "unit_price", e.target.value)}
                          required
                        />
                      </td>
                      <td className="font-mono font-semibold">
                        {currency_symbol || "$"}{Number(item.total_price || 0).toFixed(2)}
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-danger"
                          onClick={() => handleRemoveItem(i)}
                          title="Remove item"
                        >
                          <MdDelete size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItem}
              >
                <MdAdd size={16} /> Add Item
              </button>

              <div className="text-end">
                <span className="text-muted text-sm mr-2">Updated Total: </span>
                <span className="font-mono font-bold text-accent" style={{ fontSize: "1.25rem" }}>
                  {currency_symbol || "$"}{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving || grandTotal <= 0}>
              {saving ? "Saving..." : "Save Modifications"}
            </Button>
          </Modal.Footer>
        </form>
      )}
    </Modal>
  );
};

export default SaleEditForm;
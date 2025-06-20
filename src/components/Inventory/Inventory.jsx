import React, { useEffect, useState } from "react";
import ProductForm from "./ProductForm";
import { Button, Modal, Form, InputGroup, Dropdown } from "react-bootstrap";
import { authFetch } from "../../utils/api";
import { toast } from "react-hot-toast";
import { useSettings } from "../../contexts/SettingsContext";

function Inventory() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { currency_symbol, loading: settingsLoading } = useSettings();
  
  const sortOptions = [
    { label: "Name", value: "name" },
    { label: "Category", value: "category" },
    { label: "Quantity", value: "total_quantity" },
    { label: "Unit Price", value: "unit_price" },
    { label: "Created At", value: "created_at" },
    { label: "Updated At", value: "updated_at" },
  ];

  const fetchProducts = async () => {
    try {
      const res = await authFetch(`/products?sortBy=${sortBy}&sortOrder=${sortOrder}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error("Unexpected response format:", data);
        toast.error("Unexpected server response.");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [sortBy, sortOrder]);

  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];

      if (valA == null || valB == null) return 0;

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    setFilteredProducts(filtered);
  }, [searchTerm, products, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const requestDelete = (id) => {
    setDeleteId(id);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    try {
      const response = await authFetch(`/products/${deleteId}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Product deleted successfully!");
        fetchProducts();
      } else {
        toast.error("Failed to delete product.");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Error deleting product.");
    } finally {
      setConfirmDelete(false);
      setDeleteId(null);
    }
  };

  const handleCloseForm = (refresh = false, isEdit = false) => {
    setShowForm(false);
    setEditingProduct(null);
    if (refresh) {
      fetchProducts();
      toast.success(isEdit ? "Product updated successfully!" : "Product added successfully!");
    }
  };

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 style={{ fontWeight: "bold" }}>Inventory</h2>
        <Button onClick={() => setShowForm(true)}>+ Add Product</Button>
      </div>

      {/* Search and Sort Bar */}
      <div className="d-flex mb-3 gap-2 align-items-center">
        <InputGroup className="flex-grow-1">
          <Form.Control
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="custom-input"
          />
        </InputGroup>

        <Dropdown>
          <Dropdown.Toggle variant="outline-primary" id="dropdown-sort">
            Sort By: {sortOptions.find((opt) => opt.value === sortBy)?.label}
            {sortOrder === "asc" ? " ↓" : " ↑" }
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {sortOptions.map((option) => (
              <Dropdown.Item key={option.value} onClick={() => toggleSort(option.value)}>
                {option.label}
                {sortBy === option.value &&
                  (sortOrder === "asc" ? " ↓" : " ↑")}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Unit Price</th>
            <th>Total Quantity</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <tr key={product.product_id}>
                <td>{product.product_id}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{product.unit_price}{currency_symbol}</td>
                <td className={product.total_quantity <= product.low_stock_threshold ? "low-stock" : ""}>
                  {product.total_quantity}
                </td>
                <td>{new Date(product.created_at).toLocaleString("en-GB")}</td>
                <td>{new Date(product.updated_at).toLocaleString("en-GB")}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => handleEdit(product)}
                    className="me-2"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => requestDelete(product.product_id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Add/Edit Form Modal */}
      <Modal show={showForm} onHide={() => handleCloseForm(false)} size="lg" contentClassName="custom-modal">
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? "Edit Product" : "Add Product"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProductForm
            product={editingProduct}
            onClose={(refresh) => handleCloseForm(refresh, !!editingProduct)}
          />
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={confirmDelete} onHide={() => setConfirmDelete(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this product?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Inventory;
import React, { useEffect, useState, useMemo, useCallback } from "react";
import ProductForm from "./ProductForm";
import { Modal, Button } from "react-bootstrap";
import { authFetch } from "../../utils/api";
import { toast } from "react-hot-toast";
import { useSettings } from "../../contexts/SettingsContext";
import {
  MdAdd,
  MdSearch,
  MdEdit,
  MdDelete,
  MdInventory2,
  MdWarningAmber,
  MdCheckCircle,
  MdArrowUpward,
  MdArrowDownward,
  MdClose
} from "react-icons/md";

function Inventory() {
  const [products, setProducts]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState("");
  const [selectedCategory, setSelectedCat]  = useState("All");
  const [sortBy, setSortBy]                 = useState("name");
  const [sortOrder, setSortOrder]           = useState("asc");
  const [showForm, setShowForm]             = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete]   = useState(false);
  const [deleteProduct, setDeleteProduct]   = useState(null);

  const { currency_symbol } = useSettings();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/products?sortBy=${sortBy}&order=${sortOrder}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        const normalized = data.map((p) => ({
          ...p,
          unit_price: Number(p.unit_price) || 0,
          cost_price: Number(p.cost_price ?? p.unit_price) || 0,
          total_quantity: Number(p.total_quantity) || 0,
          low_stock_threshold: Number(p.low_stock_threshold) || 0,
        }));
        setProducts(normalized);
      } else {
        toast.error("Unexpected server response format.");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [products]);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== "All") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          String(p.product_id).includes(q)
      );
    }

    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return list;
  }, [products, selectedCategory, searchTerm, sortBy, sortOrder]);

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

  const requestDelete = (product) => {
    setDeleteProduct(product);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      const response = await authFetch(`/products/${deleteProduct.product_id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success(`"${deleteProduct.name}" deleted successfully.`);
        fetchProducts();
      } else {
        const err = await response.json();
        toast.error(err.error || err.message || "Failed to delete product.");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Error deleting product.");
    } finally {
      setConfirmDelete(false);
      setDeleteProduct(null);
    }
  };

  const handleCloseForm = (refresh = false, isEdit = false) => {
    setShowForm(false);
    setEditingProduct(null);
    if (refresh) {
      fetchProducts();
      toast.success(isEdit ? "Product updated successfully!" : "Product added to catalog!");
    }
  };

  const getStockBadge = (product) => {
    if (product.total_quantity <= 0) {
      return (
        <span className="badge badge-danger">
          <MdWarningAmber /> Out of Stock
        </span>
      );
    }
    if (product.total_quantity <= product.low_stock_threshold) {
      return (
        <span className="badge badge-warning">
          <MdWarningAmber /> Low Stock ({product.total_quantity})
        </span>
      );
    }
    return (
      <span className="badge badge-success">
        <MdCheckCircle /> {product.total_quantity} In Stock
      </span>
    );
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Catalog</h1>
          <p className="page-subtitle">
            Manage your store items, pricing, categories, and stock alerts.
          </p>
        </div>
        <button
          id="btn-add-product"
          className="btn btn-primary"
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
        >
          <MdAdd size={20} /> Add Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel-card mb-4">
        <div className="panel-card-body">
          <div className="inventory-controls-row">
            {/* Search Input */}
            <div className="input-wrapper has-icon-left flex-grow-1">
              <span className="input-icon input-icon-left">
                <MdSearch size={18} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search products by name, ID, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <span
                  className="input-icon input-icon-right clickable-icon"
                  onClick={() => setSearchTerm("")}
                >
                  <MdClose />
                </span>
              )}
            </div>

            {/* Sort Select */}
            <div className="sort-controls">
              <span className="text-muted text-sm">Sort:</span>
              <select
                className="form-control form-control-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="unit_price">Selling price</option>
                <option value="cost_price">Cost price</option>
                <option value="total_quantity">Quantity</option>
                <option value="updated_at">Recently Updated</option>
              </select>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                title={sortOrder === "asc" ? "Ascending order" : "Descending order"}
              >
                {sortOrder === "asc" ? <MdArrowUpward /> : <MdArrowDownward />}
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 1 && (
            <div className="category-pills mt-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="panel-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("product_id")} style={{ cursor: "pointer" }}>
                  ID {sortBy === "product_id" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => toggleSort("name")} style={{ cursor: "pointer" }}>
                  Product {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => toggleSort("category")} style={{ cursor: "pointer" }}>
                  Category {sortBy === "category" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => toggleSort("unit_price")} style={{ cursor: "pointer" }}>
                  Selling Price {sortBy === "unit_price" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th onClick={() => toggleSort("cost_price")} style={{ cursor: "pointer" }}>
                  Cost Price {sortBy === "cost_price" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th>Stock Status</th>
                <th>Threshold</th>
                <th>Last Updated</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5">
                    <div className="skeleton skeleton-title mx-auto mb-2" />
                    <div className="skeleton skeleton-text mx-auto w-50" />
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <tr key={p.product_id}>
                    <td className="text-muted font-mono">#{p.product_id}</td>
                    <td className="font-semibold">{p.name}</td>
                    <td>
                      <span className="badge badge-accent">{p.category || "General"}</span>
                    </td>
                    <td className="font-mono text-accent">
                      {currency_symbol || "$"}{p.unit_price.toFixed(2)}
                    </td>
                    <td className="font-mono text-muted">
                      {currency_symbol || "$"}{p.cost_price.toFixed(2)}
                    </td>
                    <td>{getStockBadge(p)}</td>
                    <td className="text-muted text-sm">{p.low_stock_threshold} units</td>
                    <td className="text-muted text-sm">
                      {new Date(p.updated_at || p.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="text-end">
                      <div className="btn-group">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(p)}
                          title="Edit product"
                        >
                          <MdEdit size={14} /> Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => requestDelete(p)}
                          title="Delete product"
                        >
                          <MdDelete size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <MdInventory2 size={40} className="empty-state-icon" />
                    <p className="empty-state-text mt-2">
                      {searchTerm || selectedCategory !== "All"
                        ? "No products match your current filters."
                        : "Your catalog is empty. Add your first product to get started!"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        show={showForm}
        onHide={() => handleCloseForm(false)}
        size="lg"
        centered
        contentClassName="custom-modal-dark"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProduct ? `Edit Product: ${editingProduct.name}` : "Create New Product"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProductForm
            product={editingProduct}
            onClose={(refresh) => handleCloseForm(refresh, !!editingProduct)}
          />
        </Modal.Body>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        show={confirmDelete}
        onHide={() => setConfirmDelete(false)}
        centered
        contentClassName="custom-modal-dark"
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Product Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to permanently delete{" "}
            <strong>"{deleteProduct?.name}"</strong>?
          </p>
          <p className="text-muted text-sm">
            This will remove the product from your catalog. Past sales history will remain recorded.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Product
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Inventory;

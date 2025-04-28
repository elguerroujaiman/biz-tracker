import React, { useEffect, useState } from "react";
import ProductForm from "./ProductForm";
import { Button, Table, Modal } from "react-bootstrap";
import { authFetch } from "../../utils/api";
import { toast } from "react-hot-toast"; // Toast import

function Inventory() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await authFetch("/products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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

  // FIXED: handleCloseForm now accepts a 'refresh' argument
  const handleCloseForm = (refresh = false, isEdit = false) => {
    setShowForm(false);
    setEditingProduct(null);
    if (refresh) {
      fetchProducts();
      toast.success(isEdit ? "Product updated successfully!" : "Product added successfully!");
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Inventory</h2>
        <Button onClick={() => setShowForm(true)}>Add Product</Button>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Unit Price</th>
            <th>Total Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length ? (
            products.map((product) => (
              <tr key={product.product_id}>
                <td>{product.product_id}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>${product.unit_price}</td>
                <td>{product.total_quantity}</td>
                <td>
                  <Button
                    size="sm"
                    variant="warning"
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
              <td colSpan="6" className="text-center">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <Modal show={showForm} onHide={() => handleCloseForm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? "Edit Product" : "Add Product"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Pass refresh and edit flags from ProductForm */}
          <ProductForm
            product={editingProduct}
            onClose={(refresh) => handleCloseForm(refresh, !!editingProduct)}
          />
        </Modal.Body>
      </Modal>

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
import React, { useEffect, useState, useCallback } from "react";
import { Button, Form, Row, Col, ListGroup } from "react-bootstrap";
import { authFetch } from "../../utils/api";
import PurchaseForm from "./PurchaseForm";
import PurchaseDetail from "./PurchaseDetail";
import PurchaseStats from "./PurchaseStats";

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    category: "",
    product_id: ""
  });

  const [expandedPurchaseId, setExpandedPurchaseId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editPurchase, setEditPurchase] = useState(null);

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

  const fetchPurchases = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.from) queryParams.append("from", filters.from);
      if (filters.to) queryParams.append("to", filters.to);
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.product_id) queryParams.append("product_id", filters.product_id);

      const response = await authFetch(`/purchases?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setPurchases(data);
    } catch (err) {
      console.error("Failed to fetch purchases", err);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category" ? { product_id: "" } : {})
    }));
  };

  const handlePurchaseClick = (purchaseId) => {
    setExpandedPurchaseId((prevId) => (prevId === purchaseId ? null : purchaseId));
  };

  const handleEditPurchase = (purchase) => {
    setEditPurchase(purchase);
    setShowFormModal(true);
  };

  const uniqueCategories = [...new Set(products.map((p) => p.category))];
  const filteredProducts = filters.category
    ? products.filter((p) => p.category === filters.category)
    : products;

  return (
    <div className="container mt-4">
      <h2>Purchases</h2>

      {/* Filters */}
      <Form className="mb-3">
        <Row>
          <Col md={2}>
            <Form.Label>From</Form.Label>
            <Form.Control
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
            />
          </Col>
          <Col md={2}>
            <Form.Label>To</Form.Label>
            <Form.Control
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
            />
          </Col>
          <Col md={3}>
            <Form.Label>Category</Form.Label>
            <Form.Select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All</option>
              {uniqueCategories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Label>Product</Form.Label>
            <Form.Select name="product_id" value={filters.product_id} onChange={handleFilterChange}>
              <option value="">All</option>
              {filteredProducts.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2} className="d-flex align-items-end">
            <Button variant="primary" onClick={() => {
              setEditPurchase(null);
              setShowFormModal(true);
            }}>
              + Add Purchase
            </Button>
          </Col>
        </Row>
      </Form>

      {/* Purchases List */}
      <ListGroup>
        {purchases.map((purchase) => {
          const items = purchase.items || [];
          const productNames = items.map((item) => item.product_name);
          const summary =
            productNames.length > 2
              ? `${productNames.slice(0, 2).join(", ")}...`
              : productNames.join(", ");
          const isExpanded = expandedPurchaseId === purchase.purchase_id;

          return (
            <React.Fragment key={purchase.purchase_id}>
              <ListGroup.Item className="p-0">
                <div
                  className="d-flex justify-content-between align-items-center list-group-item list-group-item-action"
                  onClick={() => handlePurchaseClick(purchase.purchase_id)}
                  style={{ padding: "1rem", cursor: "pointer" }}
                >
                  <div>
                    <strong>Purchase #{purchase.purchase_id}</strong> |{" "}
                    {new Date(purchase.purchase_date).toLocaleDateString()} |{" "}
                    Total: ${Number(purchase.total_amount).toFixed(2)} |{" "}
                    {items.length} item{items.length !== 1 ? "s" : ""} | {summary}
                    {purchase.notes && (
                    <span> | <em>Note: {purchase.notes}</em></span>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleEditPurchase(purchase)}
                    >
                    Edit
                    </Button>
                  </div>
                </div>
              </ListGroup.Item>
              {isExpanded && (
                <ListGroup.Item variant="light">
                  <PurchaseDetail purchaseId={purchase.purchase_id} />
                </ListGroup.Item>
              )}
            </React.Fragment>
          );
        })}
      </ListGroup>

      {/* Form Modal */}
      <PurchaseForm
        show={showFormModal}
        onHide={() => setShowFormModal(false)}
        onPurchaseCreated={() => {
          fetchPurchases();
          setEditPurchase(null);
        }}
        editPurchase={editPurchase}
      />

      {/* Stats */}
      <div className="mt-4">
        <PurchaseStats purchases={purchases} />
      </div>
    </div>
  );
};

export default PurchasesPage;
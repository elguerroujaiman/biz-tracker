import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Row, Col, Button, Form, Modal, Dropdown, Card, Collapse
} from "react-bootstrap";
import { authFetch } from "../../utils/api";
import PurchaseForm from "./PurchaseForm";
import PurchaseEditForm from "./PurchaseEditForm";
import PurchaseDetail from "./PurchaseDetail";
import { GrMoney } from "react-icons/gr";

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [sortBy, setSortBy] = useState("Purchase ID");
  const [sortAsc, setSortAsc] = useState(false);
  const [detailRefreshKeys, setDetailRefreshKeys] = useState({});

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
      const response = await authFetch("/purchases");
      const data = await response.json();
      setPurchases(Array.isArray(data) ? data : data.purchases || []);
    } catch (err) {
      console.error("Failed to fetch purchases", err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchPurchases();
  }, [fetchPurchases]);

  useEffect(() => {
    let updated = [...purchases];

    if (filterText) {
      updated = updated.filter(p =>
        p.notes?.toLowerCase().includes(filterText.toLowerCase()) ||
        p.purchase_id.toString().startsWith(filterText)
      );
    }

    updated.sort((a, b) => {
      const getValue = (purchase) => {
        if (sortBy === "Purchase ID") return purchase.purchase_id;
        if (sortBy === "Total Amount") return Number(purchase.total_amount);
        return new Date(purchase.purchase_date);
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      return sortAsc ? aValue - bValue : bValue - aValue;
    });

    setFilteredPurchases(updated);
  }, [purchases, filterText, sortBy, sortAsc]);

  const toggleExpanded = (purchaseId) => {
    setExpandedPurchaseId(prev => (prev === purchaseId ? null : purchaseId));
  };

  const handlePurchaseCreated = () => {
    fetchPurchases();
    setShowAddModal(false);
  };

  const handlePurchaseUpdated = () => {
    fetchPurchases();
    if (editingPurchase?.purchase_id) {
      setDetailRefreshKeys(prev => ({
        ...prev,
        [editingPurchase.purchase_id]: (prev[editingPurchase.purchase_id] || 0) + 1
      }));
    }
    setEditingPurchase(null);
    setShowEditModal(false);
  };

  const handleEdit = async (purchase) => {
    try {
      setIsEditLoading(true);
      setShowEditModal(true);
      const res = await authFetch(`/purchases/${purchase.purchase_id}`);
      const fullPurchase = await res.json();
      setEditingPurchase(fullPurchase);
    } catch (err) {
      console.error("Failed to load purchase for editing", err);
    } finally {
      setIsEditLoading(false);
    }
  };
  
  const handleDelete = async (purchase_id, e) => {
  e.stopPropagation();                             // keep card from toggling
  if (!window.confirm("Are you sure you want to delete this purchase?")) return;

  try {
    const res = await authFetch(`/purchases/${purchase_id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchPurchases();                            // refresh list
    } else {
      alert("Failed to delete purchase");
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Something went wrong deleting the purchase.");
  }
};

const handleSortChange = (criterion) => {
  if (sortBy === criterion) {
    // If already sorting by this, toggle the direction
    setSortAsc(prev => !prev);
  } else {
    // When selecting a new column, start in descending order
    setSortBy(criterion);
    setSortAsc(false);
  }
};

  const getArrow = (criterion) =>
    sortBy === criterion ? (sortAsc ? "↓" : "↑") : "";

  return (
    <Container style={{ paddingTop: "2rem", maxWidth: "900px" }}>
      <Row className="align-items-center mb-4">
        <Col>
          <h2 style={{ fontWeight: "bold" }}>Purchases</h2>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            + Add Purchase
          </Button>
        </Col>
      </Row>

      <Row className="mb-4 gx-2 align-items-center">
        <Col xs="auto" style={{ flexGrow: 1 }}>
          <Form.Control
            type="text"
            placeholder="Search by Purchase ID or Notes"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="custom-input"
          />
        </Col>
        <Col xs="auto">
          <Dropdown onSelect={handleSortChange}>
            <Dropdown.Toggle variant="outline-primary">
              Sort By: {sortBy} {getArrow(sortBy)}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item eventKey="Purchase ID">
                Purchase ID {getArrow("Purchase ID")}
              </Dropdown.Item>
              <Dropdown.Item eventKey="Total Amount">
                Total Amount {getArrow("Total Amount")}
              </Dropdown.Item>
              <Dropdown.Item eventKey="Created At">
                Created At {getArrow("Created At")}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {filteredPurchases.length === 0 ? (
        <div className="text-center text-muted mt-5">No purchases found</div>
      ) : (
        filteredPurchases.map((purchase) => {
          const items = purchase.items || [];

          const productNames = items.map(item => item.product_name || `Product ${item.product_id}`);
          const summary =
            productNames.length > 2
              ? `${productNames.slice(0, 2).join(", ")}...`
              : productNames.join(", ");

          const isExpanded = expandedPurchaseId === purchase.purchase_id;
          const refreshKey = detailRefreshKeys[purchase.purchase_id] || 0;

          return (
            <Card key={purchase.purchase_id} className="mb-3 shadow-sm custom-card-color">
              <Card.Body onClick={() => toggleExpanded(purchase.purchase_id)} style={{ cursor: "pointer" }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <Card.Title className="mb-0">
                    <strong>Purchase {purchase.purchase_id}</strong> :{" "}
                    {new Date(purchase.purchase_date).toLocaleDateString("en-GB")}
                  </Card.Title>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(purchase);
                      }}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => handleDelete(purchase.purchase_id, e)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <Card.Subtitle className="mb-2 text-muted mt-2">
                  <GrMoney /> ${Number(purchase.total_amount).toFixed(2)}
                </Card.Subtitle>
                <Card.Text className="mb-0">
                  <em>Note&nbsp;:&nbsp;{purchase.notes?.trim() ? purchase.notes : "Empty"}</em>
                </Card.Text>
              </Card.Body>

              <Collapse in={isExpanded}>
                <div>
                  <Card.Footer className="custom-detail">
                    <PurchaseDetail key={refreshKey} purchaseId={purchase.purchase_id} />
                  </Card.Footer>
                </div>
              </Collapse>
            </Card>
          );
        })
      )}

      {/* Add Purchase Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" contentClassName="custom-modal">
        <Modal.Header closeButton>
          <Modal.Title>New Purchase</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PurchaseForm onPurchaseCreated={handlePurchaseCreated} />
        </Modal.Body>
      </Modal>

      {/* Edit Purchase Modal */}
      <Modal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setEditingPurchase(null);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Purchase</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isEditLoading ? (
            <p>Loading...</p>
          ) : (
            editingPurchase && (
              <PurchaseEditForm
                purchaseId={editingPurchase.purchase_id}
                onClose={() => {
                  setShowEditModal(false);
                  setEditingPurchase(null);
                }}
                onUpdated={handlePurchaseUpdated}
              />
            )
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PurchasesPage;
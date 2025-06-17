import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Row, Col, Button, Form, Modal, Dropdown, Card
} from "react-bootstrap";
import { authFetch } from "../../utils/api";
import PurchaseForm from "./PurchaseForm";
import PurchaseEditForm from "./PurchaseEditForm";
import PurchaseDetail from "./PurchaseDetail";

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [sortBy, setSortBy] = useState("Purchase ID");
  const [sortAsc, setSortAsc] = useState(false);
  const [detailPurchaseId, setDetailPurchaseId] = useState(null);

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
        if (sortBy === "Created At") return new Date(purchase.purchase_date);
        return 0;
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (aValue < bValue) return sortAsc ? -1 : 1;
      if (aValue > bValue) return sortAsc ? 1 : -1;
      return 0;
    });

    setFilteredPurchases(updated);
  }, [purchases, filterText, sortBy, sortAsc]);

  const handlePurchaseCreated = () => {
    fetchPurchases();
    setShowAddModal(false);
  };

  const handlePurchaseUpdated = () => {
    fetchPurchases();
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
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this purchase?")) return;

    try {
      const res = await authFetch(`/purchases/${purchase_id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPurchases();
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
      setSortAsc(prev => !prev);
    } else {
      setSortBy(criterion);
      setSortAsc(false);
    }
  };

  const getArrow = (criterion) =>
    sortBy === criterion ? (sortAsc ? "↓" : "↑") : "";

  return (
    <Container className="page-container">
      {/* Header */}
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

      {/* Filter + Sort */}
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

      {/* Purchases List */}
      {filteredPurchases.length === 0 ? (
        <div className="text-center text-muted mt-5">No purchases found</div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredPurchases.map((purchase) => (
            <Col key={purchase.purchase_id}>
              <Card className="themed-card h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="mb-0">
                      <strong>Purchase ID: {purchase.purchase_id}</strong>
                    </Card.Title>
                    <div className="d-flex gap-1">
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

                  <Card.Subtitle className="mb-1 text-muted">
                    {new Date(purchase.purchase_date).toLocaleDateString("en-GB")}
                  </Card.Subtitle>
                  <Card.Text className="mb-1">
                    Total: <strong>${Number(purchase.total_amount).toFixed(2)}</strong>
                  </Card.Text>
                  <Card.Text>
                    <em>Note:</em> {purchase.notes?.trim() || "Empty"}
                  </Card.Text>

                  <div className="text-end mt-3">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setDetailPurchaseId(purchase.purchase_id)}
                    >
                      View Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
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

      {/* Details Modal */}
      <Modal
        show={!!detailPurchaseId}
        onHide={() => setDetailPurchaseId(null)}
        size="lg"
        centered
        contentClassName="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Purchase Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PurchaseDetail purchaseId={detailPurchaseId} />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PurchasesPage;
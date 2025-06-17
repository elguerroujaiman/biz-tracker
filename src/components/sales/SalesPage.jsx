import React, { useEffect, useState, useCallback } from "react";
import { authFetch } from "../../utils/api";
import {Modal,Button,Card,Form,Container,Row,Col,Dropdown,Collapse} from "react-bootstrap";
import SaleForm from "./SaleForm";
import SaleDetail from "./SaleDetail";
import SaleEditForm from "./SaleEditForm";
import { GrMoney } from "react-icons/gr";

const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filteredSales, setFilteredSales] = useState([]);
  const [sortBy, setSortBy] = useState("Sale ID");
  const [sortAsc, setSortAsc] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [detailsRefreshKey, setDetailsRefreshKey] = useState(0);
  const [detailSaleId, setDetailSaleId] = useState(null);

  const fetchSales = useCallback(async () => {
    try {
      const response = await authFetch("/sales");
      let data = await response.json();
      if (!Array.isArray(data)) data = [data];
      setSales(data);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Filter & sort sales
  useEffect(() => {
    let updated = [...sales];

    if (filterText) {
      updated = updated.filter(s =>
        s.note?.toLowerCase().startsWith(filterText.toLowerCase()) ||
        s.sale_id.toString().startsWith(filterText)
      );
    }

    updated.sort((a, b) => {
      const getValue = (sale) => {
        if (sortBy === "Sale ID") return sale.sale_id;
        if (sortBy === "Total Amount") return Number(sale.total_amount);
        if (sortBy === "Total Earnings") return Number(sale.total_earnings);
        return new Date(sale.sale_date);
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (aValue < bValue) return sortAsc ? -1 : 1;
      if (aValue > bValue) return sortAsc ? 1 : -1;
      return 0;
    });

    setFilteredSales(updated);
  }, [sales, filterText, sortBy, sortAsc]);

  const handleSaleCreated = () => {
    fetchSales();
    setShowForm(false);
  };

  const toggleExpanded = (saleId) => {
    setExpandedSaleId(prev => (prev === saleId ? null : saleId));
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
    <Container className="page-container">
      <Row className="align-items-center mb-4">
        <Col>
          <h2 style={{ fontWeight: "bold" }}>Sales</h2>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => setShowForm(true)}>
            + Add Sale
          </Button>
        </Col>
      </Row>

      {/* Search + Sort */}
      <Row className="mb-4 gx-2 align-items-center">
        <Col xs="auto" style={{ flexGrow: 1 }}>
          <Form.Control
            type="text"
            placeholder="Search by Sale ID or Note"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="custom-input"
          />
        </Col>
        <Col xs="auto">
          <Dropdown onSelect={handleSortChange}>
            <Dropdown.Toggle variant="outline-primary" id="dropdown-sort">
              Sort By: {sortBy} {getArrow(sortBy)}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item eventKey="Sale ID">
                Sale ID {getArrow("Sale ID")}
              </Dropdown.Item>
              <Dropdown.Item eventKey="Total Amount">
                Total Amount {getArrow("Total Amount")}
              </Dropdown.Item>
              <Dropdown.Item eventKey="Total Earnings">
                Total Earnings {getArrow("Total Earnings")}
              </Dropdown.Item>
              <Dropdown.Item eventKey="Created At">
                Created At {getArrow("Created At")}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* Add Sale Modal */}
      <Modal show={showForm} onHide={() => setShowForm(false)} size="lg" contentClassName="custom-modal">
        <Modal.Header closeButton>
          <Modal.Title>New Sale</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SaleForm onSaleCreated={handleSaleCreated} />
        </Modal.Body>
      </Modal>

      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <div className="text-center text-muted mt-5">No sales found</div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredSales.map((sale) => (
            <Col key={sale.sale_id}>
              <Card className="themed-card h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="mb-0">
                      <strong>Sale ID: {sale.sale_id}</strong>
                    </Card.Title>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSaleId(sale.sale_id);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm("Are you sure you want to delete this sale?")) {
                            try {
                              const res = await authFetch(`/sales/${sale.sale_id}`, { method: "DELETE" });
                              if (res.ok) {
                                fetchSales();
                              } else {
                                alert("Failed to delete sale");
                              }
                            } catch (err) {
                              console.error("Delete error:", err);
                              alert("Something went wrong deleting the sale.");
                            }
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  <Card.Subtitle className="mb-1 text-muted">
                    {new Date(sale.sale_date).toLocaleDateString("en-GB")}
                  </Card.Subtitle>
                  <Card.Text className="mb-1">
                    Total: <strong>${Number(sale.total_amount).toFixed(2)}</strong>
                  </Card.Text>
                  <Card.Text className="mb-1">
                    <GrMoney /> Earnings: ${Number(sale.total_earnings).toFixed(2)}
                  </Card.Text>
                  <Card.Text>
                    <em>Note:</em> {sale.note?.trim() || "Empty"}
                  </Card.Text>

                  <div className="text-end mt-3">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setDetailSaleId(sale.sale_id)}
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
      {editingSaleId && (
        <SaleEditForm
          saleId={editingSaleId}
          onClose={() => setEditingSaleId(null)}
          onUpdated={() => {
            setEditingSaleId(null);
            fetchSales();
            setDetailsRefreshKey(prev => prev + 1);
          }}
        />
      )}
      <Modal
        show={!!detailSaleId}
        onHide={() => setDetailSaleId(null)}
        size="lg"
        centered
        contentClassName="custom-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Sale Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SaleDetail sale_id={detailSaleId} />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default SalesPage;
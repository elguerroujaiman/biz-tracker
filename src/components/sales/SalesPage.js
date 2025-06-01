import React, { useEffect, useState, useCallback } from "react";
import { authFetch } from "../../utils/api";
import {Modal,Button,Card,Form,Container,Row,Col,Dropdown,Collapse} from "react-bootstrap";
import SaleForm from "./SaleForm";
import SaleDetail from "./SaleDetail";
import { GrMoney } from "react-icons/gr";

const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filteredSales, setFilteredSales] = useState([]);
  const [sortBy, setSortBy] = useState("Sale ID");
  const [sortAsc, setSortAsc] = useState(true);

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
      setSortAsc(!sortAsc);
    } else {
      setSortBy(criterion);
      setSortAsc(true);
    }
  };

  const getArrow = (criterion) =>
    sortBy === criterion ? (sortAsc ? "↓" : "↑") : "";

  return (
    <Container style={{ paddingTop: "2rem", maxWidth: "900px" }}>
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
          />
        </Col>
        <Col xs="auto">
          <Dropdown onSelect={handleSortChange}>
            <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort">
              Sort By: {sortBy} {getArrow(sortBy)}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item eventKey="Sale ID">
                Sale ID {getArrow("Sale ID")}
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

      {/* Add Sale Modal */}
      <Modal show={showForm} onHide={() => setShowForm(false)}>
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
        filteredSales.map((sale) => (
          <Card key={sale.sale_id} className="mb-3 shadow-sm">
            <Card.Body
              onClick={() => toggleExpanded(sale.sale_id)}
              style={{ cursor: "pointer" }}
            >
              <Card.Title>
                <strong>Sale {sale.sale_id}</strong> :{" "}
                {new Date(sale.sale_date).toLocaleDateString("en-GB")}
              </Card.Title>
              <Card.Subtitle className="mb-2 text-muted">
              <GrMoney /> ${Number(sale.total_amount).toFixed(2)}
              </Card.Subtitle>
              {sale.note && <Card.Text>📝 {sale.note}</Card.Text>}
            </Card.Body>

            <Collapse in={expandedSaleId === sale.sale_id}>
              <div>
                <Card.Footer style={{ backgroundColor: "#f9f9f9" }}>
                  <SaleDetail sale_id={sale.sale_id} />
                </Card.Footer>
              </div>
            </Collapse>
          </Card>
        ))
      )}
    </Container>
  );
};

export default SalesPage;
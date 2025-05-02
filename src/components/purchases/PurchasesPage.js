import React, { useEffect, useState, useCallback } from "react";
import { authFetch } from "../../utils/api";
import PurchaseForm from "./PurchaseForm";
import PurchaseDetail from "./PurchaseDetail";
import PurchaseStats from "./PurchaseStats";

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const fetchPurchases = useCallback(async () => {
    try {
      const response = await authFetch("/purchases");
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setPurchases(data);
    } catch (err) {
      console.error("Failed to fetch purchases", err);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handlePurchaseSelect = (purchase) => {
    setSelectedPurchase(purchase);
  };

  return (
    <div>
      <h1>Purchases</h1>
      <PurchaseForm onPurchaseCreated={fetchPurchases} />
      <PurchaseStats purchases={purchases} />
      <ul>
        {purchases.map((purchase) => (
          <li key={purchase.id} onClick={() => handlePurchaseSelect(purchase)}>
            Purchase #{purchase.id} - {new Date(purchase.purchase_date).toLocaleDateString()} - ${purchase.total_amount}
          </li>
        ))}
      </ul>
      {selectedPurchase && (
        <PurchaseDetail purchaseId={selectedPurchase.id} />
      )}
    </div>
  );
};

export default PurchasesPage;